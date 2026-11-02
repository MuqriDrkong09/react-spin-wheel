import {
  Button,
  Card,
  CardContent,
  FormControlLabel,
  FormGroup,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Controller } from 'react-hook-form';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { TeamHistoryList } from '@/features/random-generator/components/TeamHistoryList';
import { TeamResultCard } from '@/features/random-generator/components/TeamResult';
import { GENERATOR_LIMITS, GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import {
  defaultTeamGeneratorValues,
  teamGeneratorFormSchema,
  type TeamGeneratorFormValues,
} from '@/features/random-generator/schema';
import type { Team } from '@/features/random-generator/types';
import { generateTeams } from '@/features/random-generator/utils/generateTeams';
import { useAppForm } from '@/hooks/useAppForm';
import { useGeneratorHistoryStore } from '@/stores/generatorHistoryStore';
import { createId, nowIso } from '@/utils/id';

export function TeamGeneratorTool() {
  const form = useAppForm(teamGeneratorFormSchema, {
    defaultValues: defaultTeamGeneratorValues,
  });
  const generatorHistory = useGeneratorHistoryStore((state) => state.generatorHistory);
  const addTeamGeneration = useGeneratorHistoryStore((state) => state.addTeamGeneration);
  const deleteTeamGeneration = useGeneratorHistoryStore((state) => state.deleteTeamGeneration);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Form
            form={form}
            aria-label={GENERATOR_MESSAGES.teamTab}
            onSubmit={(input) => {
              const result = generateTeams(input, Math.random);
              if (!result.ok) {
                setTeams(null);
                setError(result.error);
                return;
              }

              setError(null);
              setTeams(result.value);
              addTeamGeneration({
                id: createId(),
                createdAt: nowIso(),
                teamCount: input.teamCount,
                balanced: input.balanced,
                random: input.random,
                preventDuplicates: input.preventDuplicates,
                teams: result.value,
              });
            }}
          >
            <Stack spacing={2.5}>
              <Typography color="text.secondary">{GENERATOR_MESSAGES.teamHint}</Typography>
              <FormTextField<TeamGeneratorFormValues>
                name="participants"
                label={GENERATOR_MESSAGES.participantsLabel}
                helperText={GENERATOR_MESSAGES.participantsHint}
                required
                fullWidth
                multiline
                minRows={6}
                slotProps={{
                  htmlInput: {
                    'aria-label': GENERATOR_MESSAGES.participantsLabel,
                  },
                }}
              />
              <FormTextField<TeamGeneratorFormValues>
                name="teamCount"
                label={GENERATOR_MESSAGES.teamCountLabel}
                type="number"
                required
                sx={{ maxWidth: { sm: 240 } }}
                slotProps={{
                  htmlInput: {
                    min: GENERATOR_LIMITS.minTeamCount,
                    max: GENERATOR_LIMITS.maxTeamCount,
                    step: 1,
                    'aria-label': GENERATOR_MESSAGES.teamCountLabel,
                  },
                }}
              />
              <FormGroup>
                <Controller
                  name="balanced"
                  control={form.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                          inputRef={field.ref}
                        />
                      }
                      label={GENERATOR_MESSAGES.balancedLabel}
                    />
                  )}
                />
                <Controller
                  name="random"
                  control={form.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                          inputRef={field.ref}
                        />
                      }
                      label={GENERATOR_MESSAGES.randomAssignmentLabel}
                    />
                  )}
                />
                <Controller
                  name="preventDuplicates"
                  control={form.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                          inputRef={field.ref}
                        />
                      }
                      label={GENERATOR_MESSAGES.preventDuplicatesLabel}
                    />
                  )}
                />
              </FormGroup>
              <TeamResultCard teams={teams} error={error} />
              <Button type="submit" variant="contained">
                {teams ? GENERATOR_MESSAGES.rerollTeams : GENERATOR_MESSAGES.generateTeams}
              </Button>
            </Stack>
          </Form>
          <TeamHistoryList entries={generatorHistory} onDelete={deleteTeamGeneration} />
        </Stack>
      </CardContent>
    </Card>
  );
}
