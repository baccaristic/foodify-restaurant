import httpClient from './httpClient';
import type {
  MenuItemDTO,
  MenuItemRequestDTO,
  OrderNotificationDTO,
  UploadableAsset,
} from '../types/api';

const serializeMenuPayload = (
  payload: MenuItemRequestDTO,
  files?: UploadableAsset[]
): FormData => {
  const formData = new FormData();

  formData.append('menu', JSON.stringify(payload));

  files?.forEach((file, index) => {
    formData.append('files', {
      uri: file.uri,
      name: file.name ?? `menu-asset-${index}`,
      type: file.type ?? 'image/jpeg',
    } as unknown as any);
  });

  return formData;
};

export const restaurantApi = {
  async getCurrentOrders(): Promise<OrderNotificationDTO[]> {
    const response = await httpClient.get<OrderNotificationDTO[]>('/api/restaurant/my-orders');
    return response.data;
  },

  async getOrder(orderId: number): Promise<OrderNotificationDTO | null> {
    const response = await httpClient.get<OrderNotificationDTO | null>(
      `/api/restaurant/order/${orderId}`
    );
    return response.data;
  },

  async acceptOrder(orderId: number): Promise<OrderNotificationDTO> {
    const response = await httpClient.post<OrderNotificationDTO>(
      `/api/restaurant/accept-order/${orderId}`
    );
    return response.data;
  },

  async markOrderReady(orderId: number): Promise<OrderNotificationDTO> {
    const response = await httpClient.post<OrderNotificationDTO>(
      `/api/restaurant/order/ready/${orderId}`
    );
    return response.data;
  },

  async getMenu(): Promise<MenuItemDTO[]> {
    const response = await httpClient.get<MenuItemDTO[]>('/api/restaurant/my-menu');
    return response.data;
  },

  async addMenuItem(payload: MenuItemRequestDTO, files?: UploadableAsset[]): Promise<MenuItemDTO> {
    const formData = serializeMenuPayload(payload, files);
    const response = await httpClient.post<MenuItemDTO>('/api/restaurant/addMenu', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateMenuItem(
    menuId: number,
    payload: MenuItemRequestDTO,
    files?: UploadableAsset[]
  ): Promise<MenuItemDTO> {
    const formData = serializeMenuPayload(payload, files);
    const response = await httpClient.put<MenuItemDTO>(`/api/restaurant/menu/${menuId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
