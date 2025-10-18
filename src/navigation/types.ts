import type { MenuItemDTO, OrderNotificationDTO } from '../types/api';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  MyOrders: undefined;
  OrderDetails: { order: OrderNotificationDTO };
  Menu: undefined;
  AddDish: { menuItem?: MenuItemDTO; origin?: 'menu' | 'view' } | undefined;
  ViewMenuItem: { item: MenuItemDTO };
};
