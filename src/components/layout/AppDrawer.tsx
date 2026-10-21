import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { APP_NAME, DRAWER_WIDTH } from '@/constants/app';
import { NAV_ITEMS } from '@/data/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAppStore } from '@/stores/appStore';

export function AppDrawer() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {APP_NAME}
        </Typography>
      </Toolbar>
      <List sx={{ px: 1 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => {
                void navigate(item.path);
                if (isMobile) {
                  setSidebarOpen(false);
                }
              }}
            >
              <ListItemIcon>
                <Icon />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? sidebarOpen : true}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
