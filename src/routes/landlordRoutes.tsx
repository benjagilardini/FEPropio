import { lazy } from 'react';
import { Route } from 'react-router-dom';
import Layout from '../components/common/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Units
const UnitsPage = lazy(() => import('../pages/landlord/UnitsPage'));
const UnitDetailPage = lazy(() => import('../pages/landlord/UnitDetailPage'));
const UnitFormPage = lazy(() => import('../pages/landlord/UnitFormPage'));

// Leases
const LeaseUploadPage = lazy(() => import('../pages/landlord/LeaseUploadPage'));
const LeaseConfirmPage = lazy(() => import('../pages/landlord/LeaseConfirmPage'));
const LeaseDetailPage = lazy(() => import('../pages/landlord/LeaseDetailPage'));
const LeaseInvitePage = lazy(() => import('../pages/landlord/LeaseInvitePage'));

// Per-lease detail pages
const AdjustmentPage = lazy(() => import('../pages/landlord/AdjustmentPage'));
const LeasePaymentsPage = lazy(() => import('../pages/landlord/PaymentsPage'));
const LeaseMaintenancePage = lazy(() => import('../pages/landlord/MaintenancePage'));
const LeaseIndexComparisonPage = lazy(() => import('../pages/landlord/IndexComparisonPage'));

// Per-unit detail pages
const ExpensesPage = lazy(() => import('../pages/landlord/ExpensesPage'));
const UnitYieldPage = lazy(() => import('../pages/landlord/YieldPage'));

// Top-level overview pages (sidebar)
const YieldOverviewPage = lazy(() => import('../pages/landlord/YieldOverviewPage'));
const IndexComparisonOverviewPage = lazy(() => import('../pages/landlord/IndexComparisonOverviewPage'));

export const landlordRoutes = (
  <Route element={<ProtectedRoute role="landlord" />}>
    <Route element={<Layout />}>
      {/* Units */}
      <Route path="/units" element={<UnitsPage />} />
      <Route path="/units/new" element={<UnitFormPage />} />
      <Route path="/units/:unitId" element={<UnitDetailPage />} />
      <Route path="/units/:unitId/edit" element={<UnitFormPage />} />
      <Route path="/units/:unitId/leases/new" element={<LeaseUploadPage />} />
      <Route path="/units/:unitId/expenses" element={<ExpensesPage />} />
      <Route path="/units/:unitId/yield" element={<UnitYieldPage />} />

      {/* Leases */}
      <Route path="/leases/:leaseId" element={<LeaseDetailPage />} />
      <Route path="/leases/:leaseId/confirm" element={<LeaseConfirmPage />} />
      <Route path="/leases/:leaseId/invite" element={<LeaseInvitePage />} />
      <Route path="/leases/:leaseId/adjustments/:adjustmentId" element={<AdjustmentPage />} />
      <Route path="/leases/:leaseId/payments" element={<LeasePaymentsPage />} />
      <Route path="/leases/:leaseId/maintenance" element={<LeaseMaintenancePage />} />
      <Route path="/leases/:leaseId/index-comparison" element={<LeaseIndexComparisonPage />} />

      {/* Sidebar overview pages */}
      <Route path="/yield" element={<YieldOverviewPage />} />
      <Route path="/index-comparison" element={<IndexComparisonOverviewPage />} />
    </Route>
  </Route>
);
