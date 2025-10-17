import type { LocationDto } from './common';

export interface ExtraRequestDTO {
  id?: number;
  name: string;
  price: number;
  isDefault: boolean;
}

export interface OptionGroupRequestDTO {
  id?: number;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  extras: ExtraRequestDTO[];
}

export interface CategoryDTO {
  id: number;
  name: string;
}

export interface MenuItemRequestDTO {
  id?: number;
  name: string;
  description: string;
  price: number;
  categories: number[];
  popular: boolean;
  restaurantId?: number;
  promotionLabel?: string | null;
  promotionPrice?: number | null;
  promotionActive?: boolean;
  imageUrls?: string[];
  optionGroups?: OptionGroupRequestDTO[];
}

export interface ExtraDTO extends ExtraRequestDTO {
  id: number;
}

export interface OptionGroupDTO extends OptionGroupRequestDTO {
  id: number;
  extras: ExtraDTO[];
}

export interface MenuItemDTO extends Omit<MenuItemRequestDTO, 'categories'> {
  id: number;
  restaurantId: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  location?: LocationDto;
  categories: CategoryDTO[];
}

export interface UploadableAsset {
  uri: string;
  name?: string;
  type?: string;
}
