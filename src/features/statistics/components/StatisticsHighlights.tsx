import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import SubdirectoryArrowRightOutlinedIcon from '@mui/icons-material/SubdirectoryArrowRightOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { Box } from '@mui/material';

import { StatisticsMetricCard } from '@/features/statistics/components/StatisticsMetricCard';
import { STATISTICS_MESSAGES } from '@/features/statistics/constants';
import { formatPercent, formatTimes } from '@/features/statistics/utils/formatPercent';
import type { NamedCount, StatisticsSnapshot } from '@/features/statistics/utils/selectStatistics';

interface StatisticsHighlightsProps {
  snapshot: StatisticsSnapshot;
}

export function StatisticsHighlights({ snapshot }: StatisticsHighlightsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' },
      }}
    >
      <StatisticsMetricCard
        label={STATISTICS_MESSAGES.totalSpins}
        value={snapshot.totalSpins}
        icon={<ReplayOutlinedIcon color="primary" />}
      />
      <StatisticsMetricCard
        label={STATISTICS_MESSAGES.uniqueWinners}
        value={snapshot.uniqueWinners}
        icon={<EmojiEventsOutlinedIcon color="primary" />}
      />
      <StatisticsMetricCard
        label={STATISTICS_MESSAGES.mostSelectedItem}
        value={snapshot.mostSelectedItem?.name ?? STATISTICS_MESSAGES.none}
        hint={namedHint(snapshot.mostSelectedItem)}
        icon={<TrendingUpOutlinedIcon color="primary" />}
      />
      <StatisticsMetricCard
        label={STATISTICS_MESSAGES.leastSelectedItem}
        value={snapshot.leastSelectedItem?.name ?? STATISTICS_MESSAGES.none}
        hint={namedHint(snapshot.leastSelectedItem)}
        icon={<TrendingDownOutlinedIcon color="primary" />}
      />
      <StatisticsMetricCard
        label={STATISTICS_MESSAGES.totalCompletedSelections}
        value={snapshot.totalCompletedSelections}
        icon={<DoneAllOutlinedIcon color="primary" />}
      />
      <StatisticsMetricCard
        label={STATISTICS_MESSAGES.mostSelectedParent}
        value={snapshot.mostSelectedParent?.name ?? STATISTICS_MESSAGES.none}
        hint={namedHint(snapshot.mostSelectedParent)}
        icon={<AccountTreeOutlinedIcon color="primary" />}
      />
      <StatisticsMetricCard
        label={STATISTICS_MESSAGES.mostSelectedChild}
        value={snapshot.mostSelectedChild?.name ?? STATISTICS_MESSAGES.none}
        hint={namedHint(snapshot.mostSelectedChild)}
        icon={<SubdirectoryArrowRightOutlinedIcon color="primary" />}
      />
      <StatisticsMetricCard
        label={STATISTICS_MESSAGES.mostSelectedPath}
        value={snapshot.mostSelectedPath?.name ?? STATISTICS_MESSAGES.none}
        hint={namedHint(snapshot.mostSelectedPath)}
        icon={<RouteOutlinedIcon color="primary" />}
      />
    </Box>
  );
}

function namedHint(entry: NamedCount | undefined): string | undefined {
  if (!entry) {
    return undefined;
  }

  return `${formatTimes(entry.count)} · ${formatPercent(entry.percent)}`;
}
