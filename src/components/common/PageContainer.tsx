import { Container, type ContainerProps } from '@mui/material';

export function PageContainer({ children, sx, ...props }: ContainerProps) {
  return (
    <Container
      maxWidth="lg"
      disableGutters
      sx={[{ p: 0 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...props}
    >
      {children}
    </Container>
  );
}
