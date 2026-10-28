import { Box } from '@mui/material';

import type { PresetItemDefinition } from '@/features/presets/types';

interface PresetItemTreeProps {
  items: readonly PresetItemDefinition[];
}

export function PresetItemTree({ items }: PresetItemTreeProps) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
      {items.map((item, index) => (
        <Box component="li" key={`${item.name}-${index}`} sx={{ mt: 0.5 }}>
          {item.icon ? `${item.icon} ${item.name}` : item.name}
          {item.children?.length ? <PresetItemTree items={item.children} /> : null}
        </Box>
      ))}
    </Box>
  );
}
