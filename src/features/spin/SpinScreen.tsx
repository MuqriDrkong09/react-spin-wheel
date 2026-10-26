import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Stack, Typography } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SpinWheel } from '@/features/spin/components/SpinWheel';
import { SpinWheelPicker } from '@/features/spin/components/SpinWheelPicker';
import { SPIN_MESSAGES, SPIN_STATUS } from '@/features/spin/constants';
import { useSpinScreen } from '@/features/spin/hooks/useSpinScreen';

export function SpinScreen() {
  const {
    wheel,
    availableWheels,
    needsWheelChoice,
    isMissingWheel,
    spin,
    selectWheel,
    clearWheelSelection,
    goToCreate,
    goToDashboard,
  } = useSpinScreen();

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
            wheel
              ? `Spin ${wheel.name}.`
              : needsWheelChoice
                ? SPIN_MESSAGES.chooseWheelDescription
                : 'Run a wheel and capture the result.'
          }
          action={
            wheel ? (
              <Button variant="outlined" onClick={clearWheelSelection}>
                {SPIN_MESSAGES.changeWheel}
              </Button>
            ) : needsWheelChoice ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={goToCreate}>
                Create Wheel
              </Button>
            ) : null
          }
        />
        {wheel ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: 0,
              gap: 2,
            }}
          >
            <SpinWheel
              items={wheel.items}
              onSpin={spin.spin}
              spinning={spin.spinning}
              selectedColor={spin.selectedColor}
              rotationDegrees={spin.rotationDegrees}
              spinDuration={spin.animation.spinDuration}
              animationType={spin.animation.animationType}
              reducedMotion={spin.reducedMotion}
              onSpinComplete={spin.complete}
            />
            {spin.status === SPIN_STATUS.spinning ? (
              <Typography color="text.secondary">{SPIN_MESSAGES.spinning}</Typography>
            ) : null}
            {spin.status === SPIN_STATUS.completed && spin.result ? (
              <Typography aria-live="polite">{SPIN_MESSAGES.winner(spin.result.item.name)}</Typography>
            ) : null}
          </Box>
        ) : needsWheelChoice ? (
          <SpinWheelPicker wheels={availableWheels} onSelect={selectWheel} />
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
      </Stack>
    </PageContainer>
  );
}
