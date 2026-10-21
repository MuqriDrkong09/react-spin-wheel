import { Container, type ContainerProps } from '@mui/material';

export function PageContainer({ children, sx, ...props }: ContainerProps) {
  return (
    <Container
      maxWidth="lg"
      sx={[
        {
          py: { xs: 2, md: 3 },
          px: { xs: 0, sm: 2 },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {children}
    </Container>
  );
}
