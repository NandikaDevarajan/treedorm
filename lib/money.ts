/** 2500 → "$25", 2550 → "$25.50" */
export const formatCents = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
