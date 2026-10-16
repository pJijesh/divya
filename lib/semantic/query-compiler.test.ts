import { describe, expect, it } from 'vitest';

import { compileQuery, QueryCompilerError } from '@/lib/semantic/query-compiler';
import type { QueryCompilerInput } from '@/lib/semantic/types';

const tableSource = { sourceType: 'table' as const, schema: 'public', table: 'orders' };

describe('compileQuery', () => {
  it('compiles a single metric with no dimensions (no GROUP BY)', () => {
    const input: QueryCompilerInput = {
      source: tableSource,
      metrics: [{ alias: 'total_revenue', fieldColumn: 'amount', aggregation: 'sum' }],
      dimensions: [],
      filters: [],
    };

    const { sql, params } = compileQuery(input);

    expect(sql).toContain('SUM("amount") AS "total_revenue"');
    expect(sql).toContain('FROM "public"."orders"');
    expect(sql).not.toContain('GROUP BY');
    expect(sql).toContain('LIMIT $1');
    expect(params).toEqual([10_000]);
  });

  it('compiles a metric grouped by a categorical dimension', () => {
    const input: QueryCompilerInput = {
      source: tableSource,
      metrics: [{ alias: 'order_count', fieldColumn: 'id', aggregation: 'count' }],
      dimensions: [{ alias: 'status', fieldColumn: 'status' }],
      filters: [],
    };

    const { sql } = compileQuery(input);

    expect(sql).toContain('"status" AS "status"');
    expect(sql).toContain('COUNT("id") AS "order_count"');
    expect(sql).toContain('GROUP BY 1');
  });

  it('compiles a time dimension with DATE_TRUNC', () => {
    const input: QueryCompilerInput = {
      source: tableSource,
      metrics: [{ alias: 'revenue', fieldColumn: 'amount', aggregation: 'sum' }],
      dimensions: [{ alias: 'month', fieldColumn: 'created_at', timeGrain: 'month' }],
      filters: [],
    };

    const { sql } = compileQuery(input);

    expect(sql).toContain('DATE_TRUNC(\'month\', "created_at") AS "month"');
    expect(sql).toContain('GROUP BY 1');
  });

  it('compiles count_distinct correctly', () => {
    const input: QueryCompilerInput = {
      source: tableSource,
      metrics: [
        { alias: 'unique_customers', fieldColumn: 'customer_id', aggregation: 'count_distinct' },
      ],
      dimensions: [],
      filters: [],
    };

    const { sql } = compileQuery(input);

    expect(sql).toContain('COUNT(DISTINCT "customer_id") AS "unique_customers"');
  });

  it('binds eq filter values as parameters, never interpolated', () => {
    const input: QueryCompilerInput = {
      source: tableSource,
      metrics: [{ alias: 'revenue', fieldColumn: 'amount', aggregation: 'sum' }],
      dimensions: [],
      filters: [{ fieldColumn: 'status', operator: 'eq', value: 'paid' }],
    };

    const { sql, params } = compileQuery(input);

    expect(sql).toContain('WHERE "status" = $1');
    expect(sql).toContain('LIMIT $2');
    expect(params).toEqual(['paid', 10_000]);
  });

  it('binds an "in" filter as an array parameter using = ANY', () => {
    const input: QueryCompilerInput = {
      source: tableSource,
      metrics: [{ alias: 'revenue', fieldColumn: 'amount', aggregation: 'sum' }],
      dimensions: [],
      filters: [{ fieldColumn: 'status', operator: 'in', value: ['paid', 'refunded'] }],
    };

    const { sql, params } = compileQuery(input);

    expect(sql).toContain('WHERE "status" = ANY($1)');
    expect(params[0]).toEqual(['paid', 'refunded']);
  });

  it('binds a "between" filter as two parameters', () => {
    const input: QueryCompilerInput = {
      source: tableSource,
      metrics: [{ alias: 'revenue', fieldColumn: 'amount', aggregation: 'sum' }],
      dimensions: [],
      filters: [
        { fieldColumn: 'created_at', operator: 'between', value: ['2026-01-01', '2026-01-31'] },
      ],
    };

    const { sql, params } = compileQuery(input);

    expect(sql).toContain('WHERE "created_at" BETWEEN $1 AND $2');
    expect(params.slice(0, 2)).toEqual(['2026-01-01', '2026-01-31']);
  });

  it('combines multiple filters with AND', () => {
    const input: QueryCompilerInput = {
      source: tableSource,
      metrics: [{ alias: 'revenue', fieldColumn: 'amount', aggregation: 'sum' }],
      dimensions: [],
      filters: [
        { fieldColumn: 'status', operator: 'eq', value: 'paid' },
        { fieldColumn: 'amount', operator: 'gte', value: 100 },
      ],
    };

    const { sql } = compileQuery(input);

    expect(sql).toContain('WHERE "status" = $1 AND "amount" >= $2');
  });

  it('wraps a query-type dataset source in a subquery', () => {
    const input: QueryCompilerInput = {
      source: { sourceType: 'query', sql: "select * from orders where region = 'us'" },
      metrics: [{ alias: 'revenue', fieldColumn: 'amount', aggregation: 'sum' }],
      dimensions: [],
      filters: [],
    };

    const { sql } = compileQuery(input);

    expect(sql).toContain("FROM (select * from orders where region = 'us') AS dataset_source");
  });

  it('rejects a query-type source containing a semicolon (stacked statements)', () => {
    const input: QueryCompilerInput = {
      source: { sourceType: 'query', sql: 'select 1; drop table orders' },
      metrics: [{ alias: 'revenue', fieldColumn: 'amount', aggregation: 'sum' }],
      dimensions: [],
      filters: [],
    };

    expect(() => compileQuery(input)).toThrow(QueryCompilerError);
  });

  it('rejects a metric field column that is not a safe identifier (injection attempt)', () => {
    const input: QueryCompilerInput = {
      source: tableSource,
      metrics: [{ alias: 'x', fieldColumn: 'amount"; drop table orders; --', aggregation: 'sum' }],
      dimensions: [],
      filters: [],
    };

    expect(() => compileQuery(input)).toThrow(QueryCompilerError);
  });

  it('rejects an invalid aggregation', () => {
    const input = {
      source: tableSource,
      metrics: [{ alias: 'x', fieldColumn: 'amount', aggregation: 'median' }],
      dimensions: [],
      filters: [],
    } as unknown as QueryCompilerInput;

    expect(() => compileQuery(input)).toThrow(QueryCompilerError);
  });

  it('requires at least one metric', () => {
    const input: QueryCompilerInput = {
      source: tableSource,
      metrics: [],
      dimensions: [],
      filters: [],
    };

    expect(() => compileQuery(input)).toThrow(QueryCompilerError);
  });

  it('respects a custom limit', () => {
    const input: QueryCompilerInput = {
      source: tableSource,
      metrics: [{ alias: 'revenue', fieldColumn: 'amount', aggregation: 'sum' }],
      dimensions: [],
      filters: [],
      limit: 50,
    };

    const { sql, params } = compileQuery(input);

    expect(sql).toContain('LIMIT $1');
    expect(params).toEqual([50]);
  });
});
