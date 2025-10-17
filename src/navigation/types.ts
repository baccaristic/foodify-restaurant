import type { MenuItemDTO, OrderNotificationDTO } from '../types/api';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  MyOrders: undefined;
  NewOrderAlert: undefined;
  OrderDetails: { order: OrderNotificationDTO };
  Menu: undefined;
  AddDish: { menuItem?: MenuItemDTO; origin?: 'menu' | 'view' } | undefined;
  ViewMenuItem: { item: MenuItemDTO };
};
