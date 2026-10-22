import DonutLargeOutlinedIcon from '@mui/icons-material/DonutLargeOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import { Box } from '@mui/material';

import { StatCard } from '@/features/dashboard/components/StatCard';
import type { DashboardStats } from '@/features/dashboard/utils/selectDashboardData';

interface DashboardStatsProps {
  stats: DashboardStats;
}

export function DashboardStatsCards({ stats }: DashboardStatsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' },
      }}
    >
      <StatCard
        label="Total wheels"
        value={stats.totalWheels}
        icon={<DonutLargeOutlinedIcon color="primary" />}
      />
      <StatCard
        label="Total spins"
        value={stats.totalSpins}
        icon={<ReplayOutlinedIcon color="primary" />}
      />
      <StatCard
        label="Total winners"
        value={stats.totalWinners}
        icon={<EmojiEventsOutlinedIcon color="primary" />}
      />
      <StatCard
        label="Favorite wheels"
        value={stats.favoriteCount}
        icon={<FavoriteBorderOutlinedIcon color="primary" />}
      />
    </Box>
  );
}
