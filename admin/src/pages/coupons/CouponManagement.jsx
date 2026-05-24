import React, { useState } from 'react';
import {
  Box, Card, Grid, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Switch, FormControlLabel, Chip, Tab, Tabs,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
} from '@mui/material';
import { Plus, Tag, ToggleLeft, ToggleRight, Copy } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import KPICard from '../../components/charts/KPICard';
import { BarChartCard } from '../../components/charts/RevenueChart';
import toast from 'react-hot-toast';

const mockCoupons = [
  { id: 'SUMMER20', type: 'percent', value: 20, min_order: 500, max_discount: 300, usage: 1842, limit: 5000, revenue: 284600, status: 'active', expires: '31 May 2024', applicable: 'All Services' },
  { id: 'FLAT200', type: 'flat', value: 200, min_order: 1000, max_discount: 200, usage: 956, limit: 2000, revenue: 191200, status: 'active', expires: '30 Jun 2024', applicable: 'AC Service' },
  { id: 'NEWUSER', type: 'percent', value: 15, min_order: 0, max_discount: 150, usage: 3240, limit: 0, revenue: 486000, status: 'active', expires: '31 Dec 2024', applicable: 'First Booking' },
  { id: 'ELITE30', type: 'percent', value: 30, min_order: 1500, max_discount: 500, usage: 420, limit: 1000, revenue: 210000, status: 'active', expires: '31 May 2024', applicable: 'Elite Users' },
  { id: 'MONSOON15', type: 'percent', value: 15, min_order: 800, max_discount: 250, usage: 0, limit: 3000, revenue: 0, status: 'inactive', expires: '31 Aug 2024', applicable: 'All Services' },
];

const couponPerformance = mockCoupons.slice(0, 4).map((c) => ({ name: c.id, usage: c.usage, revenue: c.revenue / 1000 }));

const SERVICES = ['All Services', 'Oil Change', 'AC Service', 'Tyre Service', 'Detailing', 'Brake Service', 'First Booking'];

const initialForm = { code: '', type: 'percent', value: '', min_order: '', max_discount: '', limit: '', expires: '', applicable: 'All Services', description: '' };

export default function CouponManagement() {
  const [tab, setTab] = useState(0);
  const [coupons, setCoupons] = useState(mockCoupons);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkPrefix, setBulkPrefix] = useState('ACX');

  const filtered = coupons.filter((c) => !search || c.id.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = () => {
    if (!form.code || !form.value) { toast.error('Code and value are required'); return; }
    setCoupons((p) => [{ ...form, id: form.code.toUpperCase(), usage: 0, revenue: 0, status: 'active' }, ...p]);
    toast.success(`Coupon ${form.code.toUpperCase()} created!`);
    setForm(initialForm);
    setCreateOpen(false);
  };

  const handleToggle = (id) => {
    setCoupons((p) => p.map((c) => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c));
    toast.success('Coupon status updated');
  };

  const handleBulkCreate = () => {
    const newCoupons = Array.from({ length: bulkCount }, (_, i) => ({
      id: `${bulkPrefix}${String(1000 + i)}`,
      type: 'flat',
      value: 100,
      min_order: 500,
      max_discount: 100,
      usage: 0,
      limit: 1,
      revenue: 0,
      status: 'active',
      expires: '31 Dec 2024',
      applicable: 'All Services',
    }));
    setCoupons((p) => [...newCoupons, ...p]);
    toast.success(`${bulkCount} coupons created with prefix ${bulkPrefix}`);
    setBulkOpen(false);
  };

  const columns = [
    {
      field: 'id', headerName: 'Coupon Code', width: 160,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ color: '#F5C518', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{value}</Typography>
          <Tooltip title="Copy code">
            <IconButton size="small" onClick={() => { navigator.clipboard?.writeText(value); toast.success('Copied!'); }} sx={{ color: '#555', '&:hover': { color: '#F5C518' } }}>
              <Copy size={12} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'type', headerName: 'Type', width: 110,
      renderCell: ({ row }) => (
        <Chip
          label={row.type === 'percent' ? `${row.value}% OFF` : `₹${row.value} OFF`}
          size="small"
          sx={{ bgcolor: row.type === 'percent' ? 'rgba(33,150,243,0.12)' : 'rgba(156,39,176,0.12)', color: row.type === 'percent' ? '#2196F3' : '#9C27B0', fontWeight: 700, fontSize: 11 }}
        />
      ),
    },
    {
      field: 'min_order', headerName: 'Min Order', width: 110, align: 'right',
      renderCell: ({ value }) => <Typography sx={{ fontSize: 13 }}>₹{value || 0}</Typography>,
    },
    {
      field: 'max_discount', headerName: 'Max Discount', width: 130, align: 'right',
      renderCell: ({ value }) => <Typography sx={{ fontSize: 13 }}>₹{value}</Typography>,
    },
    {
      field: 'usage', headerName: 'Used / Limit', width: 130,
      renderCell: ({ row }) => (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.usage} {row.limit > 0 ? `/ ${row.limit}` : '/ ∞'}</Typography>
          {row.limit > 0 && (
            <Box sx={{ height: 3, bgcolor: '#1E1E1E', borderRadius: 2, mt: 0.5 }}>
              <Box sx={{ width: `${Math.min((row.usage / row.limit) * 100, 100)}%`, height: '100%', bgcolor: '#F5C518', borderRadius: 2 }} />
            </Box>
          )}
        </Box>
      ),
    },
    {
      field: 'revenue', headerName: 'Revenue Attributed', width: 160, align: 'right',
      renderCell: ({ value }) => <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: 13 }}>₹{value.toLocaleString()}</Typography>,
    },
    { field: 'applicable', headerName: 'Applicable To', width: 160 },
    { field: 'expires', headerName: 'Expires', width: 120 },
    {
      field: 'status', headerName: 'Status', width: 110,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => handleToggle(row.id)} sx={{ color: row.status === 'active' ? '#4CAF50' : '#555', p: 0.5 }}>
            {row.status === 'active' ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
          </IconButton>
          <Chip
            label={row.status === 'active' ? 'Active' : 'Off'}
            size="small"
            sx={{ bgcolor: row.status === 'active' ? 'rgba(76,175,80,0.12)' : '#1E1E1E', color: row.status === 'active' ? '#4CAF50' : '#555', fontWeight: 700, fontSize: 11 }}
          />
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Active Coupons', value: String(coupons.filter((c) => c.status === 'active').length), trend: 'up', trendValue: '+2 this week', icon: Tag, color: '#F5C518' },
          { title: 'Total Usage', value: coupons.reduce((a, c) => a + c.usage, 0).toLocaleString(), trend: 'up', trendValue: '+340 today', icon: Tag, color: '#4CAF50' },
          { title: 'Revenue Attributed', value: `₹${(coupons.reduce((a, c) => a + c.revenue, 0) / 100000).toFixed(1)}L`, trend: 'up', trendValue: '+12%', icon: Tag, color: '#2196F3' },
          { title: 'Avg Discount Issued', value: '₹186', trend: 'down', trendValue: '-2.4%', icon: Tag, color: '#9C27B0' },
        ].map((k) => <Grid item xs={12} sm={6} lg={3} key={k.title}><KPICard {...k} /></Grid>)}
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #2A2A2A', px: 2 }}>
          <Tab label="Coupon List" />
          <Tab label="Performance" />
        </Tabs>
        <Box sx={{ p: tab === 0 ? 0 : 2.5 }}>
          {tab === 0 && (
            <DataTable
              title="All Coupons"
              rows={filtered}
              columns={columns}
              rowCount={filtered.length}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search coupon code..."
              getRowId={(r) => r.id}
              onExport={() => toast.success('Exporting coupons...')}
              height={500}
              actions={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" startIcon={<Copy size={14} />} onClick={() => setBulkOpen(true)} sx={{ height: 36, borderColor: '#2A2A2A', color: '#888', '&:hover': { borderColor: '#F5C518', color: '#F5C518' }, fontSize: 12 }}>
                    Bulk Create
                  </Button>
                  <Button variant="contained" size="small" startIcon={<Plus size={14} />} onClick={() => setCreateOpen(true)} sx={{ height: 36, fontSize: 12 }}>
                    New Coupon
                  </Button>
                </Box>
              }
            />
          )}
          {tab === 1 && (
            <BarChartCard
              title="Coupon Performance — Usage & Revenue (₹k)"
              data={couponPerformance}
              bars={[{ key: 'usage', name: 'Usage Count' }, { key: 'revenue', name: 'Revenue (₹k)' }]}
              height={360}
            />
          )}
        </Box>
      </Card>

      {/* Create Coupon Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1A1A1A', border: '1px solid #2A2A2A' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Coupon</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <TextField label="Coupon Code *" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} fullWidth inputProps={{ style: { fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 } }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Discount Type</InputLabel>
                <Select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} label="Discount Type">
                  <MenuItem value="percent">Percentage</MenuItem>
                  <MenuItem value="flat">Flat Amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField label={form.type === 'percent' ? 'Discount %' : 'Discount ₹'} type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} fullWidth />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Min Order (₹)" type="number" value={form.min_order} onChange={(e) => setForm((p) => ({ ...p, min_order: e.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Max Discount (₹)" type="number" value={form.max_discount} onChange={(e) => setForm((p) => ({ ...p, max_discount: e.target.value }))} fullWidth />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Usage Limit (0 = unlimited)" type="number" value={form.limit} onChange={(e) => setForm((p) => ({ ...p, limit: e.target.value }))} fullWidth />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Expiry Date" type="date" value={form.expires} onChange={(e) => setForm((p) => ({ ...p, expires: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
          <FormControl fullWidth>
            <InputLabel>Applicable To</InputLabel>
            <Select value={form.applicable} onChange={(e) => setForm((p) => ({ ...p, applicable: e.target.value }))} label="Applicable To">
              {SERVICES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Internal Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: '#888' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ fontWeight: 700 }}>Create Coupon</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#1A1A1A', border: '1px solid #2A2A2A' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Bulk Create Coupons</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <TextField label="Code Prefix" value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())} fullWidth helperText={`Codes will be: ${bulkPrefix}1000, ${bulkPrefix}1001, ...`} />
          <TextField label="Number of Coupons" type="number" value={bulkCount} onChange={(e) => setBulkCount(Number(e.target.value))} fullWidth inputProps={{ min: 1, max: 1000 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setBulkOpen(false)} sx={{ color: '#888' }}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkCreate} sx={{ fontWeight: 700 }}>Generate {bulkCount} Coupons</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
