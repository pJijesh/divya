'use client';

import type { EChartsOption } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { CATEGORICAL_PALETTE, echarts } from '@/components/widgets/shared/echarts-core';

// Shared option-builder defaults so every chart widget has consistent
// tooltip styling, legend placement, and axis label truncation — see
// docs/UI.md §5.2. Individual widgets pass their series/axis config and
// get these merged underneath.
const BASE_OPTION: EChartsOption = {
  color: CATEGORICAL_PALETTE,
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(15, 20, 25, 0.92)',
    borderWidth: 0,
    textStyle: { color: '#fff', fontSize: 12 },
    padding: [8, 12],
  },
  legend: {
    bottom: 0,
    type: 'scroll',
    textStyle: { fontSize: 12 },
  },
  grid: {
    top: 24,
    left: 8,
    right: 16,
    bottom: 32,
    containLabel: true,
  },
};

export function EChartsBase({ option, height = 260 }: { option: EChartsOption; height?: number }) {
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={{ ...BASE_OPTION, ...option }}
      style={{ height, width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
}
