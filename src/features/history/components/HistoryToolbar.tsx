import SearchIcon from '@mui/icons-material/Search';
import { Box, FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField } from '@mui/material';

import {
  HISTORY_FILTER_ALL,
  HISTORY_MESSAGES,
  HISTORY_MODE_LABELS,
  HISTORY_SORT_LABELS,
  isHistoryModeFilter,
  isHistorySort,
  type HistorySort,
} from '@/features/history/constants';
import { SELECTION_MODE } from '@/types/wheel';

interface HistoryToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  wheelId: string;
  onWheelIdChange: (value: string) => void;
  wheels: { id: string; name: string }[];
  mode: string;
  onModeChange: (value: string) => void;
  sort: HistorySort;
  onSortChange: (value: HistorySort) => void;
}

export function HistoryToolbar({
  search,
  onSearchChange,
  wheelId,
  onWheelIdChange,
  wheels,
  mode,
  onModeChange,
  sort,
  onSortChange,
}: HistoryToolbarProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <TextField
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        label={HISTORY_MESSAGES.searchLabel}
        placeholder={HISTORY_MESSAGES.searchPlaceholder}
        size="small"
        sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: { sm: 180 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: '0 0 180px' }, minWidth: { sm: 160 } }}>
        <InputLabel id="history-wheel-label">{HISTORY_MESSAGES.wheelFilter}</InputLabel>
        <Select
          labelId="history-wheel-label"
          label={HISTORY_MESSAGES.wheelFilter}
          value={wheelId}
          onChange={(event) => onWheelIdChange(event.target.value)}
        >
          <MenuItem value={HISTORY_FILTER_ALL}>{HISTORY_MESSAGES.allWheels}</MenuItem>
          {wheels.map((wheel) => (
            <MenuItem key={wheel.id} value={wheel.id}>
              {wheel.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: '0 0 140px' }, minWidth: { sm: 140 } }}>
        <InputLabel id="history-mode-label">{HISTORY_MESSAGES.modeFilter}</InputLabel>
        <Select
          labelId="history-mode-label"
          label={HISTORY_MESSAGES.modeFilter}
          value={mode}
          onChange={(event) => {
            if (isHistoryModeFilter(event.target.value)) {
              onModeChange(event.target.value);
            }
          }}
        >
          <MenuItem value={HISTORY_FILTER_ALL}>{HISTORY_MESSAGES.allModes}</MenuItem>
          <MenuItem value={SELECTION_MODE.manual}>{HISTORY_MODE_LABELS[SELECTION_MODE.manual]}</MenuItem>
          <MenuItem value={SELECTION_MODE.automatic}>
            {HISTORY_MODE_LABELS[SELECTION_MODE.automatic]}
          </MenuItem>
          <MenuItem value={SELECTION_MODE.ask}>{HISTORY_MODE_LABELS[SELECTION_MODE.ask]}</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: '0 0 180px' }, minWidth: { sm: 180 } }}>
        <InputLabel id="history-sort-label">{HISTORY_MESSAGES.sort}</InputLabel>
        <Select
          labelId="history-sort-label"
          label={HISTORY_MESSAGES.sort}
          value={sort}
          onChange={(event) => {
            if (isHistorySort(event.target.value)) {
              onSortChange(event.target.value);
            }
          }}
        >
          {Object.entries(HISTORY_SORT_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
