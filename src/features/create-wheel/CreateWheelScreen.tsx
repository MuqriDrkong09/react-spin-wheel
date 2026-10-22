import { Stack } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { CreateWheelForm } from '@/features/create-wheel/components/CreateWheelForm';
import { useCreateWheel } from '@/features/create-wheel/hooks/useCreateWheel';

export function CreateWheelScreen() {
  const { submit, cancel } = useCreateWheel();

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader
          title="Create wheel"
          description="Name the wheel, add starting options, and continue in the editor."
        />
        <CreateWheelForm onSubmit={submit} onCancel={cancel} />
      </Stack>
    </PageContainer>
  );
}
