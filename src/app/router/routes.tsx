import type { RouteObject } from 'react-router-dom';

import { AppLayout } from '@/components/layout/AppLayout';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';

import { lazyPage } from './lazyPage';

const DashboardPage = lazyPage(() => import('@/pages/DashboardPage'), 'DashboardPage');
const WheelsPage = lazyPage(() => import('@/pages/WheelsPage'), 'WheelsPage');
const CreateWheelPage = lazyPage(() => import('@/pages/CreateWheelPage'), 'CreateWheelPage');
const WheelEditorPage = lazyPage(() => import('@/pages/WheelEditorPage'), 'WheelEditorPage');
const SpinPage = lazyPage(() => import('@/pages/SpinPage'), 'SpinPage');
const HistoryPage = lazyPage(() => import('@/pages/HistoryPage'), 'HistoryPage');
const StatisticsPage = lazyPage(() => import('@/pages/StatisticsPage'), 'StatisticsPage');
const PresetsPage = lazyPage(() => import('@/pages/PresetsPage'), 'PresetsPage');
const SettingsPage = lazyPage(() => import('@/pages/SettingsPage'), 'SettingsPage');
const RandomGeneratorPage = lazyPage(
  () => import('@/pages/RandomGeneratorPage'),
  'RandomGeneratorPage',
);
const SharedWheelPage = lazyPage(() => import('@/pages/SharedWheelPage'), 'SharedWheelPage');

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'wheels', element: <WheelsPage /> },
      { path: 'create-wheel', element: <CreateWheelPage /> },
      { path: 'editor', element: <WheelEditorPage /> },
      { path: 'spin', element: <SpinPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'presets', element: <PresetsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'random-generator', element: <RandomGeneratorPage /> },
      { path: 'share', element: <SharedWheelPage /> },
      { path: 'share/:shareId', element: <SharedWheelPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
