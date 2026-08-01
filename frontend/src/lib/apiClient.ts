import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('dsl_access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Extrait un message d'erreur français exploitable depuis une erreur Axios.
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    if (data?.error) return data.error;
  }
  return "Une erreur inattendue s'est produite. Veuillez réessayer.";
}
