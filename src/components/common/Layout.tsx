import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Drawer, Avatar, Badge,
  List, ListItemButton, ListItemIcon, ListItemText, Divider, useMediaQuery, useTheme,
  alpha, Popover, Button, CircularProgress,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CircleIcon from '@mui/icons-material/Circle';
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
import { useUnreadCount, useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import { useSocket } from '../../hooks/useSocket';
import { formatDateTime } from '../../utils/formatDate';

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
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const qc = useQueryClient();
  const { data: unreadCount } = useUnreadCount();
  const { data: notifData, isLoading: notifLoading } = useNotifications(1);
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();

  const openNotifications = (e: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(e.currentTarget);
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  useSocket();
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
            <IconButton color="inherit" onClick={openNotifications} size="small">
              <Badge badgeContent={unreadCount || 0} color="error" max={99}>
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: 'primary.dark', width: 36, height: 36, fontSize: '0.875rem' }}>
              {userInitials}
            </Avatar>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.firstName} {user?.lastName}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notifications popover */}
      <Popover
        open={!!notifAnchor}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 380, maxHeight: 460, display: 'flex', flexDirection: 'column', mt: 0.5, borderRadius: 2 } } }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Notificaciones</Typography>
          {(unreadCount ?? 0) > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              Marcar leídas
            </Button>
          )}
        </Box>

        {/* List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {notifLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : !notifData?.data?.length ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <NotificationsNoneIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">Sin notificaciones</Typography>
            </Box>
          ) : (
            notifData.data.slice(0, 15).map((n) => (
              <Box
                key={n.id}
                onClick={() => { if (!n.readAt) markRead.mutate(n.id); }}
                sx={{
                  px: 2, py: 1.25,
                  borderBottom: '1px solid', borderColor: 'divider',
                  bgcolor: n.readAt ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                  cursor: n.readAt ? 'default' : 'pointer',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                  display: 'flex', gap: 1.25, alignItems: 'flex-start',
                }}
              >
                {!n.readAt && <CircleIcon sx={{ fontSize: 8, color: 'primary.main', mt: 0.75, flexShrink: 0 }} />}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: n.readAt ? 400 : 600, fontSize: '0.82rem', lineHeight: 1.3 }}>
                    {n.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.15, lineHeight: 1.3 }} noWrap>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', mt: 0.25, display: 'block' }}>
                    {formatDateTime(n.createdAt)}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>

      </Popover>

      {isMobile ? (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, mt: 8, height: 'calc(100vh - 64px)', overflow: 'auto', px: 3, pb: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
