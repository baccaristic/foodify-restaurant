declare module 'expo-image-picker' {
  export const MediaTypeOptions: {
    readonly Images: string;
    readonly Videos: string;
    readonly All: string;
  };

  export interface ImagePickerAsset {
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  }

  export interface PermissionResponse {
    granted: boolean;
    canAskAgain?: boolean;
    expires?: string;
    status?: string;
  }

  export interface ImagePickerSuccessResult {
    canceled: false;
    assets: ImagePickerAsset[];
  }

  export interface ImagePickerCancelResult {
    canceled: true;
  }

  export type ImagePickerResult = ImagePickerSuccessResult | ImagePickerCancelResult;

  export interface ImagePickerOptions {
    mediaTypes?: typeof MediaTypeOptions[keyof typeof MediaTypeOptions];
    allowsMultipleSelection?: boolean;
    quality?: number;
    base64?: boolean;
    aspect?: [number, number];
  }

  export function requestMediaLibraryPermissionsAsync(): Promise<PermissionResponse>;
  export function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
}
