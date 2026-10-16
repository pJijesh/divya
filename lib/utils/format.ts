export type MetricFormat = 'number' | 'currency' | 'percent';

export function formatMetricValue(value: unknown, format: MetricFormat = 'number'): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return String(value ?? '—');

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(num);
    case 'percent':
      return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(
        num,
      );
    default:
      return new Intl.NumberFormat('en-US').format(num);
  }
}
