import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import { authRoutes } from './routes/authRoutes';
import { landlordRoutes } from './routes/landlordRoutes';
import { tenantRoutes } from './routes/tenantRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'landlord' ? '/units' : '/home'} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Routes>
                {authRoutes}
                {landlordRoutes}
                {tenantRoutes}
                <Route path="/" element={<RoleBasedRedirect />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
