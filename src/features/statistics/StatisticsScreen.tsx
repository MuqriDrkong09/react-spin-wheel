import { Stack } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { StatisticsCharts } from '@/features/statistics/components/StatisticsCharts';
import { StatisticsHighlights } from '@/features/statistics/components/StatisticsHighlights';
import { STATISTICS_MESSAGES } from '@/features/statistics/constants';
import { useStatistics } from '@/features/statistics/hooks/useStatistics';

export function StatisticsScreen() {
  const { hasData, snapshot } = useStatistics();

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader title={STATISTICS_MESSAGES.title} description={STATISTICS_MESSAGES.description} />
        {hasData ? (
          <>
            <StatisticsHighlights snapshot={snapshot} />
            <StatisticsCharts snapshot={snapshot} />
          </>
        ) : (
          <EmptyState
            title={STATISTICS_MESSAGES.emptyTitle}
            description={STATISTICS_MESSAGES.emptyDescription}
            titleComponent="h2"
          />
        )}
      </Stack>
    </PageContainer>
  );
}
