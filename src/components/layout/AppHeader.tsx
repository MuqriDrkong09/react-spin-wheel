import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material';

import { APP_NAME, DRAWER_WIDTH } from '@/constants/app';
import { useColorMode } from '@/hooks/useColorMode';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAppStore } from '@/stores/appStore';
import { COLOR_MODE } from '@/types/colorMode';

export function AppHeader() {
  const isMobile = useIsMobile();
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === COLOR_MODE.dark;

  return (
    <AppBar
      position="fixed"
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
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
          <IconButton
            color="inherit"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleColorMode}
          >
            {isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
