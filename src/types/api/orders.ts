import type {
  ClientSummaryDTO,
  LocationDto,
  PaymentMethod,
  SavedAddressSummaryDto,
} from './common';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICK_UP'
  | 'IN_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELED';

export type OrderAction =
  | 'ORDER_CREATED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_REJECTED'
  | 'ORDER_PREPARING'
  | 'ORDER_READY'
  | 'ORDER_PICKED_UP'
  | 'ORDER_DELIVERED'
  | string;

export type OrderChangedBy = 'RESTAURANT' | 'CLIENT' | 'SYSTEM' | 'DRIVER' | string;

export interface RestaurantSummary {
  id: number;
  name: string;
  address: string;
  phone: string;
  imageUrl?: string;
  location?: LocationDto;
}

export interface DriverSummary {
  id: number;
  name: string;
  phone: string;
}

export interface DeliverySummary {
  id: number;
  driver?: DriverSummary;
  estimatedPickupTime?: number;
  estimatedDeliveryTime?: number;
  pickupTime?: string;
  deliveredTime?: string;
  driverLocation?: LocationDto;
  address: string;
  location?: LocationDto;
  savedAddress?: SavedAddressSummaryDto;
}

export interface PaymentSummary {
  subtotal: number;
  extrasTotal: number;
  total: number;
  itemsSubtotal: number;
  promotionDiscount: number;
  itemsTotal: number;
  deliveryFee: number;
}

export interface OrderStatusHistoryDTO {
  action: OrderAction;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedBy: OrderChangedBy;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  changedAt: string;
}

export interface OrderItemDTO {
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  extras: string[];
  specialInstructions?: string | null;
  unitBasePrice: number;
  unitPrice: number;
  unitExtrasPrice: number;
  lineSubtotal: number;
  promotionDiscount: number;
  lineItemsTotal: number;
  extrasTotal: number;
  lineTotal: number;
}

export interface OrderNotificationDTO {
  orderId: number;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  date: string;
  items: OrderItemDTO[];
  savedAddress?: SavedAddressSummaryDto;
  client: ClientSummaryDTO;
  status: OrderStatus;
  deliveryLocation?: LocationDto;
  restaurant: RestaurantSummary;
  delivery?: DeliverySummary;
  payment: PaymentSummary;
  statusHistory: OrderStatusHistoryDTO[];
}
