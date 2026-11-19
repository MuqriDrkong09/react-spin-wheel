import AddIcon from '@mui/icons-material/Add';
import { Alert, Button, Snackbar, Stack } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CreateDatasetDialog } from '@/features/test-data-generator/components/CreateDatasetDialog';
import { DatasetEditor } from '@/features/test-data-generator/components/DatasetEditor';
import { DatasetPicker } from '@/features/test-data-generator/components/DatasetPicker';
import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import { useTestDataGenerator } from '@/features/test-data-generator/hooks/useTestDataGenerator';

export function TestDataGeneratorScreen() {
  const editor = useTestDataGenerator();

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader
          title={TEST_DATA_MESSAGES.title}
          description={
            editor.dataset
              ? `Edit and generate from ${editor.dataset.name}.`
              : editor.needsDatasetChoice
                ? TEST_DATA_MESSAGES.chooseDataset
                : TEST_DATA_MESSAGES.description
          }
          action={
            editor.needsDatasetChoice ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={editor.openCreate}>
                {TEST_DATA_MESSAGES.createDataset}
              </Button>
            ) : null
          }
        />

        {editor.dataset ? (
          <DatasetEditor
            dataset={editor.dataset}
            results={editor.results}
            generateError={editor.generateError}
            onChangeDataset={editor.clearDatasetSelection}
            onDeleteDataset={() => {
              if (
                window.confirm(TEST_DATA_MESSAGES.deleteDatasetConfirm(editor.dataset?.name ?? ''))
              ) {
                editor.deleteDataset(editor.dataset!.id);
              }
            }}
            onAddField={editor.addField}
            onToggleField={editor.toggleFieldEnabled}
            onDeleteField={editor.deleteField}
            onAddValue={editor.addValue}
            onToggleValue={editor.toggleValueEnabled}
            onDeleteValue={editor.deleteValue}
            onGenerateOne={() => editor.generate(1, true)}
            onGenerateMultiple={editor.generate}
            onExport={editor.exportResults}
          />
        ) : editor.needsDatasetChoice ? (
          <DatasetPicker
            datasets={editor.datasets}
            onSelect={editor.selectDataset}
            onCreate={editor.openCreate}
          />
        ) : editor.isMissingDataset ? (
          <EmptyState
            titleComponent="h2"
            title="Dataset not found"
            description="This dataset is missing or was deleted. Create a new one or choose another."
            action={
              <Button variant="contained" onClick={editor.clearDatasetSelection}>
                {TEST_DATA_MESSAGES.createDataset}
              </Button>
            }
          />
        ) : (
          <EmptyState
            titleComponent="h2"
            title={TEST_DATA_MESSAGES.noDatasetsTitle}
            description={TEST_DATA_MESSAGES.noDatasetsDescription}
            action={
              <Button variant="contained" startIcon={<AddIcon />} onClick={editor.openCreate}>
                {TEST_DATA_MESSAGES.createDataset}
              </Button>
            }
          />
        )}
      </Stack>

      <CreateDatasetDialog
        open={editor.createOpen}
        onClose={editor.closeCreate}
        onSubmit={editor.createDataset}
      />

      <Snackbar
        key={editor.successMessage ?? 'success-snackbar'}
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
