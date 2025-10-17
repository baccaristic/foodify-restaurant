export type PaymentMethod = 'CARD' | 'CASH' | 'WALLET';

export type SavedAddressType = 'HOME' | 'WORK' | 'OTHER' | string;
export type EntrancePreference = 'LOBBY' | 'DOOR' | 'CURBSIDE' | string;

export interface LocationDto {
  lat: number;
  lng: number;
}

export interface ClientSummaryDTO {
  id: number;
  name: string;
}

export interface SavedAddressSummaryDto {
  id: string;
  type: SavedAddressType;
  label?: string;
  formattedAddress: string;
  placeId?: string;
  entrancePreference?: EntrancePreference;
  entranceNotes?: string;
  directions?: string;
  notes?: string;
  primary: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
}
