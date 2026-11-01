import { lazy } from 'react';
import { Route } from 'react-router-dom';
import Layout from '../components/common/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';

const UnitInfoPage = lazy(() => import('../pages/tenant/UnitInfoPage'));
const LeasePage = lazy(() => import('../pages/tenant/LeasePage'));

export const tenantRoutes = (
  <Route element={<ProtectedRoute role="tenant" />}>
    <Route element={<Layout />}>
      <Route path="/home" element={<UnitInfoPage />} />
      <Route path="/my-lease" element={<LeasePage />} />
    </Route>
  </Route>
);
