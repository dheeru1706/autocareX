import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Chip, Tab, Tabs, Switch, FormControlLabel,
  Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import { Bell, Send, Clock, Users, TrendingUp } from 'lucide-react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const TARGET_OPTIONS = [
  { value: 'all', label: 'All Users', count: '84,320' },
  { value: 'city', label: 'By City', count: 'Variable' },
  { value: 'subscription_basic', label: 'Basic Subscribers', count: '3,480' },
  { value: 'subscription_pro', label: 'Pro Subscribers', count: '2,150' },
  { value: 'subscription_elite', label: 'Elite Subscribers', count: '1,240' },
  { value: 'inactive_30', label: 'Inactive 30+ days', count: '12,400' },
  { value: 'no_subscription', label: 'No Subscription', count: '42,100' },
];

const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Chennai', 'Delhi', 'Pune'];

const mockHistory = [
  { id: 1, title: 'Summer AC Special Offer', body: 'Get 20% off on AC service this summer!', target: 'All Users', sent: '20 May 2024', sent_count: 84320, opened: 28960, ctr: 34.3 },
  { id: 2, title: 'Pro Plan Upgrade', body: 'Upgrade to Pro and save ₹1200 annually', target: 'Basic Subscribers', sent: '18 May 2024', sent_count: 3480, opened: 1562, ctr: 44.9 },
  { id: 3, title: 'We Miss You!', body: 'Book a service today and get ₹200 cashback', target: 'Inactive 30+ days', sent: '15 May 2024', sent_count: 12400, opened: 3720, ctr: 30.0 },
  { id: 4, title: 'New City: Ahmedabad', body: 'AutoCareX is now live in Ahmedabad!', target: 'All Users', sent: '10 May 2024', sent_count: 84320, opened: 42160, ctr: 50.0 },
  { id: 5, title: 'Monthly Service Reminder', body: 'Your vehicle is due for its monthly check', target: 'Pro Subscribers', sent: '05 May 2024', sent_count: 2150, opened: 1462, ctr: 68.0 },
];

export default function NotificationCenter() {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    title: '',
    body: '',
    image_url: '',
    target: 'all',
    city: '',
    scheduled: false,
    schedule_time: dayjs().add(1, 'hour'),
    action_url: '',
  });

  const handleChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target?.value ?? e }));

  const handleSend = () => {
    if (!form.title || !form.body) { toast.error('Title and body are required'); return; }
    const target = TARGET_OPTIONS.find((t) => t.value === form.target);
    toast.success(`Notification ${form.scheduled ? 'scheduled' : 'sent'} to ${target?.count} users!`);
    setForm({ title: '', body: '', image_url: '', target: 'all', city: '', scheduled: false, schedule_time: dayjs().add(1, 'hour'), action_url: '' });
  };

  const estimatedReach = TARGET_OPTIONS.find((t) => t.value === form.target)?.count || '—';

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #2A2A2A', px: 2 }}>
          <Tab label="Send Campaign" />
          <Tab label="History & Analytics" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Bell size={18} color="#F5C518" /> Create Push Notification
                  </Typography>

                  <TextField
                    label="Notification Title *"
                    value={form.title}
                    onChange={handleChange('title')}
                    fullWidth
                    inputProps={{ maxLength: 65 }}
                    helperText={`${form.title.length}/65 characters`}
                  />
                  <TextField
                    label="Message Body *"
                    value={form.body}
                    onChange={handleChange('body')}
                    fullWidth
                    multiline
                    rows={3}
                    inputProps={{ maxLength: 200 }}
                    helperText={`${form.body.length}/200 characters`}
                  />
                  <TextField
                    label="Image URL (optional)"
                    value={form.image_url}
                    onChange={handleChange('image_url')}
                    fullWidth
                    placeholder="https://example.com/image.jpg"
                  />
                  <TextField
                    label="Action URL (deep link)"
                    value={form.action_url}
                    onChange={handleChange('action_url')}
                    fullWidth
                    placeholder="autocareX://bookings or https://..."
                  />

                  <FormControl fullWidth>
                    <InputLabel>Target Audience</InputLabel>
                    <Select value={form.target} onChange={handleChange('target')} label="Target Audience">
                      {TARGET_OPTIONS.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{t.label}</span>
                            <Typography variant="caption" sx={{ color: '#666' }}>{t.count}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {form.target === 'city' && (
                    <FormControl fullWidth>
                      <InputLabel>Select City</InputLabel>
                      <Select value={form.city} onChange={handleChange('city')} label="Select City">
                        {CITIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}

                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.scheduled}
                        onChange={(e) => setForm((p) => ({ ...p, scheduled: e.target.checked }))}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#F5C518' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#F5C518' } }}
                      />
                    }
                    label={<Typography variant="body2">Schedule for later</Typography>}
                  />

                  {form.scheduled && (
                    <DateTimePicker
                      label="Schedule Date & Time"
                      value={form.schedule_time}
                      onChange={(v) => setForm((p) => ({ ...p, schedule_time: v }))}
                      minDateTime={dayjs()}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  )}

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={form.scheduled ? <Clock size={18} /> : <Send size={18} />}
                    onClick={handleSend}
                    sx={{ alignSelf: 'flex-start', px: 4 }}
                  >
                    {form.scheduled ? 'Schedule Notification' : 'Send Now'}
                  </Button>
                </Box>
              </Grid>

              {/* Preview */}
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 2.5, border: '1px solid #333', bgcolor: '#111', position: 'sticky', top: 24 }}>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 2 }}>
                    Live Preview
                  </Typography>
                  <Box sx={{ bgcolor: '#0D0D0D', borderRadius: 3, p: 2, border: '1px solid #2A2A2A' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: '#F5C518', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={14} color="#000" />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>AutoCareX • now</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#FFF', mb: 0.5, fontSize: 14 }}>
                      {form.title || 'Notification Title'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888', fontSize: 12 }}>
                      {form.body || 'Your notification message will appear here...'}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#666' }}>Estimated Reach</Typography>
                      <Typography variant="caption" sx={{ color: '#F5C518', fontWeight: 700 }}>{estimatedReach}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#666' }}>Target</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{TARGET_OPTIONS.find((t) => t.value === form.target)?.label}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#666' }}>Delivery</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{form.scheduled ? `Scheduled: ${form.schedule_time?.format('DD MMM, HH:mm')}` : 'Immediate'}</Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <Box>
              {/* Summary stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: 'Total Campaigns', value: '48', color: '#F5C518' },
                  { label: 'Total Sent', value: '2.4M', color: '#2196F3' },
                  { label: 'Avg Open Rate', value: '38.2%', color: '#4CAF50' },
                  { label: 'Avg CTR', value: '12.8%', color: '#9C27B0' },
                ].map((s) => (
                  <Grid item xs={6} md={3} key={s.label}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>{s.label}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { borderColor: '#2A2A2A', color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' } }}>
                      <TableCell>Campaign</TableCell>
                      <TableCell>Target</TableCell>
                      <TableCell>Sent</TableCell>
                      <TableCell align="right">Sent Count</TableCell>
                      <TableCell align="right">Opened</TableCell>
                      <TableCell align="right">Open Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockHistory.map((h) => (
                      <TableRow key={h.id} sx={{ '& td': { borderColor: '#1E1E1E' }, '&:hover': { bgcolor: 'rgba(245,197,24,0.04)' } }}>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{h.title}</Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>{h.body.substring(0, 50)}...</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={h.target} size="small" sx={{ bgcolor: '#1E1E1E', color: '#888', fontSize: 11 }} />
                        </TableCell>
                        <TableCell sx={{ color: '#888', fontSize: 12 }}>{h.sent}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{h.sent_count.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{h.opened.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${h.ctr}%`}
                            size="small"
                            sx={{ bgcolor: h.ctr >= 40 ? 'rgba(76,175,80,0.12)' : 'rgba(255,152,0,0.12)', color: h.ctr >= 40 ? '#4CAF50' : '#FF9800', fontWeight: 700, fontSize: 11 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </Box>
      </Card>
    </LocalizationProvider>
  );
}
