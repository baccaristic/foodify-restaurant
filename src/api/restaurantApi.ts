import httpClient from './httpClient';
import type {
  CategoryDTO,
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
  async getActiveOrders(): Promise<OrderNotificationDTO[]> {
    const response = await httpClient.get<OrderNotificationDTO[]>(
      '/restaurant/my-active-orders'
    );
    return response.data;
  },

  async getOrder(orderId: number): Promise<OrderNotificationDTO | null> {
    const response = await httpClient.get<OrderNotificationDTO | null>(
      `/restaurant/order/${orderId}`
    );
    return response.data;
  },

  async acceptOrder(orderId: number): Promise<OrderNotificationDTO> {
    const response = await httpClient.post<OrderNotificationDTO>(
      `/restaurant/accept-order/${orderId}`
    );
    return response.data;
  },

  async markOrderReady(orderId: number): Promise<OrderNotificationDTO> {
    const response = await httpClient.post<OrderNotificationDTO>(
      `/restaurant/order/ready/${orderId}`
    );
    return response.data;
  },

  async getMenu(): Promise<MenuItemDTO[]> {
    const response = await httpClient.get<MenuItemDTO[]>('/restaurant/my-menu');
    return response.data;
  },

  async addMenuItem(payload: MenuItemRequestDTO, files?: UploadableAsset[]): Promise<MenuItemDTO> {
    const formData = serializeMenuPayload(payload, files);
    const response = await httpClient.post<MenuItemDTO>('/restaurant/addMenu', formData, {
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
    const response = await httpClient.put<MenuItemDTO>(`/restaurant/menu/${menuId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getCategories(): Promise<CategoryDTO[]> {
    const response = await httpClient.get<CategoryDTO[]>('/restaurant/categories');
    return response.data;
  },

  async createCategory(name: string): Promise<CategoryDTO> {
    const response = await httpClient.post<CategoryDTO>('/restaurant/categories', { name });
    return response.data;
  },
};
