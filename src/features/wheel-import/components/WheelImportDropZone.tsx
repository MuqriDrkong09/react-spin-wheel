import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { Box, Button, Typography } from '@mui/material';
import type { ChangeEvent, RefObject } from 'react';

interface WheelImportDropZoneProps {
  inputRef: RefObject<HTMLInputElement | null>;
  dragging: boolean;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPickFile: () => void;
}

export function WheelImportDropZone({
  inputRef,
  dragging,
  onInputChange,
  onPickFile,
}: WheelImportDropZoneProps) {
  return (
    <Box
      component="section"
      aria-label="Import wheel JSON"
      sx={{
        border: 1,
        borderStyle: 'dashed',
        borderColor: dragging ? 'primary.main' : 'divider',
        bgcolor: dragging ? 'action.hover' : 'transparent',
        borderRadius: 2,
        px: 2,
        py: 2.5,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="subtitle1">Import wheel JSON</Typography>
        <Typography color="text.secondary" variant="body2">
          Drop a file here or choose an exported wheel JSON file.
        </Typography>
      </Box>
      <Button variant="outlined" startIcon={<FileUploadOutlinedIcon />} onClick={onPickFile}>
        Choose JSON file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        aria-label="Choose wheel JSON file"
        onChange={onInputChange}
        style={{ display: 'none' }}
      />
    </Box>
  );
}
