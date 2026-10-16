import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().trim().min(1, 'Name is required'),
  organizationName: z.string().trim().min(1, 'Organization name is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const dataSourceConnectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  host: z.string().trim().min(1, 'Host is required'),
  port: z.coerce.number().int().min(1).max(65535),
  databaseName: z.string().trim().min(1, 'Database name is required'),
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  sslMode: z.enum(['require', 'disable', 'verify-full']).default('require'),
});

export type DataSourceConnectionInput = z.infer<typeof dataSourceConnectionSchema>;

export const datasetCreateSchema = z.discriminatedUnion('sourceType', [
  z.object({
    sourceType: z.literal('table'),
    dataSourceId: z.uuid(),
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().optional(),
    sourceTableSchema: z.string().trim().min(1),
    sourceTableName: z.string().trim().min(1),
  }),
  z.object({
    sourceType: z.literal('query'),
    dataSourceId: z.uuid(),
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().optional(),
    sourceSql: z.string().trim().min(1, 'Query is required'),
  }),
]);

export type DatasetCreateInput = z.infer<typeof datasetCreateSchema>;

export const metricCreateSchema = z.object({
  fieldId: z.uuid(),
  label: z.string().trim().min(1, 'Label is required'),
  aggregation: z.enum(['sum', 'avg', 'count', 'count_distinct', 'min', 'max']),
  format: z.enum(['number', 'currency', 'percent']).default('number'),
});

export type MetricCreateInput = z.infer<typeof metricCreateSchema>;

export const dimensionCreateSchema = z.object({
  fieldId: z.uuid(),
  label: z.string().trim().min(1, 'Label is required'),
  type: z.enum(['categorical', 'time']),
  timeGrain: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
});

export type DimensionCreateInput = z.infer<typeof dimensionCreateSchema>;
