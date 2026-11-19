import { Button, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';

import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import type { TestDataset } from '@/features/test-data-generator/types';

interface DatasetPickerProps {
  datasets: readonly TestDataset[];
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function DatasetPicker({ datasets, onSelect, onCreate }: DatasetPickerProps) {
  return (
    <Stack spacing={2}>
      <Typography color="text.secondary">{TEST_DATA_MESSAGES.chooseDataset}</Typography>
      <Stack spacing={1.5}>
        {datasets.map((dataset) => (
          <Card key={dataset.id} variant="outlined">
            <CardActionArea
              onClick={() => onSelect(dataset.id)}
              aria-label={`Open dataset ${dataset.name}`}
            >
              <CardContent>
                <Typography variant="h6" component="h2">
                  {dataset.name}
                </Typography>
                {dataset.description ? (
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {dataset.description}
                  </Typography>
                ) : null}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {dataset.fields.length} parent field{dataset.fields.length === 1 ? '' : 's'}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
      <Button variant="outlined" onClick={onCreate}>
        {TEST_DATA_MESSAGES.createDataset}
      </Button>
    </Stack>
  );
}
