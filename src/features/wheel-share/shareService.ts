import { createEncodedShareService } from '@/features/wheel-share/services/encodedShareService';
import type { WheelShareService } from '@/features/wheel-share/types';

export type { WheelShareService } from '@/features/wheel-share/types';

export const wheelShareService: WheelShareService = createEncodedShareService();
