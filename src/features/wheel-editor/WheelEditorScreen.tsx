import { Alert, Button, Card, CardContent, Snackbar, Stack } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { AddMainDataCard } from '@/features/wheel-editor/components/AddMainDataCard';
import { DeleteItemDialog } from '@/features/wheel-editor/components/DeleteItemDialog';
import { ItemFormDialog } from '@/features/wheel-editor/components/ItemFormDialog';
import { WheelTree } from '@/features/wheel-editor/components/WheelTree';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import { useWheelEditor } from '@/features/wheel-editor/hooks/useWheelEditor';

export function WheelEditorScreen() {
  const editor = useWheelEditor();
  const tree = editor.tree;

  const dialogTitle =
    editor.dialog?.type === 'add'
      ? `Add child to ${editor.dialogParent?.name ?? 'item'}`
      : `Edit ${editor.dialogNode?.name ?? 'item'}`;

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader
          title="Wheel editor"
          description={
            editor.wheel
              ? `Edit items in ${editor.wheel.name}.`
              : 'Design wheel segments and settings.'
          }
        />
        {tree ? (
          <>
            <AddMainDataCard onSubmit={editor.addMainItem} />
            <Card variant="outlined">
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <WheelTree
                  root={tree}
                  expandedIds={editor.expandedIds}
                  handlers={{
                    onEdit: editor.openEdit,
                    onDelete: editor.requestDelete,
                    onAddChild: editor.openAddChild,
                    onToggleEnabled: editor.toggleEnabled,
                    onDuplicate: editor.duplicate,
                  }}
                  onToggleExpand={editor.toggleExpand}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <EmptyState
            titleComponent="h2"
            title={editor.isMissingWheel ? 'Wheel not found' : EDITOR_MESSAGES.noWheelTitle}
            description={
              editor.isMissingWheel
                ? 'This wheel is missing or was deleted. Create a new wheel or open one from the dashboard.'
                : EDITOR_MESSAGES.noWheelDescription
            }
            action={
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center' }}>
                <Button variant="contained" onClick={editor.goToCreate}>
                  Create a wheel
                </Button>
                <Button variant="outlined" onClick={editor.goToDashboard}>
                  Back to dashboard
                </Button>
              </Stack>
            }
          />
        )}
      </Stack>
      <ItemFormDialog
        open={Boolean(editor.dialog)}
        title={dialogTitle}
        submitLabel={editor.dialog?.type === 'add' ? 'Add item' : 'Save item'}
        defaultValues={editor.formDefaults}
        onClose={editor.closeDialog}
        onSubmit={editor.submitDialog}
      />
      <DeleteItemDialog
        node={editor.pendingDelete}
        onCancel={editor.cancelDelete}
        onConfirm={editor.confirmDelete}
      />
      <Snackbar
        open={Boolean(editor.successMessage)}
        autoHideDuration={4000}
        onClose={editor.clearSuccessMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={editor.clearSuccessMessage}>
          {editor.successMessage}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
