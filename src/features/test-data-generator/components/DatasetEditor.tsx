import { Button, Card, CardContent, Stack, Typography } from '@mui/material';

import { AddFieldForm } from '@/features/test-data-generator/components/AddFieldForm';
import { FieldCard } from '@/features/test-data-generator/components/FieldCard';
import {
  GeneratePanel,
  type GenerationProgress,
} from '@/features/test-data-generator/components/GeneratePanel';
import { GeneratedResults } from '@/features/test-data-generator/components/GeneratedResults';
import {
  TEST_DATA_MESSAGES,
  type TestDataRecordCount,
} from '@/features/test-data-generator/constants';
import type { FieldFormValues, ValueFormValues } from '@/features/test-data-generator/schema';
import type { GeneratedCombination, TestDataset } from '@/features/test-data-generator/types';

interface DatasetEditorProps {
  dataset: TestDataset;
  results: readonly GeneratedCombination[];
  generateError: string | null;
  infoMessage: string | null;
  recordCount: TestDataRecordCount;
  unique: boolean;
  generating: boolean;
  progress: GenerationProgress | null;
  onChangeDataset: () => void;
  onDeleteDataset: () => void;
  onAddField: (values: FieldFormValues) => void;
  onToggleField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onAddValue: (fieldId: string, values: ValueFormValues) => void;
  onToggleValue: (fieldId: string, valueId: string) => void;
  onDeleteValue: (fieldId: string, valueId: string) => void;
  onRecordCountChange: (count: TestDataRecordCount) => void;
  onUniqueChange: (unique: boolean) => void;
  onGenerate: () => void;
  onCancelGeneration: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export function DatasetEditor({
  dataset,
  results,
  generateError,
  infoMessage,
  recordCount,
  unique,
  generating,
  progress,
  onChangeDataset,
  onDeleteDataset,
  onAddField,
  onToggleField,
  onDeleteField,
  onAddValue,
  onToggleValue,
  onDeleteValue,
  onRecordCountChange,
  onUniqueChange,
  onGenerate,
  onCancelGeneration,
  onExportJson,
  onExportCsv,
}: DatasetEditorProps) {
  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button variant="outlined" onClick={onChangeDataset} disabled={generating}>
          {TEST_DATA_MESSAGES.changeDataset}
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={onDeleteDataset}
          disabled={generating}
          aria-label={TEST_DATA_MESSAGES.deleteDataset}
        >
          {TEST_DATA_MESSAGES.deleteDataset}
        </Button>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" component="h2">
              {TEST_DATA_MESSAGES.fieldsTitle}
            </Typography>
            <Typography color="text.secondary">{TEST_DATA_MESSAGES.fieldsHint}</Typography>
            <Typography variant="body2" color="text.secondary">
              {TEST_DATA_MESSAGES.optionalFieldHint}
            </Typography>
            <AddFieldForm onSubmit={onAddField} />
          </Stack>
        </CardContent>
      </Card>

      {dataset.fields.length === 0 ? (
        <Typography color="text.secondary">{TEST_DATA_MESSAGES.noFieldsDescription}</Typography>
      ) : (
        <Stack spacing={2}>
          {dataset.fields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              onToggleEnabled={() => onToggleField(field.id)}
              onDelete={() => onDeleteField(field.id)}
              onAddValue={(values) => onAddValue(field.id, values)}
              onToggleValue={(valueId) => onToggleValue(field.id, valueId)}
              onDeleteValue={(valueId) => onDeleteValue(field.id, valueId)}
            />
          ))}
        </Stack>
      )}

      <Card variant="outlined">
        <CardContent>
          <GeneratePanel
            error={generateError}
            infoMessage={infoMessage}
            count={recordCount}
            unique={unique}
            generating={generating}
            progress={progress}
            onCountChange={onRecordCountChange}
            onUniqueChange={onUniqueChange}
            onGenerate={onGenerate}
            onCancel={onCancelGeneration}
          />
        </CardContent>
      </Card>

      <GeneratedResults
        fields={dataset.fields}
        results={results}
        onExportJson={onExportJson}
        onExportCsv={onExportCsv}
      />
    </Stack>
  );
}
