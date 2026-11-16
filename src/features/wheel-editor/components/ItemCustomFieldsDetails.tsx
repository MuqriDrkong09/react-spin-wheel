import { Stack, Typography } from '@mui/material';

import { CUSTOM_FIELD_MESSAGES } from '@/features/wheel-editor/constants/customFields';
import type { CustomFieldDefinition, CustomFieldValues } from '@/types/customFields';
import { formatCustomFieldValue } from '@/utils/customFields';

interface ItemCustomFieldsDetailsProps {
  definitions: readonly CustomFieldDefinition[];
  values?: CustomFieldValues;
  compact?: boolean;
}

export function ItemCustomFieldsDetails({
  definitions,
  values,
  compact = false,
}: ItemCustomFieldsDetailsProps) {
  if (definitions.length === 0) {
    return null;
  }

  const rows = definitions
    .map((definition) => ({
      definition,
      display: formatCustomFieldValue(definition, values?.[definition.id]),
    }))
    .filter((row) => row.display !== '—');

  if (rows.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {rows
          .map(({ definition, display }) => `${definition.key}: ${display}`)
          .join(' · ')}
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      <Typography variant="subtitle2" component="h3">
        {CUSTOM_FIELD_MESSAGES.detailsHeading}
      </Typography>
      <Stack component="dl" spacing={0.5} sx={{ m: 0 }}>
        {definitions.map((definition) => (
          <Stack
            key={definition.id}
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'space-between', gap: 2 }}
          >
            <Typography component="dt" color="text.secondary" variant="body2">
              {definition.label}
            </Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 600 }}>
              {formatCustomFieldValue(definition, values?.[definition.id])}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
