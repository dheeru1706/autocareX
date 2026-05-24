import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Chip, IconButton, Tooltip, Tab, Tabs,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { CheckCircle, XCircle, Eye, Car, TrendingUp } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import KPICard from '../../components/charts/KPICard';
import { BarChartCard } from '../../components/charts/RevenueChart';
import toast from 'react-hot-toast';

const mockListings = Array.from({ length: 50 }, (_, i) => ({
  id: `CAR${String(1000 + i).padStart(5, '0')}`,
  title: `${['Honda City', 'Maruti Suzuki Swift', 'Hyundai Creta', 'Toyota Fortuner', 'Tata Nexon'][i % 5]} ${2019 + (i % 5)}`,
  dealer: ['Sunrise Motors', 'City Auto Hub', 'Prime Cars', 'TopDrive', 'Elite Wheels'][i % 5],
  city: ['Hyderabad', 'Bengaluru', 'Mumbai', 'Chennai', 'Delhi'][i % 5],
  price: Math.floor(500000 + Math.random() * 1500000),
  ai_price: Math.floor(490000 + Math.random() * 1520000),
  inspection_score: Math.floor(60 + Math.random() * 40),
  status: ['pending', 'approved', 'rejected', 'pending', 'approved'][i % 5],
  submitted: new Date(2024, 4, 23 - (i % 10)).toLocaleDateString('en-IN'),
  km: Math.floor(10000 + Math.random() * 80000),
  fuel: ['Petrol', 'Diesel', 'CNG', 'Electric'][i % 4],
}));

const dealerPerformance = [
  { name: 'Sunrise Motors', listings: 24, sold: 18, rating: 4.8 },
  { name: 'City Auto Hub', listings: 19, sold: 14, rating: 4.6 },
  { name: 'Prime Cars', listings: 15, sold: 11, rating: 4.5 },
  { name: 'TopDrive', listings: 12, sold: 8, rating: 4.3 },
  { name: 'Elite Wheels', listings: 10, sold: 6, rating: 4.2 },
];

const pricingAccuracy = [
  { name: 'Honda City', ai_price: 680000, actual: 695000 },
  { name: 'Maruti Swift', ai_price: 480000, actual: 475000 },
  { name: 'Hyundai Creta', ai_price: 920000, actual: 950000 },
  { name: 'Toyota Fortuner', ai_price: 2850000, actual: 2800000 },
  { name: 'Tata Nexon', ai_price: 740000, actual: 760000 },
];

const statusColors = {
  pending: { color: '#FF9800', bg: 'rgba(255,152,0,0.12)', label: 'Pending Review' },
  approved: { color: '#4CAF50', bg: 'rgba(76,175,80,0.12)', label: 'Approved' },
  rejected: { color: '#F44336', bg: 'rgba(244,67,54,0.12)', label: 'Rejected' },
};

export default function MarketplaceManagement() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', listing: null });
  const [rejectionReason, setRejectionReason] = useState('');

  const filtered = mockListings.filter((l) => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.dealer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = mockListings.filter((l) => l.status === 'pending').length;

  const columns = [
    {
      field: 'id', headerName: 'ID', width: 120,
      renderCell: ({ value }) => <Typography sx={{ color: '#F5C518', fontWeight: 600, fontSize: 12 }}>{value}</Typography>,
    },
    { field: 'title', headerName: 'Vehicle', flex: 1, minWidth: 200 },
    { field: 'dealer', headerName: 'Dealer', width: 160 },
    { field: 'city', headerName: 'City', width: 120 },
    {
      field: 'price', headerName: 'Listed Price', width: 140, align: 'right',
      renderCell: ({ value }) => <Typography sx={{ fontWeight: 600, fontSize: 13 }}>₹{(value / 100000).toFixed(1)}L</Typography>,
    },
    {
      field: 'ai_price', headerName: 'AI Price', width: 120, align: 'right',
      renderCell: ({ row }) => {
        const diff = ((row.ai_price - row.price) / row.price * 100).toFixed(1);
        const isHigh = Number(diff) > 0;
        return (
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>₹{(row.ai_price / 100000).toFixed(1)}L</Typography>
            <Typography sx={{ fontSize: 10, color: isHigh ? '#4CAF50' : '#F44336' }}>{isHigh ? '+' : ''}{diff}%</Typography>
          </Box>
        );
      },
    },
    {
      field: 'inspection_score', headerName: 'Inspection', width: 120, align: 'center',
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: '#1E1E1E', overflow: 'hidden', width: 50 }}>
            <Box sx={{ width: `${value}%`, height: '100%', bgcolor: value >= 80 ? '#4CAF50' : value >= 60 ? '#FF9800' : '#F44336' }} />
          </Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: value >= 80 ? '#4CAF50' : value >= 60 ? '#FF9800' : '#F44336' }}>{value}</Typography>
        </Box>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: ({ value }) => {
        const s = statusColors[value] || statusColors.pending;
        return <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11 }} />;
      },
    },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View">
            <IconButton size="small" sx={{ color: '#888', '&:hover': { color: '#F5C518' } }}><Eye size={15} /></IconButton>
          </Tooltip>
          {row.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <IconButton size="small" onClick={() => setActionDialog({ open: true, type: 'approve', listing: row })} sx={{ color: '#888', '&:hover': { color: '#4CAF50' } }}><CheckCircle size={15} /></IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton size="small" onClick={() => setActionDialog({ open: true, type: 'reject', listing: row })} sx={{ color: '#888', '&:hover': { color: '#F44336' } }}><XCircle size={15} /></IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Total Listings', value: '280', trend: 'up', trendValue: '+12 this week', icon: Car, color: '#F5C518' },
          { title: 'Pending Review', value: String(pendingCount), trend: 'down', trendValue: 'Needs action', icon: Eye, color: '#FF9800' },
          { title: 'Approved', value: '198', trend: 'up', trendValue: '70.7% approval rate', icon: CheckCircle, color: '#4CAF50' },
          { title: 'Avg AI Price Accuracy', value: '97.2%', trend: 'up', trendValue: '+0.4% this month', icon: TrendingUp, color: '#2196F3' },
        ].map((k) => (
          <Grid item xs={12} sm={6} lg={3} key={k.title}><KPICard {...k} /></Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #2A2A2A', px: 2 }}>
          <Tab label="Listings Moderation" />
          <Tab label="AI Pricing Accuracy" />
          <Tab label="Dealer Performance" />
        </Tabs>
        <Box sx={{ p: tab === 0 ? 0 : 2.5 }}>
          {tab === 0 && (
            <DataTable
              rows={filtered}
              columns={columns}
              rowCount={filtered.length}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search listings..."
              getRowId={(r) => r.id}
              onExport={() => toast.success('Exporting listings...')}
              height={480}
              toolbar={
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel sx={{ fontSize: 13 }}>Status</InputLabel>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status" sx={{ fontSize: 13, height: 36 }}>
                    <MenuItem value="all" sx={{ fontSize: 13 }}>All Status</MenuItem>
                    {Object.entries(statusColors).map(([v, { label }]) => <MenuItem key={v} value={v} sx={{ fontSize: 13 }}>{label}</MenuItem>)}
                  </Select>
                </FormControl>
              }
            />
          )}
          {tab === 1 && (
            <BarChartCard
              title="AI Price vs Listed Price (₹)"
              data={pricingAccuracy}
              bars={[{ key: 'ai_price', name: 'AI Price' }, { key: 'actual', name: 'Listed Price' }]}
              prefix="₹"
              height={360}
            />
          )}
          {tab === 2 && (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Dealer', 'Listings', 'Sold', 'Conversion', 'Rating'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dealerPerformance.map((d) => (
                    <tr key={d.name} style={{ borderBottom: '1px solid #1E1E1E' }}>
                      <td style={{ padding: '14px 16px', color: '#DDD', fontWeight: 600 }}>{d.name}</td>
                      <td style={{ padding: '14px 16px' }}>{d.listings}</td>
                      <td style={{ padding: '14px 16px', color: '#4CAF50', fontWeight: 600 }}>{d.sold}</td>
                      <td style={{ padding: '14px 16px', color: '#2196F3', fontWeight: 600 }}>{((d.sold / d.listings) * 100).toFixed(0)}%</td>
                      <td style={{ padding: '14px 16px', color: '#F5C518', fontWeight: 700 }}>★ {d.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Box>
      </Card>

      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: '', listing: null })} PaperProps={{ sx: { bgcolor: '#1A1A1A', border: '1px solid #2A2A2A', minWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{actionDialog.type === 'approve' ? 'Approve Listing' : 'Reject Listing'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>{actionDialog.listing?.title} — {actionDialog.listing?.dealer}</Typography>
          {actionDialog.type === 'reject' && (
            <TextField label="Rejection Reason" multiline rows={3} fullWidth value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Explain why this listing is being rejected..." />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setActionDialog({ open: false, type: '', listing: null })} sx={{ color: '#888' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => { toast.success(`Listing ${actionDialog.type === 'approve' ? 'approved' : 'rejected'}`); setActionDialog({ open: false, type: '', listing: null }); }}
            color={actionDialog.type === 'approve' ? 'success' : 'error'}
            sx={{ fontWeight: 700 }}
          >
            {actionDialog.type === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
