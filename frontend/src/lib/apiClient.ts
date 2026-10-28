import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const LAN_HOST = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;
const LOCAL_HOST = /^(localhost|127\.0\.0\.1)$/;

// Quand le site est ouvert depuis un téléphone via l'IP du Mac (ex. http://192.168.1.100:5173),
// « localhost » désigne le téléphone lui-même : l'API y est introuvable (« erreur de connexion »).
// On remplace alors localhost par l'adresse qui sert la page. Sans effet en production, où
// VITE_API_BASE_URL pointe vers le vrai serveur, ni sur l'ordinateur qui héberge le serveur.
function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';
  try {
    const url = new URL(configured);
    if (LOCAL_HOST.test(url.hostname) && LAN_HOST.test(window.location.hostname)) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    /* URL invalide : on la garde telle quelle */
  }
  return configured;
}

const API_BASE_URL = resolveApiBaseUrl();

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
