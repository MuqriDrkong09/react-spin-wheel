import { Box, Toolbar } from '@mui/material';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { RouteFallback } from '@/components/feedback/RouteFallback';
import { RuntimeNoticeBanner } from '@/components/feedback/RuntimeNoticeBanner';

import { AppDrawer } from './AppDrawer';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

export function AppLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: -9999,
          top: 0,
          zIndex: (theme) => theme.zIndex.tooltip + 1,
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          textDecoration: 'none',
          fontWeight: 600,
          '&:focus': {
            left: 16,
            top: 16,
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        Skip to main content
      </Box>
      <AppHeader />
      <AppDrawer />
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          bgcolor: 'background.default',
          outline: 'none',
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          <RuntimeNoticeBanner />
          <AppErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <PageTransition>
                <Outlet />
              </PageTransition>
            </Suspense>
          </AppErrorBoundary>
        </Box>
        <AppFooter />
      </Box>
    </Box>
  );
}
