import React from 'react';
import { Box, Card, Typography, TextField, InputAdornment, Button, Chip, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Download } from 'lucide-react';

export default function DataTable({
  title,
  rows = [],
  columns = [],
  loading = false,
  onExport,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  toolbar,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  getRowId,
  onRowClick,
  actions,
  height = 500,
}) {
  return (
    <Card sx={{ overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid #2A2A2A',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {title && (
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 15 }}>
              {title}
            </Typography>
          )}
          {rowCount !== undefined && (
            <Chip
              label={rowCount.toLocaleString()}
              size="small"
              sx={{ bgcolor: 'rgba(245,197,24,0.12)', color: '#F5C518', fontWeight: 700, fontSize: 11 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {toolbar}
          {onSearchChange && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={15} color="#666" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 220, '& .MuiInputBase-root': { height: 36, fontSize: 13 } }}
            />
          )}
          {onExport && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Download size={14} />}
              onClick={onExport}
              sx={{ height: 36, borderColor: '#2A2A2A', color: '#888', '&:hover': { borderColor: '#F5C518', color: '#F5C518' } }}
            >
              Export
            </Button>
          )}
          {actions}
        </Box>
      </Box>

      {/* Grid */}
      <Box sx={{ height }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={getRowId}
          onRowClick={onRowClick}
          paginationModel={paginationModel || { page: 0, pageSize: 25 }}
          onPaginationModelChange={onPaginationModelChange}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          rowHeight={56}
          columnHeaderHeight={48}
          sx={{
            border: 'none',
            '& .MuiDataGrid-row': { cursor: onRowClick ? 'pointer' : 'default' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' },
            '& .MuiDataGrid-cell': { fontSize: 13.5, color: '#DDD' },
            '& .MuiDataGrid-virtualScroller': { backgroundColor: '#1A1A1A' },
          }}
          slots={{
            loadingOverlay: () => (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress size={32} sx={{ color: '#F5C518' }} />
              </Box>
            ),
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#555' }}>No records found</Typography>
              </Box>
            ),
          }}
        />
      </Box>
    </Card>
  );
}
