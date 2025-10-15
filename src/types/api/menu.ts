import type { LocationDto } from './common';

export interface ExtraDTO {
  id: number;
  name: string;
  price: number;
  isDefault: boolean;
}

export interface OptionGroupDTO {
  id: number;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  extras: ExtraDTO[];
}

export interface MenuItemRequestDTO {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: string;
  popular: boolean;
  restaurantId?: number;
  promotionLabel?: string | null;
  promotionPrice?: number | null;
  promotionActive?: boolean;
  imageUrls?: string[];
  optionGroups?: OptionGroupDTO[];
}

export interface MenuItemDTO extends MenuItemRequestDTO {
  id: number;
  restaurantId: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  location?: LocationDto;
}

export interface UploadableAsset {
  uri: string;
  name?: string;
  type?: string;
}
