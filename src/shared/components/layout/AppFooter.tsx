import { Box, Typography } from '@mui/material';

import { APP_NAME } from '@/shared/constants';

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
        {APP_NAME} application foundation
      </Typography>
    </Box>
  );
}
