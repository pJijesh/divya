export type WidgetDataRow = Record<string, unknown>;

export interface WidgetDataset {
  rows: WidgetDataRow[];
  dimensionKeys: string[];
  metricKeys: string[];
}

export interface WidgetDisplayField {
  /** Column alias (matches metrics/dimensions `name`, see lib/semantic). */
  key: string;
  /** Display label (metrics/dimensions `label`). */
  label: string;
  format?: 'number' | 'currency' | 'percent';
}

export interface WidgetVisualConfig {
  title?: string;
  dimensions: WidgetDisplayField[];
  metrics: WidgetDisplayField[];
}

export type WidgetType =
  'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'kpi' | 'table' | 'pivot_table';

export interface WidgetComponentProps {
  data: WidgetDataset;
  config: WidgetVisualConfig;
}
