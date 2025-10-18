import httpClient from './httpClient';
import type {
  CategoryDTO,
  MenuItemDTO,
  MenuItemRequestDTO,
  OrderNotificationDTO,
  PaginatedResponse,
  UploadableAsset,
} from '../types/api';

export type MyOrdersFilterValue = Date | string | null | undefined;

export interface GetMyOrdersParams {
  page?: number;
  pageSize?: number;
  from?: MyOrdersFilterValue;
  to?: MyOrdersFilterValue;
}

const formatDateForFilter = (value: MyOrdersFilterValue): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  const date = value;
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

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

  async rejectOrder(orderId: number): Promise<OrderNotificationDTO> {
    const response = await httpClient.post<OrderNotificationDTO>(
      `/restaurant/reject-order/${orderId}`
    );
    return response.data;
  },

  async markOrderReady(orderId: number): Promise<OrderNotificationDTO> {
    const response = await httpClient.post<OrderNotificationDTO>(
      `/restaurant/order/ready/${orderId}`
    );
    return response.data;
  },

  async getMyOrders(
    params: GetMyOrdersParams = {}
  ): Promise<PaginatedResponse<OrderNotificationDTO>> {
    const {
      page = 0,
      pageSize = 10,
      from,
      to,
    } = params;

    const formattedFrom = formatDateForFilter(from);
    const formattedTo = formatDateForFilter(to);

    const queryParams: Record<string, string | number> = {
      page,
      pageSize,
    };

    if (formattedFrom) {
      queryParams.from = formattedFrom;
    }

    if (formattedTo) {
      queryParams.to = formattedTo;
    }

    const response = await httpClient.get<PaginatedResponse<OrderNotificationDTO>>(
      '/restaurant/my-orders',
      {
        params: queryParams,
      }
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

  async updateMenuAvailability(menuId: number, available: boolean): Promise<MenuItemDTO> {
    const response = await httpClient.patch<MenuItemDTO>(
      `/restaurant/menu/${menuId}/availability`,
      { available }
    );
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
