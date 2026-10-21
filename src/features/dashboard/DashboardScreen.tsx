import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { APP_DESCRIPTION } from '@/constants/app';

export function DashboardScreen() {
  return (
    <PageContainer>
      <PageHeader title="Dashboard" description={APP_DESCRIPTION} />
    </PageContainer>
  );
}
