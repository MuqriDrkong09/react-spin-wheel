import AddIcon from '@mui/icons-material/Add';
import { Alert, Box, Button, Snackbar, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FinalResult } from '@/features/spin/components/FinalResult';
import { RemoveWinnerSwitch } from '@/features/spin/components/RemoveWinnerSwitch';
import { SelectionModeSelect } from '@/features/spin/components/SelectionModeSelect';
import { SelectionPath } from '@/features/spin/components/SelectionPath';
import { SpinWheel } from '@/features/spin/components/SpinWheel';
import { SpinWheelPicker } from '@/features/spin/components/SpinWheelPicker';
import { WinnerDialog } from '@/features/spin/components/WinnerDialog';
import { SPIN_MESSAGES, SPIN_STATUS } from '@/features/spin/constants';
import { useSpinScreen } from '@/features/spin/hooks/useSpinScreen';
import { useSpinSession } from '@/features/spin/hooks/useSpinSession';
import { formatFinalResultCopy, toSpinHistorySession } from '@/features/spin/utils/formatFinalResult';
import {
  displayWheelTitle,
  resolveAppearance,
} from '@/features/wheel-customization/utils/appearance';
import { useHistoryStore } from '@/stores/historyStore';
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
    setSelectionMode,
    setRemoveWinner,
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
          actionsBesideFrom={wheel ? 'md' : 'sm'}
          description={
            wheel
              ? `Spin ${wheel.name}.`
              : needsWheelChoice
                ? SPIN_MESSAGES.chooseWheelDescription
                : 'Run a wheel and capture the result.'
          }
          action={
            wheel ? (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ alignItems: { xs: 'stretch', sm: 'center' }, width: { xs: '100%', sm: 'auto' } }}
              >
                <SelectionModeSelect
                  value={wheel.settings.selectionMode}
                  onChange={setSelectionMode}
                />
                <RemoveWinnerSwitch
                  checked={wheel.settings.removeWinner ?? false}
                  onChange={setRemoveWinner}
                />
                <Button variant="outlined" onClick={clearWheelSelection}>
                  {SPIN_MESSAGES.changeWheel}
                </Button>
              </Stack>
            ) : needsWheelChoice ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={goToCreate}>
                Create Wheel
              </Button>
            ) : null
          }
        />
        {wheel ? (
          <ActiveWheelSpin key={wheel.id} wheel={wheel} />
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

function ActiveWheelSpin({ wheel }: { wheel: Wheel }) {
  const session = useSpinSession(wheel);
  const addSpinSession = useHistoryStore((state) => state.addSpinSession);
  const [saved, setSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const appearance = resolveAppearance(wheel.settings.appearance);
  const title = displayWheelTitle(appearance, wheel.name);

  async function copyResult() {
    if (!session.result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        formatFinalResultCopy({
          wheelName: wheel.name,
          steps: session.selection,
          timestamp: session.result.timestamp,
        }),
      );
      setStatusMessage(SPIN_MESSAGES.resultCopied);
    } catch {
      setStatusMessage(SPIN_MESSAGES.resultCopyFailed);
    }
  }

  function saveResult() {
    if (!session.result || saved) {
      return;
    }

    addSpinSession(
      toSpinHistorySession({
        result: session.result,
        wheelName: wheel.name,
        mode: session.selectionMode,
      }),
    );
    setSaved(true);
    setStatusMessage(SPIN_MESSAGES.resultSaved);
  }

  function spinAgain() {
    setSaved(false);
    setStatusMessage('');
    session.spinAgain();
  }

  function resumeFromResult() {
    setSaved(false);
    setStatusMessage('');
    session.resumeFromResult();
  }

  function startNewSelection() {
    setSaved(false);
    setStatusMessage('');
    session.startNewSelection();
  }

  function restoreItems() {
    session.restoreItems();
  }

  return (
    <>
      {session.canRestoreItems ? (
        <Stack direction="row" sx={{ justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
          <Button variant="outlined" onClick={restoreItems}>
            {SPIN_MESSAGES.restoreItems}
          </Button>
        </Stack>
      ) : null}
      {session.finalOpen && session.result ? (
        <FinalResult
          wheelName={wheel.name}
          steps={session.selection}
          timestamp={session.result.timestamp}
          reducedMotion={session.spin.reducedMotion}
          saved={saved}
          statusMessage={statusMessage}
          onSpinAgain={resumeFromResult}
          onStartNewSelection={startNewSelection}
          onCopy={() => {
            void copyResult();
          }}
          onSave={saveResult}
        />
      ) : (
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
            overflow: 'hidden',
            scrollbarGutter: 'stable',
            bgcolor: appearance.background,
            borderRadius: 3,
            px: 2,
            py: 3,
          }}
        >
          <Box
            sx={{
              minHeight: { xs: 72, md: 0 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
              flexShrink: 0,
            }}
          >
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: appearance.textColor }}>
              {title}
            </Typography>
            {session.ancestors.length > 0 ? (
              <>
                <SelectionPath steps={session.ancestors} textColor={appearance.textColor} />
                <Typography sx={{ color: appearance.textColor, opacity: 0.8 }}>
                  {SPIN_MESSAGES.childWheelOf(session.ancestors[session.ancestors.length - 1]?.name ?? '')}
                </Typography>
              </>
            ) : null}
          </Box>
          <SpinWheel
            key={session.items.map((item) => item.id).join('|')}
            items={session.items}
            appearance={appearance}
            onSpin={session.startSpin}
            spinning={session.spin.spinning}
            rotationDegrees={session.spin.rotationDegrees}
            spinDuration={session.spin.animation.spinDuration}
            animationType={session.spin.animation.animationType}
            reducedMotion={session.spin.reducedMotion}
            onSpinComplete={session.completeSpin}
          />
          {session.spin.status === SPIN_STATUS.spinning ? (
            <Typography sx={{ color: appearance.textColor, opacity: 0.8 }}>
              {SPIN_MESSAGES.spinning}
            </Typography>
          ) : null}
        </Box>
      )}
      <WinnerDialog
        open={session.winnerOpen}
        item={session.winner}
        path={session.selection}
        selectionMode={session.selectionMode}
        reducedMotion={session.spin.reducedMotion}
        onClose={session.closeWinner}
        onFinish={() => {
          const completed = session.finish();
          setStatusMessage('');
          if (!completed) {
            setSaved(false);
            return;
          }

          addSpinSession(
            toSpinHistorySession({
              result: completed,
              wheelName: wheel.name,
              mode: session.selectionMode,
            }),
          );
          setSaved(true);
        }}
        onSpinAgain={spinAgain}
        onSpinChild={session.spinChild}
      />
      <Snackbar
        open={Boolean(statusMessage)}
        autoHideDuration={4000}
        onClose={() => setStatusMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={statusMessage === SPIN_MESSAGES.resultCopyFailed ? 'error' : 'success'}
          variant="filled"
          onClose={() => setStatusMessage('')}
        >
          {statusMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
