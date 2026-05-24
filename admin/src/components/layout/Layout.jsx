import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const { sidebarOpen } = useSelector((s) => s.ui);

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#F5F7FA', overflow: 'hidden' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'margin-left 0.2s ease',
        }}
      >
        <Header />
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            backgroundColor: '#F5F7FA',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
