import SearchIcon from '@mui/icons-material/Search';
import { Box, FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField } from '@mui/material';

import {
  CATEGORY_FILTER_ALL,
  WHEEL_SORT_LABELS,
  isWheelSort,
  type WheelSort,
} from '@/features/dashboard/constants';

interface DashboardToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categoryOptions: string[];
  sort: WheelSort;
  onSortChange: (value: WheelSort) => void;
}

export function DashboardToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categoryOptions,
  sort,
  onSortChange,
}: DashboardToolbarProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <TextField
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        label="Search wheels"
        placeholder="Search by name"
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
      <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: '0 0 160px' }, minWidth: { sm: 160 } }}>
        <InputLabel id="dashboard-category-label">Category</InputLabel>
        <Select
          labelId="dashboard-category-label"
          label="Category"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          {categoryOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option === CATEGORY_FILTER_ALL ? 'All categories' : option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: '0 0 180px' }, minWidth: { sm: 180 } }}>
        <InputLabel id="dashboard-sort-label">Sort</InputLabel>
        <Select
          labelId="dashboard-sort-label"
          label="Sort"
          value={sort}
          onChange={(event) => {
            if (isWheelSort(event.target.value)) {
              onSortChange(event.target.value);
            }
          }}
        >
          {Object.entries(WHEEL_SORT_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
