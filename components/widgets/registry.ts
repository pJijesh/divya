import { AreaWidget } from './AreaWidget';
import { BarWidget } from './BarWidget';
import { KpiWidget } from './KpiWidget';
import { LineWidget } from './LineWidget';
import { PieWidget } from './PieWidget';
import { PivotTableWidget } from './PivotTableWidget';
import { ScatterWidget } from './ScatterWidget';
import { TableWidget } from './TableWidget';
import type { WidgetComponentProps, WidgetType } from './types';

export interface WidgetRegistryEntry {
  label: string;
  component: (props: WidgetComponentProps) => React.ReactNode;
  /** Whether this widget type needs >=1 dimension to render meaningfully. */
  requiresDimension: boolean;
}

// Single source of truth for widget-type -> component mapping. The
// designer's widget picker and the viewer/preview renderer both read
// from this registry rather than switching on type directly, so adding a
// 9th widget type is "write the component, add one line here."
export const WIDGET_REGISTRY: Record<WidgetType, WidgetRegistryEntry> = {
  bar: { label: 'Bar', component: BarWidget, requiresDimension: true },
  line: { label: 'Line', component: LineWidget, requiresDimension: true },
  area: { label: 'Area', component: AreaWidget, requiresDimension: true },
  pie: { label: 'Pie', component: PieWidget, requiresDimension: true },
  scatter: { label: 'Scatter', component: ScatterWidget, requiresDimension: false },
  kpi: { label: 'KPI', component: KpiWidget, requiresDimension: false },
  table: { label: 'Table', component: TableWidget, requiresDimension: false },
  pivot_table: { label: 'Pivot Table', component: PivotTableWidget, requiresDimension: false },
};

export const WIDGET_TYPES = Object.keys(WIDGET_REGISTRY) as WidgetType[];
