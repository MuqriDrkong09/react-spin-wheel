import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';

import { PageTransition } from '@/shared/components/motion';

import { AppDrawer } from './AppDrawer';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

export function AppLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppHeader />
      <AppDrawer />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Box>
        <AppFooter />
      </Box>
    </Box>
  );
}
