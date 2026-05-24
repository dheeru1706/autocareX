import React, { useState } from 'react';
import { Box, Grid, Card, Typography, Tab, Tabs, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { LineChartCard, BarChartCard, PieChartCard } from '../../components/charts/RevenueChart';
import KPICard from '../../components/charts/KPICard';
import { DollarSign, TrendingUp, Users, RefreshCw } from 'lucide-react';

const revenueDaily = [
  { name: 'Mon', revenue: 84000 }, { name: 'Tue', revenue: 92000 }, { name: 'Wed', revenue: 78000 },
  { name: 'Thu', revenue: 105000 }, { name: 'Fri', revenue: 118000 }, { name: 'Sat', revenue: 142000 }, { name: 'Sun', revenue: 98000 },
];

const revenueMonthly = [
  { name: 'Jan', revenue: 1420000, target: 1300000 },
  { name: 'Feb', revenue: 1650000, target: 1400000 },
  { name: 'Mar', revenue: 1780000, target: 1500000 },
  { name: 'Apr', revenue: 1920000, target: 1600000 },
  { name: 'May', revenue: 2150000, target: 1750000 },
];

const cityPerformance = [
  { name: 'Hyderabad', revenue: 520000, bookings: 1840 },
  { name: 'Bengaluru', revenue: 490000, bookings: 1720 },
  { name: 'Mumbai', revenue: 460000, bookings: 1640 },
  { name: 'Chennai', revenue: 380000, bookings: 1380 },
  { name: 'Delhi', revenue: 340000, bookings: 1210 },
  { name: 'Pune', revenue: 290000, bookings: 1040 },
];

const serviceMix = [
  { name: 'Service & Repair', value: 38 },
  { name: 'Tyre & Wheel', value: 22 },
  { name: 'Marketplace', value: 18 },
  { name: 'Insurance', value: 12 },
  { name: 'Detailing', value: 10 },
];

const cohortData = [
  { name: 'Jan Cohort', m1: 100, m2: 72, m3: 61, m4: 54, m5: 48 },
  { name: 'Feb Cohort', m1: 100, m2: 75, m3: 64, m4: 57 },
  { name: 'Mar Cohort', m1: 100, m2: 78, m3: 67 },
  { name: 'Apr Cohort', m1: 100, m2: 81 },
  { name: 'May Cohort', m1: 100 },
];

const abvTrend = [
  { name: 'Jan', abv: 1820 }, { name: 'Feb', abv: 1940 }, { name: 'Mar', abv: 2010 },
  { name: 'Apr', abv: 1970 }, { name: 'May', abv: 2150 },
];

const subscriptionMetrics = [
  { name: 'Jan', mrr: 28400, churn: 3.2 }, { name: 'Feb', mrr: 31200, churn: 2.8 },
  { name: 'Mar', mrr: 34800, churn: 2.4 }, { name: 'Apr', mrr: 37600, churn: 2.1 },
  { name: 'May', mrr: 41200, churn: 1.8 },
];

const kpis = [
  { title: 'Total Revenue (MTD)', value: '₹2.15Cr', trend: 'up', trendValue: '+12.4%', icon: DollarSign, color: '#F5C518' },
  { title: 'Avg Booking Value', value: '₹2,150', trend: 'up', trendValue: '+5.8%', icon: TrendingUp, color: '#4CAF50' },
  { title: 'New Customers (MTD)', value: '2,140', trend: 'up', trendValue: '+8.2%', icon: Users, color: '#2196F3' },
  { title: 'Churn Rate', value: '1.8%', trend: 'up', trendValue: '-0.3% MoM', icon: RefreshCw, color: '#9C27B0' },
];

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('monthly');
  const [tab, setTab] = useState(0);
  const [startDate, setStartDate] = useState(dayjs().subtract(3, 'month'));
  const [endDate, setEndDate] = useState(dayjs());

  const revenueData = period === 'daily' ? revenueDaily : revenueMonthly;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Date Range + Period */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <ToggleButtonGroup value={period} exclusive onChange={(_, v) => v && setPeriod(v)} size="small">
            {PERIODS.map((p) => (
              <ToggleButton
                key={p.value} value={p.value}
                sx={{
                  fontSize: 12, fontWeight: 600, px: 2, py: 0.75, color: '#666',
                  border: '1px solid #2A2A2A',
                  '&.Mui-selected': { color: '#F5C518', bgcolor: 'rgba(245,197,24,0.1)', borderColor: '#F5C518' },
                }}
              >
                {p.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <DatePicker
            label="From"
            value={startDate}
            onChange={setStartDate}
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />
          <DatePicker
            label="To"
            value={endDate}
            onChange={setEndDate}
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />
        </Box>

        {/* KPIs */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {kpis.map((k) => (
            <Grid item xs={12} sm={6} lg={3} key={k.title}>
              <KPICard {...k} />
            </Grid>
          ))}
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #2A2A2A', px: 2 }}>
            <Tab label="Revenue" />
            <Tab label="City Performance" />
            <Tab label="Cohort Retention" />
            <Tab label="Subscriptions" />
          </Tabs>
          <Box sx={{ p: 2.5 }}>
            {tab === 0 && (
              <Grid container spacing={2.5}>
                <Grid item xs={12} lg={8}>
                  <LineChartCard
                    title="Revenue vs Target"
                    data={revenueData}
                    lines={[{ key: 'revenue', name: 'Revenue' }, { key: 'target', name: 'Target' }]}
                    prefix="₹"
                    height={320}
                  />
                </Grid>
                <Grid item xs={12} lg={4}>
                  <PieChartCard title="Service Mix" data={serviceMix} height={320} />
                </Grid>
                <Grid item xs={12}>
                  <LineChartCard
                    title="Average Booking Value Trend"
                    data={abvTrend}
                    lines={[{ key: 'abv', name: 'Avg Booking Value' }]}
                    prefix="₹"
                    height={260}
                  />
                </Grid>
              </Grid>
            )}

            {tab === 1 && (
              <BarChartCard
                title="City-wise Revenue & Bookings"
                data={cityPerformance}
                bars={[{ key: 'revenue', name: 'Revenue' }, { key: 'bookings', name: 'Bookings' }]}
                prefix="₹"
                height={360}
              />
            )}

            {tab === 2 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#888' }}>Customer Cohort Retention (%)</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['Cohort', 'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5'].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #2A2A2A' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cohortData.map((row) => (
                        <tr key={row.name} style={{ borderBottom: '1px solid #1E1E1E' }}>
                          <td style={{ padding: '12px 16px', color: '#CCC', fontWeight: 600 }}>{row.name}</td>
                          {[row.m1, row.m2, row.m3, row.m4, row.m5].map((v, i) =>
                            v !== undefined ? (
                              <td key={i} style={{ padding: '12px 16px' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#1E1E1E', overflow: 'hidden' }}>
                                    <Box sx={{ width: `${v}%`, height: '100%', bgcolor: v >= 70 ? '#4CAF50' : v >= 50 ? '#FF9800' : '#F44336', borderRadius: 3 }} />
                                  </Box>
                                  <Typography sx={{ color: v >= 70 ? '#4CAF50' : v >= 50 ? '#FF9800' : '#F44336', fontWeight: 700, fontSize: 12, minWidth: 36 }}>{v}%</Typography>
                                </Box>
                              </td>
                            ) : <td key={i} style={{ padding: '12px 16px', color: '#333' }}>—</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            )}

            {tab === 3 && (
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={7}>
                  <LineChartCard
                    title="Monthly Recurring Revenue (MRR)"
                    data={subscriptionMetrics}
                    lines={[{ key: 'mrr', name: 'MRR' }]}
                    prefix="₹"
                    height={300}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <LineChartCard
                    title="Churn Rate (%)"
                    data={subscriptionMetrics}
                    lines={[{ key: 'churn', name: 'Churn %' }]}
                    suffix="%"
                    height={300}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ p: 2.5 }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>MRR (May)</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#F5C518', mt: 0.5 }}>₹41.2L</Typography>
                    <Typography variant="caption" sx={{ color: '#4CAF50' }}>+9.6% MoM</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ p: 2.5 }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>Active Subscribers</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#2196F3', mt: 0.5 }}>6,870</Typography>
                    <Typography variant="caption" sx={{ color: '#4CAF50' }}>+580 this month</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ p: 2.5 }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>Churn Rate</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#9C27B0', mt: 0.5 }}>1.8%</Typography>
                    <Typography variant="caption" sx={{ color: '#4CAF50' }}>-0.3% MoM (improving)</Typography>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Card>
      </Box>
    </LocalizationProvider>
  );
}
