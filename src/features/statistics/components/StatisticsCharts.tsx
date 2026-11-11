import { Box, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
import { formatPercent } from '@/features/statistics/utils/formatPercent';
import type { NamedCount, StatisticsSnapshot } from '@/features/statistics/utils/selectStatistics';

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
            <LineChart
              data={snapshot.dailySpinCount}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke={grid} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={tick} />
              <YAxis allowDecimals={false} tick={tick} width={36} />
              <ChartTooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="spins"
                name={STATISTICS_MESSAGES.spins}
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartFrame>
        </StatisticsSectionCard>
      </Box>

      <StatisticsSectionCard title={STATISTICS_MESSAGES.weeklyActivity}>
        <ChartFrame label={STATISTICS_MESSAGES.weeklyActivity}>
          <BarChart
            data={snapshot.weeklySpinCount}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={tick} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={tick} width={36} />
            <ChartTooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="spins"
              name={STATISTICS_MESSAGES.spins}
              fill={theme.palette.primary.main}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartFrame>
      </StatisticsSectionCard>

      <StatisticsSectionCard title={STATISTICS_MESSAGES.monthlyActivity}>
        <ChartFrame label={STATISTICS_MESSAGES.monthlyActivity}>
          <LineChart
            data={snapshot.monthlySpinCount}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={tick} />
            <YAxis allowDecimals={false} tick={tick} width={36} />
            <ChartTooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="spins"
              name={STATISTICS_MESSAGES.spins}
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartFrame>
      </StatisticsSectionCard>

      <StatisticsSectionCard title={STATISTICS_MESSAGES.winnerDistribution}>
        <WinnerDistributionChart
          rows={snapshot.winnerDistributionChart}
          tooltipStyle={tooltipStyle}
          primaryFallback={theme.palette.primary.main}
        />
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

      <StatisticsSectionCard title={STATISTICS_MESSAGES.parentFrequency}>
        <SelectionFrequencyTable
          rows={snapshot.parentFrequency}
          ariaLabel={STATISTICS_MESSAGES.parentFrequencyAria}
          emptyMessage={STATISTICS_MESSAGES.none}
        />
      </StatisticsSectionCard>

      <StatisticsSectionCard title={STATISTICS_MESSAGES.childFrequency}>
        <SelectionFrequencyTable
          rows={snapshot.childFrequency}
          ariaLabel={STATISTICS_MESSAGES.childFrequencyAria}
          emptyMessage={STATISTICS_MESSAGES.none}
        />
      </StatisticsSectionCard>

      <StatisticsSectionCard title={STATISTICS_MESSAGES.pathFrequency}>
        <SelectionFrequencyTable
          rows={snapshot.pathFrequency}
          ariaLabel={STATISTICS_MESSAGES.pathFrequencyAria}
          nameColumnLabel={STATISTICS_MESSAGES.path}
          emptyMessage={STATISTICS_MESSAGES.none}
        />
      </StatisticsSectionCard>
    </Box>
  );
}

const WINNER_PIE_HEIGHT = 200;

function WinnerDistributionChart({
  rows,
  tooltipStyle,
  primaryFallback,
}: {
  rows: NamedCount[];
  tooltipStyle: Record<string, string | number>;
  primaryFallback: string;
}) {
  return (
    <Box>
      <ChartFrame label={STATISTICS_MESSAGES.winnerDistribution} height={WINNER_PIE_HEIGHT}>
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={rows}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            isAnimationActive={false}
          >
            {rows.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={ITEM_COLORS[index % ITEM_COLORS.length] ?? primaryFallback}
              />
            ))}
          </Pie>
          <ChartTooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ChartFrame>
      <Box
        component="ul"
        aria-label={`${STATISTICS_MESSAGES.winnerDistribution} legend`}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1,
          m: 0,
          mt: 1.5,
          p: 0,
          listStyle: 'none',
          maxHeight: { xs: 220, sm: 'none' },
          overflowY: { xs: 'auto', sm: 'visible' },
        }}
      >
        {rows.map((entry, index) => (
          <Box
            key={entry.name}
            component="li"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 0,
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 10,
                height: 10,
                borderRadius: 0.5,
                flexShrink: 0,
                bgcolor: ITEM_COLORS[index % ITEM_COLORS.length] ?? primaryFallback,
              }}
            />
            <Typography variant="body2" noWrap title={entry.name} sx={{ flex: 1, minWidth: 0 }}>
              {entry.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              {formatPercent(entry.percent)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function ChartFrame({
  label,
  children,
  height = STATISTICS_CHART_HEIGHT,
}: {
  label: string;
  children: ReactNode;
  height?: number;
}) {
  return (
    <Box aria-label={label} sx={{ width: '100%', minWidth: 0, height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </Box>
  );
}

function truncateLabel(value: string): string {
  return value.length > 16 ? `${value.slice(0, 15)}…` : value;
}
