import { Box, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      {description ? (
        <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}
