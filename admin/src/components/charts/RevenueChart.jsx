import React from 'react';
import { Box, Card, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const GOLD = '#F5C518';
const COLORS = ['#F5C518', '#FF6B35', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 2, p: 1.5, minWidth: 140 }}>
      <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.5 }}>{label}</Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
          <Typography variant="caption" sx={{ color: '#FFF', fontWeight: 600 }}>
            {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export function LineChartCard({ title, data, lines = [], period, onPeriodChange, periods, prefix = '', suffix = '', height = 300 }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 15 }}>{title}</Typography>
        {periods && (
          <ToggleButtonGroup value={period} exclusive onChange={(_, v) => v && onPeriodChange(v)} size="small">
            {periods.map((p) => (
              <ToggleButton
                key={p.value}
                value={p.value}
                sx={{
                  fontSize: 11, fontWeight: 600, px: 1.5, py: 0.5,
                  color: '#666', border: '1px solid #2A2A2A',
                  '&.Mui-selected': { color: '#F5C518', bgcolor: 'rgba(245,197,24,0.1)', borderColor: '#F5C518' },
                }}
              >
                {p.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      </Box>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            {lines.map((l, i) => (
              <linearGradient key={l.key} id={`gradient-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.25} />
                <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${prefix}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}${suffix}`} />
          <Tooltip content={<CustomTooltip prefix={prefix} suffix={suffix} />} />
          {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />}
          {lines.map((l, i) => (
            <Area
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.name || l.key}
              stroke={COLORS[i]}
              strokeWidth={2}
              fill={`url(#gradient-${l.key})`}
              dot={false}
              activeDot={{ r: 4, fill: COLORS[i] }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function BarChartCard({ title, data, bars = [], prefix = '', suffix = '', height = 300 }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 15, mb: 2.5 }}>{title}</Typography>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${prefix}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}${suffix}`} />
          <Tooltip content={<CustomTooltip prefix={prefix} suffix={suffix} />} />
          {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />}
          {bars.map((b, i) => (
            <Bar key={b.key} dataKey={b.key} name={b.name || b.key} fill={COLORS[i]} radius={[4, 4, 0, 0]} maxBarSize={48} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function PieChartCard({ title, data, height = 300 }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 15, mb: 2 }}>{title}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ResponsiveContainer width="55%" height={height}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{ flex: 1 }}>
          {data.map((d, i) => (
            <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: COLORS[i % COLORS.length] }} />
                <Typography variant="caption" sx={{ color: '#888', fontSize: 12 }}>{d.name}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#FFF', fontWeight: 700, fontSize: 12 }}>{d.value}%</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  );
}

export default LineChartCard;
