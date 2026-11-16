import { Box, Typography } from '@mui/material';

import { ItemCustomFieldsDetails } from '@/features/wheel-editor/components/ItemCustomFieldsDetails';
import type { WheelExportItem } from '@/features/wheel-export/types';
import type { CustomFieldDefinition } from '@/types/customFields';

interface ShareItemTreeProps {
  items: readonly WheelExportItem[];
  fieldDefinitions?: readonly CustomFieldDefinition[];
}

export function ShareItemTree({ items, fieldDefinitions = [] }: ShareItemTreeProps) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
      {items.map((item, index) => (
        <Box component="li" key={`${item.name}-${index}`} sx={{ mt: 0.5 }}>
          <Typography component="span">
            {item.icon ? `${item.icon} ${item.name}` : item.name}
          </Typography>
          {fieldDefinitions.length > 0 ? (
            <Box sx={{ mt: 0.25 }}>
              <ItemCustomFieldsDetails
                definitions={fieldDefinitions}
                values={item.customFields}
                compact
              />
            </Box>
          ) : null}
          {item.children?.length ? (
            <ShareItemTree items={item.children} fieldDefinitions={fieldDefinitions} />
          ) : null}
        </Box>
      ))}
    </Box>
  );
}
