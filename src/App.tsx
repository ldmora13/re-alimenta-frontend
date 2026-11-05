import { Outlet, Route, Routes } from 'react-router-dom'
import { GuestOnly, RequireAuth } from './features/auth/guards'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { LandingPage } from './features/landing/pages/LandingPage'
import { OnboardingPage } from './features/onboarding/pages/OnboardingPage'
import { DashboardPage } from './features/donations/pages/DashboardPage'
import { CatalogPage } from './features/donations/pages/CatalogPage'
import { DonationDetailPage } from './features/donations/pages/DonationDetailPage'
import { NewDonationPage } from './features/donations/pages/NewDonationPage'
import { DeliveriesPage } from './features/deliveries/pages/DeliveriesPage'
import { DeliveryDetailPage } from './features/deliveries/pages/DeliveryDetailPage'
import { CourierPage } from './features/deliveries/pages/CourierPage'
import { SettingsPage } from './features/settings/pages/SettingsPage'
import { AdminPage } from './features/admin/pages/AdminPage'
import { DesignSystemPage } from './features/design/pages/DesignSystemPage'
import { NotFoundPage } from './features/not-found/pages/NotFoundPage'
import { WorkspaceProvider } from './features/workspace/WorkspaceProvider'
import { AppShell } from './shared/layout/AppShell'

function WorkspaceGate() {
  return (
    <WorkspaceProvider>
      <Outlet />
    </WorkspaceProvider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<WorkspaceGate />}>
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route element={<AppShell />}>
            <Route path="/panel" element={<DashboardPage />} />
            <Route path="/donaciones" element={<CatalogPage />} />
            <Route path="/donaciones/nueva" element={<NewDonationPage />} />
            <Route path="/donaciones/:id" element={<DonationDetailPage />} />
            <Route path="/entregas" element={<DeliveriesPage />} />
            <Route path="/entregas/:id" element={<DeliveryDetailPage />} />
            <Route path="/courier" element={<CourierPage />} />
            <Route path="/courier/entregas/:id" element={<DeliveryDetailPage />} />
            <Route path="/configuracion" element={<SettingsPage />} />
            <Route path="/admin/verificaciones" element={<AdminPage />} />
            <Route path="/diseno" element={<DesignSystemPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
