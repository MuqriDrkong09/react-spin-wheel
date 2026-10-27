import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ITEM_COLORS } from '@/constants/wheel';
import { SelectionFrequencyTable } from '@/features/statistics/components/SelectionFrequencyTable';
import { StatisticsSectionCard } from '@/features/statistics/components/StatisticsSectionCard';
import { STATISTICS_CHART_HEIGHT, STATISTICS_MESSAGES } from '@/features/statistics/constants';
import type { StatisticsSnapshot } from '@/features/statistics/utils/selectStatistics';

interface StatisticsChartsProps {
  snapshot: StatisticsSnapshot;
}

export function StatisticsCharts({ snapshot }: StatisticsChartsProps) {
  const theme = useTheme();
  const tick = { fill: theme.palette.text.secondary, fontSize: 12 };
  const grid = theme.palette.divider;
  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    color: theme.palette.text.primary,
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      }}
    >
      <Box sx={{ gridColumn: { md: '1 / -1' } }}>
        <StatisticsSectionCard title={STATISTICS_MESSAGES.spinFrequency}>
          <ChartFrame label={STATISTICS_MESSAGES.spinFrequency}>
            <AreaChart
              data={snapshot.dailySpinCount}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke={grid} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={tick} />
              <YAxis allowDecimals={false} tick={tick} width={36} />
              <ChartTooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="spins"
                name={STATISTICS_MESSAGES.spins}
                stroke={theme.palette.primary.main}
                fill={theme.palette.primary.main}
                fillOpacity={0.18}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartFrame>
        </StatisticsSectionCard>
      </Box>

      <StatisticsSectionCard title={STATISTICS_MESSAGES.winnerDistribution}>
        <ChartFrame label={STATISTICS_MESSAGES.winnerDistribution}>
          <PieChart>
            <Pie
              data={snapshot.winnerDistributionChart}
              dataKey="count"
              nameKey="name"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {snapshot.winnerDistributionChart.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={ITEM_COLORS[index % ITEM_COLORS.length] ?? theme.palette.primary.main}
                />
              ))}
            </Pie>
            <ChartTooltip contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        </ChartFrame>
      </StatisticsSectionCard>

      <StatisticsSectionCard title={STATISTICS_MESSAGES.parentVsChild}>
        {snapshot.parentVsChild[1]?.count === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {STATISTICS_MESSAGES.noChildSelections}
          </Typography>
        ) : null}
        <ChartFrame label={STATISTICS_MESSAGES.parentVsChild}>
          <BarChart
            data={snapshot.parentVsChild}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={tick} />
            <YAxis allowDecimals={false} tick={tick} width={36} />
            <ChartTooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="count"
              name={STATISTICS_MESSAGES.selections}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            >
              <Cell fill={theme.palette.primary.main} />
              <Cell fill={theme.palette.secondary.main} />
            </Bar>
          </BarChart>
        </ChartFrame>
      </StatisticsSectionCard>

      <StatisticsSectionCard title={STATISTICS_MESSAGES.spinsPerWheel}>
        <ChartFrame label={STATISTICS_MESSAGES.spinsPerWheel}>
          <BarChart
            data={snapshot.spinsPerWheel}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid stroke={grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={tick} />
            <YAxis
              type="category"
              dataKey="wheelName"
              width={112}
              tick={tick}
              tickFormatter={truncateLabel}
            />
            <ChartTooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="spins"
              name={STATISTICS_MESSAGES.spins}
              fill={theme.palette.primary.main}
              radius={[0, 6, 6, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartFrame>
      </StatisticsSectionCard>

      <StatisticsSectionCard title={STATISTICS_MESSAGES.selectionFrequency}>
        <SelectionFrequencyTable rows={snapshot.selectionFrequency} />
      </StatisticsSectionCard>
    </Box>
  );
}

function ChartFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box aria-label={label} sx={{ width: '100%', height: STATISTICS_CHART_HEIGHT }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </Box>
  );
}

function truncateLabel(value: string): string {
  return value.length > 16 ? `${value.slice(0, 15)}…` : value;
}
