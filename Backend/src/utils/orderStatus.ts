export type OrderStatus =
  | "placed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "cancelled";

const STATUS_ALIASES: Record<string, OrderStatus> = {
  PENDING: "placed",
  PLACED: "placed",
  PREPARING: "preparing",
  READY: "ready",
  PICKED_UP: "picked_up",
  PICKEDUP: "picked_up",
  COMPLETED: "picked_up",
  CANCELLED: "cancelled",
  CANCELED: "cancelled",
};

export const normalizeOrderStatus = (status: string): OrderStatus => {
  const normalized = (status ?? "").trim().toUpperCase();

  return STATUS_ALIASES[normalized] ?? (normalized.toLowerCase() as OrderStatus);
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "placed",
  "preparing",
  "ready",
];

export const isActiveOrderStatus = (status: string): boolean =>
  ACTIVE_ORDER_STATUSES.includes(normalizeOrderStatus(status));
