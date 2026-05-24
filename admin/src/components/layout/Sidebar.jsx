import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, Tooltip, Collapse, IconButton,
} from '@mui/material';
import {
  LayoutDashboard, Store, Users, Calendar, ShoppingBag, Shield, CreditCard,
  Truck, BarChart3, Tag, Bell, Settings, LogOut, ChevronDown, ChevronRight,
  Car, ChevronLeft, Menu,
} from 'lucide-react';
import { logoutAsync } from '../../store/authSlice';
import { toggleSidebar } from '../../store/uiSlice';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

const NAVY = '#0F2D52';
const ORANGE = '#E8500A';

const navSections = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, path: '/' }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Franchise Mgmt', icon: Store, path: '/franchise' },
      { label: 'Customers', icon: Users, path: '/customers' },
      { label: 'Bookings', icon: Calendar, path: '/bookings' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Marketplace', icon: ShoppingBag, path: '/marketplace' },
      { label: 'Insurance', icon: Shield, path: '/insurance' },
      { label: 'Subscriptions', icon: CreditCard, path: '/subscriptions' },
      { label: 'Fleet', icon: Truck, path: '/fleet' },
    ],
  },
  {
    title: 'Growth',
    items: [
      { label: 'Analytics', icon: BarChart3, path: '/analytics' },
      { label: 'Coupons', icon: Tag, path: '/coupons' },
      { label: 'Notifications', icon: Bell, path: '/notifications' },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Settings', icon: Settings, path: '/settings' }],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { sidebarOpen } = useSelector((s) => s.ui);
  const [collapsedSections, setCollapsedSections] = useState({});

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const toggleSection = (title) =>
    setCollapsedSections((p) => ({ ...p, [title]: !p[title] }));

  const handleNavClick = (path) => navigate(path);

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        width: sidebarOpen ? DRAWER_WIDTH : COLLAPSED_WIDTH,
        transition: 'width 0.2s ease',
        backgroundColor: NAVY,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: sidebarOpen ? 2.5 : 1.5,
          py: 2.5,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          minHeight: 72,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Car size={20} color={NAVY} />
        </Box>
        {sidebarOpen && (
          <Box>
            <Typography
              variant="h6"
              sx={{ color: '#FFFFFF', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.5px' }}
            >
              AutoCare<span style={{ color: ORANGE }}>X</span>
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>
              Admin Console
            </Typography>
          </Box>
        )}
        {sidebarOpen && (
          <IconButton
            size="small"
            onClick={() => dispatch(toggleSidebar())}
            sx={{ ml: 'auto', color: 'rgba(255,255,255,0.45)', '&:hover': { color: '#fff' } }}
          >
            <ChevronLeft size={18} />
          </IconButton>
        )}
      </Box>

      {/* Collapsed toggle */}
      {!sidebarOpen && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <IconButton
            size="small"
            onClick={() => dispatch(toggleSidebar())}
            sx={{ color: 'rgba(255,255,255,0.45)', '&:hover': { color: '#fff' } }}
          >
            <Menu size={18} />
          </IconButton>
        </Box>
      )}

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        {navSections.map((section) => (
          <Box key={section.title} sx={{ mb: 0.5 }}>
            {sidebarOpen && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2.5,
                  py: 0.5,
                  cursor: 'pointer',
                }}
                onClick={() => toggleSection(section.title)}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.35)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: 10,
                  }}
                >
                  {section.title}
                </Typography>
                {collapsedSections[section.title] ? (
                  <ChevronRight size={12} color="rgba(255,255,255,0.35)" />
                ) : (
                  <ChevronDown size={12} color="rgba(255,255,255,0.35)" />
                )}
              </Box>
            )}
            <Collapse in={!collapsedSections[section.title]} timeout="auto">
              <List dense disablePadding>
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  const btn = (
                    <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                      <ListItemButton
                        onClick={() => handleNavClick(item.path)}
                        sx={{
                          mx: 1,
                          borderRadius: '10px',
                          px: sidebarOpen ? 1.5 : 1,
                          py: 1,
                          justifyContent: sidebarOpen ? 'flex-start' : 'center',
                          backgroundColor: active ? 'rgba(232,80,10,0.18)' : 'transparent',
                          '&:hover': {
                            backgroundColor: active
                              ? 'rgba(232,80,10,0.25)'
                              : 'rgba(255,255,255,0.07)',
                          },
                          transition: 'all 0.15s',
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: sidebarOpen ? 36 : 'auto',
                            color: active ? ORANGE : 'rgba(255,255,255,0.55)',
                          }}
                        >
                          <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                        </ListItemIcon>
                        {sidebarOpen && (
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontSize: 13.5,
                              fontWeight: active ? 700 : 500,
                              color: active ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                            }}
                          />
                        )}
                        {active && sidebarOpen && (
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              backgroundColor: ORANGE,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                  return sidebarOpen ? btn : (
                    <Tooltip key={item.path} title={item.label} placement="right" arrow>
                      {btn}
                    </Tooltip>
                  );
                })}
              </List>
            </Collapse>
          </Box>
        ))}
      </Box>

      {/* User info */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Box
        sx={{
          p: sidebarOpen ? 2 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: ORANGE,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {user?.name?.[0] || 'A'}
        </Avatar>
        {sidebarOpen && (
          <>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: 13 }}
                noWrap
              >
                {user?.name || 'Admin User'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }} noWrap>
                {user?.role || 'Super Admin'}
              </Typography>
            </Box>
            <Tooltip title="Logout">
              <IconButton
                size="small"
                onClick={() => dispatch(logoutAsync())}
                sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ff6b6b' } }}
              >
                <LogOut size={16} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarOpen ? DRAWER_WIDTH : COLLAPSED_WIDTH,
        flexShrink: 0,
        transition: 'width 0.2s ease',
        '& .MuiDrawer-paper': {
          width: sidebarOpen ? DRAWER_WIDTH : COLLAPSED_WIDTH,
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
          backgroundColor: NAVY,
          borderRight: 'none',
          boxShadow: '2px 0 12px rgba(15,45,82,0.15)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
