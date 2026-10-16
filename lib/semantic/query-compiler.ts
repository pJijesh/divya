import type {
  Aggregation,
  CompiledDimension,
  CompiledFilter,
  CompiledMetric,
  CompiledQuery,
  DatasetSource,
  QueryCompilerInput,
  TimeGrain,
} from '@/lib/semantic/types';

// Translates a {dataset, metrics, dimensions, filters} description into a
// single parameterized SQL statement. This module has no Next.js-specific
// imports and is the seed of the future API-exposed metrics layer and
// AI NL-to-SQL compiler (see docs/API.md) — both would assemble the same
// QueryCompilerInput shape, just from a different source (an HTTP request
// or an LLM) than today's designer UI.
//
// Security invariants this module exists to guarantee:
//   - every VALUE is bound as a $n parameter, never string-interpolated
//   - every IDENTIFIER (column/table/schema/alias) is validated against an
//     allow-list regex before being interpolated, since identifiers can't
//     be parameterized in SQL — there is no other way to express "this
//     column" in a prepared statement
//   - the only free-text SQL that can appear is a dataset's own
//     `source.sql` (a "query"-type dataset), which is author-time trusted
//     (set by an editor/admin defining the dataset, not by a dashboard
//     viewer) and is still checked for stacked statements below

const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const ALLOWED_AGGREGATIONS: Aggregation[] = ['sum', 'avg', 'count', 'count_distinct', 'min', 'max'];
const ALLOWED_TIME_GRAINS: TimeGrain[] = ['day', 'week', 'month', 'quarter', 'year'];

export class QueryCompilerError extends Error {}

function quoteIdentifier(name: string, label: string): string {
  if (!IDENTIFIER_RE.test(name)) {
    throw new QueryCompilerError(`Invalid ${label}: "${name}"`);
  }
  return `"${name}"`;
}

function compileAggregation(metric: CompiledMetric): string {
  if (!ALLOWED_AGGREGATIONS.includes(metric.aggregation)) {
    throw new QueryCompilerError(`Invalid aggregation: "${metric.aggregation}"`);
  }
  const column = quoteIdentifier(metric.fieldColumn, 'metric field');
  const alias = quoteIdentifier(metric.alias, 'metric alias');

  const expr =
    metric.aggregation === 'count_distinct'
      ? `COUNT(DISTINCT ${column})`
      : `${metric.aggregation.toUpperCase()}(${column})`;

  return `${expr} AS ${alias}`;
}

function compileDimension(dimension: CompiledDimension): string {
  const column = quoteIdentifier(dimension.fieldColumn, 'dimension field');
  const alias = quoteIdentifier(dimension.alias, 'dimension alias');

  if (dimension.timeGrain) {
    if (!ALLOWED_TIME_GRAINS.includes(dimension.timeGrain)) {
      throw new QueryCompilerError(`Invalid time grain: "${dimension.timeGrain}"`);
    }
    return `DATE_TRUNC('${dimension.timeGrain}', ${column}) AS ${alias}`;
  }

  return `${column} AS ${alias}`;
}

function compileFilter(filter: CompiledFilter, params: unknown[]): string {
  const column = quoteIdentifier(filter.fieldColumn, 'filter field');

  switch (filter.operator) {
    case 'eq':
      params.push(filter.value);
      return `${column} = $${params.length}`;
    case 'neq':
      params.push(filter.value);
      return `${column} != $${params.length}`;
    case 'gt':
      params.push(filter.value);
      return `${column} > $${params.length}`;
    case 'gte':
      params.push(filter.value);
      return `${column} >= $${params.length}`;
    case 'lt':
      params.push(filter.value);
      return `${column} < $${params.length}`;
    case 'lte':
      params.push(filter.value);
      return `${column} <= $${params.length}`;
    case 'in':
      if (!Array.isArray(filter.value)) {
        throw new QueryCompilerError('"in" filter requires an array value');
      }
      params.push(filter.value);
      return `${column} = ANY($${params.length})`;
    case 'between': {
      if (!Array.isArray(filter.value) || filter.value.length !== 2) {
        throw new QueryCompilerError('"between" filter requires a [min, max] value');
      }
      const [min, max] = filter.value;
      params.push(min);
      const minParam = params.length;
      params.push(max);
      const maxParam = params.length;
      return `${column} BETWEEN $${minParam} AND $${maxParam}`;
    }
    default:
      throw new QueryCompilerError(`Invalid filter operator: "${filter.operator}"`);
  }
}

function compileSource(source: DatasetSource): string {
  if (source.sourceType === 'table') {
    if (!source.schema || !source.table) {
      throw new QueryCompilerError('Table source requires both schema and table');
    }
    const schema = quoteIdentifier(source.schema, 'schema');
    const table = quoteIdentifier(source.table, 'table');
    return `${schema}.${table}`;
  }

  if (!source.sql) {
    throw new QueryCompilerError('Query source requires sql');
  }
  // Author-time trusted (set by an editor/admin defining the dataset, not
  // by a dashboard viewer) — still reject stacked statements as a cheap
  // extra guard against the wrapper being broken out of.
  if (source.sql.includes(';')) {
    throw new QueryCompilerError('Dataset query source must be a single statement (no semicolons)');
  }
  return `(${source.sql}) AS dataset_source`;
}

export function compileQuery(input: QueryCompilerInput): CompiledQuery {
  if (input.metrics.length === 0) {
    throw new QueryCompilerError('At least one metric is required');
  }

  const params: unknown[] = [];

  const selectParts = [
    ...input.dimensions.map(compileDimension),
    ...input.metrics.map(compileAggregation),
  ];

  const fromClause = compileSource(input.source);

  const whereParts = input.filters.map((filter) => compileFilter(filter, params));
  const whereClause = whereParts.length > 0 ? `\nWHERE ${whereParts.join(' AND ')}` : '';

  // Positional GROUP BY (1, 2, ...) over just the dimension columns —
  // robust regardless of each dimension's exact expression (DATE_TRUNC(...)
  // vs a bare column) without having to repeat it verbatim.
  const groupByClause =
    input.dimensions.length > 0
      ? `\nGROUP BY ${input.dimensions.map((_, i) => i + 1).join(', ')}`
      : '';

  const limit = input.limit ?? 10_000;
  params.push(limit);
  const limitClause = `\nLIMIT $${params.length}`;

  const sql = `SELECT\n  ${selectParts.join(',\n  ')}\nFROM ${fromClause}${whereClause}${groupByClause}${limitClause}`;

  return { sql, params };
}
