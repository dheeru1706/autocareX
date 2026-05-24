import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, Typography, Chip, Button, Avatar, Tab, Tabs,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Tooltip,
} from '@mui/material';
import { ArrowLeft, MapPin, Phone, Mail, Star, TrendingUp, FileText, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { BarChartCard, LineChartCard } from '../../components/charts/RevenueChart';
import toast from 'react-hot-toast';

const mockEarningsData = [
  { name: 'Jan', earnings: 48000, commission: 9600 },
  { name: 'Feb', earnings: 52000, commission: 10400 },
  { name: 'Mar', earnings: 61000, commission: 12200 },
  { name: 'Apr', earnings: 58000, commission: 11600 },
  { name: 'May', earnings: 67000, commission: 13400 },
  { name: 'Jun', earnings: 75000, commission: 15000 },
];

const mockStaff = [
  { id: 1, name: 'Ramesh Kumar', role: 'Lead Technician', rating: 4.8, bookings: 124 },
  { id: 2, name: 'Suresh Babu', role: 'Technician', rating: 4.6, bookings: 98 },
  { id: 3, name: 'Anand Rao', role: 'Technician', rating: 4.5, bookings: 87 },
  { id: 4, name: 'Pradeep Verma', role: 'Support Staff', rating: 4.7, bookings: 0 },
];

const mockBookings = [
  { id: 'BK001234', customer: 'Rahul Sharma', service: 'AC Service', amount: 2800, status: 'completed', date: '23 May 2024' },
  { id: 'BK001198', customer: 'Priya Nair', service: 'Oil Change', amount: 1200, status: 'completed', date: '22 May 2024' },
  { id: 'BK001156', customer: 'Vikram Joshi', service: 'Brake Check', amount: 650, status: 'in_progress', date: '22 May 2024' },
];

const kycDocuments = [
  { name: 'GST Certificate', status: 'verified', uploaded: '10 Jan 2024' },
  { name: 'Shop License', status: 'verified', uploaded: '10 Jan 2024' },
  { name: 'Aadhaar Card', status: 'verified', uploaded: '10 Jan 2024' },
  { name: 'Bank Statement', status: 'pending', uploaded: '20 May 2024' },
];

const statusColors = {
  completed: { color: '#4CAF50', bg: 'rgba(76,175,80,0.12)' },
  in_progress: { color: '#2196F3', bg: 'rgba(33,150,243,0.12)' },
  pending: { color: '#FF9800', bg: 'rgba(255,152,0,0.12)' },
};

export default function FranchiseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [kycDialog, setKycDialog] = useState({ open: false, action: '' });
  const [notes, setNotes] = useState('');

  const franchise = {
    id,
    name: 'AutoCareX Banjara Hills',
    partner: 'Ravi Teja Motors Pvt Ltd',
    city: 'Hyderabad',
    territory: 'Banjara Hills & Jubilee Hills',
    phone: '+91 99887 66554',
    email: 'raviteja.motors@autocareX.in',
    kyc_status: 'approved',
    status: 'active',
    rating: 4.9,
    totalEarnings: 580000,
    totalBookings: 842,
    joined: '15 January 2024',
    commission_rate: 20,
    staff_count: 6,
  };

  const handleKycAction = () => {
    toast.success(`KYC ${kycDialog.action === 'approve' ? 'Approved' : 'Rejected'} successfully`);
    setKycDialog({ open: false, action: '' });
  };

  return (
    <Box>
      {/* Back + Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/franchise')} sx={{ color: '#888', border: '1px solid #2A2A2A', borderRadius: '10px' }}>
          <ArrowLeft size={18} />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{franchise.name}</Typography>
          <Typography variant="body2" sx={{ color: '#888' }}>{franchise.partner}</Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Chip
            label={franchise.kyc_status.toUpperCase()}
            sx={{ bgcolor: franchise.kyc_status === 'approved' ? 'rgba(76,175,80,0.12)' : 'rgba(255,152,0,0.12)', color: franchise.kyc_status === 'approved' ? '#4CAF50' : '#FF9800', fontWeight: 700 }}
          />
          <Chip
            label={franchise.status.toUpperCase()}
            sx={{ bgcolor: 'rgba(76,175,80,0.12)', color: '#4CAF50', fontWeight: 700 }}
          />
        </Box>
      </Box>

      {/* Profile + Quick Stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: '#F5C518', color: '#000', fontSize: 22, fontWeight: 700 }}>
                {franchise.partner[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{franchise.partner}</Typography>
                <Typography variant="caption" sx={{ color: '#888' }}>{franchise.id}</Typography>
              </Box>
            </Box>
            {[
              { icon: MapPin, label: franchise.city + ', ' + franchise.territory },
              { icon: Phone, label: franchise.phone },
              { icon: Mail, label: franchise.email },
              { icon: Calendar, label: 'Joined ' + franchise.joined },
            ].map(({ icon: Icon, label }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Icon size={15} color="#666" />
                <Typography variant="body2" sx={{ color: '#CCC', fontSize: 13 }}>{label}</Typography>
              </Box>
            ))}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #2A2A2A' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#666' }}>Commission Rate</Typography>
                <Typography variant="caption" sx={{ color: '#F5C518', fontWeight: 700 }}>{franchise.commission_rate}%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#666' }}>Staff Count</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{franchise.staff_count} members</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<CheckCircle size={14} />} onClick={() => setKycDialog({ open: true, action: 'approve' })} sx={{ flex: 1, borderColor: '#4CAF50', color: '#4CAF50', fontSize: 12 }}>
                Re-approve
              </Button>
              <Button variant="outlined" size="small" startIcon={<XCircle size={14} />} onClick={() => setKycDialog({ open: true, action: 'reject' })} sx={{ flex: 1, borderColor: '#F44336', color: '#F44336', fontSize: 12 }}>
                Suspend
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              { label: 'Total Earnings', value: `₹${(franchise.totalEarnings / 1000).toFixed(0)}k`, color: '#4CAF50' },
              { label: 'Total Bookings', value: franchise.totalBookings, color: '#2196F3' },
              { label: 'Average Rating', value: `★ ${franchise.rating}`, color: '#F5C518' },
              { label: 'Staff Members', value: franchise.staff_count, color: '#9C27B0' },
            ].map((stat) => (
              <Grid item xs={6} key={stat.label}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ color: '#666' }}>{stat.label}</Typography>
                  <Typography variant="h5" sx={{ color: stat.color, fontWeight: 800, mt: 0.5 }}>{stat.value}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #2A2A2A', px: 2 }}>
          <Tab label="Earnings" />
          <Tab label="KYC Documents" />
          <Tab label="Staff" />
          <Tab label="Bookings" />
        </Tabs>

        <Box sx={{ p: 2.5 }}>
          {tab === 0 && (
            <BarChartCard
              title="Monthly Earnings & Commission"
              data={mockEarningsData}
              bars={[{ key: 'earnings', name: 'Gross Earnings' }, { key: 'commission', name: 'Commission (20%)' }]}
              prefix="₹"
              height={300}
            />
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#888' }}>KYC Documents</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderColor: '#2A2A2A', color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' } }}>
                    <TableCell>Document</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {kycDocuments.map((doc) => (
                    <TableRow key={doc.name} sx={{ '& td': { borderColor: '#1E1E1E' } }}>
                      <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileText size={15} color="#666" />
                        <Typography sx={{ fontSize: 13 }}>{doc.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#888', fontSize: 13 }}>{doc.uploaded}</TableCell>
                      <TableCell>
                        <Chip
                          label={doc.status}
                          size="small"
                          sx={{ bgcolor: doc.status === 'verified' ? 'rgba(76,175,80,0.12)' : 'rgba(255,152,0,0.12)', color: doc.status === 'verified' ? '#4CAF50' : '#FF9800', fontWeight: 700, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" sx={{ fontSize: 12, color: '#F5C518' }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {tab === 2 && (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderColor: '#2A2A2A', color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Rating</TableCell>
                  <TableCell align="right">Bookings</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockStaff.map((s) => (
                  <TableRow key={s.id} sx={{ '& td': { borderColor: '#1E1E1E' } }}>
                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 30, height: 30, bgcolor: '#2A2A2A', fontSize: 13 }}>{s.name[0]}</Avatar>
                      <Typography sx={{ fontSize: 13 }}>{s.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#888', fontSize: 13 }}>{s.role}</TableCell>
                    <TableCell align="right" sx={{ color: '#F5C518', fontWeight: 700, fontSize: 13 }}>★ {s.rating}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>{s.bookings}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {tab === 3 && (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderColor: '#2A2A2A', color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' } }}>
                  <TableCell>Booking ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockBookings.map((b) => {
                  const s = statusColors[b.status];
                  return (
                    <TableRow key={b.id} sx={{ '& td': { borderColor: '#1E1E1E' } }}>
                      <TableCell sx={{ color: '#F5C518', fontWeight: 600, fontSize: 12 }}>{b.id}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{b.customer}</TableCell>
                      <TableCell sx={{ color: '#888', fontSize: 13 }}>{b.service}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>₹{b.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={b.status.replace('_', ' ')} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11 }} />
                      </TableCell>
                      <TableCell sx={{ color: '#888', fontSize: 12 }}>{b.date}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      {/* KYC Action Dialog */}
      <Dialog open={kycDialog.open} onClose={() => setKycDialog({ open: false, action: '' })} PaperProps={{ sx: { bgcolor: '#1A1A1A', border: '1px solid #2A2A2A', minWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {kycDialog.action === 'approve' ? 'Re-approve KYC' : 'Suspend Franchise'}
        </DialogTitle>
        <DialogContent>
          <TextField label="Notes" multiline rows={3} fullWidth value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add review notes..." sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setKycDialog({ open: false, action: '' })} sx={{ color: '#888' }}>Cancel</Button>
          <Button variant="contained" onClick={handleKycAction} color={kycDialog.action === 'approve' ? 'success' : 'error'} sx={{ fontWeight: 700 }}>
            {kycDialog.action === 'approve' ? 'Approve' : 'Suspend'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
