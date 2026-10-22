import { Card, CardContent, Typography } from '@mui/material';

import { ItemForm } from '@/features/wheel-editor/components/ItemForm';
import type { ItemFormValues } from '@/features/wheel-editor/schema';

interface AddMainDataCardProps {
  onSubmit: (values: ItemFormValues) => void;
}

export function AddMainDataCard({ onSubmit }: AddMainDataCardProps) {
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
          onSubmit={onSubmit}
        />
      </CardContent>
    </Card>
  );
}
