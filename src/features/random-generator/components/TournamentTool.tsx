import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { TournamentBracketView } from '@/features/random-generator/components/TournamentBracket';
import { TournamentHistoryList } from '@/features/random-generator/components/TournamentHistoryList';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import {
  defaultTournamentValues,
  tournamentFormSchema,
  type TournamentFormValues,
} from '@/features/random-generator/schema';
import { generateTournament } from '@/features/random-generator/utils/generateTournament';
import { useAppForm } from '@/hooks/useAppForm';
import { useTournamentStore } from '@/stores/tournamentStore';

export function TournamentTool() {
  const form = useAppForm(tournamentFormSchema, {
    defaultValues: defaultTournamentValues,
  });
  const activeTournament = useTournamentStore((state) => state.activeTournament);
  const tournamentHistory = useTournamentStore((state) => state.tournamentHistory);
  const startTournament = useTournamentStore((state) => state.startTournament);
  const selectWinner = useTournamentStore((state) => state.selectWinner);
  const deleteTournament = useTournamentStore((state) => state.deleteTournament);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Form
            form={form}
            aria-label={GENERATOR_MESSAGES.tournamentTab}
            onSubmit={(input) => {
              const result = generateTournament(
                { participants: input.participants, random: true },
                Math.random,
              );
              if (!result.ok) {
                setError(result.error);
                return;
              }

              setError(null);
              startTournament(result.value);
            }}
          >
            <Stack spacing={2.5}>
              <Typography color="text.secondary">{GENERATOR_MESSAGES.tournamentHint}</Typography>
              <FormTextField<TournamentFormValues>
                name="participants"
                label={GENERATOR_MESSAGES.participantsLabel}
                helperText={GENERATOR_MESSAGES.participantsHint}
                required
                fullWidth
                multiline
                minRows={8}
                slotProps={{
                  htmlInput: {
                    'aria-label': GENERATOR_MESSAGES.participantsLabel,
                  },
                }}
              />
              {error ? (
                <Typography color="error" role="status">
                  {error}
                </Typography>
              ) : null}
              {activeTournament ? (
                <TournamentBracketView bracket={activeTournament} onSelectWinner={selectWinner} />
              ) : (
                <Typography color="text.secondary">{GENERATOR_MESSAGES.emptyTournament}</Typography>
              )}
              <Button type="submit" variant="contained">
                {activeTournament
                  ? GENERATOR_MESSAGES.rerollTournament
                  : GENERATOR_MESSAGES.generateTournament}
              </Button>
            </Stack>
          </Form>
          <TournamentHistoryList entries={tournamentHistory} onDelete={deleteTournament} />
        </Stack>
      </CardContent>
    </Card>
  );
}
