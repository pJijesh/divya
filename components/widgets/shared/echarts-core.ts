// Modular ECharts registration (per docs/UI.md §2.4) — only the chart
// types and components Divya's widgets actually use, imported via
// echarts/core instead of the full `echarts` bundle, to keep bundle size
// down. Add to this list only when a new widget genuinely needs it.
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts';
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

// Categorical palette from docs/UI.md §2.1 — colorblind-considerate,
// avoids a red/green pairing.
export const CATEGORICAL_PALETTE = [
  '#4F46E5',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#F43F5E',
  '#8B5CF6',
  '#06B6D4',
  '#84CC16',
];

export { echarts };
