import React, { useState } from 'react';
import { Box, Grid, Card, Typography, Chip, Avatar, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import { DollarSign, Calendar, Users, Store, CreditCard, AlertCircle, TrendingUp, MapPin } from 'lucide-react';
import KPICard from '../../components/charts/KPICard';
import { LineChartCard, BarChartCard, PieChartCard } from '../../components/charts/RevenueChart';

// --- Mock data ---
const revenueData = [
  { name: 'Jun', revenue: 820000, target: 750000 },
  { name: 'Jul', revenue: 940000, target: 850000 },
  { name: 'Aug', revenue: 1050000, target: 950000 },
  { name: 'Sep', revenue: 980000, target: 1000000 },
  { name: 'Oct', revenue: 1120000, target: 1050000 },
  { name: 'Nov', revenue: 1300000, target: 1100000 },
  { name: 'Dec', revenue: 1560000, target: 1200000 },
  { name: 'Jan', revenue: 1420000, target: 1300000 },
  { name: 'Feb', revenue: 1650000, target: 1400000 },
  { name: 'Mar', revenue: 1780000, target: 1500000 },
  { name: 'Apr', revenue: 1920000, target: 1600000 },
  { name: 'May', revenue: 2150000, target: 1750000 },
];

const bookingsByService = [
  { name: 'Oil Change', bookings: 3420 },
  { name: 'Tyres', bookings: 2890 },
  { name: 'Brakes', bookings: 2100 },
  { name: 'AC Service', bookings: 1850 },
  { name: 'Detailing', bookings: 1620 },
  { name: 'Inspection', bookings: 1340 },
  { name: 'Battery', bookings: 980 },
];

const serviceMix = [
  { name: 'Service & Repair', value: 38 },
  { name: 'Tyre & Wheel', value: 22 },
  { name: 'Marketplace', value: 18 },
  { name: 'Insurance', value: 12 },
  { name: 'Detailing', value: 10 },
];

const subscriptionGrowth = [
  { name: 'Jun', basic: 1200, pro: 680, elite: 290 },
  { name: 'Jul', basic: 1350, pro: 760, elite: 320 },
  { name: 'Aug', basic: 1500, pro: 840, elite: 380 },
  { name: 'Sep', basic: 1620, pro: 910, elite: 430 },
  { name: 'Oct', basic: 1800, pro: 1020, elite: 510 },
  { name: 'Nov', basic: 2050, pro: 1180, elite: 590 },
  { name: 'Dec', basic: 2300, pro: 1340, elite: 680 },
  { name: 'Jan', basic: 2480, pro: 1450, elite: 760 },
  { name: 'Feb', basic: 2700, pro: 1600, elite: 870 },
  { name: 'Mar', basic: 2950, pro: 1780, elite: 980 },
  { name: 'Apr', basic: 3200, pro: 1960, elite: 1100 },
  { name: 'May', basic: 3480, pro: 2150, elite: 1240 },
];

const topFranchises = [
  { rank: 1, name: 'AutoCareX Banjara Hills', city: 'Hyderabad', rating: 4.9, earnings: 580000, bookings: 842, status: 'active' },
  { rank: 2, name: 'AutoCareX Koramangala', city: 'Bengaluru', rating: 4.8, earnings: 520000, bookings: 794, status: 'active' },
  { rank: 3, name: 'AutoCareX Andheri', city: 'Mumbai', rating: 4.8, earnings: 490000, bookings: 756, status: 'active' },
  { rank: 4, name: 'AutoCareX T Nagar', city: 'Chennai', rating: 4.7, earnings: 445000, bookings: 692, status: 'active' },
  { rank: 5, name: 'AutoCareX Connaught Place', city: 'Delhi', rating: 4.7, earnings: 420000, bookings: 670, status: 'active' },
  { rank: 6, name: 'AutoCareX Aundh', city: 'Pune', rating: 4.6, earnings: 385000, bookings: 624, status: 'active' },
  { rank: 7, name: 'AutoCareX Whitefield', city: 'Bengaluru', rating: 4.6, earnings: 360000, bookings: 598, status: 'active' },
  { rank: 8, name: 'AutoCareX Jubilee Hills', city: 'Hyderabad', rating: 4.5, earnings: 340000, bookings: 572, status: 'active' },
];

const recentBookings = [
  { id: 'BK001234', customer: 'Rahul Sharma', service: 'AC Service', city: 'Hyderabad', amount: 2800, status: 'completed', time: '2m ago' },
  { id: 'BK001233', customer: 'Priya Nair', service: 'Oil Change', city: 'Mumbai', amount: 1200, status: 'in_progress', time: '8m ago' },
  { id: 'BK001232', customer: 'Arun Kumar', service: 'Tyre Rotation', city: 'Bengaluru', amount: 800, status: 'confirmed', time: '15m ago' },
  { id: 'BK001231', customer: 'Sneha Reddy', service: 'Full Detailing', city: 'Chennai', amount: 4500, status: 'completed', time: '22m ago' },
  { id: 'BK001230', customer: 'Vikram Joshi', service: 'Brake Inspection', city: 'Pune', amount: 650, status: 'pending', time: '35m ago' },
  { id: 'BK001229', customer: 'Ananya Singh', service: 'Windshield Repair', city: 'Delhi', amount: 3200, status: 'completed', time: '48m ago' },
  { id: 'BK001228', customer: 'Karthik Rao', service: 'Battery Replace', city: 'Hyderabad', amount: 5600, status: 'in_progress', time: '1h ago' },
  { id: 'BK001227', customer: 'Meera Pillai', service: 'AC Gas Refill', city: 'Bengaluru', amount: 2200, status: 'completed', time: '1h ago' },
];

const statusColors = {
  completed: { color: '#4CAF50', bg: 'rgba(76,175,80,0.12)', label: 'Completed' },
  in_progress: { color: '#2196F3', bg: 'rgba(33,150,243,0.12)', label: 'In Progress' },
  confirmed: { color: '#FF9800', bg: 'rgba(255,152,0,0.12)', label: 'Confirmed' },
  pending: { color: '#9E9E9E', bg: 'rgba(158,158,158,0.12)', label: 'Pending' },
  cancelled: { color: '#F44336', bg: 'rgba(244,67,54,0.12)', label: 'Cancelled' },
};

const kpis = [
  { title: 'Total Revenue (MTD)', value: '₹2.15Cr', trend: 'up', trendValue: '+12.4% MoM', icon: DollarSign, color: '#F5C518', subtitle: 'vs ₹1.91Cr last month' },
  { title: 'Active Bookings', value: '1,284', trend: 'up', trendValue: '+8.2%', icon: Calendar, color: '#4CAF50', subtitle: '342 in progress right now' },
  { title: 'Total Customers', value: '84,320', trend: 'up', trendValue: '+5.6%', icon: Users, color: '#2196F3', subtitle: '2,140 new this month' },
  { title: 'Active Franchises', value: '127', trend: 'up', trendValue: '+3 new', icon: Store, color: '#FF6B35', subtitle: 'Across 18 cities' },
  { title: 'Active Subscriptions', value: '6,870', trend: 'up', trendValue: '+9.1%', icon: CreditCard, color: '#9C27B0', subtitle: 'MRR ₹41.2L' },
  { title: 'Pending KYC', value: '14', trend: 'down', trendValue: '-6 this week', icon: AlertCircle, color: '#FF9800', subtitle: '9 franchise, 5 driver' },
];

export default function Dashboard() {
  const [revPeriod, setRevPeriod] = useState('monthly');
  const [subPeriod, setSubPeriod] = useState('monthly');

  return (
    <Box>
      {/* KPI Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={kpi.title}>
            <KPICard {...kpi} />
          </Grid>
        ))}
      </Grid>

      {/* Row 2: Revenue + Service Mix */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} lg={8}>
          <LineChartCard
            title="Revenue Trend"
            data={revenueData}
            lines={[
              { key: 'revenue', name: 'Actual Revenue' },
              { key: 'target', name: 'Target' },
            ]}
            period={revPeriod}
            onPeriodChange={setRevPeriod}
            periods={[
              { value: 'daily', label: '7D' },
              { value: 'weekly', label: '4W' },
              { value: 'monthly', label: '12M' },
            ]}
            prefix="₹"
            height={300}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <PieChartCard title="Service Mix" data={serviceMix} height={300} />
        </Grid>
      </Grid>

      {/* Row 3: Bookings by category + Subscription growth */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={6}>
          <BarChartCard
            title="Bookings by Service Category"
            data={bookingsByService}
            bars={[{ key: 'bookings', name: 'Bookings' }]}
            height={280}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <LineChartCard
            title="Subscription Growth"
            data={subscriptionGrowth}
            lines={[
              { key: 'basic', name: 'Basic' },
              { key: 'pro', name: 'Pro' },
              { key: 'elite', name: 'Elite' },
            ]}
            period={subPeriod}
            onPeriodChange={setSubPeriod}
            periods={[
              { value: 'monthly', label: '12M' },
              { value: 'quarterly', label: 'Qtly' },
            ]}
            height={280}
          />
        </Grid>
      </Grid>

      {/* Row 4: Franchise performance + Recent bookings */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp size={18} color="#F5C518" />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 15 }}>Top Performing Franchises</Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderColor: '#2A2A2A', color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, whiteSpace: 'nowrap' } }}>
                    <TableCell>#</TableCell>
                    <TableCell>Franchise</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell align="right">Rating</TableCell>
                    <TableCell align="right">Earnings</TableCell>
                    <TableCell align="right">Bookings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topFranchises.map((f) => (
                    <TableRow key={f.rank} sx={{ '& td': { borderColor: '#1E1E1E', py: 1.5, fontSize: 13 }, '&:hover': { bgcolor: 'rgba(245,197,24,0.04)' } }}>
                      <TableCell>
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: f.rank <= 3 ? 'rgba(245,197,24,0.15)' : '#1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: f.rank <= 3 ? '#F5C518' : '#666', fontSize: 11 }}>{f.rank}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#DDD', fontWeight: 500, maxWidth: 160 }}>
                        <Typography noWrap sx={{ fontSize: 13 }}>{f.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MapPin size={12} color="#666" />
                          <Typography sx={{ fontSize: 12, color: '#888' }}>{f.city}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ color: '#F5C518', fontWeight: 700, fontSize: 13 }}>★ {f.rating}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: 13 }}>₹{(f.earnings / 1000).toFixed(0)}k</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{f.bookings}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={18} color="#F5C518" />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 15 }}>Recent Bookings</Typography>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderColor: '#2A2A2A', color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 } }}>
                    <TableCell>ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentBookings.map((b) => {
                    const s = statusColors[b.status] || statusColors.pending;
                    return (
                      <TableRow key={b.id} sx={{ '& td': { borderColor: '#1E1E1E', py: 1.5, fontSize: 13 }, '&:hover': { bgcolor: 'rgba(245,197,24,0.04)' } }}>
                        <TableCell sx={{ color: '#F5C518', fontWeight: 600, fontSize: 12 }}>{b.id}</TableCell>
                        <TableCell sx={{ color: '#DDD', fontSize: 13 }}>{b.customer}</TableCell>
                        <TableCell sx={{ color: '#888', fontSize: 12 }}>{b.service}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{b.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={s.label}
                            size="small"
                            sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11, height: 22, border: `1px solid ${s.color}30` }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
