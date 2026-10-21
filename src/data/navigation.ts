import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DonutLargeOutlinedIcon from '@mui/icons-material/DonutLargeOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ShuffleOutlinedIcon from '@mui/icons-material/ShuffleOutlined';

import { ROUTES } from '@/constants/routes';

export const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.dashboard, icon: DashboardOutlinedIcon },
  { label: 'Wheels', path: ROUTES.wheels, icon: DonutLargeOutlinedIcon },
  { label: 'Editor', path: ROUTES.wheelEditor, icon: EditOutlinedIcon },
  { label: 'Spin', path: ROUTES.spin, icon: PlayCircleOutlinedIcon },
  { label: 'History', path: ROUTES.history, icon: HistoryOutlinedIcon },
  { label: 'Statistics', path: ROUTES.statistics, icon: BarChartOutlinedIcon },
  { label: 'Presets', path: ROUTES.presets, icon: BookmarkBorderOutlinedIcon },
  { label: 'Generator', path: ROUTES.randomGenerator, icon: ShuffleOutlinedIcon },
  { label: 'Settings', path: ROUTES.settings, icon: SettingsOutlinedIcon },
] as const;
