import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Drawer, Avatar,
  List, ListItemButton, ListItemIcon, ListItemText, Divider, useMediaQuery, useTheme,
  alpha,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import DescriptionIcon from '@mui/icons-material/Description';
import TuneIcon from '@mui/icons-material/Tune';
import PaymentIcon from '@mui/icons-material/Payment';
import BuildIcon from '@mui/icons-material/Build';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BarChartIcon from '@mui/icons-material/BarChart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 240;

const landlordNav = [
  { label: 'Mis unidades', path: '/units', icon: <ApartmentIcon /> },
  { label: 'Actualizaciones', path: '/adjustments', icon: <TrendingUpIcon /> },
  { label: 'Comparar indices', path: '/index-comparison', icon: <CompareArrowsIcon /> },
  { label: 'Rendimiento', path: '/yield', icon: <BarChartIcon /> },
  { label: 'Pagos', path: '/payments', icon: <ReceiptIcon /> },
  { label: 'Reclamos', path: '/maintenance', icon: <BuildIcon /> },
];

const landlordNavBottom = [
  { label: 'Mi cuenta', path: '/account', icon: <AccountCircleIcon /> },
];

const tenantNav = [
  { label: 'Inicio', path: '/home', icon: <HomeIcon /> },
  { label: 'Mi Contrato', path: '/my-lease', icon: <DescriptionIcon /> },
  { label: 'Ajustes', path: '/adjustments', icon: <TuneIcon /> },
  { label: 'Pagos', path: '/payments', icon: <PaymentIcon /> },
  { label: 'Reclamos', path: '/maintenance', icon: <BuildIcon /> },
  { label: 'Notificaciones', path: '/notifications', icon: <NotificationsIcon /> },
];

const tenantNavBottom = [
  { label: 'Mi Cuenta', path: '/account', icon: <AccountCircleIcon /> },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLandlord = user?.role === 'landlord';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const selectedSx = (path: string) => {
    const isSelected = location.pathname.startsWith(path);
    return {
      bgcolor: isSelected ? alpha(theme.palette.primary.light, 0.15) : 'transparent',
      color: isSelected ? 'primary.main' : 'inherit',
      '& .MuiListItemIcon-root': {
        color: isSelected ? 'primary.main' : 'inherit',
      },
    };
  };

  const renderNavItem = (item: { label: string; path: string; icon: React.ReactNode }) => (
    <ListItemButton
      key={item.path}
      selected={location.pathname.startsWith(item.path)}
      onClick={() => {
        navigate(item.path);
        if (isMobile) setMobileOpen(false);
      }}
      sx={selectedSx(item.path)}
    >
      <ListItemIcon>{item.icon}</ListItemIcon>
      <ListItemText primary={item.label} />
    </ListItemButton>
  );

  const drawer = isLandlord ? (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {landlordNav.map(renderNavItem)}
      </List>
      <Divider />
      <List>
        {landlordNavBottom.map(renderNavItem)}
        <ListItemButton
          onClick={handleLogout}
          sx={{ color: 'inherit' }}
        >
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Cerrar sesión" />
        </ListItemButton>
      </List>
    </Box>
  ) : (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {tenantNav.map(renderNavItem)}
      </List>
      <Divider />
      <List>
        {tenantNavBottom.map(renderNavItem)}
        <ListItemButton
          onClick={handleLogout}
          sx={{ color: 'inherit' }}
        >
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Cerrar sesión" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <ApartmentIcon sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Propio
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.dark', width: 36, height: 36, fontSize: '0.875rem' }}>
              {userInitials}
            </Avatar>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.firstName} {user?.lastName}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, minHeight: 0, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
