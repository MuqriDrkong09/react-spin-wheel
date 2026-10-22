import { useNavigate } from 'react-router-dom';

import { ROUTES, withWheelId } from '@/constants/routes';
import type { CreateWheelFormValues } from '@/features/create-wheel/schema';
import { toCreateWheelInput } from '@/features/create-wheel/utils/toCreateWheelInput';
import { persistStores } from '@/services/storage/storePersistence';
import { useWheelStore } from '@/stores/wheelStore';

export function useCreateWheel() {
  const navigate = useNavigate();
  const createWheel = useWheelStore((state) => state.createWheel);
  const setActiveWheel = useWheelStore((state) => state.setActiveWheel);

  const submit = (values: CreateWheelFormValues) => {
    const wheel = createWheel(toCreateWheelInput(values));
    setActiveWheel(wheel.id);
    persistStores();
    void navigate(withWheelId(ROUTES.wheelEditor, wheel.id));
  };

  const cancel = () => {
    void navigate(ROUTES.dashboard);
  };

  return { submit, cancel };
}
