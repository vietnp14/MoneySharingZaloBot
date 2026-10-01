const MONEY_PATTERN = /^(\d+(?:[.,]\d+)?)(k|K)$/;

export function parseMoneyVnd(input: string): number | null {
  const match = input.trim().match(MONEY_PATTERN);
  if (!match) return null;

  const numeric = Number(match[1].replace(",", "."));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;

  return Math.round(numeric * 1000);
}

export function formatMoneyVnd(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded % 1000 === 0) return `${rounded / 1000}k`;
  return `${new Intl.NumberFormat("vi-VN").format(rounded)}đ`;
}
