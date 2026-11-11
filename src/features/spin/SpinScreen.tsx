import AddIcon from '@mui/icons-material/Add';
import DonutLargeOutlinedIcon from '@mui/icons-material/DonutLargeOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useLayoutEffect, useMemo, useState } from 'react';

import { LiveAnnouncer } from '@/components/common/LiveAnnouncer';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { AppToast } from '@/components/feedback/AppToast';
import { EmptyState } from '@/components/feedback/EmptyState';
import { AutoSpinPanel } from '@/features/spin/components/AutoSpinPanel';
import { FinalResult } from '@/features/spin/components/FinalResult';
import { RemoveWinnerSwitch } from '@/features/spin/components/RemoveWinnerSwitch';
import { SelectionModeSelect } from '@/features/spin/components/SelectionModeSelect';
import { SelectionPath } from '@/features/spin/components/SelectionPath';
import { SpinWheel } from '@/features/spin/components/SpinWheel';
import { SpinWheelPicker } from '@/features/spin/components/SpinWheelPicker';
import { WinnerDialog } from '@/features/spin/components/WinnerDialog';
import { SPIN_MESSAGES, SPIN_STATUS } from '@/features/spin/constants';
import { useAutoSpin } from '@/features/spin/hooks/useAutoSpin';
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
    isInvalidWheel,
    invalidWheelMessage,
    selectWheel,
    clearWheelSelection,
    goToCreate,
    goToDashboard,
    setSelectionMode,
    setRemoveWinner,
  } = useSpinScreen();
  const [controlsLocked, setControlsLocked] = useState(false);

  return (
    <PageContainer>
      <Stack
        spacing={3}
        sx={{
          minHeight: { xs: 'auto', md: 'calc(100dvh - 10.5rem)' },
          minWidth: 0,
          width: '100%',
          maxWidth: '100%',
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
                  disabled={controlsLocked}
                />
                <RemoveWinnerSwitch
                  checked={wheel.settings.removeWinner ?? false}
                  onChange={setRemoveWinner}
                  disabled={controlsLocked}
                />
                <Button variant="outlined" onClick={clearWheelSelection} disabled={controlsLocked}>
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
          <ActiveWheelSpin
            key={wheel.id}
            wheel={wheel}
            onControlsLockedChange={setControlsLocked}
            onRemoveWinnersChange={setRemoveWinner}
          />
        ) : needsWheelChoice ? (
          <SpinWheelPicker wheels={availableWheels} onSelect={selectWheel} />
        ) : (
          <EmptyState
            titleComponent="h2"
            icon={<DonutLargeOutlinedIcon />}
            title={
              isInvalidWheel
                ? SPIN_MESSAGES.missingWheelTitle
                : isMissingWheel
                  ? SPIN_MESSAGES.missingWheelTitle
                  : SPIN_MESSAGES.noWheelTitle
            }
            description={
              isInvalidWheel
                ? invalidWheelMessage
                : isMissingWheel
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

function ActiveWheelSpin({
  wheel,
  onControlsLockedChange,
  onRemoveWinnersChange,
}: {
  wheel: Wheel;
  onControlsLockedChange: (locked: boolean) => void;
  onRemoveWinnersChange: (enabled: boolean) => void;
}) {
  const session = useSpinSession(wheel);
  const addSpinSession = useHistoryStore((state) => state.addSpinSession);
  const [saved, setSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const appearance = resolveAppearance(wheel.settings.appearance);
  const title = displayWheelTitle(appearance, wheel.name);
  const spinWheelKey = useMemo(
    () => session.items.map((item) => item.id).join('|'),
    [session.items],
  );
  const autoSpin = useAutoSpin({
    itemCount: session.items.length,
    spinStatus: session.spin.status,
    willAutoAdvance: session.willAutoAdvance,
    sessionId: session.sessionId,
    result: session.result,
    startSpin: session.startSpin,
    startNewSelection: session.startNewSelection,
    onSave: (completed) => {
      addSpinSession(
        toSpinHistorySession({
          result: completed,
          wheelName: wheel.name,
          mode: session.selectionMode,
        }),
      );
    },
  });

  useLayoutEffect(() => {
    onControlsLockedChange(autoSpin.controlsLocked);
  }, [autoSpin.controlsLocked, onControlsLockedChange]);

  useLayoutEffect(() => {
    return () => onControlsLockedChange(false);
  }, [onControlsLockedChange]);

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

  const winnerAnnouncement =
    session.winner && (session.winnerOpen || autoSpin.controlsLocked)
      ? SPIN_MESSAGES.winner(session.winner.name)
      : '';

  return (
    <>
      <LiveAnnouncer message={winnerAnnouncement} />
      {session.canRestoreItems ? (
        <Stack direction="row" sx={{ justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
          <Button variant="outlined" onClick={restoreItems} disabled={autoSpin.controlsLocked}>
            {SPIN_MESSAGES.restoreItems}
          </Button>
        </Stack>
      ) : null}
      {session.finalOpen && session.result && !autoSpin.controlsLocked ? (
        <FinalResult
          wheelName={wheel.name}
          steps={session.selection}
          timestamp={session.result.timestamp}
          reducedMotion={session.spin.reducedMotion}
          saved={saved}
          statusMessage={statusMessage}
          soundEnabled={wheel.settings.soundEnabled}
          celebrationEnabled={wheel.settings.confettiEnabled}
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
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            // Keep a real stage floor so the wheel never collapses when the
            // page already fills the viewport (flex leftover space ≈ 0).
            minHeight: { xs: 420, sm: 520, md: 640 },
            gap: 2,
            overflow: 'hidden',
            bgcolor: appearance.background,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            px: { xs: 2, md: 3 },
            py: { xs: 2.5, md: 3 },
          }}
        >
          <Box
            sx={{
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
          <Box
            sx={{
              flex: '1 1 auto',
              // height: 1px gives container queries a definite block size so
              // 100cqh works; minHeight keeps a usable wheel when flex space is tight.
              height: 1,
              minHeight: { xs: 280, sm: 360, md: 440 },
              minWidth: 0,
              width: '100%',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              containerType: 'size',
            }}
          >
            <SpinWheel
              key={spinWheelKey}
              items={session.items}
              appearance={appearance}
              onSpin={session.startSpin}
              spinning={session.spin.spinning}
              spinLocked={autoSpin.controlsLocked}
              rotationDegrees={session.spin.rotationDegrees}
              spinDuration={session.spin.animation.spinDuration}
              animationType={session.spin.animation.animationType}
              reducedMotion={session.spin.reducedMotion}
              soundEnabled={wheel.settings.soundEnabled}
              onSpinComplete={session.completeSpin}
            />
          </Box>
          {session.spin.status === SPIN_STATUS.spinning ? (
            <Typography
              role="status"
              aria-live="polite"
              sx={{ color: appearance.textColor, opacity: 0.8, flexShrink: 0 }}
            >
              {SPIN_MESSAGES.spinning}
            </Typography>
          ) : null}
        </Box>
      )}
      <AutoSpinPanel
        countInput={autoSpin.countInput}
        delayInput={autoSpin.delayInput}
        saveResults={autoSpin.saveResults}
        removeWinners={wheel.settings.removeWinner ?? false}
        status={autoSpin.status}
        error={autoSpin.error}
        results={autoSpin.results}
        total={autoSpin.total}
        currentIndex={autoSpin.currentIndex}
        progressPercent={autoSpin.progressPercent}
        busy={session.spin.spinning}
        reducedMotion={session.spin.reducedMotion}
        onCountChange={autoSpin.setCountInput}
        onDelayChange={autoSpin.setDelayInput}
        onSaveResultsChange={autoSpin.setSaveResults}
        onRemoveWinnersChange={onRemoveWinnersChange}
        onStart={autoSpin.start}
        onStop={autoSpin.stop}
      />
      <WinnerDialog
        open={session.winnerOpen && !autoSpin.controlsLocked}
        item={session.winner}
        path={session.selection}
        selectionMode={session.selectionMode}
        reducedMotion={session.spin.reducedMotion}
        soundEnabled={wheel.settings.soundEnabled}
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
      <AppToast
        open={Boolean(statusMessage)}
        message={statusMessage}
        severity={statusMessage === SPIN_MESSAGES.resultCopyFailed ? 'error' : 'success'}
        onClose={() => setStatusMessage('')}
      />
    </>
  );
}
