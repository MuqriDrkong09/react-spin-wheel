import { Box, Button, Stack } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SpinWheel } from '@/features/spin/components/SpinWheel';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import { useSpinScreen } from '@/features/spin/hooks/useSpinScreen';

export function SpinScreen() {
  const { wheel, isMissingWheel, goToCreate, goToDashboard } = useSpinScreen();

  return (
    <PageContainer>
      <Stack
        spacing={3}
        sx={{
          minHeight: { xs: 'auto', md: 'calc(100dvh - 10.5rem)' },
        }}
      >
        <PageHeader
          title="Spin"
          description={
            wheel ? `Spin ${wheel.name}.` : 'Run a wheel and capture the result.'
          }
        />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minHeight: 0,
          }}
        >
          {wheel ? (
            <SpinWheel items={wheel.items} />
          ) : (
            <EmptyState
              titleComponent="h2"
              title={isMissingWheel ? SPIN_MESSAGES.missingWheelTitle : SPIN_MESSAGES.noWheelTitle}
              description={
                isMissingWheel
                  ? SPIN_MESSAGES.missingWheelDescription
                  : SPIN_MESSAGES.noWheelDescription
              }
              action={
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ justifyContent: 'center' }}
                >
                  <Button variant="contained" onClick={goToCreate}>
                    Create a wheel
                  </Button>
                  <Button variant="outlined" onClick={goToDashboard}>
                    Back to dashboard
                  </Button>
                </Stack>
              }
            />
          )}
        </Box>
      </Stack>
    </PageContainer>
  );
}
