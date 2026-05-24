import React, { useState } from 'react';
import { Box, Chip, Typography, Select, MenuItem, FormControl, InputLabel, Avatar } from '@mui/material';
import DataTable from '../../components/tables/DataTable';
import toast from 'react-hot-toast';

const mockCustomers = Array.from({ length: 80 }, (_, i) => ({
  id: `CU${String(i + 1).padStart(5, '0')}`,
  name: ['Rahul Sharma', 'Priya Nair', 'Arun Kumar', 'Sneha Reddy', 'Vikram Joshi', 'Ananya Singh', 'Karthik Rao', 'Meera Pillai'][i % 8],
  phone: `+91 ${9800000000 + i}`,
  email: `user${i + 1}@email.com`,
  city: ['Hyderabad', 'Bengaluru', 'Mumbai', 'Chennai', 'Delhi', 'Pune'][i % 6],
  joined: new Date(2023, i % 12, (i % 28) + 1).toLocaleDateString('en-IN'),
  bookings: Math.floor(1 + Math.random() * 20),
  subscription: ['None', 'Basic', 'Pro', 'Elite'][i % 4],
  wallet_balance: Math.floor(Math.random() * 5000),
  status: i % 10 === 0 ? 'inactive' : 'active',
  vehicles: Math.floor(1 + Math.random() * 3),
}));

const subscriptionColors = {
  None: { color: '#666', bg: '#1E1E1E' },
  Basic: { color: '#2196F3', bg: 'rgba(33,150,243,0.12)' },
  Pro: { color: '#9C27B0', bg: 'rgba(156,39,176,0.12)' },
  Elite: { color: '#F5C518', bg: 'rgba(245,197,24,0.12)' },
};

export default function CustomerList() {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [subFilter, setSubFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  const filtered = mockCustomers.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email.includes(search);
    const matchCity = cityFilter === 'all' || c.city === cityFilter;
    const matchSub = subFilter === 'all' || c.subscription === subFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchCity && matchSub && matchStatus;
  });

  const cities = ['all', ...new Set(mockCustomers.map((c) => c.city))];

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Phone', 'Email', 'City', 'Joined', 'Bookings', 'Subscription', 'Wallet Balance', 'Status'],
      ...filtered.map((c) => [c.id, c.name, c.phone, c.email, c.city, c.joined, c.bookings, c.subscription, c.wallet_balance, c.status]),
    ].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'customers.csv'; a.click();
    toast.success('Customers exported to CSV');
  };

  const columns = [
    {
      field: 'id', headerName: 'ID', width: 110,
      renderCell: ({ value }) => <Typography sx={{ color: '#F5C518', fontWeight: 600, fontSize: 12 }}>{value}</Typography>,
    },
    {
      field: 'name', headerName: 'Customer', flex: 1, minWidth: 180,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#2A2A2A', fontSize: 13, fontWeight: 700 }}>{row.name[0]}</Avatar>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.name}</Typography>
            <Typography sx={{ fontSize: 11, color: '#666' }}>{row.phone}</Typography>
          </Box>
        </Box>
      ),
    },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'joined', headerName: 'Joined', width: 130 },
    {
      field: 'bookings', headerName: 'Bookings', width: 100, align: 'right',
      renderCell: ({ value }) => <Typography sx={{ fontWeight: 600 }}>{value}</Typography>,
    },
    { field: 'vehicles', headerName: 'Vehicles', width: 90, align: 'right' },
    {
      field: 'subscription', headerName: 'Plan', width: 110,
      renderCell: ({ value }) => {
        const c = subscriptionColors[value] || subscriptionColors.None;
        return <Chip label={value} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: 11 }} />;
      },
    },
    {
      field: 'wallet_balance', headerName: 'Wallet', width: 120, align: 'right',
      renderCell: ({ value }) => <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: 13 }}>₹{value.toLocaleString()}</Typography>,
    },
    {
      field: 'status', headerName: 'Status', width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          size="small"
          sx={{
            bgcolor: value === 'active' ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)',
            color: value === 'active' ? '#4CAF50' : '#F44336',
            fontWeight: 700, fontSize: 11,
          }}
        />
      ),
    },
  ];

  return (
    <DataTable
      title="All Customers"
      rows={filtered}
      columns={columns}
      rowCount={filtered.length}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by name, phone, email..."
      getRowId={(r) => r.id}
      paginationModel={{ page, pageSize: 25 }}
      onPaginationModelChange={(m) => setPage(m.page)}
      onExport={handleExport}
      height={580}
      toolbar={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 13 }}>City</InputLabel>
            <Select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} label="City" sx={{ fontSize: 13, height: 36 }}>
              {cities.map((c) => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c === 'all' ? 'All Cities' : c}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 13 }}>Plan</InputLabel>
            <Select value={subFilter} onChange={(e) => setSubFilter(e.target.value)} label="Plan" sx={{ fontSize: 13, height: 36 }}>
              <MenuItem value="all" sx={{ fontSize: 13 }}>All Plans</MenuItem>
              {['None', 'Basic', 'Pro', 'Elite'].map((p) => <MenuItem key={p} value={p} sx={{ fontSize: 13 }}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 13 }}>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status" sx={{ fontSize: 13, height: 36 }}>
              <MenuItem value="all" sx={{ fontSize: 13 }}>All</MenuItem>
              <MenuItem value="active" sx={{ fontSize: 13 }}>Active</MenuItem>
              <MenuItem value="inactive" sx={{ fontSize: 13 }}>Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      }
    />
  );
}
