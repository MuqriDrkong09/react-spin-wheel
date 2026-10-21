import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { EmptyState, PageContainer } from '@/shared/components/ui';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <EmptyState
        title="Page not found"
        description="The page you are looking for does not exist yet."
        action={
          <Button variant="contained" onClick={() => void navigate('/')}>
            Back to home
          </Button>
        }
      />
    </PageContainer>
  );
}
