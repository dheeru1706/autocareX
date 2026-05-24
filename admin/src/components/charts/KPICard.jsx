import React from 'react';
import { Box, Card, Typography, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({ title, value, subtitle, trend, trendValue, icon: Icon, color = '#F5C518', loading = false }) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <Card
      sx={{
        p: 2.5,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            backgroundColor: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {Icon && <Icon size={22} color={color} strokeWidth={1.8} />}
        </Box>

        {trendValue !== undefined && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
              px: 1,
              py: 0.4,
              borderRadius: '8px',
              backgroundColor: isPositive ? 'rgba(76,175,80,0.12)' : isNegative ? 'rgba(244,67,54,0.12)' : 'rgba(158,158,158,0.12)',
            }}
          >
            {isPositive ? (
              <TrendingUp size={13} color="#4CAF50" />
            ) : isNegative ? (
              <TrendingDown size={13} color="#F44336" />
            ) : (
              <Minus size={13} color="#9E9E9E" />
            )}
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: 11,
                color: isPositive ? '#4CAF50' : isNegative ? '#F44336' : '#9E9E9E',
              }}
            >
              {trendValue}
            </Typography>
          </Box>
        )}
      </Box>

      {loading ? (
        <>
          <Skeleton variant="text" width="60%" height={40} sx={{ bgcolor: '#2A2A2A' }} />
          <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: '#2A2A2A' }} />
        </>
      ) : (
        <>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFF', lineHeight: 1.1, mb: 0.5, fontSize: { xs: 22, md: 26 } }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', fontWeight: 500, fontSize: 13 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#555', fontSize: 11, display: 'block', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </>
      )}
    </Card>
  );
}
