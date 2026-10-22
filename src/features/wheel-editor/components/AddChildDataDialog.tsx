import { Box, Dialog, DialogContent, DialogTitle, Drawer, Stack, Typography } from '@mui/material';

import { ItemForm } from '@/features/wheel-editor/components/ItemForm';
import { childItemFormSchema, type ItemFormValues } from '@/features/wheel-editor/schema';
import { useIsMobile } from '@/hooks/useIsMobile';

interface AddChildDataDialogProps {
  open: boolean;
  parentName?: string;
  defaultValues: ItemFormValues;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => void;
}

export function AddChildDataDialog({
  open,
  parentName,
  defaultValues,
  onClose,
  onSubmit,
}: AddChildDataDialogProps) {
  const isMobile = useIsMobile();

  if (!open) {
    return null;
  }

  const form = (
    <Stack spacing={2.5}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          Parent
        </Typography>
        <Typography variant="subtitle1" component="p" sx={{ fontWeight: 700 }}>
          {parentName}
        </Typography>
      </Stack>
      <ItemForm
        key={`${parentName}-${defaultValues.color}`}
        nameLabel="Child name"
        submitLabel="Add Child"
        ariaLabel="Add Child Data"
        schema={childItemFormSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Stack>
  );

  if (isMobile) {
    return (
      <Drawer
        open
        anchor="bottom"
        onClose={onClose}
        aria-labelledby="add-child-title"
        slotProps={{
          paper: {
            sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, px: 2, py: 3 },
          },
        }}
      >
        <Box>
          <Typography id="add-child-title" variant="h6" component="h2" gutterBottom>
            Add Child Data
          </Typography>
          {form}
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      transitionDuration={0}
      closeAfterTransition={false}
      fullWidth
      maxWidth="sm"
      aria-labelledby="add-child-title"
    >
      <DialogTitle id="add-child-title">Add Child Data</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>{form}</DialogContent>
    </Dialog>
  );
}
