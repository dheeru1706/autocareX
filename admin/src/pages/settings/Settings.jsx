import React, { useState } from 'react';
import {
  Box, Card, Grid, Typography, TextField, Button, Switch, FormControlLabel,
  Tab, Tabs, Select, MenuItem, FormControl, InputLabel, Chip, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, Alert,
} from '@mui/material';
import { Save, Shield, Settings as SettingsIcon, Bell, Users, FileText, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Chennai', 'Delhi', 'Pune'];

const mockAuditLogs = [
  { id: 1, action: 'Approved Franchise KYC', admin: 'Super Admin', resource: 'Franchise FR0042', timestamp: '23 May 2024, 14:32', ip: '192.168.1.1' },
  { id: 2, action: 'Rejected Car Listing', admin: 'Priya Admin', resource: 'Listing CAR01024', timestamp: '23 May 2024, 13:18', ip: '192.168.1.2' },
  { id: 3, action: 'Updated Commission Rate', admin: 'Super Admin', resource: 'City: Mumbai (18% → 20%)', timestamp: '23 May 2024, 11:05', ip: '192.168.1.1' },
  { id: 4, action: 'Sent Push Notification', admin: 'Marketing Admin', resource: 'Campaign: Summer AC Offer', timestamp: '22 May 2024, 16:44', ip: '192.168.1.3' },
  { id: 5, action: 'Suspended Franchise', admin: 'Super Admin', resource: 'Franchise FR0018', timestamp: '22 May 2024, 10:20', ip: '192.168.1.1' },
  { id: 6, action: 'Created Coupon', admin: 'Marketing Admin', resource: 'SUMMER20', timestamp: '20 May 2024, 09:15', ip: '192.168.1.3' },
];

const mockRoles = [
  { id: 1, name: 'Super Admin', permissions: ['all'], users: 2 },
  { id: 2, name: 'Operations Admin', permissions: ['franchise', 'bookings', 'customers'], users: 4 },
  { id: 3, name: 'Marketing Admin', permissions: ['notifications', 'coupons', 'analytics'], users: 3 },
  { id: 4, name: 'Finance Admin', permissions: ['analytics', 'subscriptions'], users: 2 },
];

export default function Settings() {
  const [tab, setTab] = useState(0);

  const [commissions, setCommissions] = useState(
    Object.fromEntries(CITIES.map((c) => [c, { rate: 20 + Math.floor(Math.random() * 5), gst: 18 }]))
  );

  const [appConfig, setAppConfig] = useState({
    maintenance_mode: false,
    new_registrations: true,
    marketplace_enabled: true,
    insurance_enabled: true,
    fleet_enabled: false,
    ai_pricing_enabled: true,
    min_booking_notice: 2,
    max_booking_advance: 30,
    support_phone: '+91 1800 123 4567',
    support_email: 'support@autocareX.in',
  });

  const [kycRequirements, setKycRequirements] = useState({
    gst_required: true,
    shop_license_required: true,
    aadhaar_required: true,
    bank_statement_required: true,
    police_clearance_required: false,
    minimum_staff: 2,
  });

  const handleSave = (section) => {
    toast.success(`${section} settings saved successfully`);
  };

  const toggleConfig = (key) => setAppConfig((p) => ({ ...p, [key]: !p[key] }));

  return (
    <Box>
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #2A2A2A', px: 2 }}>
          <Tab icon={<SettingsIcon size={15} />} iconPosition="start" label="App Config" />
          <Tab icon={<Activity size={15} />} iconPosition="start" label="Commission Rates" />
          <Tab icon={<Shield size={15} />} iconPosition="start" label="KYC Requirements" />
          <Tab icon={<Users size={15} />} iconPosition="start" label="Role Management" />
          <Tab icon={<FileText size={15} />} iconPosition="start" label="Audit Log" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* App Config */}
          {tab === 0 && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3, bgcolor: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.2)', color: '#FF9800' }}>
                Changes here affect all users across the platform immediately.
              </Alert>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Platform Toggles</Typography>
                    {[
                      { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Block all user access and show maintenance page' },
                      { key: 'new_registrations', label: 'New Registrations', desc: 'Allow new user & franchise registrations' },
                      { key: 'marketplace_enabled', label: 'Marketplace', desc: 'Enable car buy/sell marketplace' },
                      { key: 'insurance_enabled', label: 'Insurance Module', desc: 'Enable insurance comparison & purchase' },
                      { key: 'fleet_enabled', label: 'Fleet Management', desc: 'Enable fleet module (Beta)' },
                      { key: 'ai_pricing_enabled', label: 'AI Pricing', desc: 'Enable AI-based car pricing suggestions' },
                    ].map(({ key, label, desc }) => (
                      <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #1E1E1E' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{label}</Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>{desc}</Typography>
                        </Box>
                        <Switch
                          checked={appConfig[key]}
                          onChange={() => toggleConfig(key)}
                          size="small"
                          color={appConfig[key] && key !== 'maintenance_mode' ? 'primary' : 'error'}
                        />
                      </Box>
                    ))}
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2.5, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Booking Configuration</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Min Booking Notice (hours)"
                        type="number"
                        value={appConfig.min_booking_notice}
                        onChange={(e) => setAppConfig((p) => ({ ...p, min_booking_notice: e.target.value }))}
                        fullWidth
                        size="small"
                      />
                      <TextField
                        label="Max Advance Booking (days)"
                        type="number"
                        value={appConfig.max_booking_advance}
                        onChange={(e) => setAppConfig((p) => ({ ...p, max_booking_advance: e.target.value }))}
                        fullWidth
                        size="small"
                      />
                    </Box>
                  </Card>
                  <Card sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Support Contact</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField label="Support Phone" value={appConfig.support_phone} onChange={(e) => setAppConfig((p) => ({ ...p, support_phone: e.target.value }))} fullWidth size="small" />
                      <TextField label="Support Email" value={appConfig.support_email} onChange={(e) => setAppConfig((p) => ({ ...p, support_email: e.target.value }))} fullWidth size="small" />
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<Save size={16} />} onClick={() => handleSave('App Configuration')} sx={{ px: 4 }}>
                    Save Configuration
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Commission Rates */}
          {tab === 1 && (
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#888', mb: 3 }}>Set platform commission rates per city. All rates are exclusive of GST.</Typography>
              <Grid container spacing={2}>
                {CITIES.map((city) => (
                  <Grid item xs={12} sm={6} md={4} key={city}>
                    <Card sx={{ p: 2.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{city}</Typography>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField
                          label="Commission %"
                          type="number"
                          value={commissions[city].rate}
                          onChange={(e) => setCommissions((p) => ({ ...p, [city]: { ...p[city], rate: e.target.value } }))}
                          size="small"
                          inputProps={{ min: 5, max: 40 }}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          label="GST %"
                          type="number"
                          value={commissions[city].gst}
                          disabled
                          size="small"
                          sx={{ width: 80 }}
                        />
                      </Box>
                      <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#111', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Effective Rate: <strong style={{ color: '#F5C518' }}>{commissions[city].rate}% + {commissions[city].gst}% GST = {(commissions[city].rate * 1.18).toFixed(1)}%</strong>
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<Save size={16} />} onClick={() => handleSave('Commission Rates')} sx={{ px: 4 }}>
                    Save Commission Rates
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* KYC Requirements */}
          {tab === 2 && (
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#888', mb: 3 }}>Configure mandatory KYC documents for franchise onboarding.</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Required Documents</Typography>
                    {[
                      { key: 'gst_required', label: 'GST Certificate' },
                      { key: 'shop_license_required', label: 'Shop & Establishment License' },
                      { key: 'aadhaar_required', label: 'Owner Aadhaar Card' },
                      { key: 'bank_statement_required', label: 'Bank Statement (6 months)' },
                      { key: 'police_clearance_required', label: 'Police Clearance Certificate' },
                    ].map(({ key, label }) => (
                      <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #1E1E1E' }}>
                        <Typography variant="body2" sx={{ fontSize: 13 }}>{label}</Typography>
                        <Switch checked={kycRequirements[key]} onChange={() => setKycRequirements((p) => ({ ...p, [key]: !p[key] }))} size="small" />
                      </Box>
                    ))}
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Other Requirements</Typography>
                    <TextField
                      label="Minimum Staff Count"
                      type="number"
                      value={kycRequirements.minimum_staff}
                      onChange={(e) => setKycRequirements((p) => ({ ...p, minimum_staff: e.target.value }))}
                      fullWidth
                      size="small"
                      helperText="Minimum trained technicians required"
                    />
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<Save size={16} />} onClick={() => handleSave('KYC Requirements')} sx={{ px: 4 }}>
                    Save KYC Settings
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Roles */}
          {tab === 3 && (
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#888', mb: 3 }}>Manage admin roles and their permissions.</Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { borderColor: '#2A2A2A', color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' } }}>
                      <TableCell>Role Name</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell align="right">Users</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockRoles.map((role) => (
                      <TableRow key={role.id} sx={{ '& td': { borderColor: '#1E1E1E' } }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: 14 }}>{role.name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {role.permissions.map((p) => (
                              <Chip key={p} label={p} size="small" sx={{ bgcolor: p === 'all' ? 'rgba(245,197,24,0.12)' : '#1E1E1E', color: p === 'all' ? '#F5C518' : '#888', fontSize: 11 }} />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{role.users}</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined" sx={{ fontSize: 12, borderColor: '#2A2A2A', color: '#888', '&:hover': { borderColor: '#F5C518', color: '#F5C518' } }}>
                            Edit Permissions
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}

          {/* Audit Log */}
          {tab === 4 && (
            <Box>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { borderColor: '#2A2A2A', color: '#666', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' } }}>
                      <TableCell>Action</TableCell>
                      <TableCell>Admin</TableCell>
                      <TableCell>Resource</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>IP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockAuditLogs.map((log) => (
                      <TableRow key={log.id} sx={{ '& td': { borderColor: '#1E1E1E' }, '&:hover': { bgcolor: 'rgba(245,197,24,0.02)' } }}>
                        <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{log.action}</TableCell>
                        <TableCell>
                          <Chip label={log.admin} size="small" sx={{ bgcolor: '#1E1E1E', color: '#CCC', fontSize: 11 }} />
                        </TableCell>
                        <TableCell sx={{ color: '#888', fontSize: 12 }}>{log.resource}</TableCell>
                        <TableCell sx={{ color: '#666', fontSize: 12 }}>{log.timestamp}</TableCell>
                        <TableCell sx={{ color: '#555', fontSize: 12, fontFamily: 'monospace' }}>{log.ip}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}
