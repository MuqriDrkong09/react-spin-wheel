import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Stack, Typography } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SelectionPath } from '@/features/spin/components/SelectionPath';
import { SpinWheel } from '@/features/spin/components/SpinWheel';
import { SpinWheelPicker } from '@/features/spin/components/SpinWheelPicker';
import { WinnerDialog } from '@/features/spin/components/WinnerDialog';
import { SPIN_MESSAGES, SPIN_STATUS } from '@/features/spin/constants';
import { useSpinScreen } from '@/features/spin/hooks/useSpinScreen';
import { useSpinSession } from '@/features/spin/hooks/useSpinSession';
import type { Wheel } from '@/types/wheel';

export function SpinScreen() {
  const {
    wheel,
    availableWheels,
    needsWheelChoice,
    isMissingWheel,
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
          <ActiveWheelSpin key={wheel.id} wheel={wheel} onFinish={clearWheelSelection} />
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

function ActiveWheelSpin({ wheel, onFinish }: { wheel: Wheel; onFinish: () => void }) {
  const session = useSpinSession(wheel);

  function handleFinish() {
    session.finish();
    onFinish();
  }

  return (
    <>
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
        {session.ancestors.length > 0 ? (
          <>
            <SelectionPath steps={session.ancestors} />
            <Typography color="text.secondary">
              {SPIN_MESSAGES.childWheelOf(session.ancestors[session.ancestors.length - 1]?.name ?? '')}
            </Typography>
          </>
        ) : null}
        <SpinWheel
          key={session.items.map((item) => item.id).join('|')}
          items={session.items}
          onSpin={session.startSpin}
          spinning={session.spin.spinning}
          selectedColor={session.spin.selectedColor}
          rotationDegrees={session.spin.rotationDegrees}
          spinDuration={session.spin.animation.spinDuration}
          animationType={session.spin.animation.animationType}
          reducedMotion={session.spin.reducedMotion}
          onSpinComplete={session.spin.complete}
        />
        {session.spin.status === SPIN_STATUS.spinning ? (
          <Typography color="text.secondary">{SPIN_MESSAGES.spinning}</Typography>
        ) : null}
      </Box>
      <WinnerDialog
        open={session.winnerOpen}
        item={session.winner}
        path={session.selection}
        reducedMotion={session.spin.reducedMotion}
        onClose={session.closeWinner}
        onFinish={handleFinish}
        onSpinAgain={session.spinAgain}
        onSpinChild={session.spinChild}
      />
    </>
  );
}
