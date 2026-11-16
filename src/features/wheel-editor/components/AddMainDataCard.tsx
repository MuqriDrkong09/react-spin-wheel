import { Card, CardContent, Typography } from '@mui/material';

import { ItemForm } from '@/features/wheel-editor/components/ItemForm';
import type { ItemFormValues } from '@/features/wheel-editor/schema';
import type { CustomFieldDefinition } from '@/types/customFields';

interface AddMainDataCardProps {
  onSubmit: (values: ItemFormValues) => void;
  defaultValues?: ItemFormValues;
  fieldDefinitions?: readonly CustomFieldDefinition[];
}

export function AddMainDataCard({
  onSubmit,
  defaultValues,
  fieldDefinitions = [],
}: AddMainDataCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Add Main Data
        </Typography>
        <ItemForm
          formId="add-main-data-form"
          ariaLabel="Add Main Data"
          submitLabel="Add item"
          resetOnSubmit
          defaultValues={defaultValues}
          fieldDefinitions={fieldDefinitions}
          onSubmit={onSubmit}
        />
      </CardContent>
    </Card>
  );
}
