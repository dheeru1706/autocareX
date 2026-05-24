import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Chip, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography } from '@mui/material';
import { Eye, CheckCircle, XCircle, Ban, DollarSign } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import toast from 'react-hot-toast';

const mockFranchises = Array.from({ length: 40 }, (_, i) => ({
  id: `FR${String(i + 1).padStart(4, '0')}`,
  name: ['AutoCareX Banjara Hills', 'AutoCareX Koramangala', 'AutoCareX Andheri', 'AutoCareX T Nagar', 'AutoCareX Connaught Place', 'AutoCareX Aundh'][i % 6],
  partner: ['Ravi Teja Motors', 'Suresh Auto Works', 'Mumbai Auto Hub', 'Chennai Car Care', 'Delhi Drive Tech', 'Pune Auto Pro'][i % 6],
  city: ['Hyderabad', 'Bengaluru', 'Mumbai', 'Chennai', 'Delhi', 'Pune'][i % 6],
  territory: ['Banjara Hills', 'Koramangala', 'Andheri West', 'T Nagar', 'CP Zone 1', 'Aundh'][i % 6],
  kyc_status: ['approved', 'pending', 'approved', 'rejected', 'approved', 'pending'][i % 6],
  status: i % 7 === 0 ? 'suspended' : 'active',
  rating: (4.2 + (i % 8) * 0.1).toFixed(1),
  earnings: Math.floor(200000 + Math.random() * 400000),
  bookings: Math.floor(300 + Math.random() * 600),
  joined: new Date(2023, i % 12, (i % 28) + 1).toLocaleDateString('en-IN'),
}));

const kycConfig = {
  approved: { label: 'Approved', color: '#4CAF50', bg: 'rgba(76,175,80,0.12)' },
  pending: { label: 'Pending', color: '#FF9800', bg: 'rgba(255,152,0,0.12)' },
  rejected: { label: 'Rejected', color: '#F44336', bg: 'rgba(244,67,54,0.12)' },
};

const statusConfig = {
  active: { label: 'Active', color: '#4CAF50', bg: 'rgba(76,175,80,0.12)' },
  suspended: { label: 'Suspended', color: '#F44336', bg: 'rgba(244,67,54,0.12)' },
};

export default function FranchiseList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', franchise: null });
  const [actionNotes, setActionNotes] = useState('');

  const filtered = mockFranchises.filter((f) => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.partner.toLowerCase().includes(search.toLowerCase());
    const matchCity = cityFilter === 'all' || f.city === cityFilter;
    const matchStatus = statusFilter === 'all' || f.kyc_status === statusFilter;
    return matchSearch && matchCity && matchStatus;
  });

  const handleAction = (type, franchise) => {
    setActionDialog({ open: true, type, franchise });
    setActionNotes('');
  };

  const handleConfirmAction = () => {
    const { type, franchise } = actionDialog;
    toast.success(`${type === 'approve' ? 'Approved' : type === 'reject' ? 'Rejected' : 'Suspended'} ${franchise.name}`);
    setActionDialog({ open: false, type: '', franchise: null });
  };

  const columns = [
    {
      field: 'id', headerName: 'ID', width: 100,
      renderCell: ({ value }) => <Typography sx={{ color: '#F5C518', fontWeight: 600, fontSize: 13 }}>{value}</Typography>,
    },
    { field: 'partner', headerName: 'Partner', flex: 1, minWidth: 160 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'territory', headerName: 'Territory', width: 150 },
    {
      field: 'kyc_status', headerName: 'KYC Status', width: 130,
      renderCell: ({ value }) => {
        const c = kycConfig[value] || kycConfig.pending;
        return <Chip label={c.label} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: 11 }} />;
      },
    },
    {
      field: 'status', headerName: 'Status', width: 110,
      renderCell: ({ value }) => {
        const c = statusConfig[value] || statusConfig.active;
        return <Chip label={c.label} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: 11 }} />;
      },
    },
    {
      field: 'rating', headerName: 'Rating', width: 90, align: 'center',
      renderCell: ({ value }) => <Typography sx={{ color: '#F5C518', fontWeight: 700 }}>★ {value}</Typography>,
    },
    {
      field: 'earnings', headerName: 'Earnings', width: 130, align: 'right',
      renderCell: ({ value }) => <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: 13 }}>₹{(value / 1000).toFixed(0)}k</Typography>,
    },
    { field: 'bookings', headerName: 'Bookings', width: 100, align: 'right' },
    {
      field: 'actions', headerName: 'Actions', width: 160, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => navigate(`/franchise/${row.id}`)} sx={{ color: '#888', '&:hover': { color: '#F5C518' } }}>
              <Eye size={15} />
            </IconButton>
          </Tooltip>
          {row.kyc_status === 'pending' && (
            <>
              <Tooltip title="Approve KYC">
                <IconButton size="small" onClick={() => handleAction('approve', row)} sx={{ color: '#888', '&:hover': { color: '#4CAF50' } }}>
                  <CheckCircle size={15} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject KYC">
                <IconButton size="small" onClick={() => handleAction('reject', row)} sx={{ color: '#888', '&:hover': { color: '#F44336' } }}>
                  <XCircle size={15} />
                </IconButton>
              </Tooltip>
            </>
          )}
          {row.status === 'active' && (
            <Tooltip title="Suspend">
              <IconButton size="small" onClick={() => handleAction('suspend', row)} sx={{ color: '#888', '&:hover': { color: '#FF9800' } }}>
                <Ban size={15} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const cities = ['all', ...new Set(mockFranchises.map((f) => f.city))];

  return (
    <Box>
      <DataTable
        title="All Franchises"
        rows={filtered}
        columns={columns}
        rowCount={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or partner..."
        getRowId={(r) => r.id}
        onRowClick={({ row }) => navigate(`/franchise/${row.id}`)}
        paginationModel={{ page, pageSize: 25 }}
        onPaginationModelChange={(m) => setPage(m.page)}
        onExport={() => toast.success('Exporting franchise list...')}
        toolbar={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: 13 }}>City</InputLabel>
              <Select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} label="City" sx={{ fontSize: 13, height: 36 }}>
                {cities.map((c) => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c === 'all' ? 'All Cities' : c}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: 13 }}>KYC Status</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="KYC Status" sx={{ fontSize: 13, height: 36 }}>
                <MenuItem value="all" sx={{ fontSize: 13 }}>All Status</MenuItem>
                <MenuItem value="approved" sx={{ fontSize: 13 }}>Approved</MenuItem>
                <MenuItem value="pending" sx={{ fontSize: 13 }}>Pending</MenuItem>
                <MenuItem value="rejected" sx={{ fontSize: 13 }}>Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
      />

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: '', franchise: null })}
        PaperProps={{ sx: { bgcolor: '#1A1A1A', border: '1px solid #2A2A2A', minWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {actionDialog.type === 'approve' ? 'Approve KYC' : actionDialog.type === 'reject' ? 'Reject KYC' : 'Suspend Franchise'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
            {actionDialog.franchise?.name} — {actionDialog.franchise?.city}
          </Typography>
          <TextField
            label="Notes (optional)"
            multiline
            rows={3}
            fullWidth
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder="Add internal notes..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setActionDialog({ open: false, type: '', franchise: null })} sx={{ color: '#888' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmAction}
            color={actionDialog.type === 'approve' ? 'success' : 'error'}
            sx={{ fontWeight: 700 }}
          >
            {actionDialog.type === 'approve' ? 'Approve' : actionDialog.type === 'reject' ? 'Reject' : 'Suspend'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
