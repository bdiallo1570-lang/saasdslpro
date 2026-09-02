import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

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

// Sans ce bloc, un token expiré (JWT_ACCESS_EXPIRES_IN=15m) fait échouer silencieusement
// TOUTES les requêtes en 401 en boucle (chaque composant qui poll/refetch réessaie sans jamais
// aboutir) — perçu par l'utilisateur comme un chargement infini, alors qu'il suffirait de se
// reconnecter. On tente un refresh une seule fois par requête en échec ; si le refresh
// lui-même échoue (refresh token expiré/révoqué), on nettoie la session et on redirige.
let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('dsl_refresh_token');
  if (!refreshToken) throw new Error('Aucun jeton de rafraîchissement.');

  const res = await axios.post<{
    success: boolean;
    data: { accessToken: string; refreshToken: string } | null;
  }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });

  const data = res.data.data;
  if (!data) throw new Error('Rafraîchissement du jeton refusé.');

  localStorage.setItem('dsl_access_token', data.accessToken);
  localStorage.setItem('dsl_refresh_token', data.refreshToken);
  return data.accessToken;
}

function clearSessionAndRedirect() {
  localStorage.removeItem('dsl_access_token');
  localStorage.removeItem('dsl_refresh_token');
  localStorage.removeItem('dsl_user');
  if (location.pathname !== '/connexion') {
    location.href = '/connexion';
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (error.response?.status !== 401 || !original || original._retried || isAuthRoute) {
      throw error;
    }
    original._retried = true;

    try {
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
      const newAccessToken = await refreshInFlight;
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(original);
    } catch {
      clearSessionAndRedirect();
      throw error;
    }
  },
);

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
