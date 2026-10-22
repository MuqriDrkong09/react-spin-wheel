import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Stack } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { APP_DESCRIPTION } from '@/constants/app';
import { CreateWheelDialog } from '@/features/dashboard/components/CreateWheelDialog';
import { DashboardStatsCards } from '@/features/dashboard/components/DashboardStats';
import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar';
import { DeleteWheelDialog } from '@/features/dashboard/components/DeleteWheelDialog';
import { FavoriteWheelsCard } from '@/features/dashboard/components/FavoriteWheelsCard';
import { RecentResultsCard } from '@/features/dashboard/components/RecentResultsCard';
import { RecentlyUsedWheelsCard } from '@/features/dashboard/components/RecentlyUsedWheelsCard';
import { WheelList } from '@/features/dashboard/components/WheelList';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';

export function DashboardScreen() {
  const dashboard = useDashboard();

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader
          title="Dashboard"
          description={APP_DESCRIPTION}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={dashboard.openCreate}>
              Create Wheel
            </Button>
          }
        />
        <DashboardStatsCards stats={dashboard.stats} />
        {dashboard.hasWheels ? (
          <>
            <DashboardToolbar
              search={dashboard.search}
              onSearchChange={dashboard.setSearch}
              category={dashboard.category}
              onCategoryChange={dashboard.setCategory}
              categoryOptions={dashboard.categoryOptions}
              sort={dashboard.sort}
              onSortChange={dashboard.setSort}
            />
            {dashboard.visibleWheels.length > 0 ? (
              <WheelList
                wheels={dashboard.visibleWheels}
                favoriteWheelIds={dashboard.favoriteWheelIds}
                onOpen={dashboard.openWheel}
                onEdit={dashboard.editWheel}
                onDelete={dashboard.requestDelete}
                onToggleFavorite={dashboard.toggleFavorite}
              />
            ) : (
              <EmptyState
                title="No matching wheels"
                description="Try a different search, category, or sort order."
                titleComponent="h2"
              />
            )}
          </>
        ) : (
          <EmptyState
            title="No wheels yet"
            description="Create a wheel to start spinning names, meals, and decisions."
            titleComponent="h2"
            action={
              <Button variant="contained" startIcon={<AddIcon />} onClick={dashboard.openCreate}>
                Create your first wheel
              </Button>
            }
          />
        )}
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          <FavoriteWheelsCard wheels={dashboard.favoriteWheels} onOpen={dashboard.openWheel} />
          <RecentlyUsedWheelsCard wheels={dashboard.recentlyUsedWheels} onOpen={dashboard.openWheel} />
          <RecentResultsCard results={dashboard.recentResults} onOpen={dashboard.openWheel} />
        </Box>
      </Stack>
      <CreateWheelDialog
        open={dashboard.createOpen}
        onClose={dashboard.closeCreate}
        onSubmit={dashboard.submitCreate}
      />
      <DeleteWheelDialog
        wheel={dashboard.pendingDeleteWheel}
        onCancel={dashboard.cancelDelete}
        onConfirm={dashboard.confirmPendingDelete}
      />
    </PageContainer>
  );
}
