import type { OrderNotificationDTO } from '../types/api';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  NewOrderAlert: undefined;
  OrderDetails: { order: OrderNotificationDTO };
  Menu: undefined;
  AddDish: undefined;
};
