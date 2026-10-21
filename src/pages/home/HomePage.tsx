import { Box, Chip, Paper, Stack, Typography } from '@mui/material';

import { PageContainer } from '@/shared/components/ui';
import { APP_DESCRIPTION, APP_NAME } from '@/shared/constants';

const FOUNDATION_ITEMS = [
  {
    title: 'Routing',
    description: 'React Router is wired through a layout shell with nested routes.',
  },
  {
    title: 'UI & theme',
    description: 'MUI provides the component system, including light and dark color modes.',
  },
  {
    title: 'Application state',
    description: 'Zustand stores global UI state such as theme and navigation.',
  },
  {
    title: 'Forms',
    description: 'React Hook Form and Zod are ready for typed, validated forms.',
  },
  {
    title: 'Motion & charts',
    description: 'Framer Motion, Recharts, and @dnd-kit are installed for upcoming features.',
  },
  {
    title: 'Quality tooling',
    description: 'TypeScript, ESLint, Prettier, Vitest, and Testing Library are configured.',
  },
] as const;

const STACK = [
  'React',
  'TypeScript',
  'Vite',
  'MUI',
  'Zustand',
  'React Hook Form',
  'Zod',
  'Vitest',
] as const;

export function HomePage() {
  return (
    <PageContainer>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {APP_NAME}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
            {APP_DESCRIPTION}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {STACK.map((item) => (
            <Chip key={item} label={item} variant="outlined" />
          ))}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {FOUNDATION_ITEMS.map((item) => (
            <Paper key={item.title} variant="outlined" sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="h6" component="h2" gutterBottom>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Stack>
    </PageContainer>
  );
}
