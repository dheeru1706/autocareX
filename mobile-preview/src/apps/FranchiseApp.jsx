import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

// ─── Color Palette ────────────────────────────────────────────────────────────
const BG = '#FFFFFF'
const BG2 = '#F5F7FA'
const NAVY = '#0F2D52'
const ORANGE = '#E8500A'
const TEXT = '#1C1C1E'
const TEXT2 = '#6C7280'
const BORDER = '#E5E7EB'
const CARD = '#FFFFFF'
const SHADOW = '0 2px 12px rgba(15,45,82,0.08)'
const SUCCESS = '#15803D'
const RED = '#DC2626'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function NavyButton({ children, onClick, style = {}, variant = 'navy' }) {
  const [hover, setHover] = useState(false)
  const isOrange = variant === 'orange'
  const isOutline = variant === 'outline'
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', padding: '15px 0',
        background: isOrange
          ? (hover ? '#c94108' : ORANGE)
          : isOutline
            ? 'transparent'
            : (hover ? '#1A4580' : NAVY),
        border: isOutline ? `1.5px solid ${NAVY}` : 'none',
        color: isOutline ? NAVY : '#fff',
        borderRadius: 14, fontWeight: 700, fontSize: 15,
        cursor: 'pointer', fontFamily: 'Inter, inherit', letterSpacing: 0.2,
        transition: 'all 0.18s ease',
        transform: hover ? 'translateY(-1px)' : 'none',
        boxShadow: hover ? '0 4px 16px rgba(15,45,82,0.18)' : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function PartnerBottomNav({ active, onNavigate }) {
  const items = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'jobs', icon: '🔧', label: 'Jobs' },
    { id: 'earnings', icon: '💰', label: 'Earnings' },
    { id: 'pprofile', icon: '🏪', label: 'Profile' },
  ]
  return (
    <div style={{
      height: 72, background: CARD,
      borderTop: `1px solid ${BORDER}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexShrink: 0,
      boxShadow: '0 -2px 8px rgba(15,45,82,0.06)',
    }}>
      {items.map(item => (
        <button key={item.id} onClick={() => onNavigate(item.id)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px',
        }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, fontFamily: 'Inter, inherit',
            color: active === item.id ? NAVY : TEXT2,
          }}>{item.label}</span>
          {active === item.id && (
            <div style={{ width: 20, height: 3, background: ORANGE, borderRadius: 2, marginTop: 1 }} />
          )}
        </button>
      ))}
    </div>
  )
}

function ScreenWrapper({ children, style = {} }) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto', overflowX: 'hidden', background: BG, ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Screen 1: Partner Login ──────────────────────────────────────────────────

function PartnerLogin({ onNext }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)

  return (
    <ScreenWrapper>
      <div style={{ padding: '40px 28px 32px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72,
            background: NAVY,
            borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(15,45,82,0.2)',
          }}>🏪</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: NAVY, marginBottom: 4, fontFamily: 'Inter, inherit' }}>
            Partner <span style={{ color: ORANGE }}>Portal</span>
          </div>
          <div style={{ fontSize: 13, color: TEXT2 }}>Sign in to manage your business</div>
        </div>

        {/* Fields */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: TEXT2, fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
            EMAIL ADDRESS
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: CARD, border: `1.5px solid ${emailFocused ? NAVY : BORDER}`,
            borderRadius: 12, padding: '0 16px',
            transition: 'border-color 0.2s',
            boxShadow: emailFocused ? '0 0 0 3px rgba(15,45,82,0.08)' : 'none',
          }}>
            <span style={{ fontSize: 16 }}>✉️</span>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="partner@sparkauto.in"
              type="email"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: TEXT, fontSize: 14, padding: '14px 0', fontFamily: 'Inter, inherit',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: TEXT2, fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
            PASSWORD
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: CARD, border: `1.5px solid ${passFocused ? NAVY : BORDER}`,
            borderRadius: 12, padding: '0 16px',
            transition: 'border-color 0.2s',
            boxShadow: passFocused ? '0 0 0 3px rgba(15,45,82,0.08)' : 'none',
          }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <input
              value={pass}
              onChange={e => setPass(e.target.value)}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
              placeholder="••••••••"
              type={showPass ? 'text' : 'password'}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: TEXT, fontSize: 14, padding: '14px 0', fontFamily: 'Inter, inherit',
              }}
            />
            <span
              onClick={() => setShowPass(!showPass)}
              style={{ cursor: 'pointer', fontSize: 14, color: TEXT2 }}
            >{showPass ? '🙈' : '👁️'}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginBottom: 28 }}>
          <span style={{ fontSize: 13, color: ORANGE, fontWeight: 600, cursor: 'pointer' }}>
            Forgot password?
          </span>
        </div>

        <NavyButton variant="navy" onClick={onNext}>Sign In →</NavyButton>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: TEXT2 }}>
          New franchise?{' '}
          <span style={{ color: ORANGE, cursor: 'pointer', fontWeight: 600 }}>Apply for Onboarding</span>
        </div>

        {/* Demo hint */}
        <div style={{
          marginTop: 28, padding: '12px 16px', background: BG2,
          border: `1px solid ${BORDER}`, borderRadius: 12, textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: TEXT2, marginBottom: 6 }}>DEMO CREDENTIALS</div>
          <div style={{ fontSize: 12, color: TEXT }}>
            partner@sparkauto.in &nbsp;/&nbsp; <span style={{ color: ORANGE }}>••••••••</span>
          </div>
        </div>
      </div>
    </ScreenWrapper>
  )
}

// ─── Screen 2: Partner Dashboard ──────────────────────────────────────────────

const chartData = [
  { day: 'Mon', amount: 8400 },
  { day: 'Tue', amount: 12800 },
  { day: 'Wed', amount: 9200 },
  { day: 'Thu', amount: 15400 },
  { day: 'Fri', amount: 18200 },
  { day: 'Sat', amount: 22600 },
  { day: 'Sun', amount: 12400 },
]

const INCOMING = [
  {
    id: '#AX5103',
    customer: 'Priya Reddy',
    service: '🚿 Car Wash',
    dist: '1.2 km',
    price: '₹399',
    vehicle: 'Maruti Swift',
    time: '11:30 AM',
  },
  {
    id: '#AX5104',
    customer: 'Arjun Mehta',
    service: '🛢️ Oil Change',
    dist: '2.4 km',
    price: '₹799',
    vehicle: 'Honda City',
    time: '12:00 PM',
  },
]

function PartnerDashboard({ onNavigate }) {
  const [accepted, setAccepted] = useState({})
  const [declined, setDeclined] = useState({})

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ScreenWrapper>
        {/* Header */}
        <div style={{
          padding: '20px 20px 20px',
          background: NAVY,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 2 }}>Good morning 👋</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Inter, inherit' }}>SparkAuto Workshop</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <div style={{ width: 8, height: 8, background: '#4ade80', borderRadius: '50%' }} />
                <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>Open for Business</span>
              </div>
            </div>
            <div style={{
              width: 44, height: 44, background: ORANGE, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🏪</div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { icon: '🔧', val: '8', label: "Today's Jobs", subColor: SUCCESS },
              { icon: '💰', val: '₹12.4K', label: 'Earned Today', subColor: ORANGE },
              { icon: '⭐', val: '4.9', label: 'Avg Rating', subColor: NAVY },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1, background: NAVY,
                borderRadius: 14, padding: '14px 10px', textAlign: 'center',
                boxShadow: '0 2px 8px rgba(15,45,82,0.15)',
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings Chart */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 18, padding: '18px',
            boxShadow: SHADOW,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: 'Inter, inherit' }}>Weekly Earnings</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>Last 7 days</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>₹99,000</div>
                <div style={{ fontSize: 11, color: SUCCESS }}>▲ 14% vs last week</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: TEXT2, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={v => [`₹${(v / 1000).toFixed(1)}K`, 'Earned']}
                  contentStyle={{
                    background: CARD, border: `1px solid ${BORDER}`,
                    borderRadius: 10, fontSize: 12, color: TEXT,
                    boxShadow: SHADOW,
                  }}
                  cursor={{ fill: 'rgba(15,45,82,0.04)' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={i === chartData.length - 1 ? ORANGE : 'rgba(15,45,82,0.25)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incoming Requests */}
        <div style={{ padding: '0 20px 28px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: 'Inter, inherit' }}>Incoming Requests</div>
            <div style={{
              background: RED, color: '#fff', fontSize: 10, fontWeight: 700,
              padding: '3px 10px', borderRadius: 20, minWidth: 20, textAlign: 'center',
            }}>2</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {INCOMING.map((req, i) => (
              <div key={i} style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderLeft: `3px solid ${NAVY}`,
                borderRadius: 18, padding: '16px', overflow: 'hidden',
                boxShadow: SHADOW,
              }}>
                {/* Booking header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: TEXT2, fontWeight: 600 }}>{req.id}</span>
                  <span style={{
                    background: 'rgba(232,80,10,0.08)', color: ORANGE,
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                  }}>NEW REQUEST</span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 48, height: 48, background: BG2, borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>👤</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{req.customer}</div>
                    <div style={{ fontSize: 12, color: TEXT2 }}>{req.vehicle}</div>
                  </div>
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14,
                }}>
                  {[
                    ['Service', req.service],
                    ['Distance', `📍 ${req.dist}`],
                    ['Price', req.price],
                    ['Time', `⏰ ${req.time}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{
                      background: BG2, borderRadius: 10, padding: '8px 10px',
                      border: `1px solid ${BORDER}`,
                    }}>
                      <div style={{ fontSize: 10, color: TEXT2, marginBottom: 2, fontWeight: 600 }}>{k}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{v}</div>
                    </div>
                  ))}
                </div>
                {accepted[i] ? (
                  <div style={{
                    textAlign: 'center', padding: '10px', background: 'rgba(21,128,61,0.08)',
                    borderRadius: 10, color: SUCCESS, fontWeight: 700, fontSize: 13,
                    border: `1px solid rgba(21,128,61,0.15)`,
                  }}>✓ Accepted</div>
                ) : declined[i] ? (
                  <div style={{
                    textAlign: 'center', padding: '10px', background: 'rgba(220,38,38,0.06)',
                    borderRadius: 10, color: RED, fontWeight: 700, fontSize: 13,
                    border: `1px solid rgba(220,38,38,0.12)`,
                  }}>✗ Declined</div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setDeclined(d => ({ ...d, [i]: true }))}
                      style={{
                        flex: 1, padding: '11px 0', background: 'transparent',
                        border: `1.5px solid ${BORDER}`, color: TEXT2,
                        borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
                      }}
                    >✕ Decline</button>
                    <button
                      onClick={() => setAccepted(a => ({ ...a, [i]: true }))}
                      style={{
                        flex: 2, padding: '11px 0', background: ORANGE,
                        border: 'none', color: '#fff',
                        borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
                      }}
                    >✓ Accept Job</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScreenWrapper>
      <PartnerBottomNav active="dashboard" onNavigate={onNavigate} />
    </div>
  )
}

// ─── Screen 3: Job Management ─────────────────────────────────────────────────

const JOBS = {
  active: [
    { id: '#AX4821', customer: 'Rahul Sharma', service: '🔧 Engine Service', time: '10:40 AM', amount: '₹2,999', vehicle: 'Honda City', status: 'In Progress' },
  ],
  upcoming: [
    { id: '#AX4830', customer: 'Anita Gupta', service: '🚿 Car Wash', time: '11:30 AM', amount: '₹399', vehicle: 'Hyundai i20', status: 'Scheduled' },
    { id: '#AX4831', customer: 'Vikram Singh', service: '🔄 Tyre Change', time: '12:00 PM', amount: '₹599', vehicle: 'Tata Nexon', status: 'Scheduled' },
    { id: '#AX4832', customer: 'Deepa Nair', service: '✨ Detailing', time: '2:30 PM', amount: '₹1,499', vehicle: 'Maruti Brezza', status: 'Confirmed' },
  ],
  completed: [
    { id: '#AX4810', customer: 'Rohan Verma', service: '🛢️ Oil Change', time: '9:00 AM', amount: '₹799', vehicle: 'Honda Jazz', status: 'Done' },
    { id: '#AX4800', customer: 'Kavya Patel', service: '🚿 Car Wash', time: '8:00 AM', amount: '₹399', vehicle: 'Swift Dzire', status: 'Done' },
  ],
}

const STATUS_STYLE = {
  'In Progress': { bg: 'rgba(15,45,82,0.08)', color: NAVY },
  'Scheduled': { bg: 'rgba(232,80,10,0.08)', color: ORANGE },
  'Confirmed': { bg: 'rgba(21,128,61,0.08)', color: SUCCESS },
  'Done': { bg: BG2, color: TEXT2 },
}

function JobManagement({ onNavigate }) {
  const [tab, setTab] = useState('active')

  const counts = { active: JOBS.active.length, upcoming: JOBS.upcoming.length, completed: 24 }
  const jobs = tab === 'completed' ? JOBS.completed : JOBS[tab]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 0',
        background: NAVY,
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 16, fontFamily: 'Inter, inherit' }}>Job Management</div>
        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 4, marginBottom: 0,
        }}>
          {[
            { id: 'active', label: 'Active' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '9px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? NAVY : 'rgba(255,255,255,0.6)',
              fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.15s',
            }}>
              {t.label}
              <span style={{
                background: tab === t.id ? ORANGE : 'rgba(255,255,255,0.15)',
                color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.6)',
                borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800,
              }}>{counts[t.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <ScreenWrapper style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map((job, i) => (
            <div key={i} style={{
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 16, padding: '16px',
              boxShadow: SHADOW,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: TEXT2, fontWeight: 600 }}>{job.id}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                  background: STATUS_STYLE[job.status]?.bg,
                  color: STATUS_STYLE[job.status]?.color,
                }}>{job.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                <div style={{
                  width: 46, height: 46, background: BG2, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 1 }}>{job.customer}</div>
                  <div style={{ fontSize: 12, color: TEXT2 }}>{job.vehicle}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{job.amount}</div>
                  <div style={{ fontSize: 11, color: TEXT2 }}>⏰ {job.time}</div>
                </div>
              </div>
              <div style={{
                background: BG2, borderRadius: 10, padding: '8px 12px',
                border: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{job.service}</span>
                {job.status === 'In Progress' && (
                  <span style={{ fontSize: 11, color: ORANGE, fontWeight: 600 }}>● Live</span>
                )}
                {job.status === 'Done' && (
                  <span style={{ fontSize: 11, color: SUCCESS, fontWeight: 600 }}>✓ Completed</span>
                )}
              </div>
              {job.status === 'In Progress' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={{
                    flex: 1, padding: '9px 0', background: 'rgba(21,128,61,0.08)',
                    border: '1px solid rgba(21,128,61,0.15)', color: SUCCESS,
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12,
                  }}>📞 Call Customer</button>
                  <button style={{
                    flex: 1, padding: '9px 0', background: NAVY,
                    border: 'none', color: '#fff',
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12,
                  }}>Mark Complete</button>
                </div>
              )}
            </div>
          ))}
          {tab === 'completed' && (
            <div style={{
              textAlign: 'center', padding: '16px', color: TEXT2, fontSize: 13,
            }}>
              Showing recent 2 of 24 completed jobs
            </div>
          )}
        </div>
      </ScreenWrapper>
      <PartnerBottomNav active="jobs" onNavigate={onNavigate} />
    </div>
  )
}

// ─── Screen 4: Earnings ───────────────────────────────────────────────────────

const PAYOUTS = [
  { date: 'May 20', amount: '₹24,600', status: 'Paid', jobs: 22 },
  { date: 'May 13', amount: '₹31,200', status: 'Paid', jobs: 28 },
  { date: 'May 6', amount: '₹19,800', status: 'Paid', jobs: 18 },
  { date: 'Apr 29', amount: '₹27,400', status: 'Paid', jobs: 25 },
]

function EarningsScreen({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ScreenWrapper>
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 20, fontFamily: 'Inter, inherit' }}>Earnings</div>

          {/* Summary Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {[
              { period: 'Today', amount: '₹12,400', jobs: 8, growth: '+18%' },
              { period: 'This Week', amount: '₹67,200', jobs: 54, growth: '+14%' },
              { period: 'This Month', amount: '₹2.1L', jobs: 186, growth: '+22%' },
            ].map((card, i) => (
              <div key={i} style={{
                background: i === 0 ? NAVY : CARD,
                border: `1px solid ${i === 0 ? 'transparent' : BORDER}`,
                borderRadius: 18, padding: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: i === 0 ? '0 4px 16px rgba(15,45,82,0.2)' : SHADOW,
              }}>
                <div>
                  <div style={{ fontSize: 12, color: i === 0 ? 'rgba(255,255,255,0.55)' : TEXT2, fontWeight: 600, marginBottom: 4 }}>
                    {card.period.toUpperCase()}
                  </div>
                  <div style={{ fontSize: i === 0 ? 28 : 22, fontWeight: 900, color: i === 0 ? '#fff' : TEXT, marginBottom: 4, fontFamily: 'Inter, inherit' }}>
                    {card.amount}
                  </div>
                  <div style={{ fontSize: 12, color: i === 0 ? 'rgba(255,255,255,0.5)' : TEXT2 }}>{card.jobs} jobs completed</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    background: i === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(21,128,61,0.1)', color: i === 0 ? '#4ade80' : SUCCESS,
                    fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 10, marginBottom: 8,
                  }}>{card.growth}</div>
                  <div style={{ fontSize: 20 }}>
                    {i === 0 ? '📅' : i === 1 ? '📈' : '🏆'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payout History */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 14, fontFamily: 'Inter, inherit' }}>Payout History</div>
            <div style={{
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 16, overflow: 'hidden', marginBottom: 16,
              boxShadow: SHADOW,
            }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                padding: '10px 16px', borderBottom: `1px solid ${BORDER}`,
                background: BG2,
              }}>
                {['Date', 'Amount', 'Status'].map(h => (
                  <div key={h} style={{ fontSize: 10, color: TEXT2, fontWeight: 700, letterSpacing: 0.5 }}>{h}</div>
                ))}
              </div>
              {PAYOUTS.map((p, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                  padding: '14px 16px',
                  borderBottom: i < PAYOUTS.length - 1 ? `1px solid ${BORDER}` : 'none',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{p.date}</div>
                    <div style={{ fontSize: 10, color: TEXT2 }}>{p.jobs} jobs</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{p.amount}</div>
                  <div>
                    <span style={{
                      background: 'rgba(21,128,61,0.1)', color: SUCCESS,
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                    }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <NavyButton variant="orange">💳 Request Payout</NavyButton>
          <div style={{ height: 32 }} />
        </div>
      </ScreenWrapper>
      <PartnerBottomNav active="earnings" onNavigate={onNavigate} />
    </div>
  )
}

// ─── Screen 5: Partner Profile ────────────────────────────────────────────────

const STAFF = [
  { name: 'Ravi Kumar', role: 'Senior Mechanic', rating: 4.9, jobs: 342 },
  { name: 'Suresh Babu', role: 'Wash Specialist', rating: 4.7, jobs: 218 },
  { name: 'Prakash M.', role: 'Tyre Technician', rating: 4.6, jobs: 156 },
]

function PartnerProfile({ onNavigate }) {
  const ratingBreakdown = [
    { stars: '5★', pct: 78, color: SUCCESS },
    { stars: '4★', pct: 18, color: '#65a30d' },
    { stars: '3★', pct: 4, color: ORANGE },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ScreenWrapper>
        {/* Header */}
        <div style={{
          padding: '24px 20px 20px',
          background: NAVY,
          textAlign: 'center',
        }}>
          <div style={{
            width: 72, height: 72, background: ORANGE, borderRadius: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 14px',
            boxShadow: '0 4px 20px rgba(232,80,10,0.4)',
          }}>🏪</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4, fontFamily: 'Inter, inherit' }}>
            SparkAuto Workshop
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>Ravi Kumar (Owner)</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#4ade80', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>✅ Verified Partner</span>
            <span style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: ORANGE, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
            }}>👑 Premium Tier</span>
          </div>

          {/* Edit button */}
          <div style={{ marginTop: 14 }}>
            <button style={{
              background: ORANGE, border: 'none', color: '#fff',
              padding: '8px 24px', borderRadius: 10, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>✏️ Edit Profile</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px 28px' }}>
          {/* Service Areas */}
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: '16px', marginBottom: 16,
            boxShadow: SHADOW,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12, fontFamily: 'Inter, inherit' }}>
              📍 Service Areas
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Banjara Hills', 'Jubilee Hills', 'Madhapur', 'HITEC City', 'Gachibowli'].map(area => (
                <span key={area} style={{
                  background: BG2, border: `1px solid ${BORDER}`,
                  color: TEXT, fontSize: 11, fontWeight: 600,
                  padding: '5px 12px', borderRadius: 20,
                }}>{area}</span>
              ))}
            </div>
          </div>

          {/* Ratings */}
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: '16px', marginBottom: 16,
            boxShadow: SHADOW,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: 'Inter, inherit' }}>Ratings Breakdown</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: NAVY }}>4.9</div>
                <div style={{ fontSize: 10, color: TEXT2 }}>648 reviews</div>
              </div>
            </div>
            {ratingBreakdown.map(r => (
              <div key={r.stars} style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
              }}>
                <span style={{ fontSize: 12, color: TEXT, fontWeight: 700, width: 22 }}>{r.stars}</span>
                <div style={{
                  flex: 1, height: 8, background: BORDER, borderRadius: 4, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${r.pct}%`, height: '100%',
                    background: r.color, borderRadius: 4,
                  }} />
                </div>
                <span style={{ fontSize: 11, color: TEXT2, width: 30, textAlign: 'right' }}>
                  {r.pct}%
                </span>
              </div>
            ))}
          </div>

          {/* Staff */}
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, overflow: 'hidden', marginBottom: 16,
            boxShadow: SHADOW,
          }}>
            <div style={{ padding: '16px', borderBottom: `1px solid ${BORDER}`, background: BG2 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: 'Inter, inherit' }}>Staff Members</div>
                <span style={{
                  background: NAVY, color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                }}>+ Add Staff</span>
              </div>
            </div>
            {STAFF.map((s, i) => (
              <div key={i} style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < STAFF.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}>
                <div style={{
                  width: 42, height: 42, background: BG2, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>👨‍🔧</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 1 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: TEXT2 }}>{s.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: ORANGE, fontWeight: 700 }}>★ {s.rating}</div>
                  <div style={{ fontSize: 10, color: TEXT2 }}>{s.jobs} jobs</div>
                </div>
              </div>
            ))}
          </div>

          {/* Business Details */}
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: '16px', marginBottom: 4,
            boxShadow: SHADOW,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 14, fontFamily: 'Inter, inherit' }}>Business Details</div>
            {[
              ['GST Number', '36AABCS1234N1Z5'],
              ['License', 'AP/2022/AUTO/4821'],
              ['Working Hours', '7:00 AM — 9:00 PM'],
              ['Joined', 'March 2022'],
              ['Total Earnings', '₹18.4L'],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: `1px solid ${BORDER}`,
              }}>
                <span style={{ fontSize: 12, color: TEXT2 }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </ScreenWrapper>
      <PartnerBottomNav active="pprofile" onNavigate={onNavigate} />
    </div>
  )
}

// ─── Root FranchiseApp ────────────────────────────────────────────────────────

export default function FranchiseApp() {
  const [screen, setScreen] = useState('login')

  const navigate = (tab) => {
    const map = {
      dashboard: 'dashboard',
      jobs: 'jobs',
      earnings: 'earnings',
      pprofile: 'pprofile',
    }
    setScreen(map[tab] || tab)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 750 }}>
      {screen === 'login' && (
        <PartnerLogin onNext={() => setScreen('dashboard')} />
      )}
      {screen === 'dashboard' && (
        <PartnerDashboard onNavigate={navigate} />
      )}
      {screen === 'jobs' && (
        <JobManagement onNavigate={navigate} />
      )}
      {screen === 'earnings' && (
        <EarningsScreen onNavigate={navigate} />
      )}
      {screen === 'pprofile' && (
        <PartnerProfile onNavigate={navigate} />
      )}
    </div>
  )
}
