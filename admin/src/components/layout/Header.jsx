import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar, Toolbar, Box, Typography, IconButton, Badge, InputBase,
  Avatar, Menu, MenuItem, Divider, Breadcrumbs, Link, Tooltip, Chip,
} from '@mui/material';
import { Bell, Search, Settings, User, LogOut, ChevronRight } from 'lucide-react';
import { logoutAsync } from '../../store/authSlice';
import { markAllRead } from '../../store/uiSlice';

const routeMap = {
  '/': { title: 'Dashboard', crumbs: [] },
  '/franchise': { title: 'Franchise Management', crumbs: ['Operations'] },
  '/customers': { title: 'Customers', crumbs: ['Operations'] },
  '/bookings': { title: 'Bookings', crumbs: ['Operations'] },
  '/analytics': { title: 'Analytics', crumbs: ['Growth'] },
  '/marketplace': { title: 'Marketplace', crumbs: ['Platform'] },
  '/subscriptions': { title: 'Subscriptions', crumbs: ['Platform'] },
  '/notifications': { title: 'Notification Center', crumbs: ['Growth'] },
  '/coupons': { title: 'Coupons', crumbs: ['Growth'] },
  '/settings': { title: 'Settings', crumbs: ['System'] },
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { notifications, unreadCount } = useSelector((s) => s.ui);

  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  const routeKey = Object.keys(routeMap).find(
    (k) => k !== '/' && location.pathname.startsWith(k)
  ) || '/';
  const { title, crumbs } = routeMap[routeKey] || routeMap['/'];

  const handleUserMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);
  const handleNotifOpen = (e) => {
    setNotifAnchor(e.currentTarget);
    dispatch(markAllRead());
  };
  const handleNotifClose = () => setNotifAnchor(null);

  const handleLogout = () => {
    handleUserMenuClose();
    dispatch(logoutAsync());
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer - 1 }}>
      <Toolbar sx={{ gap: 2, minHeight: '64px !important', px: 3 }}>
        {/* Title + Breadcrumbs */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFF', lineHeight: 1.2, fontSize: 18 }}>
            {title}
          </Typography>
          {crumbs.length > 0 && (
            <Breadcrumbs
              separator={<ChevronRight size={12} color="#555" />}
              sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
            >
              <Link
                underline="hover"
                onClick={() => navigate('/')}
                sx={{ color: '#666', fontSize: 12, cursor: 'pointer' }}
              >
                Home
              </Link>
              {crumbs.map((c) => (
                <Typography key={c} sx={{ color: '#666', fontSize: 12 }}>
                  {c}
                </Typography>
              ))}
              <Typography sx={{ color: '#F5C518', fontSize: 12, fontWeight: 600 }}>
                {title}
              </Typography>
            </Breadcrumbs>
          )}
        </Box>

        {/* Search */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#111',
            border: '1px solid #2A2A2A',
            borderRadius: '10px',
            px: 1.5,
            py: 0.5,
            width: 280,
            '&:focus-within': { borderColor: '#F5C518' },
            transition: 'border-color 0.15s',
          }}
        >
          <Search size={16} color="#555" />
          <InputBase
            placeholder="Search anything..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            sx={{ flex: 1, fontSize: 13.5, color: '#CCC', '& input::placeholder': { color: '#555' } }}
          />
        </Box>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton onClick={handleNotifOpen} sx={{ color: '#666', '&:hover': { color: '#F5C518' } }}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <Bell size={20} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User Avatar */}
        <Tooltip title={user?.name || 'Admin'}>
          <Box
            onClick={handleUserMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              borderRadius: '10px',
              px: 1,
              py: 0.5,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#F5C518', color: '#000', fontSize: 14, fontWeight: 700 }}>
              {user?.name?.[0] || 'A'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13, color: '#FFF', lineHeight: 1.2 }}>
                {user?.name || 'Admin'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', fontSize: 11 }}>
                {user?.role || 'Super Admin'}
              </Typography>
            </Box>
          </Box>
        </Tooltip>

        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          PaperProps={{
            sx: { mt: 1, minWidth: 180, backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => { navigate('/settings'); handleUserMenuClose(); }} sx={{ gap: 1.5, fontSize: 14 }}>
            <User size={15} color="#666" /> Profile
          </MenuItem>
          <MenuItem onClick={() => { navigate('/settings'); handleUserMenuClose(); }} sx={{ gap: 1.5, fontSize: 14 }}>
            <Settings size={15} color="#666" /> Settings
          </MenuItem>
          <Divider sx={{ borderColor: '#2A2A2A' }} />
          <MenuItem onClick={handleLogout} sx={{ gap: 1.5, fontSize: 14, color: '#F44336' }}>
            <LogOut size={15} /> Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={handleNotifClose}
          PaperProps={{
            sx: { mt: 1, width: 340, backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', maxHeight: 420, overflow: 'auto' },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #2A2A2A' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notifications</Typography>
          </Box>
          {notifications.length === 0 ? (
            <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
              <Bell size={28} color="#333" />
              <Typography variant="body2" sx={{ color: '#555', mt: 1 }}>No notifications</Typography>
            </Box>
          ) : (
            notifications.slice(0, 8).map((n, i) => (
              <MenuItem key={i} onClick={handleNotifClose} sx={{ py: 1.5, gap: 1.5, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{n.title}</Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>{n.body}</Typography>
                </Box>
                {!n.read && <Chip label="New" size="small" sx={{ bgcolor: '#F5C518', color: '#000', fontSize: 10, height: 18 }} />}
              </MenuItem>
            ))
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
