import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow, Button } from '@mui/material';
import { Shield, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import KPICard from '../../components/charts/KPICard';

export default function InsuranceManagement() {
  const { data: policies } = useQuery({ queryKey: ['insurance'], queryFn: () => adminAPI.get('/admin/insurance').then(r => r.data) });

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Insurance Management</Typography>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Active Policies" value={policies?.active_count ?? '—'} icon={<Shield />} color="#00C853" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Expiring (30 days)" value={policies?.expiring_30 ?? '—'} icon={<AlertTriangle />} color="#FF9800" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Renewed This Month" value={policies?.renewed_mtd ?? '—'} icon={<CheckCircle />} color="#2196F3" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Commission Earned" value={policies?.commission_mtd ? `₹${policies.commission_mtd.toLocaleString('en-IN')}` : '—'} icon={<DollarSign />} color="#F5C518" />
        </Grid>
      </Grid>

      <Card sx={{ bgcolor: '#1A1A1A', borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={600}>Expiring Policies</Typography>
            <Button variant="outlined" size="small" sx={{ borderColor: '#F5C518', color: '#F5C518' }}>Send Reminders</Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9E9E9E' }}>Customer</TableCell>
                <TableCell sx={{ color: '#9E9E9E' }}>Vehicle</TableCell>
                <TableCell sx={{ color: '#9E9E9E' }}>Provider</TableCell>
                <TableCell sx={{ color: '#9E9E9E' }}>Expiry</TableCell>
                <TableCell sx={{ color: '#9E9E9E' }}>Type</TableCell>
                <TableCell sx={{ color: '#9E9E9E' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(policies?.expiring_policies ?? []).map(p => {
                const daysLeft = Math.ceil((new Date(p.expiry_date) - new Date()) / 86400000);
                return (
                  <TableRow key={p.id}>
                    <TableCell sx={{ color: '#fff' }}>{p.user_name}</TableCell>
                    <TableCell sx={{ color: '#9E9E9E' }}>{p.registration_number}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{p.provider_name}</TableCell>
                    <TableCell>
                      <Chip label={`${daysLeft}d left`} size="small"
                        sx={{ bgcolor: daysLeft <= 7 ? '#FF444420' : '#FFB30020', color: daysLeft <= 7 ? '#FF4444' : '#FFB300' }} />
                    </TableCell>
                    <TableCell sx={{ color: '#9E9E9E' }}>{p.type}</TableCell>
                    <TableCell>
                      <Button size="small" sx={{ color: '#F5C518', fontSize: 12 }}>Remind</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
