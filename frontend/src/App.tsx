import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { ROLE_NAMES } from '@/lib/roles';
import { CursorAura } from '@/ui/CursorAura';
import HomePage from '@/modules/auth/pages/HomePage';

// La landing est chargée tout de suite (c'est la page la plus visitée) ; chaque page de
// l'application n'est téléchargée qu'à sa première ouverture. Le visiteur de la landing ne paie
// donc plus pour les graphiques, le lecteur de QR code ou l'import CSV du back-office.
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('@/modules/auth/pages/ResetPasswordPage'));
const AccessDeniedPage = lazy(() => import('@/modules/auth/pages/AccessDeniedPage'));
const DashboardFinancierPage = lazy(() => import('@/modules/dashboard/pages/DashboardFinancierPage'));
const ReceptionPage = lazy(() => import('@/modules/colis/pages/ReceptionPage'));
const ReceptionConsultationPage = lazy(() => import('@/modules/colis/pages/ReceptionConsultationPage'));
const ColisGuineePage = lazy(() => import('@/modules/colis/pages/ColisGuineePage'));
const EcartsPoidsPage = lazy(() => import('@/modules/colis/pages/EcartsPoidsPage'));
const ExchangeRatesPage = lazy(() => import('@/modules/exchangeRates/pages/ExchangeRatesPage'));
const CaisseHubPage = lazy(() => import('@/modules/caisse/pages/CaisseHubPage'));
const CaisseConsultationPage = lazy(() => import('@/modules/caisse/pages/CaisseConsultationPage'));
const LotsListPage = lazy(() => import('@/modules/lots/pages/LotsListPage'));
const LotDetailPage = lazy(() => import('@/modules/lots/pages/LotDetailPage'));
const PortailClientPage = lazy(() => import('@/modules/simulator/pages/PortailClientPage'));
const CreancesDashboardPage = lazy(() => import('@/modules/creances/pages/CreancesDashboardPage'));
const AlertesPage = lazy(() => import('@/modules/alertes/pages/AlertesPage'));
const ClientsListPage = lazy(() => import('@/modules/clients/pages/ClientsListPage'));
const FacturesPage = lazy(() => import('@/modules/factures/pages/FacturesPage'));
const DocumentPage = lazy(() => import('@/modules/documents/pages/DocumentPage'));

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" />
          <CursorAura />
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/mot-de-passe-oublie" element={<ResetPasswordPage />} />
            <Route path="/acces-refuse" element={<AccessDeniedPage />} />
            {/* Public : facture ou reçu partagé au client par un lien signé */}
            <Route path="/document/:token" element={<DocumentPage />} />

            <Route element={<ProtectedRoute allowedRoles={[ROLE_NAMES.ADMIN]} />}>
              <Route path="/dashboard/financier" element={<DashboardFinancierPage />} />
              <Route path="/caisse/consultation" element={<CaisseConsultationPage />} />
              <Route path="/ecarts-poids" element={<EcartsPoidsPage />} />
              <Route path="/parametres/taux-change" element={<ExchangeRatesPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={[ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_CHINE]} />
              }
            >
              <Route path="/reception/consultation" element={<ReceptionConsultationPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={[ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_GUINEE]} />
              }
            >
              <Route path="/creances" element={<CreancesDashboardPage />} />
              <Route path="/alertes" element={<AlertesPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={[ROLE_NAMES.AGENT_CHINE]} />
              }
            >
              <Route path="/reception" element={<ReceptionPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_CHINE, ROLE_NAMES.AGENT_GUINEE]}
                />
              }
            >
              <Route path="/lots" element={<LotsListPage />} />
              <Route path="/lots/:id" element={<LotDetailPage />} />
              <Route path="/clients" element={<ClientsListPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={[ROLE_NAMES.AGENT_GUINEE, ROLE_NAMES.CAISSIER]} />
              }
            >
              <Route path="/caisse" element={<CaisseHubPage />} />
            </Route>

            {/* Une seule déclaration de /factures : React Router retient la première qui correspond,
                un doublon réservé à l'admin renvoyait l'agent Guinée et le caissier vers « Accès refusé ». */}
            <Route
              element={
                <ProtectedRoute allowedRoles={[ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_GUINEE, ROLE_NAMES.CAISSIER]} />
              }
            >
              <Route path="/factures" element={<FacturesPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={[ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_GUINEE]} />
              }
            >
              <Route path="/colis" element={<ColisGuineePage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLE_NAMES.CLIENT]} />}>
              <Route path="/portail-client" element={<PortailClientPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

// Écran d'attente pendant le téléchargement d'une page : fond neutre, puis un fin repère animé
// seulement si l'attente dépasse 300 ms (pas de clignotement sur une bonne connexion).
function RouteFallback() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-night-900">
      <div className="fixed inset-x-0 top-0 h-0.5 overflow-hidden opacity-0 animate-[fadeIn_0.2s_0.3s_forwards]">
        <div className="h-full w-1/3 animate-[routeBar_1.1s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cargo-400 to-transparent" />
      </div>
    </div>
  );
}
