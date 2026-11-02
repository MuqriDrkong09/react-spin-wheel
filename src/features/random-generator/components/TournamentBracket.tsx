import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';

import { GENERATOR_MESSAGES, MATCH_STATUS } from '@/features/random-generator/constants';
import type { TournamentBracket, TournamentMatch, TournamentRound } from '@/features/random-generator/types';
import {
  participantName,
  selectEliminatedParticipants,
} from '@/features/random-generator/utils/generateTournament';

interface TournamentBracketViewProps {
  bracket: TournamentBracket;
  onSelectWinner: (matchId: string, winnerId: string) => void;
}

export function TournamentBracketView({ bracket, onSelectWinner }: TournamentBracketViewProps) {
  const eliminated = selectEliminatedParticipants(bracket);
  const championName = bracket.winnerId ? participantName(bracket, bracket.winnerId) : null;

  return (
    <Stack spacing={2} aria-label={GENERATOR_MESSAGES.bracketLabel}>
      {bracket.rounds.map((round, index) => (
        <Box key={round.index}>
          {index > 0 ? (
            <Stack alignItems="center" sx={{ color: 'text.secondary', py: 0.5 }} aria-hidden>
              <ArrowDownwardIcon fontSize="small" />
            </Stack>
          ) : null}
          <RoundSection bracket={bracket} round={round} onSelectWinner={onSelectWinner} />
        </Box>
      ))}
      <Stack alignItems="center" sx={{ color: 'text.secondary' }} aria-hidden>
        <ArrowDownwardIcon fontSize="small" />
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
          {GENERATOR_MESSAGES.winnerTitle}
        </Typography>
        <Typography variant="h5" component="p" sx={{ fontWeight: 700, mt: 1 }}>
          {championName ?? GENERATOR_MESSAGES.noWinner}
        </Typography>
      </Paper>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          {GENERATOR_MESSAGES.eliminatedTitle}
        </Typography>
        {eliminated.length > 0 ? (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {eliminated.map((participant) => (
              <Chip key={participant.id} label={participant.name} variant="outlined" />
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">{GENERATOR_MESSAGES.noEliminated}</Typography>
        )}
      </Box>
    </Stack>
  );
}

function RoundSection({
  bracket,
  round,
  onSelectWinner,
}: {
  bracket: TournamentBracket;
  round: TournamentRound;
  onSelectWinner: (matchId: string, winnerId: string) => void;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 1.5 }}>
        {round.label}
      </Typography>
      <Stack spacing={1.5}>
        {round.matches.map((match) => (
          <MatchCard
            key={match.id}
            bracket={bracket}
            round={round}
            match={match}
            onSelectWinner={onSelectWinner}
          />
        ))}
      </Stack>
    </Paper>
  );
}

function MatchCard({
  bracket,
  round,
  match,
  onSelectWinner,
}: {
  bracket: TournamentBracket;
  round: TournamentRound;
  match: TournamentMatch;
  onSelectWinner: (matchId: string, winnerId: string) => void;
}) {
  const leftId = match.slots[0].participantId;
  const rightId = match.slots[1].participantId;
  const isBye =
    match.status === MATCH_STATUS.bye ||
    (rightId === null && leftId !== null && match.status !== MATCH_STATUS.pending);
  const canSelect = match.status === MATCH_STATUS.ready;

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', flexWrap: 'wrap' }}
      aria-label={`${round.label} match ${match.matchIndex + 1}`}
    >
      <ParticipantControl
        bracket={bracket}
        roundLabel={round.label}
        matchNumber={match.matchIndex + 1}
        matchId={match.id}
        participantId={leftId}
        winnerId={match.winnerId}
        canSelect={canSelect}
        onSelectWinner={onSelectWinner}
      />
      <Typography color="text.secondary">{GENERATOR_MESSAGES.vsLabel}</Typography>
      {isBye && !rightId ? (
        <Typography color="text.secondary">{GENERATOR_MESSAGES.byeLabel}</Typography>
      ) : (
        <ParticipantControl
          bracket={bracket}
          roundLabel={round.label}
          matchNumber={match.matchIndex + 1}
          matchId={match.id}
          participantId={rightId}
          winnerId={match.winnerId}
          canSelect={canSelect}
          onSelectWinner={onSelectWinner}
        />
      )}
    </Stack>
  );
}

function ParticipantControl({
  bracket,
  roundLabel,
  matchNumber,
  matchId,
  participantId,
  winnerId,
  canSelect,
  onSelectWinner,
}: {
  bracket: TournamentBracket;
  roundLabel: string;
  matchNumber: number;
  matchId: string;
  participantId: string | null;
  winnerId: string | null;
  canSelect: boolean;
  onSelectWinner: (matchId: string, winnerId: string) => void;
}) {
  const name = participantName(bracket, participantId);
  const isWinner = participantId !== null && participantId === winnerId;
  const isLoser = winnerId !== null && participantId !== null && participantId !== winnerId;

  if (!canSelect || participantId === null) {
    return (
      <Typography
        sx={{
          fontWeight: isWinner ? 700 : 400,
          textDecoration: isLoser ? 'line-through' : 'none',
          color: isLoser ? 'text.secondary' : 'text.primary',
        }}
      >
        {name}
      </Typography>
    );
  }

  return (
    <Button
      size="small"
      variant={isWinner ? 'contained' : 'outlined'}
      onClick={() => onSelectWinner(matchId, participantId)}
      aria-label={GENERATOR_MESSAGES.selectWinner(roundLabel, matchNumber, name)}
    >
      {name}
    </Button>
  );
}
