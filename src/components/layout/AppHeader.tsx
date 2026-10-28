import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material';

import { ColorModeMenu } from '@/components/layout/ColorModeMenu';
import { APP_NAME, DRAWER_WIDTH } from '@/constants/app';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAppStore } from '@/stores/appStore';

export function AppHeader() {
  const isMobile = useIsMobile();
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  return (
    <AppBar
      position="fixed"
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'text.primary',
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        {isMobile ? (
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Open navigation"
            onClick={toggleSidebar}
          >
            <MenuIcon />
          </IconButton>
        ) : null}
        <Typography variant="h6" component="p" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {APP_NAME}
        </Typography>
        <Box>
          <ColorModeMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
