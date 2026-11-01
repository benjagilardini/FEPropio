import { lazy } from 'react';
import { Route } from 'react-router-dom';
import Layout from '../components/common/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RolePage from '../components/common/RolePage';

// Landlord pages
const AdjustmentsOverviewPage = lazy(() => import('../pages/landlord/AdjustmentsOverviewPage'));
const PaymentsOverviewPage = lazy(() => import('../pages/landlord/PaymentsOverviewPage'));
const MaintenanceOverviewPage = lazy(() => import('../pages/landlord/MaintenanceOverviewPage'));

// Tenant pages
const TenantAdjustmentsPage = lazy(() => import('../pages/tenant/AdjustmentsPage'));
const TenantPaymentsPage = lazy(() => import('../pages/tenant/PaymentsPage'));
const TenantMaintenancePage = lazy(() => import('../pages/tenant/MaintenancePage'));

// Shared (same component for both roles)
const NotificationsPage = lazy(() => import('../pages/tenant/NotificationsPage'));
const AccountPage = lazy(() => import('../pages/landlord/AccountPage'));

export const sharedRoutes = (
  <Route element={<ProtectedRoute />}>
    <Route element={<Layout />}>
      <Route path="/adjustments" element={<RolePage landlord={AdjustmentsOverviewPage} tenant={TenantAdjustmentsPage} />} />
      <Route path="/payments" element={<RolePage landlord={PaymentsOverviewPage} tenant={TenantPaymentsPage} />} />
      <Route path="/maintenance" element={<RolePage landlord={MaintenanceOverviewPage} tenant={TenantMaintenancePage} />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/account" element={<AccountPage />} />
    </Route>
  </Route>
);
