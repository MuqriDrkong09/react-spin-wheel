import type { RouteObject } from 'react-router-dom';

import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PresetsPage } from '@/pages/PresetsPage';
import { RandomGeneratorPage } from '@/pages/RandomGeneratorPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SpinPage } from '@/pages/SpinPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { WheelEditorPage } from '@/pages/WheelEditorPage';
import { WheelsPage } from '@/pages/WheelsPage';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'wheels', element: <WheelsPage /> },
      { path: 'editor', element: <WheelEditorPage /> },
      { path: 'spin', element: <SpinPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'presets', element: <PresetsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'random-generator', element: <RandomGeneratorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
