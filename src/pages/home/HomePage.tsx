import { Box, Stack, Typography } from '@mui/material';

import { PageContainer } from '@/shared/components/ui';
import { APP_DESCRIPTION, APP_NAME } from '@/shared/constants';

export function HomePage() {
  return (
    <PageContainer>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {APP_NAME}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
            {APP_DESCRIPTION}
          </Typography>
        </Box>
      </Stack>
    </PageContainer>
  );
}
