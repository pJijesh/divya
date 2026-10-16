export type Aggregation = 'sum' | 'avg' | 'count' | 'count_distinct' | 'min' | 'max';
export type TimeGrain = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';

export interface CompiledMetric {
  /** Output column alias — becomes a key in each result row. */
  alias: string;
  /** Underlying source column name (validated as a safe SQL identifier). */
  fieldColumn: string;
  aggregation: Aggregation;
}

export interface CompiledDimension {
  alias: string;
  fieldColumn: string;
  timeGrain?: TimeGrain;
}

export interface CompiledFilter {
  fieldColumn: string;
  operator: FilterOperator;
  value: unknown;
}

export interface DatasetSource {
  sourceType: 'table' | 'query';
  /** Required when sourceType === 'table'. */
  schema?: string;
  /** Required when sourceType === 'table'. */
  table?: string;
  /** Required when sourceType === 'query'; author-time trusted SQL. */
  sql?: string;
}

export interface QueryCompilerInput {
  source: DatasetSource;
  metrics: CompiledMetric[];
  dimensions: CompiledDimension[];
  filters: CompiledFilter[];
  limit?: number;
}

export interface CompiledQuery {
  sql: string;
  params: unknown[];
}
