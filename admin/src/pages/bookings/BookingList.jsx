import React, { useState } from 'react';
import {
  Box, Chip, Typography, Select, MenuItem, FormControl, InputLabel,
  Drawer, Grid, Card, Divider, IconButton, Button,
} from '@mui/material';
import { X, MapPin, Phone, Calendar, CreditCard, Car } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import toast from 'react-hot-toast';

const SERVICES = ['Oil Change', 'AC Service', 'Tyre Rotation', 'Brake Inspection', 'Full Detailing', 'Battery Replace', 'Windshield Repair', 'Engine Tune-up'];
const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Chennai', 'Delhi', 'Pune'];
const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const mockBookings = Array.from({ length: 120 }, (_, i) => ({
  id: `BK${String(1000 + i).padStart(6, '0')}`,
  customer: ['Rahul Sharma', 'Priya Nair', 'Arun Kumar', 'Sneha Reddy', 'Vikram Joshi', 'Ananya Singh'][i % 6],
  customer_phone: `+91 98${String(10000000 + i).slice(-8)}`,
  franchise: ['AutoCareX Banjara Hills', 'AutoCareX Koramangala', 'AutoCareX Andheri'][i % 3],
  service: SERVICES[i % SERVICES.length],
  city: CITIES[i % CITIES.length],
  amount: Math.floor(600 + Math.random() * 5000),
  status: STATUSES[i % STATUSES.length],
  date: new Date(2024, 4, 23 - (i % 30)).toLocaleDateString('en-IN'),
  time: `${String(9 + (i % 10)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'} AM`,
  vehicle: ['Honda City', 'Maruti Swift', 'Hyundai Creta', 'Toyota Fortuner'][i % 4],
  payment: i % 3 === 0 ? 'Cash' : i % 3 === 1 ? 'UPI' : 'Card',
  address: `${i + 1}, Main Road, ${CITIES[i % CITIES.length]}`,
}));

const statusColors = {
  pending: { color: '#9E9E9E', bg: 'rgba(158,158,158,0.12)', label: 'Pending' },
  confirmed: { color: '#2196F3', bg: 'rgba(33,150,243,0.12)', label: 'Confirmed' },
  in_progress: { color: '#FF9800', bg: 'rgba(255,152,0,0.12)', label: 'In Progress' },
  completed: { color: '#4CAF50', bg: 'rgba(76,175,80,0.12)', label: 'Completed' },
  cancelled: { color: '#F44336', bg: 'rgba(244,67,54,0.12)', label: 'Cancelled' },
};

export default function BookingList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [drawerBooking, setDrawerBooking] = useState(null);

  const filtered = mockBookings.filter((b) => {
    const matchSearch = !search || b.id.includes(search) || b.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchCity = cityFilter === 'all' || b.city === cityFilter;
    const matchService = serviceFilter === 'all' || b.service === serviceFilter;
    return matchSearch && matchStatus && matchCity && matchService;
  });

  const columns = [
    {
      field: 'id', headerName: 'Booking ID', width: 130,
      renderCell: ({ value }) => <Typography sx={{ color: '#F5C518', fontWeight: 600, fontSize: 12 }}>{value}</Typography>,
    },
    { field: 'customer', headerName: 'Customer', width: 160 },
    { field: 'service', headerName: 'Service', width: 160 },
    { field: 'franchise', headerName: 'Franchise', flex: 1, minWidth: 180 },
    { field: 'city', headerName: 'City', width: 120 },
    {
      field: 'amount', headerName: 'Amount', width: 120, align: 'right',
      renderCell: ({ value }) => <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: 13 }}>₹{value.toLocaleString()}</Typography>,
    },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: ({ value }) => {
        const s = statusColors[value] || statusColors.pending;
        return <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11 }} />;
      },
    },
    { field: 'date', headerName: 'Date', width: 120 },
    { field: 'time', headerName: 'Time', width: 100 },
    { field: 'payment', headerName: 'Payment', width: 100 },
  ];

  return (
    <Box>
      <DataTable
        title="All Bookings"
        rows={filtered}
        columns={columns}
        rowCount={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ID or customer..."
        getRowId={(r) => r.id}
        onRowClick={({ row }) => setDrawerBooking(row)}
        paginationModel={{ page, pageSize: 25 }}
        onPaginationModelChange={(m) => setPage(m.page)}
        onExport={() => toast.success('Exporting bookings...')}
        height={580}
        toolbar={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: [{ v: 'all', l: 'All Status' }, ...STATUSES.map((s) => ({ v: s, l: statusColors[s].label }))] },
              { label: 'City', value: cityFilter, onChange: setCityFilter, options: [{ v: 'all', l: 'All Cities' }, ...CITIES.map((c) => ({ v: c, l: c }))] },
              { label: 'Service', value: serviceFilter, onChange: setServiceFilter, options: [{ v: 'all', l: 'All Services' }, ...SERVICES.map((s) => ({ v: s, l: s }))] },
            ].map(({ label, value, onChange, options }) => (
              <FormControl key={label} size="small" sx={{ minWidth: 130 }}>
                <InputLabel sx={{ fontSize: 13 }}>{label}</InputLabel>
                <Select value={value} onChange={(e) => onChange(e.target.value)} label={label} sx={{ fontSize: 13, height: 36 }}>
                  {options.map(({ v, l }) => <MenuItem key={v} value={v} sx={{ fontSize: 13 }}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            ))}
          </Box>
        }
      />

      {/* Booking Detail Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(drawerBooking)}
        onClose={() => setDrawerBooking(null)}
        PaperProps={{ sx: { width: 400, bgcolor: '#1A1A1A', borderLeft: '1px solid #2A2A2A' } }}
      >
        {drawerBooking && (
          <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{drawerBooking.id}</Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>{drawerBooking.date} at {drawerBooking.time}</Typography>
              </Box>
              <IconButton onClick={() => setDrawerBooking(null)} sx={{ color: '#666' }}>
                <X size={18} />
              </IconButton>
            </Box>

            <Chip
              label={statusColors[drawerBooking.status]?.label}
              sx={{
                alignSelf: 'flex-start', mb: 3, fontWeight: 700,
                bgcolor: statusColors[drawerBooking.status]?.bg,
                color: statusColors[drawerBooking.status]?.color,
              }}
            />

            {[
              { icon: Phone, label: 'Customer', value: `${drawerBooking.customer} — ${drawerBooking.customer_phone}` },
              { icon: Car, label: 'Vehicle', value: drawerBooking.vehicle },
              { icon: Calendar, label: 'Service', value: drawerBooking.service },
              { icon: MapPin, label: 'Location', value: drawerBooking.franchise + ', ' + drawerBooking.city },
              { icon: MapPin, label: 'Address', value: drawerBooking.address },
              { icon: CreditCard, label: 'Payment', value: `${drawerBooking.payment} — ₹${drawerBooking.amount.toLocaleString()}` },
            ].map(({ icon: Icon, label, value }) => (
              <Box key={label} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Icon size={14} color="#666" />
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10 }}>{label}</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#DDD', fontSize: 13, pl: 2.5 }}>{value}</Typography>
              </Box>
            ))}

            <Divider sx={{ borderColor: '#2A2A2A', my: 2 }} />

            <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
              <Button variant="outlined" fullWidth sx={{ borderColor: '#2A2A2A', color: '#888', '&:hover': { borderColor: '#F5C518', color: '#F5C518' } }}>
                View Customer
              </Button>
              <Button variant="outlined" fullWidth sx={{ borderColor: '#2A2A2A', color: '#888', '&:hover': { borderColor: '#F5C518', color: '#F5C518' } }}>
                View Franchise
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
