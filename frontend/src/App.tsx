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
import { PlaceholderPage } from '@/modules/dashboard/pages/PlaceholderPage';
import ReceptionPage from '@/modules/colis/pages/ReceptionPage';
import CaisseHubPage from '@/modules/caisse/pages/CaisseHubPage';
import LotsListPage from '@/modules/lots/pages/LotsListPage';
import LotDetailPage from '@/modules/lots/pages/LotDetailPage';
import PortailClientPage from '@/modules/simulator/pages/PortailClientPage';
import CreancesDashboardPage from '@/modules/creances/pages/CreancesDashboardPage';

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
              <Route
                path="/dashboard/financier"
                element={
                  <PlaceholderPage
                    title="Dashboard Financier"
                    description="CA par période, marges, impayés — réservé à l'Admin."
                  />
                }
              />
              <Route path="/creances" element={<CreancesDashboardPage />} />
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
                  allowedRoles={[ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_CHINE]}
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
