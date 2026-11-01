import { Box } from '@mui/material';

import type { WheelExportItem } from '@/features/wheel-export/types';

interface ShareItemTreeProps {
  items: readonly WheelExportItem[];
}

export function ShareItemTree({ items }: ShareItemTreeProps) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
      {items.map((item, index) => (
        <Box component="li" key={`${item.name}-${index}`} sx={{ mt: 0.5 }}>
          {item.icon ? `${item.icon} ${item.name}` : item.name}
          {item.children?.length ? <ShareItemTree items={item.children} /> : null}
        </Box>
      ))}
    </Box>
  );
}
