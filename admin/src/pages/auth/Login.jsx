import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Typography, TextField, Button, InputAdornment, IconButton,
  CircularProgress, Alert,
} from '@mui/material';
import { Eye, EyeOff, Car, Lock, Mail, Shield } from 'lucide-react';
import { loginAsync, clearError } from '../../store/authSlice';
import { motion } from 'framer-motion';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
    return () => dispatch(clearError());
  }, [isAuthenticated]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginAsync({ email, password }));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F2D52 0%, #1A4580 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background pattern */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Soft glow */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 500,
          height: 300,
          background: 'radial-gradient(ellipse, rgba(232,80,10,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 420, padding: '0 16px', position: 'relative', zIndex: 1 }}
      >
        {/* Logo above card */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '18px',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            <Car size={32} color="#0F2D52" />
          </Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}
          >
            AutoCare<span style={{ color: '#E8500A' }}>X</span>
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
            Admin Portal
          </Typography>
        </Box>

        <Card
          sx={{
            p: 4,
            border: 'none',
            background: '#FFFFFF',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            borderRadius: '16px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Shield size={16} color="#0F2D52" />
            <Typography variant="body2" sx={{ color: '#6C7280', fontSize: 13 }}>
              Sign in with your admin credentials
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2.5, bgcolor: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={16} color="#6C7280" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={16} color="#6C7280" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: '#6C7280' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || !email || !password}
              sx={{
                mt: 1,
                py: 1.5,
                fontSize: 15,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0F2D52 0%, #1A4580 100%)',
                color: '#fff',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1A4580 0%, #0F2D52 100%)',
                  boxShadow: '0 4px 20px rgba(15,45,82,0.3)',
                },
                '&:disabled': {
                  background: '#E5E7EB',
                  color: '#9CA3AF',
                },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
            </Button>
          </Box>
        </Card>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.4)', mt: 3 }}>
          © 2024 AutoCareX. All rights reserved.
        </Typography>
      </motion.div>
    </Box>
  );
}
