import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import {
  CUSTOM_FIELD_MESSAGES,
  CUSTOM_FIELD_TYPE_LABELS,
} from '@/features/wheel-editor/constants/customFields';
import {
  CUSTOM_FIELD_TYPE,
  type CustomFieldDefinition,
  type CustomFieldType,
} from '@/types/customFields';
import { createId } from '@/utils/id';
import { slugifyFieldKey, uniqueFieldKey } from '@/utils/customFields';

interface CustomFieldDefinitionsPanelProps {
  definitions: readonly CustomFieldDefinition[];
  onChange: (definitions: CustomFieldDefinition[]) => void;
}

interface DraftState {
  label: string;
  type: CustomFieldType;
  options: string;
  required: boolean;
}

const emptyDraft = (): DraftState => ({
  label: '',
  type: CUSTOM_FIELD_TYPE.text,
  options: '',
  required: false,
});

export function CustomFieldDefinitionsPanel({
  definitions,
  onChange,
}: CustomFieldDefinitionsPanelProps) {
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  const needsOptions =
    draft.type === CUSTOM_FIELD_TYPE.select || draft.type === CUSTOM_FIELD_TYPE.multiSelect;

  const addField = () => {
    const label = draft.label.trim();
    if (!label) {
      setError(CUSTOM_FIELD_MESSAGES.labelRequired);
      return;
    }

    const options = draft.options
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean);

    if (needsOptions && options.length === 0) {
      setError(CUSTOM_FIELD_MESSAGES.optionsRequired);
      return;
    }

    const key = uniqueFieldKey(
      slugifyFieldKey(label),
      definitions.map((definition) => definition.key),
    );

    const next: CustomFieldDefinition = {
      id: createId(),
      key,
      label,
      type: draft.type,
      required: draft.required || undefined,
      ...(needsOptions ? { options } : {}),
    };

    onChange([...definitions, next]);
    setDraft(emptyDraft());
    setError(null);
  };

  const removeField = (fieldId: string) => {
    onChange(definitions.filter((definition) => definition.id !== fieldId));
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="h6" component="h2">
              {CUSTOM_FIELD_MESSAGES.title}
            </Typography>
            <Typography color="text.secondary">{CUSTOM_FIELD_MESSAGES.description}</Typography>
          </Stack>

          {definitions.length === 0 ? (
            <Typography color="text.secondary">{CUSTOM_FIELD_MESSAGES.empty}</Typography>
          ) : (
            <Stack spacing={1}>
              {definitions.map((definition) => (
                <Stack
                  key={definition.id}
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 0.75,
                    px: 1,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                  }}
                >
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {definition.label}
                      {definition.required ? ' *' : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {definition.key} · {CUSTOM_FIELD_TYPE_LABELS[definition.type]}
                      {definition.options?.length
                        ? ` · ${definition.options.join(', ')}`
                        : ''}
                    </Typography>
                  </Stack>
                  <IconButton
                    size="small"
                    aria-label={CUSTOM_FIELD_MESSAGES.removeField(definition.label)}
                    onClick={() => removeField(definition.id)}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}

          <Stack spacing={1.5}>
            <TextField
              label={CUSTOM_FIELD_MESSAGES.label}
              value={draft.label}
              onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
              fullWidth
              error={Boolean(error && !draft.label.trim())}
            />
            <TextField
              label={CUSTOM_FIELD_MESSAGES.type}
              value={draft.type}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  type: event.target.value as CustomFieldType,
                }))
              }
              select
              fullWidth
            >
              {Object.values(CUSTOM_FIELD_TYPE).map((type) => (
                <MenuItem key={type} value={type}>
                  {CUSTOM_FIELD_TYPE_LABELS[type]}
                </MenuItem>
              ))}
            </TextField>
            {needsOptions ? (
              <TextField
                label={CUSTOM_FIELD_MESSAGES.options}
                value={draft.options}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, options: event.target.value }))
                }
                helperText={CUSTOM_FIELD_MESSAGES.optionsHint}
                fullWidth
              />
            ) : null}
            <FormControlLabel
              control={
                <Checkbox
                  checked={draft.required}
                  onChange={(_, checked) => setDraft((current) => ({ ...current, required: checked }))}
                />
              }
              label={CUSTOM_FIELD_MESSAGES.required}
            />
            {error ? (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            ) : null}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addField}
              sx={{ alignSelf: 'flex-start' }}
            >
              {CUSTOM_FIELD_MESSAGES.addField}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
