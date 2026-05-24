import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, Table, TableBody, TableCell, TableHead, TableRow, Button, LinearProgress } from '@mui/material';
import { Building2, Car, DollarSign, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import KPICard from '../../components/charts/KPICard';
import { BarChartCard } from '../../components/charts/RevenueChart';

export default function FleetManagement() {
  const { data: fleets } = useQuery({ queryKey: ['fleets'], queryFn: () => adminAPI.get('/admin/fleet').then(r => r.data) });

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Fleet Management</Typography>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Corporate Accounts" value={fleets?.accounts_count ?? '—'} icon={<Building2 />} color="#F5C518" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Fleet Vehicles" value={fleets?.vehicles_count ?? '—'} icon={<Car />} color="#2196F3" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="MTD Revenue" value={fleets?.mtd_revenue ? `₹${fleets.mtd_revenue.toLocaleString('en-IN')}` : '—'} icon={<DollarSign />} color="#00C853" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Active Bookings" value={fleets?.active_bookings ?? '—'} icon={<Calendar />} color="#FF9800" />
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: '#1A1A1A', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Corporate Accounts</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#9E9E9E' }}>Company</TableCell>
                    <TableCell sx={{ color: '#9E9E9E' }}>Vehicles</TableCell>
                    <TableCell sx={{ color: '#9E9E9E' }}>Credit Limit</TableCell>
                    <TableCell sx={{ color: '#9E9E9E' }}>Outstanding</TableCell>
                    <TableCell sx={{ color: '#9E9E9E' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(fleets?.accounts ?? []).map(acc => (
                    <TableRow key={acc.id}>
                      <TableCell sx={{ color: '#fff' }}>{acc.company_name}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{acc.vehicle_count}</TableCell>
                      <TableCell sx={{ color: '#F5C518' }}>₹{acc.credit_limit?.toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: acc.outstanding_balance > acc.credit_limit * 0.8 ? '#FF4444' : '#fff' }}>
                        ₹{acc.outstanding_balance?.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Chip label={acc.is_active ? 'Active' : 'Inactive'} size="small"
                          sx={{ bgcolor: acc.is_active ? '#00C85320' : '#FF444420', color: acc.is_active ? '#00C853' : '#FF4444' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <BarChartCard title="Monthly Fleet Spend" data={fleets?.monthly_trend ?? []} dataKey="spend" nameKey="month" color="#F5C518" />
        </Grid>
      </Grid>
    </Box>
  );
}
