import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { PageContainer } from '@/components/common/PageContainer';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ROUTES } from '@/constants/routes';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <EmptyState
        title="Page not found"
        description="The page you are looking for does not exist yet."
        action={
          <Button variant="contained" onClick={() => void navigate(ROUTES.dashboard)}>
            Back to dashboard
          </Button>
        }
      />
    </PageContainer>
  );
}
