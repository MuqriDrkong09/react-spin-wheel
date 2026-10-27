import { Button, Stack, TablePagination } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { HistoryConfirmDialog } from '@/features/history/components/HistoryConfirmDialog';
import { HistoryDetailsDialog } from '@/features/history/components/HistoryDetailsDialog';
import { HistoryList } from '@/features/history/components/HistoryList';
import { HistoryToolbar } from '@/features/history/components/HistoryToolbar';
import { HISTORY_MESSAGES, HISTORY_PAGE_SIZE_OPTIONS } from '@/features/history/constants';
import { useHistory } from '@/features/history/hooks/useHistory';

export function HistoryScreen() {
  const history = useHistory();

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader
          title={HISTORY_MESSAGES.title}
          description={HISTORY_MESSAGES.description}
          action={
            history.hasHistory ? (
              <Button color="error" variant="outlined" onClick={history.requestClear}>
                {HISTORY_MESSAGES.clearHistory}
              </Button>
            ) : null
          }
        />
        {history.hasHistory ? (
          <>
            <HistoryToolbar
              search={history.search}
              onSearchChange={history.setSearch}
              wheelId={history.wheelId}
              onWheelIdChange={history.setWheelId}
              wheels={history.wheels}
              mode={history.mode}
              onModeChange={history.setMode}
              sort={history.sort}
              onSortChange={history.setSort}
            />
            {history.visible.length > 0 ? (
              <>
                <HistoryList
                  results={history.visible}
                  onView={history.openDetails}
                  onDelete={history.requestDelete}
                />
                <TablePagination
                  component="div"
                  count={history.filteredCount}
                  page={history.page}
                  onPageChange={(_, nextPage) => history.setPage(nextPage)}
                  rowsPerPage={history.pageSize}
                  onRowsPerPageChange={(event) => history.setPageSize(Number(event.target.value))}
                  rowsPerPageOptions={HISTORY_PAGE_SIZE_OPTIONS}
                />
              </>
            ) : (
              <EmptyState
                title={HISTORY_MESSAGES.noMatchesTitle}
                description={HISTORY_MESSAGES.noMatchesDescription}
                titleComponent="h2"
              />
            )}
          </>
        ) : (
          <EmptyState
            title={HISTORY_MESSAGES.emptyTitle}
            description={HISTORY_MESSAGES.emptyDescription}
            titleComponent="h2"
          />
        )}
      </Stack>
      <HistoryDetailsDialog result={history.selected} onClose={history.closeDetails} />
      <HistoryConfirmDialog
        open={Boolean(history.pendingDelete)}
        title={HISTORY_MESSAGES.deleteResultTitle}
        description={HISTORY_MESSAGES.deleteResultDescription}
        confirmLabel={HISTORY_MESSAGES.delete}
        onCancel={history.cancelDelete}
        onConfirm={history.confirmDelete}
      />
      <HistoryConfirmDialog
        open={history.clearOpen}
        title={HISTORY_MESSAGES.clearHistoryTitle}
        description={HISTORY_MESSAGES.clearHistoryDescription}
        confirmLabel={HISTORY_MESSAGES.clearHistory}
        onCancel={history.cancelClear}
        onConfirm={history.confirmClear}
      />
    </PageContainer>
  );
}
