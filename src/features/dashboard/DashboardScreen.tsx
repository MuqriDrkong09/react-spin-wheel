import AddIcon from '@mui/icons-material/Add';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { Box, Button, Stack } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { APP_DESCRIPTION } from '@/constants/app';
import { DashboardStatsCards } from '@/features/dashboard/components/DashboardStats';
import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar';
import { DeleteWheelDialog } from '@/features/dashboard/components/DeleteWheelDialog';
import { FavoriteWheelsCard } from '@/features/dashboard/components/FavoriteWheelsCard';
import { RecentResultsCard } from '@/features/dashboard/components/RecentResultsCard';
import { RecentlyUsedWheelsCard } from '@/features/dashboard/components/RecentlyUsedWheelsCard';
import { WheelList } from '@/features/dashboard/components/WheelList';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { WheelExportSnackbar } from '@/features/wheel-export/components/WheelExportSnackbar';
import { ImportWheelDialog } from '@/features/wheel-import/components/ImportWheelDialog';
import { WheelImportDropZone } from '@/features/wheel-import/components/WheelImportDropZone';
import { WheelImportSnackbar } from '@/features/wheel-import/components/WheelImportSnackbar';
import { useWheelImport } from '@/features/wheel-import/hooks/useWheelImport';

export function DashboardScreen() {
  const dashboard = useDashboard();
  const importer = useWheelImport();

  return (
    <PageContainer>
      <Stack
        spacing={3}
        onDragEnter={importer.onDragEnter}
        onDragOver={importer.onDragOver}
        onDragLeave={importer.onDragLeave}
        onDrop={importer.onDrop}
      >
        <PageHeader
          title="Dashboard"
          description={APP_DESCRIPTION}
          action={
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<FileUploadOutlinedIcon />}
                onClick={importer.openFilePicker}
              >
                Import
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={dashboard.openCreate}>
                Create Wheel
              </Button>
            </Stack>
          }
        />
        <DashboardStatsCards stats={dashboard.stats} />
        <WheelImportDropZone
          inputRef={importer.inputRef}
          dragging={importer.dragging}
          onInputChange={importer.onInputChange}
          onPickFile={importer.openFilePicker}
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
              />
            ) : (
              <EmptyState
                title="No matching wheels"
                description="Try a different search, category, favorites, recently used filter, or sort order."
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
          <FavoriteWheelsCard
            wheels={dashboard.favoriteWheels}
            onOpen={dashboard.openWheel}
            onToggleFavorite={dashboard.toggleFavorite}
          />
          <RecentlyUsedWheelsCard wheels={dashboard.recentlyUsedWheels} onOpen={dashboard.openWheel} />
          <RecentResultsCard results={dashboard.recentResults} onOpen={dashboard.openWheel} />
        </Box>
      </Stack>
      <DeleteWheelDialog
        wheel={dashboard.pendingDeleteWheel}
        onCancel={dashboard.cancelDelete}
        onConfirm={dashboard.confirmPendingDelete}
      />
      <ImportWheelDialog
        document={importer.pendingDocument}
        name={importer.name}
        nameError={importer.nameError}
        onNameChange={importer.setName}
        onCancel={importer.cancelImport}
        onConfirm={importer.confirmImport}
      />
      <WheelExportSnackbar status={dashboard.exportStatus} onClose={dashboard.clearExportStatus} />
      <WheelImportSnackbar status={importer.status} onClose={importer.clearStatus} />
    </PageContainer>
  );
}
