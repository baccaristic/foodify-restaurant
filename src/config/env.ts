const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const sanitizedApiUrl = apiUrl?.replace(/\/$/, '');

if (!sanitizedApiUrl) {
  console.warn(
    'EXPO_PUBLIC_API_URL is not defined. Set it in your environment configuration to enable API requests.'
  );
}

export const API_URL = sanitizedApiUrl ?? '';
