import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DonutLargeOutlinedIcon from '@mui/icons-material/DonutLargeOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import { ItemCustomFieldsDetails } from '@/features/wheel-editor/components/ItemCustomFieldsDetails';
import { ItemHierarchyTree } from '@/features/wheel-editor/components/ItemHierarchyTree';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import type { EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { CustomFieldDefinition } from '@/types/customFields';

export interface ItemDetailsActions {
  onEdit: () => void;
  onAddChild: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSpinFromItem: () => void;
  onClose: () => void;
}

interface ItemDetailsDrawerProps {
  node?: EditorTreeNode | null;
  fieldDefinitions?: readonly CustomFieldDefinition[];
  canSpinFromItem?: boolean;
  actions: ItemDetailsActions;
}

const TITLE_ID = 'item-details-title';

export function ItemDetailsDrawer({
  node,
  fieldDefinitions = [],
  canSpinFromItem = false,
  actions,
}: ItemDetailsDrawerProps) {
  const isMobile = useIsMobile();
  const open = Boolean(node);

  if (!open || !node) {
    return null;
  }

  const childCount = node.children.length;
  const itemLabel = node.icon ? `${node.icon} ${node.name}` : node.name;

  const body = (
    <Stack spacing={{ xs: 2, sm: 2.5 }}>
      <Stack spacing={1.5} component="dl" sx={{ m: 0, overflowWrap: 'anywhere' }}>
        <Detail label={EDITOR_MESSAGES.detailName} value={node.name} />
        <Detail
          label={EDITOR_MESSAGES.detailDescription}
          value={node.description?.trim() || EDITOR_MESSAGES.detailNoDescription}
        />
        <Detail
          label={EDITOR_MESSAGES.detailIcon}
          value={node.icon?.trim() || EDITOR_MESSAGES.detailNoIcon}
        />
        <Detail
          label={EDITOR_MESSAGES.detailColor}
          value={
            node.color ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: node.color,
                    border: '1px solid',
                    borderColor: 'divider',
                    flexShrink: 0,
                  }}
                />
                <Typography component="span" sx={{ fontWeight: 600 }}>
                  {node.color}
                </Typography>
              </Stack>
            ) : (
              EDITOR_MESSAGES.detailNoIcon
            )
          }
        />
        <Detail label={EDITOR_MESSAGES.detailWeight} value={String(node.weight)} />
        <Detail
          label={EDITOR_MESSAGES.detailEnabled}
          value={
            <Chip
              size="small"
              label={node.enabled ? EDITOR_MESSAGES.detailEnabledYes : EDITOR_MESSAGES.detailEnabledNo}
              color={node.enabled ? 'success' : 'default'}
              variant="outlined"
            />
          }
        />
        <Detail label={EDITOR_MESSAGES.detailChildren} value={EDITOR_MESSAGES.childCount(childCount)} />
        <Detail
          label={EDITOR_MESSAGES.detailCreated}
          value={node.createdAt ? formatDateTime(node.createdAt) : '—'}
        />
        <Detail
          label={EDITOR_MESSAGES.detailUpdated}
          value={node.updatedAt ? formatDateTime(node.updatedAt) : '—'}
        />
      </Stack>

      {fieldDefinitions.length > 0 ? (
        <ItemCustomFieldsDetails definitions={fieldDefinitions} values={node.customFields} />
      ) : null}

      <Stack spacing={1}>
        <Typography variant="subtitle2" component="h3">
          {EDITOR_MESSAGES.detailHierarchy}
        </Typography>
        {childCount > 0 ? (
          <ItemHierarchyTree nodes={node.children} />
        ) : (
          <Typography color="text.secondary">{EDITOR_MESSAGES.detailEmptyHierarchy}</Typography>
        )}
      </Stack>
    </Stack>
  );

  const actionButtons = (
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      sx={{
        flexWrap: 'wrap',
        width: '100%',
        justifyContent: { xs: 'stretch', sm: 'flex-end' },
        '& > .MuiButton-root': {
          flex: { xs: '1 1 calc(50% - 8px)', sm: '0 1 auto' },
          minWidth: { xs: 0, sm: 'auto' },
        },
      }}
    >
      <Button startIcon={<EditOutlinedIcon />} onClick={actions.onEdit} variant="outlined">
        {EDITOR_MESSAGES.actionEdit}
      </Button>
      <Button startIcon={<AddIcon />} onClick={actions.onAddChild} variant="outlined">
        {EDITOR_MESSAGES.actionAddChild}
      </Button>
      <Button startIcon={<ContentCopyIcon />} onClick={actions.onDuplicate} variant="outlined">
        {EDITOR_MESSAGES.actionDuplicate}
      </Button>
      <Button
        startIcon={<DeleteOutlinedIcon />}
        onClick={actions.onDelete}
        color="error"
        variant="outlined"
      >
        {EDITOR_MESSAGES.actionDelete}
      </Button>
      <Button
        startIcon={<DonutLargeOutlinedIcon />}
        onClick={actions.onSpinFromItem}
        variant="contained"
        disabled={!canSpinFromItem}
        title={canSpinFromItem ? undefined : EDITOR_MESSAGES.spinFromItemUnavailable}
        aria-disabled={!canSpinFromItem}
        sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
      >
        {EDITOR_MESSAGES.actionSpinFromItem}
      </Button>
      <Button onClick={actions.onClose} sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}>
        {EDITOR_MESSAGES.actionClose}
      </Button>
    </Stack>
  );

  if (isMobile) {
    return (
      <Drawer
        open
        anchor="bottom"
        onClose={actions.onClose}
        aria-labelledby={TITLE_ID}
        ModalProps={{ keepMounted: false }}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '90dvh',
              height: 'auto',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              // Inset the sheet from the viewport edges (highlighted left/right).
              mx: { xs: 1.5, sm: 2 },
              width: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 32px)' },
              px: { xs: 2, sm: 3 },
              pt: 1.25,
              pb: 2,
            },
          },
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            pb: 1.25,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: 'action.disabled',
              mx: 'auto',
              mb: 1.25,
            }}
          />
          <Typography id={TITLE_ID} variant="h6" component="h2">
            {EDITOR_MESSAGES.detailsTitle}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} aria-hidden>
            {itemLabel}
          </Typography>
        </Box>

        <Box
          sx={{
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'auto',
            py: 2,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {body}
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            pt: 1.5,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {actionButtons}
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog
      open
      onClose={actions.onClose}
      transitionDuration={0}
      closeAfterTransition={false}
      fullWidth
      maxWidth="sm"
      aria-labelledby={TITLE_ID}
      sx={{
        '& .MuiDialog-paper': {
          m: { xs: 2, sm: 4 },
          width: { xs: 'calc(100% - 32px)', sm: undefined },
          maxHeight: { sm: '90dvh' },
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ flexShrink: 0 }}>
        <Typography id={TITLE_ID} component="span" variant="h6">
          {EDITOR_MESSAGES.detailsTitle}
        </Typography>
        <Typography component="div" variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }} aria-hidden>
          {itemLabel}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto' }}>
        {body}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          flexShrink: 0,
          justifyContent: 'flex-end',
        }}
      >
        {actionButtons}
      </DialogActions>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack spacing={0.25}>
      <Typography component="dt" variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box component="dd" sx={{ m: 0, fontWeight: 600 }}>
        {typeof value === 'string' || typeof value === 'number' ? (
          <Typography component="span" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Stack>
  );
}
