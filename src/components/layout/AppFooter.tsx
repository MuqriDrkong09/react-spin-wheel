import { Box, Typography } from '@mui/material';

import { APP_NAME } from '@/constants/app';

export function AppFooter() {
  return (
    <Box
      component="footer"
      sx={{
        px: { xs: 2, md: 3 },
        py: 2,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {APP_NAME}
      </Typography>
    </Box>
  );
}
