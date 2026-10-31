import { lazy } from 'react';
import { Route } from 'react-router-dom';
import Layout from '../components/common/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';

const UnitInfoPage = lazy(() => import('../pages/tenant/UnitInfoPage'));
const LeasePage = lazy(() => import('../pages/tenant/LeasePage'));
const AdjustmentsPage = lazy(() => import('../pages/tenant/AdjustmentsPage'));
const PaymentsPage = lazy(() => import('../pages/tenant/PaymentsPage'));
const MaintenancePage = lazy(() => import('../pages/tenant/MaintenancePage'));
const NotificationsPage = lazy(() => import('../pages/tenant/NotificationsPage'));
const AccountPage = lazy(() => import('../pages/tenant/AccountPage'));

export const tenantRoutes = (
  <Route element={<ProtectedRoute role="tenant" />}>
    <Route element={<Layout />}>
      <Route path="/home" element={<UnitInfoPage />} />
      <Route path="/my-lease" element={<LeasePage />} />
      <Route path="/adjustments" element={<AdjustmentsPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/account" element={<AccountPage />} />
    </Route>
  </Route>
);
