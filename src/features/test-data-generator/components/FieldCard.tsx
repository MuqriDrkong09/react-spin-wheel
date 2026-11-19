import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Switch,
  Typography,
} from '@mui/material';

import { AddValueForm } from '@/features/test-data-generator/components/AddValueForm';
import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import type { ValueFormValues } from '@/features/test-data-generator/schema';
import type { TestField } from '@/features/test-data-generator/types';

interface FieldCardProps {
  field: TestField;
  onToggleEnabled: () => void;
  onDelete: () => void;
  onAddValue: (values: ValueFormValues) => void;
  onToggleValue: (valueId: string) => void;
  onDeleteValue: (valueId: string) => void;
}

export function FieldCard({
  field,
  onToggleEnabled,
  onDelete,
  onAddValue,
  onToggleValue,
  onDeleteValue,
}: FieldCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="h6" component="h3">
                {field.name}
              </Typography>
              {field.optional ? (
                <Chip size="small" label={TEST_DATA_MESSAGES.optionalField} variant="outlined" />
              ) : null}
              {!field.enabled ? (
                <Chip size="small" label="Disabled" color="default" variant="outlined" />
              ) : null}
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Switch
                checked={field.enabled}
                onChange={onToggleEnabled}
                slotProps={{
                  input: {
                    'aria-label': TEST_DATA_MESSAGES.toggleField(field.name, field.enabled),
                  },
                }}
              />
              <IconButton
                aria-label={TEST_DATA_MESSAGES.deleteField(field.name)}
                onClick={onDelete}
                color="error"
              >
                <DeleteOutlinedIcon />
              </IconButton>
            </Stack>
          </Stack>

          {field.values.length === 0 ? (
            <Typography color="text.secondary">{TEST_DATA_MESSAGES.noValues(field.name)}</Typography>
          ) : (
            <Stack spacing={1} component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {field.values.map((value) => (
                <Box
                  key={value.id}
                  component="li"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    py: 0.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography>{value.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      w{value.weight}
                    </Typography>
                    {value.optional ? (
                      <Chip size="small" label={TEST_DATA_MESSAGES.optionalValue} variant="outlined" />
                    ) : null}
                    {!value.enabled ? (
                      <Chip size="small" label="Disabled" variant="outlined" />
                    ) : null}
                  </Stack>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Switch
                      size="small"
                      checked={value.enabled}
                      onChange={() => onToggleValue(value.id)}
                      slotProps={{
                        input: {
                          'aria-label': TEST_DATA_MESSAGES.toggleValue(value.name, value.enabled),
                        },
                      }}
                    />
                    <IconButton
                      size="small"
                      aria-label={TEST_DATA_MESSAGES.deleteValue(value.name)}
                      onClick={() => onDeleteValue(value.id)}
                      color="error"
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}

          <Stack spacing={1.5}>
            <AddValueForm fieldName={field.name} optional={false} onSubmit={onAddValue} />
            <AddValueForm fieldName={field.name} optional onSubmit={onAddValue} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
