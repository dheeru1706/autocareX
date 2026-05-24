import React, { useState } from 'react';
import { Box, Grid, Card, Typography, Chip, IconButton, Tooltip, Tab, Tabs, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { PauseCircle, XCircle, CreditCard, TrendingUp, RefreshCw, Users } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import KPICard from '../../components/charts/KPICard';
import { LineChartCard, BarChartCard } from '../../components/charts/RevenueChart';
import toast from 'react-hot-toast';

const PLANS = ['Basic', 'Pro', 'Elite'];
const planColors = {
  Basic: { color: '#2196F3', bg: 'rgba(33,150,243,0.12)' },
  Pro: { color: '#9C27B0', bg: 'rgba(156,39,176,0.12)' },
  Elite: { color: '#F5C518', bg: 'rgba(245,197,24,0.12)' },
};
const planPrices = { Basic: 299, Pro: 599, Elite: 999 };

const mockSubs = Array.from({ length: 60 }, (_, i) => ({
  id: `SUB${String(10000 + i)}`,
  customer: ['Rahul Sharma', 'Priya Nair', 'Arun Kumar', 'Sneha Reddy', 'Vikram Joshi'][i % 5],
  plan: PLANS[i % 3],
  city: ['Hyderabad', 'Bengaluru', 'Mumbai', 'Chennai', 'Delhi'][i % 5],
  status: i % 8 === 0 ? 'paused' : i % 15 === 0 ? 'cancelled' : 'active',
  start_date: new Date(2024, i % 5, (i % 28) + 1).toLocaleDateString('en-IN'),
  renewal_date: new Date(2024, (i % 5) + 1, (i % 28) + 1).toLocaleDateString('en-IN'),
  amount: planPrices[PLANS[i % 3]],
  vehicles: Math.floor(1 + i % 3),
  usage: Math.floor(20 + Math.random() * 80),
}));

const mrrData = [
  { name: 'Jan', mrr: 28400, basic: 12000, pro: 11200, elite: 5200 },
  { name: 'Feb', mrr: 31200, basic: 13200, pro: 12400, elite: 5600 },
  { name: 'Mar', mrr: 34800, basic: 14600, pro: 13800, elite: 6400 },
  { name: 'Apr', mrr: 37600, basic: 15800, pro: 14800, elite: 7000 },
  { name: 'May', mrr: 41200, basic: 17400, pro: 16200, elite: 7600 },
];

const churnData = [
  { name: 'Jan', churn: 3.2, reactivation: 1.4 },
  { name: 'Feb', churn: 2.8, reactivation: 1.6 },
  { name: 'Mar', churn: 2.4, reactivation: 1.8 },
  { name: 'Apr', churn: 2.1, reactivation: 2.0 },
  { name: 'May', churn: 1.8, reactivation: 2.2 },
];

const planPerf = [
  { name: 'Basic (₹299/mo)', subscribers: 3480, mrr: 1040520, churn: 2.4 },
  { name: 'Pro (₹599/mo)', subscribers: 2150, mrr: 1287850, churn: 1.6 },
  { name: 'Elite (₹999/mo)', subscribers: 1240, mrr: 1238760, churn: 0.9 },
];

const statusColors = {
  active: { color: '#4CAF50', bg: 'rgba(76,175,80,0.12)', label: 'Active' },
  paused: { color: '#FF9800', bg: 'rgba(255,152,0,0.12)', label: 'Paused' },
  cancelled: { color: '#F44336', bg: 'rgba(244,67,54,0.12)', label: 'Cancelled' },
};

export default function SubscriptionManagement() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', sub: null });

  const filtered = mockSubs.filter((s) =>
    !search || s.customer.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search)
  );

  const columns = [
    {
      field: 'id', headerName: 'Sub ID', width: 130,
      renderCell: ({ value }) => <Typography sx={{ color: '#F5C518', fontWeight: 600, fontSize: 12 }}>{value}</Typography>,
    },
    { field: 'customer', headerName: 'Customer', flex: 1, minWidth: 160 },
    {
      field: 'plan', headerName: 'Plan', width: 100,
      renderCell: ({ value }) => {
        const c = planColors[value] || planColors.Basic;
        return <Chip label={value} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: 11 }} />;
      },
    },
    { field: 'city', headerName: 'City', width: 120 },
    {
      field: 'amount', headerName: 'Amount/mo', width: 130, align: 'right',
      renderCell: ({ value }) => <Typography sx={{ fontWeight: 600, fontSize: 13 }}>₹{value}</Typography>,
    },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: ({ value }) => {
        const s = statusColors[value] || statusColors.active;
        return <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11 }} />;
      },
    },
    { field: 'start_date', headerName: 'Started', width: 120 },
    { field: 'renewal_date', headerName: 'Renews', width: 120 },
    { field: 'vehicles', headerName: 'Vehicles', width: 90, align: 'right' },
    {
      field: 'usage', headerName: 'Usage %', width: 110,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: '#1E1E1E', overflow: 'hidden' }}>
            <Box sx={{ width: `${value}%`, height: '100%', bgcolor: value >= 80 ? '#4CAF50' : '#F5C518', borderRadius: 3 }} />
          </Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#888', minWidth: 28 }}>{value}%</Typography>
        </Box>
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 110, sortable: false,
      renderCell: ({ row }) => row.status === 'active' ? (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Pause">
            <IconButton size="small" onClick={() => setConfirmDialog({ open: true, type: 'pause', sub: row })} sx={{ color: '#888', '&:hover': { color: '#FF9800' } }}>
              <PauseCircle size={15} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancel">
            <IconButton size="small" onClick={() => setConfirmDialog({ open: true, type: 'cancel', sub: row })} sx={{ color: '#888', '&:hover': { color: '#F44336' } }}>
              <XCircle size={15} />
            </IconButton>
          </Tooltip>
        </Box>
      ) : null,
    },
  ];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Active Subscriptions', value: '6,870', trend: 'up', trendValue: '+9.1%', icon: CreditCard, color: '#F5C518' },
          { title: 'Monthly MRR', value: '₹41.2L', trend: 'up', trendValue: '+9.6% MoM', icon: TrendingUp, color: '#4CAF50' },
          { title: 'Churn Rate', value: '1.8%', trend: 'up', trendValue: '-0.3% MoM', icon: RefreshCw, color: '#9C27B0' },
          { title: 'Total Subscribers', value: '6,870', trend: 'up', trendValue: '+580 this month', icon: Users, color: '#2196F3' },
        ].map((k) => (
          <Grid item xs={12} sm={6} lg={3} key={k.title}><KPICard {...k} /></Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #2A2A2A', px: 2 }}>
          <Tab label="Active Subscriptions" />
          <Tab label="MRR Analytics" />
          <Tab label="Churn Analysis" />
          <Tab label="Plan Performance" />
        </Tabs>
        <Box sx={{ p: tab === 0 ? 0 : 2.5 }}>
          {tab === 0 && (
            <DataTable
              rows={filtered}
              columns={columns}
              rowCount={filtered.length}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by customer or ID..."
              getRowId={(r) => r.id}
              paginationModel={{ page, pageSize: 25 }}
              onPaginationModelChange={(m) => setPage(m.page)}
              onExport={() => toast.success('Exporting subscriptions...')}
              height={500}
            />
          )}
          {tab === 1 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <LineChartCard title="MRR by Plan" data={mrrData} lines={[{ key: 'basic', name: 'Basic' }, { key: 'pro', name: 'Pro' }, { key: 'elite', name: 'Elite' }]} prefix="₹" height={320} />
              </Grid>
            </Grid>
          )}
          {tab === 2 && (
            <LineChartCard title="Churn vs Reactivation Rate (%)" data={churnData} lines={[{ key: 'churn', name: 'Churn %' }, { key: 'reactivation', name: 'Reactivation %' }]} suffix="%" height={320} />
          )}
          {tab === 3 && (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Plan', 'Subscribers', 'MRR', 'Churn Rate'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planPerf.map((p) => (
                    <tr key={p.name} style={{ borderBottom: '1px solid #1E1E1E' }}>
                      <td style={{ padding: '16px 16px', color: '#DDD', fontWeight: 700 }}>{p.name}</td>
                      <td style={{ padding: '16px 16px', fontWeight: 600 }}>{p.subscribers.toLocaleString()}</td>
                      <td style={{ padding: '16px 16px', color: '#4CAF50', fontWeight: 700 }}>₹{(p.mrr / 100000).toFixed(1)}L</td>
                      <td style={{ padding: '16px 16px', color: p.churn < 2 ? '#4CAF50' : '#FF9800', fontWeight: 700 }}>{p.churn}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Box>
      </Card>

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, type: '', sub: null })} PaperProps={{ sx: { bgcolor: '#1A1A1A', border: '1px solid #2A2A2A', minWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{confirmDialog.type === 'pause' ? 'Pause Subscription' : 'Cancel Subscription'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#888' }}>
            {confirmDialog.sub?.customer} — {confirmDialog.sub?.plan} Plan (₹{confirmDialog.sub?.amount}/mo)
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setConfirmDialog({ open: false, type: '', sub: null })} sx={{ color: '#888' }}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmDialog.type === 'pause' ? 'warning' : 'error'}
            onClick={() => { toast.success(`Subscription ${confirmDialog.type === 'pause' ? 'paused' : 'cancelled'}`); setConfirmDialog({ open: false, type: '', sub: null }); }}
            sx={{ fontWeight: 700 }}
          >
            {confirmDialog.type === 'pause' ? 'Pause' : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
