import React, { useState } from 'react'

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

// ─── Reusable helpers ────────────────────────────────────────────────────────

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
        width: '100%',
        padding: '15px 0',
        background: isOrange
          ? (hover ? '#c94108' : ORANGE)
          : isOutline
            ? 'transparent'
            : (hover ? '#1A4580' : NAVY),
        border: isOutline ? `1.5px solid ${NAVY}` : 'none',
        color: isOutline ? NAVY : '#fff',
        borderRadius: 14,
        fontWeight: 700,
        fontSize: 15,
        cursor: 'pointer',
        fontFamily: 'Inter, inherit',
        letterSpacing: 0.2,
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

function BottomNav({ active, onNavigate }) {
  const items = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'bookings', icon: '📋', label: 'Bookings' },
    { id: 'wallet', icon: '💳', label: 'Wallet' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ]
  return (
    <div style={{
      height: 72,
      background: CARD,
      borderTop: `1px solid ${BORDER}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      flexShrink: 0,
      boxShadow: '0 -2px 8px rgba(15,45,82,0.06)',
    }}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px',
          }}
        >
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
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      background: BG,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Screen 1: Splash / Onboarding ──────────────────────────────────────────

function SplashScreen({ onNext }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: NAVY,
      padding: '40px 32px', gap: 0, minHeight: 600,
    }}>
      {/* Logo Icon */}
      <div style={{
        width: 90, height: 90,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 26,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 42,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        marginBottom: 28,
        border: '1.5px solid rgba(255,255,255,0.15)',
      }}>🚗</div>

      <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 8 }}>
        AutoCare<span style={{ color: ORANGE }}>X</span>
      </div>
      <div style={{
        fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.6, marginBottom: 56,
        maxWidth: 240,
      }}>
        India's #1 Auto Care Platform
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 52, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['🔧 Expert Mechanics', '⚡ Instant Booking', '🛡️ Insured Service'].map(f => (
          <span key={f} style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.8)', fontSize: 11, padding: '6px 14px', borderRadius: 20, fontWeight: 500,
          }}>{f}</span>
        ))}
      </div>

      <div style={{ width: '100%' }}>
        <NavyButton variant="orange" onClick={onNext}>Get Started →</NavyButton>
      </div>

      <div style={{ marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
        Already have an account?{' '}
        <span style={{ color: ORANGE, cursor: 'pointer', fontWeight: 700 }} onClick={onNext}>Sign In</span>
      </div>
    </div>
  )
}

// ─── Screen 2: Login ─────────────────────────────────────────────────────────

function LoginScreen({ onNext }) {
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [phoneFocused, setPhoneFocused] = useState(false)

  const handleSend = () => {
    if (phone.length >= 10) setOtpSent(true)
  }

  return (
    <ScreenWrapper>
      <div style={{ padding: '40px 28px 32px' }}>
        {/* Header Icon */}
        <div style={{
          width: 52, height: 52, background: NAVY, borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, marginBottom: 24,
          boxShadow: SHADOW,
        }}>🚗</div>

        <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 6, fontFamily: 'Inter, inherit' }}>
          {otpSent ? 'Verify OTP' : 'Welcome Back'}
        </div>
        <div style={{ fontSize: 14, color: TEXT2, marginBottom: 36, fontFamily: 'Inter, inherit' }}>
          {otpSent
            ? `OTP sent to +91 ${phone}`
            : 'Enter your mobile number to continue'}
        </div>

        {!otpSent ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: TEXT2, fontWeight: 600, letterSpacing: 0.5, fontFamily: 'Inter, inherit' }}>
                MOBILE NUMBER
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: CARD,
                border: `1.5px solid ${phoneFocused ? NAVY : BORDER}`,
                borderRadius: 12, marginTop: 8, overflow: 'hidden',
                transition: 'border-color 0.2s',
                boxShadow: phoneFocused ? `0 0 0 3px rgba(15,45,82,0.08)` : 'none',
              }}>
                <div style={{
                  padding: '14px 14px', borderRight: `1px solid ${BORDER}`,
                  color: TEXT, fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>🇮🇳 +91</div>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  placeholder="98765 43210"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: TEXT, fontSize: 15, padding: '14px 14px', fontFamily: 'Inter, inherit',
                    letterSpacing: 1,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <NavyButton variant="orange" onClick={handleSend}>
                {phone.length >= 10 ? 'Send OTP →' : 'Enter 10-digit number'}
              </NavyButton>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
            }}>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
              <span style={{ color: TEXT2, fontSize: 12 }}>or</span>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
            </div>

            <button onClick={onNext} style={{
              width: '100%', padding: '14px 0',
              background: BG2, border: `1.5px solid ${BORDER}`,
              borderRadius: 14, color: TEXT, fontWeight: 600, fontSize: 14,
              cursor: 'pointer', fontFamily: 'Inter, inherit', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>G</span> Continue with Google
            </button>
          </>
        ) : (
          <>
            {/* OTP Boxes */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, justifyContent: 'center' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 60, height: 64,
                  background: i < otp.length ? 'rgba(15,45,82,0.04)' : BG2,
                  border: `1.5px solid ${i < otp.length ? ORANGE : BORDER}`,
                  borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 700, color: NAVY,
                  boxShadow: i < otp.length ? `0 0 0 3px rgba(232,80,10,0.1)` : 'none',
                  transition: 'all 0.15s',
                }}>
                  {otp[i] || ''}
                </div>
              ))}
            </div>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'auto', width: 1, height: 1 }}
              autoFocus
            />
            <div style={{ width: '100%', marginBottom: 16 }}>
              <NavyButton
                variant="orange"
                onClick={otp.length === 4 ? onNext : undefined}
                style={{ opacity: otp.length === 4 ? 1 : 0.5 }}
              >
                Verify & Continue →
              </NavyButton>
            </div>
            <div style={{ textAlign: 'center', color: TEXT2, fontSize: 13, fontFamily: 'Inter, inherit' }}>
              Didn't receive?{' '}
              <span style={{ color: ORANGE, cursor: 'pointer', fontWeight: 600 }}>Resend in 30s</span>
            </div>
            {/* Demo hint */}
            <div style={{
              marginTop: 24, padding: '12px 16px', background: BG2,
              border: `1px solid ${BORDER}`, borderRadius: 10, textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: TEXT2, marginBottom: 4 }}>DEMO — tap to fill OTP</div>
              <div
                onClick={() => setOtp('1234')}
                style={{ fontSize: 22, letterSpacing: 8, color: ORANGE, cursor: 'pointer', fontWeight: 700 }}
              >1234</div>
            </div>
          </>
        )}
      </div>
    </ScreenWrapper>
  )
}

// ─── Screen 3: Home Dashboard ─────────────────────────────────────────────────

const SERVICES = [
  { icon: '🚿', name: 'Car Wash', price: '₹399' },
  { icon: '🔧', name: 'Engine Service', price: '₹2,999' },
  { icon: '🔄', name: 'Tyre Change', price: '₹599' },
  { icon: '✨', name: 'Detailing', price: '₹1,499' },
  { icon: '🛢️', name: 'Oil Change', price: '₹799' },
  { icon: '🆘', name: 'Roadside', price: '₹299' },
]

const PARTNERS = [
  { name: 'SparkAuto Workshop', rating: 4.9, reviews: 342, dist: '0.8 km', badge: '⭐ Top Rated', tag: 'Express' },
  { name: 'PitStop Pro Service', rating: 4.7, reviews: 218, dist: '1.4 km', badge: '✅ Verified', tag: 'Premium' },
  { name: 'QuickFix Garage', rating: 4.6, reviews: 186, dist: '2.1 km', badge: '⚡ Fast', tag: 'Economy' },
]

function HomeScreen({ onServiceSelect, onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ScreenWrapper>
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          background: NAVY,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Good morning 👋</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Inter, inherit' }}>Rahul Sharma</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                width: 38, height: 38, background: 'rgba(255,255,255,0.1)', borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>🔔</div>
              <div style={{
                width: 38, height: 38, background: ORANGE, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14, color: '#fff',
              }}>RS</div>
            </div>
          </div>

          {/* City selector */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, padding: '10px 14px',
          }}>
            <span style={{ fontSize: 16 }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>DELIVERING TO</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Banjara Hills, Hyderabad</div>
            </div>
            <span style={{ color: ORANGE, fontSize: 11, fontWeight: 700 }}>CHANGE ▾</span>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 14, padding: '12px 16px',
            boxShadow: SHADOW,
          }}>
            <span style={{ fontSize: 16 }}>🔍</span>
            <span style={{ color: TEXT2, fontSize: 14 }}>Search services, partners...</span>
          </div>
        </div>

        {/* Promo Banner */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{
            background: NAVY,
            borderRadius: 18, padding: '18px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(15,45,82,0.2)',
          }}>
            <div>
              <div style={{ fontSize: 11, color: ORANGE, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                LIMITED OFFER
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                20% off on First Wash
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                Use code: <span style={{ color: ORANGE, fontWeight: 700 }}>CARE20</span>
              </div>
            </div>
            <div style={{ fontSize: 48 }}>✨</div>
          </div>
        </div>

        {/* Services */}
        <div style={{ padding: '0 20px 24px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: 'Inter, inherit' }}>Our Services</div>
            <span style={{ fontSize: 12, color: ORANGE, fontWeight: 600, cursor: 'pointer' }}>See all →</span>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
          }}>
            {SERVICES.map(svc => (
              <div
                key={svc.name}
                onClick={() => onServiceSelect(svc)}
                style={{
                  background: NAVY,
                  borderRadius: 16, padding: '14px 10px',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'transform 0.15s ease',
                  boxShadow: '0 2px 8px rgba(15,45,82,0.15)',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>{svc.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 3, lineHeight: 1.2 }}>
                  {svc.name}
                </div>
                <div style={{ fontSize: 11, color: ORANGE, fontWeight: 700 }}>{svc.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Partners */}
        <div style={{ padding: '0 20px 24px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: 'Inter, inherit' }}>Nearby Partners</div>
            <span style={{ fontSize: 12, color: ORANGE, fontWeight: 600, cursor: 'pointer' }}>Map view →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PARTNERS.map((p, i) => (
              <div key={i} style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 16, padding: '16px',
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer',
                boxShadow: SHADOW,
              }}>
                <div style={{
                  width: 52, height: 52, background: BG2, borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
                }}>🔧</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: ORANGE }}>★ {p.rating}</span>
                    <span style={{ fontSize: 10, color: TEXT2 }}>({p.reviews})</span>
                    <span style={{ fontSize: 10, color: TEXT2 }}>• {p.dist}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{
                      fontSize: 10, background: 'rgba(21,128,61,0.1)', color: SUCCESS,
                      padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                    }}>{p.badge}</span>
                    <span style={{
                      fontSize: 10, background: 'rgba(15,45,82,0.08)', color: NAVY,
                      padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                    }}>{p.tag}</span>
                  </div>
                </div>
                <div style={{
                  background: ORANGE, color: '#fff', fontSize: 11, fontWeight: 700,
                  padding: '6px 12px', borderRadius: 10, flexShrink: 0,
                }}>Book</div>
              </div>
            ))}
          </div>
        </div>
      </ScreenWrapper>
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  )
}

// ─── Screen 4: Service Booking ────────────────────────────────────────────────

function BookingScreen({ service, onBack, onConfirm }) {
  const [selectedTime, setSelectedTime] = useState(null)
  const [selectedDate, setSelectedDate] = useState(0)
  const [selVeh, setSelVeh] = useState(0)

  const dates = ['Today', 'Tomorrow', 'Thu 23', 'Fri 24', 'Sat 25']
  const slots = [
    { id: 'morning', label: '🌅 Morning', time: '7:00 – 12:00' },
    { id: 'afternoon', label: '☀️ Afternoon', time: '12:00 – 17:00' },
    { id: 'evening', label: '🌆 Evening', time: '17:00 – 21:00' },
  ]
  const vehicles = [
    { icon: '🚗', name: 'Honda City', plate: 'TS 09 AB 1234' },
    { icon: '🏍️', name: 'Royal Enfield', plate: 'TS 09 XY 5678' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ScreenWrapper>
        {/* Header */}
        <div style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
          background: NAVY,
        }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
            borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16,
          }}>←</button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'Inter, inherit' }}>Book Service</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Configure your appointment</div>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Service Card */}
          <div style={{
            background: NAVY,
            borderRadius: 18, padding: '18px', marginBottom: 24,
            display: 'flex', gap: 16, alignItems: 'center',
            boxShadow: '0 4px 16px rgba(15,45,82,0.2)',
          }}>
            <div style={{
              width: 60, height: 60, background: 'rgba(255,255,255,0.1)',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>{service?.icon || '🔧'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4, fontFamily: 'Inter, inherit' }}>
                {service?.name || 'Car Service'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                Professional service by certified mechanics
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: ORANGE }}>
                  {service?.price || '₹999'}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>
                  {service?.price?.replace('₹', '') ? '₹' + (parseInt(service.price.replace(/[₹,]/g, '')) * 1.2).toFixed(0) : '₹1,199'}
                </div>
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 12, fontFamily: 'Inter, inherit' }}>Select Date</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {dates.map((d, i) => (
                <button key={i} onClick={() => setSelectedDate(i)} style={{
                  flexShrink: 0, padding: '8px 16px',
                  background: selectedDate === i ? NAVY : BG2,
                  border: `1px solid ${selectedDate === i ? NAVY : BORDER}`,
                  color: selectedDate === i ? '#fff' : TEXT2,
                  borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: 600, fontSize: 13,
                  transition: 'all 0.15s',
                }}>{d}</button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 12, fontFamily: 'Inter, inherit' }}>Choose Time Slot</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {slots.map(slot => (
                <div
                  key={slot.id}
                  onClick={() => setSelectedTime(slot.id)}
                  style={{
                    padding: '14px 16px', borderRadius: 14,
                    border: `1.5px solid ${selectedTime === slot.id ? ORANGE : BORDER}`,
                    background: selectedTime === slot.id ? 'rgba(232,80,10,0.04)' : CARD,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: SHADOW,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{slot.label}</div>
                    <div style={{ fontSize: 12, color: TEXT2 }}>{slot.time}</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${selectedTime === slot.id ? ORANGE : BORDER}`,
                    background: selectedTime === slot.id ? ORANGE : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {selectedTime === slot.id && (
                      <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 12, fontFamily: 'Inter, inherit' }}>Select Vehicle</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vehicles.map((v, i) => (
                <div key={i} onClick={() => setSelVeh(i)} style={{
                  padding: '14px 16px', borderRadius: 14,
                  border: `1.5px solid ${selVeh === i ? NAVY : BORDER}`,
                  background: selVeh === i ? 'rgba(15,45,82,0.04)' : CARD,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: SHADOW,
                  transition: 'border-color 0.15s',
                }}>
                  <span style={{ fontSize: 24 }}>{v.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{v.name}</div>
                    <div style={{ fontSize: 12, color: TEXT2, letterSpacing: 1 }}>{v.plate}</div>
                  </div>
                  {selVeh === i && <span style={{ color: SUCCESS, fontSize: 16, fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 12, fontFamily: 'Inter, inherit' }}>Service Address</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: BG2, border: `1.5px solid ${BORDER}`,
              borderRadius: 14, padding: '14px 16px',
            }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Road No. 12, Banjara Hills</div>
                <div style={{ fontSize: 11, color: TEXT2 }}>Hyderabad, Telangana — 500034</div>
              </div>
              <span style={{ color: NAVY, fontSize: 11, fontWeight: 700 }}>CHANGE</span>
            </div>
          </div>

          {/* Price Summary */}
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: '16px', marginBottom: 24,
            boxShadow: SHADOW,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 12, fontFamily: 'Inter, inherit' }}>Price Summary</div>
            {[
              ['Service Charge', service?.price || '₹999'],
              ['Platform Fee', '₹49'],
              ['GST (18%)', '₹94'],
            ].map(([label, val]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: 8,
              }}>
                <span style={{ fontSize: 13, color: TEXT2 }}>{label}</span>
                <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{val}</span>
              </div>
            ))}
            <div style={{ height: 1, background: BORDER, margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>₹1,142</span>
            </div>
          </div>

          <NavyButton variant="orange" onClick={onConfirm}>Proceed to Pay →</NavyButton>
        </div>
      </ScreenWrapper>
    </div>
  )
}

// ─── Screen 5: Active Booking Tracker ────────────────────────────────────────

function TrackerScreen({ service, onBack, onNavigate }) {
  const steps = [
    { label: 'Confirmed', done: true },
    { label: 'Partner Assigned', done: true },
    { label: 'En Route', done: true },
    { label: 'In Progress', done: false, active: true },
    { label: 'Done', done: false },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ScreenWrapper>
        {/* Header */}
        <div style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
          background: NAVY,
        }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
            borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16,
          }}>←</button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'Inter, inherit' }}>Live Tracking</div>
            <div style={{ fontSize: 12, color: '#4ade80' }}>● In Progress</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Booking #AX4821</div>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Map Placeholder */}
          <div style={{
            height: 200, background: BG2,
            borderRadius: 20, marginBottom: 20,
            border: `1px solid ${BORDER}`,
            overflow: 'hidden', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: SHADOW,
          }}>
            {[...Array(6)].map((_, i) => (
              <div key={`h${i}`} style={{
                position: 'absolute', left: 0, right: 0,
                top: `${(i + 1) * 100 / 7}%`, height: 1,
                background: 'rgba(15,45,82,0.06)',
              }} />
            ))}
            {[...Array(6)].map((_, i) => (
              <div key={`v${i}`} style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${(i + 1) * 100 / 7}%`, width: 1,
                background: 'rgba(15,45,82,0.06)',
              }} />
            ))}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <path
                d="M 60 160 Q 120 100 180 90 Q 240 80 280 60"
                stroke={NAVY} strokeWidth="2.5" fill="none"
                strokeDasharray="6 4" opacity="0.4"
              />
              <circle cx="200" cy="84" r="8" fill={ORANGE} opacity="0.9" />
              <circle cx="200" cy="84" r="14" fill={ORANGE} opacity="0.2" />
              <circle cx="60" cy="160" r="8" fill={SUCCESS} />
              <circle cx="60" cy="160" r="14" fill={SUCCESS} opacity="0.2" />
            </svg>
            <div style={{
              position: 'absolute', bottom: 12, left: 0, right: 0,
              display: 'flex', justifyContent: 'space-between', padding: '0 16px',
            }}>
              <span style={{
                background: SUCCESS, color: '#fff', fontSize: 10,
                fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              }}>📍 Your location</span>
              <span style={{
                background: ORANGE, color: '#fff', fontSize: 10,
                fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              }}>🔧 Partner</span>
            </div>
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: NAVY, borderRadius: 10,
              padding: '6px 12px',
            }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>⏱ 8 min away</span>
            </div>
          </div>

          {/* ETA Card */}
          <div style={{
            background: NAVY,
            borderRadius: 16, padding: '16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(15,45,82,0.2)',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, marginBottom: 4 }}>
                ESTIMATED ARRIVAL
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>8 min</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Partner is on the way</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Arrives by</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>10:48 AM</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Today</div>
            </div>
          </div>

          {/* Progress Steps */}
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: '16px', marginBottom: 20,
            boxShadow: SHADOW,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 16, fontFamily: 'Inter, inherit' }}>Booking Progress</div>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: step.done ? SUCCESS : step.active ? 'rgba(15,45,82,0.1)' : BG2,
                    border: step.active ? `2px solid ${NAVY}` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: step.done ? '#fff' : step.active ? NAVY : TEXT2,
                    fontWeight: 800, flexShrink: 0,
                  }}>
                    {step.done ? '✓' : step.active ? '●' : '○'}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      width: 2, height: 28,
                      background: step.done ? SUCCESS : BORDER,
                    }} />
                  )}
                </div>
                <div style={{ paddingTop: 4, paddingBottom: i < steps.length - 1 ? 16 : 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: step.done ? TEXT : step.active ? NAVY : TEXT2,
                  }}>{step.label}</div>
                  {step.done && !step.active && (
                    <div style={{ fontSize: 11, color: TEXT2 }}>Completed</div>
                  )}
                  {step.active && (
                    <div style={{ fontSize: 11, color: SUCCESS }}>Currently in progress</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Partner Card */}
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: '16px', marginBottom: 20,
            boxShadow: SHADOW,
          }}>
            <div style={{ fontSize: 12, color: TEXT2, fontWeight: 600, marginBottom: 12 }}>YOUR PARTNER</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, background: BG2, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>👨‍🔧</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Ravi Kumar</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>SparkAuto Workshop</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                  <span style={{ color: ORANGE, fontSize: 12 }}>★ 4.9</span>
                  <span style={{ fontSize: 11, color: TEXT2 }}>• 342 jobs done</span>
                </div>
              </div>
              <div style={{
                background: 'rgba(21,128,61,0.1)', border: '1px solid rgba(21,128,61,0.2)',
                color: SUCCESS, fontSize: 10, fontWeight: 700,
                padding: '4px 10px', borderRadius: 10,
              }}>VERIFIED</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{
                flex: 1, padding: '12px 0',
                background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.2)',
                color: SUCCESS, borderRadius: 12, cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
              }}>📞 Call</button>
              <button style={{
                flex: 1, padding: '12px 0',
                background: 'rgba(15,45,82,0.06)', border: `1px solid ${BORDER}`,
                color: NAVY, borderRadius: 12, cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
              }}>💬 Chat</button>
            </div>
          </div>
        </div>
      </ScreenWrapper>
      <BottomNav active="bookings" onNavigate={onNavigate} />
    </div>
  )
}

// ─── Screen 6: Profile ────────────────────────────────────────────────────────

function ProfileScreen({ onNavigate }) {
  const menuItems = [
    { icon: '🚗', label: 'My Vehicles', sub: '2 vehicles registered' },
    { icon: '🔄', label: 'My Subscriptions', sub: 'AutoCare Gold — Active' },
    { icon: '💳', label: 'Wallet & Payments', sub: '₹2,450 balance' },
    { icon: '🛡️', label: 'Insurance', sub: 'View active policies' },
    { icon: '🎁', label: 'Refer & Earn', sub: 'Earn ₹200 per referral' },
    { icon: '⚙️', label: 'Settings', sub: 'Notifications, privacy, etc.' },
    { icon: '🚪', label: 'Logout', sub: '', danger: true },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ScreenWrapper>
        {/* Header */}
        <div style={{
          padding: '28px 20px 24px',
          background: NAVY,
          textAlign: 'center',
        }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            <div style={{
              width: 80, height: 80,
              background: ORANGE,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 800, color: '#fff',
              boxShadow: '0 4px 20px rgba(232,80,10,0.4)',
            }}>RS</div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 24, height: 24, background: SUCCESS, borderRadius: '50%',
              border: `2px solid ${NAVY}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700,
            }}>✓</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4, fontFamily: 'Inter, inherit' }}>Rahul Sharma</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>+91 98765 43210</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20, padding: '4px 14px',
          }}>
            <span style={{ fontSize: 12 }}>👑</span>
            <span style={{ fontSize: 12, color: ORANGE, fontWeight: 700 }}>Gold Member</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 18, padding: '16px',
            display: 'flex', justifyContent: 'space-around',
            boxShadow: SHADOW,
          }}>
            {[
              { val: '12', label: 'Bookings' },
              { val: '₹8,240', label: 'Spent' },
              { val: '4.8★', label: 'Avg Rating' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 4 }}>{stat.val}</div>
                <div style={{ fontSize: 11, color: TEXT2, fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div style={{ padding: '0 20px 32px' }}>
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 18, overflow: 'hidden',
            boxShadow: SHADOW,
          }}>
            {menuItems.map((item, i) => (
              <div key={i} style={{
                padding: '16px', display: 'flex', alignItems: 'center', gap: 14,
                borderBottom: i < menuItems.length - 1 ? `1px solid ${BORDER}` : 'none',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = BG2}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 40, height: 40,
                  background: item.danger ? 'rgba(220,38,38,0.08)' : BG2,
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: item.danger ? '#DC2626' : TEXT }}>
                    {item.label}
                  </div>
                  {item.sub && (
                    <div style={{ fontSize: 11, color: TEXT2 }}>{item.sub}</div>
                  )}
                </div>
                {!item.danger && (
                  <span style={{ color: TEXT2, fontSize: 18 }}>›</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScreenWrapper>
      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  )
}

// ─── Bookings Screen ──────────────────────────────────────────────────────────

function BookingsListScreen({ onNavigate, onTrack }) {
  const bookings = [
    { id: '#AX4821', service: 'Engine Service', partner: 'SparkAuto Workshop', date: 'Today, 10:40 AM', status: 'In Progress', icon: '🔧' },
    { id: '#AX4800', service: 'Car Wash', partner: 'PitStop Pro Service', date: 'Yesterday, 3:00 PM', status: 'Completed', icon: '🚿' },
    { id: '#AX4780', service: 'Oil Change', partner: 'QuickFix Garage', date: 'May 18, 11:00 AM', status: 'Completed', icon: '🛢️' },
  ]

  const statusStyle = s => ({
    'In Progress': { color: ORANGE, bg: 'rgba(232,80,10,0.08)' },
    'Completed': { color: SUCCESS, bg: 'rgba(21,128,61,0.08)' },
    'Cancelled': { color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  }[s] || { color: TEXT2, bg: BG2 })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ScreenWrapper>
        <div style={{ padding: '20px 20px 8px', background: NAVY }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4, fontFamily: 'Inter, inherit' }}>My Bookings</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', paddingBottom: 16 }}>Track all your service requests</div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.map((b, i) => {
            const ss = statusStyle(b.status)
            return (
              <div key={i} style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 16, padding: '16px', cursor: 'pointer',
                boxShadow: SHADOW,
              }}
                onClick={b.status === 'In Progress' ? onTrack : undefined}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: TEXT2, fontWeight: 600 }}>{b.id}</span>
                  <span style={{
                    fontSize: 11, color: ss.color,
                    background: ss.bg,
                    padding: '3px 10px', borderRadius: 10, fontWeight: 700,
                  }}>{b.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 44, height: 44, background: BG2, borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>{b.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{b.service}</div>
                    <div style={{ fontSize: 12, color: TEXT2 }}>{b.partner}</div>
                    <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>📅 {b.date}</div>
                  </div>
                  {b.status === 'In Progress' && (
                    <div style={{
                      background: ORANGE, color: '#fff', fontSize: 10, fontWeight: 700,
                      padding: '6px 10px', borderRadius: 10,
                    }}>Track</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScreenWrapper>
      <BottomNav active="bookings" onNavigate={onNavigate} />
    </div>
  )
}

// ─── Wallet Screen ────────────────────────────────────────────────────────────

function WalletScreen({ onNavigate }) {
  const txns = [
    { icon: '🔧', label: 'Engine Service Refund', date: 'May 22', amount: '+₹200', credit: true },
    { icon: '🚿', label: 'Car Wash Booking', date: 'May 20', amount: '-₹399', credit: false },
    { icon: '🎁', label: 'Referral Bonus', date: 'May 18', amount: '+₹200', credit: true },
    { icon: '💳', label: 'Wallet Topup', date: 'May 15', amount: '+₹1,000', credit: true },
    { icon: '🛢️', label: 'Oil Change Payment', date: 'May 12', amount: '-₹799', credit: false },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ScreenWrapper>
        <div style={{
          padding: '28px 20px 24px',
          background: NAVY,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20, fontFamily: 'Inter, inherit' }}>Wallet</div>
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20, padding: '24px',
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 600 }}>AVAILABLE BALANCE</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 16 }}>₹2,450</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{
                flex: 1, padding: '10px 0', background: ORANGE, border: 'none',
                borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#fff',
              }}>Add Money</button>
              <button style={{
                flex: 1, padding: '10px 0', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#fff',
              }}>Send</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 20px 32px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 14, fontFamily: 'Inter, inherit' }}>Recent Transactions</div>
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden',
            boxShadow: SHADOW,
          }}>
            {txns.map((t, i) => (
              <div key={i} style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < txns.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}>
                <div style={{
                  width: 40, height: 40, background: BG2, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: TEXT2 }}>{t.date}</div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: t.credit ? SUCCESS : '#DC2626',
                }}>{t.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </ScreenWrapper>
      <BottomNav active="wallet" onNavigate={onNavigate} />
    </div>
  )
}

// ─── Root CustomerApp ─────────────────────────────────────────────────────────

export default function CustomerApp() {
  const [screen, setScreen] = useState('splash')
  const [selectedService, setSelectedService] = useState(null)
  const [activeTab, setActiveTab] = useState('home')

  const navigate = (tab) => {
    setActiveTab(tab)
    setScreen(tab)
  }

  const handleServiceSelect = (svc) => {
    setSelectedService(svc)
    setScreen('booking')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 750 }}>
      {screen === 'splash' && (
        <SplashScreen onNext={() => setScreen('login')} />
      )}
      {screen === 'login' && (
        <LoginScreen onNext={() => { setScreen('home'); setActiveTab('home') }} />
      )}
      {screen === 'home' && (
        <HomeScreen onServiceSelect={handleServiceSelect} onNavigate={navigate} />
      )}
      {screen === 'bookings' && (
        <BookingsListScreen
          onNavigate={navigate}
          onTrack={() => setScreen('tracker')}
        />
      )}
      {screen === 'wallet' && (
        <WalletScreen onNavigate={navigate} />
      )}
      {screen === 'profile' && (
        <ProfileScreen onNavigate={navigate} />
      )}
      {screen === 'booking' && (
        <BookingScreen
          service={selectedService}
          onBack={() => setScreen('home')}
          onConfirm={() => setScreen('tracker')}
        />
      )}
      {screen === 'tracker' && (
        <TrackerScreen
          service={selectedService}
          onBack={() => setScreen('bookings')}
          onNavigate={navigate}
        />
      )}
    </div>
  )
}
