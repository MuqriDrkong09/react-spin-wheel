import AddIcon from '@mui/icons-material/Add';
import DonutLargeOutlinedIcon from '@mui/icons-material/DonutLargeOutlined';
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import { Button, Stack } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar';
import { DeleteWheelDialog } from '@/features/dashboard/components/DeleteWheelDialog';
import { WheelList } from '@/features/dashboard/components/WheelList';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { WheelExportSnackbar } from '@/features/wheel-export/components/WheelExportSnackbar';
import { ShareWheelSnackbar } from '@/features/wheel-share/components/ShareWheelSnackbar';
import { useWheelShare } from '@/features/wheel-share/hooks/useWheelShare';

export function WheelsScreen() {
  const dashboard = useDashboard();
  const sharer = useWheelShare();

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader
          title="Wheels"
          description="Browse, organize, and open the wheels in your workspace."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={dashboard.openCreate}>
              Create Wheel
            </Button>
          }
        />

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
              favoriteFilter={dashboard.favoriteFilter}
              onFavoriteFilterChange={dashboard.setFavoriteFilter}
              usageFilter={dashboard.usageFilter}
              onUsageFilterChange={dashboard.setUsageFilter}
            />
            {dashboard.visibleWheels.length > 0 ? (
              <WheelList
                wheels={dashboard.visibleWheels}
                favoriteWheelIds={dashboard.favoriteWheelIds}
                onOpen={dashboard.openWheel}
                onEdit={dashboard.editWheel}
                onDelete={dashboard.requestDelete}
                onToggleFavorite={dashboard.toggleFavorite}
                onExport={dashboard.exportWheel}
                onShare={(wheelId) => {
                  void sharer.copyShareLinkById(wheelId);
                }}
              />
            ) : (
              <EmptyState
                title="No matching wheels"
                description="Try a different search, category, favorites, recently used filter, or sort order."
                titleComponent="h2"
                icon={<SearchOffOutlinedIcon />}
              />
            )}
          </>
        ) : (
          <EmptyState
            title="No wheels yet"
            description="Create a wheel to start building your library."
            titleComponent="h2"
            icon={<DonutLargeOutlinedIcon />}
            action={
              <Button variant="contained" startIcon={<AddIcon />} onClick={dashboard.openCreate}>
                Create your first wheel
              </Button>
            }
          />
        )}
      </Stack>

      <DeleteWheelDialog
        wheel={dashboard.pendingDeleteWheel}
        onCancel={dashboard.cancelDelete}
        onConfirm={dashboard.confirmPendingDelete}
      />
      <WheelExportSnackbar status={dashboard.exportStatus} onClose={dashboard.clearExportStatus} />
      <ShareWheelSnackbar status={sharer.status} onClose={sharer.clearStatus} />
    </PageContainer>
  );
}
