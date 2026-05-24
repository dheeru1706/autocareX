import React, { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import CustomerApp from './apps/CustomerApp.jsx'
import FranchiseApp from './apps/FranchiseApp.jsx'

const NAVY = '#0F2D52'
const ORANGE = '#E8500A'
const BG = '#F5F7FA'
const BORDER = '#E5E7EB'

export default function App() {
  const [activeTab, setActiveTab] = useState('customer')

  return (
    <BrowserRouter>
      <div style={{
        minHeight: '100vh',
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        {/* Top Bar */}
        <div style={{
          width: '100%',
          background: '#FFFFFF',
          borderBottom: `1px solid ${BORDER}`,
          padding: '12px 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 1px 8px rgba(15,45,82,0.08)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 32 }}>
            <div style={{
              width: 34, height: 34, background: NAVY, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🚗</div>
            <span style={{ color: NAVY, fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>
              AutoCare<span style={{ color: ORANGE }}>X</span>
            </span>
            <span style={{
              background: BG, color: '#6C7280', fontSize: 10,
              padding: '2px 8px', borderRadius: 20, fontWeight: 600, letterSpacing: 1,
              border: `1px solid ${BORDER}`,
            }}>PREVIEW</span>
          </div>

          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            background: BG,
            borderRadius: 12,
            padding: 4,
            border: `1px solid ${BORDER}`,
          }}>
            {[
              { id: 'customer', label: '👤 Customer App' },
              { id: 'franchise', label: '🏪 Partner App' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 9,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  background: activeTab === tab.id ? NAVY : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#6C7280',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone Frame Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '40px 20px 60px',
        }}>
          <div style={{
            width: 390,
            minHeight: 844,
            background: '#FFFFFF',
            borderRadius: 40,
            overflow: 'hidden',
            boxShadow: `
              0 0 0 8px #E5E7EB,
              0 0 0 9px #D1D5DB,
              0 40px 80px rgba(15,45,82,0.18),
              0 20px 40px rgba(15,45,82,0.10)
            `,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Phone Notch */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 126,
              height: 34,
              background: NAVY,
              borderRadius: '0 0 20px 20px',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}>
              <div style={{ width: 8, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} />
              <div style={{ width: 70, height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3 }} />
            </div>

            {/* Status Bar */}
            <div style={{
              height: 44,
              background: NAVY,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: '0 24px 6px',
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              flexShrink: 0,
            }}>
              <span>9:41</span>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 10 }}>▋▋▋</span>
                <span style={{ fontSize: 10 }}>WiFi</span>
                <span style={{ fontSize: 10 }}>🔋</span>
              </div>
            </div>

            {/* App Content */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {activeTab === 'customer' ? <CustomerApp /> : <FranchiseApp />}
            </div>
          </div>
        </div>
      </div>
    </BrowserRouter>
  )
}
