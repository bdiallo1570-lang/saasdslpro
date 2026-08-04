import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { ROLE_NAMES } from '@/lib/roles';
import HomePage from '@/modules/auth/pages/HomePage';
import LoginPage from '@/modules/auth/pages/LoginPage';
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage';
import AccessDeniedPage from '@/modules/auth/pages/AccessDeniedPage';
import DashboardFinancierPage from '@/modules/dashboard/pages/DashboardFinancierPage';
import ReceptionPage from '@/modules/colis/pages/ReceptionPage';
import ReceptionConsultationPage from '@/modules/colis/pages/ReceptionConsultationPage';
import EcartsPoidsPage from '@/modules/colis/pages/EcartsPoidsPage';
import ExchangeRatesPage from '@/modules/exchangeRates/pages/ExchangeRatesPage';
import CaisseHubPage from '@/modules/caisse/pages/CaisseHubPage';
import CaisseConsultationPage from '@/modules/caisse/pages/CaisseConsultationPage';
import LotsListPage from '@/modules/lots/pages/LotsListPage';
import LotDetailPage from '@/modules/lots/pages/LotDetailPage';
import PortailClientPage from '@/modules/simulator/pages/PortailClientPage';
import CreancesDashboardPage from '@/modules/creances/pages/CreancesDashboardPage';
import AlertesPage from '@/modules/alertes/pages/AlertesPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/mot-de-passe-oublie" element={<ResetPasswordPage />} />
            <Route path="/acces-refuse" element={<AccessDeniedPage />} />

            <Route element={<ProtectedRoute allowedRoles={[ROLE_NAMES.ADMIN]} />}>
              <Route path="/dashboard/financier" element={<DashboardFinancierPage />} />
              <Route path="/caisse/consultation" element={<CaisseConsultationPage />} />
              <Route path="/reception/consultation" element={<ReceptionConsultationPage />} />
              <Route path="/ecarts-poids" element={<EcartsPoidsPage />} />
              <Route path="/parametres/taux-change" element={<ExchangeRatesPage />} />
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
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={[ROLE_NAMES.AGENT_GUINEE, ROLE_NAMES.CAISSIER]} />
              }
            >
              <Route path="/caisse" element={<CaisseHubPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLE_NAMES.CLIENT]} />}>
              <Route path="/portail-client" element={<PortailClientPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
