// Shared locale-aware formatters (Thai / THB)

/** Full Thai Baht with thousands separators, no decimals. e.g. ฿1,234,567 */
export function formatTHB(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  return '฿' + Math.round(n).toLocaleString('th-TH')
}

/** Compact Baht for big KPI numbers. e.g. ฿2.4M, ฿180K, ฿950 */
export function formatCompactTHB(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return '฿' + (n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + 'M'
  if (abs >= 1_000) return '฿' + (n / 1_000).toFixed(abs >= 100_000 ? 0 : 1).replace(/\.0$/, '') + 'K'
  return '฿' + Math.round(n).toLocaleString('th-TH')
}

/** Plain integer with separators. e.g. 1,234 */
export function formatNumber(value: number | null | undefined): string {
  return Math.round(Number(value ?? 0)).toLocaleString('th-TH')
}

/** Compact integer. e.g. 12.3K */
export function formatCompactNumber(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return formatNumber(n)
}

/** Percent change between two periods. Returns null when no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return current > 0 ? 100 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

/** Short Thai date. e.g. 5 มิ.ย. */
export function formatThaiDate(input: string | Date, opts?: { withYear?: boolean }): string {
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    ...(opts?.withYear ? { year: '2-digit' } : {}),
  })
}
