import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileForm from '../components/account/ProfileForm'
import AddressBook from '../components/account/AddressBook'
import toast from 'react-hot-toast'

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
const NAV_TABS = [
  { id: 'profile',   label: 'Profile',   icon: 'bi-person' },
  { id: 'addresses', label: 'Addresses', icon: 'bi-geo-alt' },
  { id: 'security',  label: 'Security',  icon: 'bi-shield-lock' },
]

const NAV_LINKS = [
  { to: '/orders',   label: 'My Orders', icon: 'bi-bag' },
  { to: '/wishlist', label: 'Wishlist',  icon: 'bi-heart' },
]

// ─── Account page ─────────────────────────────────────────────────────────────
const Account = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean).join('').toUpperCase() || 'U'

  return (
    <>
      <Helmet>
        <title>{`My Account — Iko Nini TV`}</title>
      </Helmet>

      <div className="container">

        {/* Page header */}
        <div className="section-header" style={{ marginBottom: '1.5rem' }}>
          <h2 className="section-title">
            <span className="section-title-accent"></span>
            My Account
          </h2>
        </div>

        <div className="layout-sidebar">

          {/* ── Left nav ───────────────────────────────────────────────── */}
          <aside>
            {/* User card */}
            <div style={{
              background: 'white',
              border: '1px solid var(--gray-150)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
            }}>
              <div style={{
                width: '48px', height: '48px',
                borderRadius: '50%',
                background: 'var(--brand-red)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 'var(--text-lg)',
                fontFamily: 'var(--font-display)',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: 'var(--text-sm)',
                  color: 'var(--gray-900)',
                  fontFamily: 'var(--font-display)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)', color: 'var(--gray-500)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Nav panel */}
            <div className="sidebar" style={{ padding: '0.5rem' }}>

              {/* Tab buttons */}
              {NAV_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="dropdown-menu-item"
                  style={{
                    width: '100%', background: 'none', border: 'none',
                    textAlign: 'left', cursor: 'pointer',
                    borderRadius: 'var(--radius)',
                    backgroundColor: activeTab === tab.id ? 'var(--brand-red-pale)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--brand-red)' : 'var(--gray-700)',
                    fontWeight: activeTab === tab.id ? 700 : 400,
                    borderLeft: activeTab === tab.id ? '3px solid var(--brand-red)' : '3px solid transparent',
                  }}
                >
                  <i className={`bi ${tab.icon}`}
                    style={{ color: activeTab === tab.id ? 'var(--brand-red)' : 'var(--gray-400)' }}
                  ></i>
                  {tab.label}
                </button>
              ))}

              <div className="dropdown-divider" style={{ margin: '0.5rem 0' }}></div>

              {/* Nav links */}
              {NAV_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="dropdown-menu-item"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <i className={`bi ${link.icon}`}></i>
                  {link.label}
                </Link>
              ))}

              <div className="dropdown-divider" style={{ margin: '0.5rem 0' }}></div>

              {/* Logout */}
              <button
                onClick={logout}
                className="dropdown-menu-item danger"
                style={{
                  width: '100%', background: 'none', border: 'none',
                  textAlign: 'left', cursor: 'pointer',
                  borderRadius: 'var(--radius)',
                }}
              >
                <i className="bi bi-box-arrow-right"></i>
                Sign Out
              </button>

            </div>
          </aside>

          {/* ── Right content ───────────────────────────────────────────── */}
          <div>
            {activeTab === 'profile'   && <ProfileForm />}
            {activeTab === 'addresses' && <AddressBook />}
            {activeTab === 'security'  && <SecuritySettings />}
          </div>

        </div>
      </div>
    </>
  )
}

// ─── Security / change password ───────────────────────────────────────────────
const SecuritySettings = () => {
  const { changePassword } = useAuth()
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    old: false, new: false, confirm: false,
  })

  const set = (field) => (e) =>
    setFormData(d => ({ ...d, [field]: e.target.value }))

  const toggleShow = (key) =>
    setShowPasswords(s => ({ ...s, [key]: !s[key] }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.new_password !== formData.new_password2) {
      toast.error('New passwords do not match')
      return
    }
    setLoading(true)
    const result = await changePassword(
      formData.old_password,
      formData.new_password,
      formData.new_password2,
    )
    setLoading(false)
    if (result?.success) {
      setFormData({ old_password: '', new_password: '', new_password2: '' })
    }
  }

  const PasswordField = ({ label, field, showKey, required = true }) => (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="form-label-required"> *</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={showPasswords[showKey] ? 'text' : 'password'}
          className="form-control"
          value={formData[field]}
          onChange={set(field)}
          required={required}
          style={{ paddingRight: '2.75rem' }}
        />
        <button
          type="button"
          onClick={() => toggleShow(showKey)}
          style={{
            position: 'absolute', right: '0.75rem', top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--gray-400)', fontSize: '1rem', padding: 0,
          }}
        >
          <i className={`bi ${showPasswords[showKey] ? 'bi-eye-slash' : 'bi-eye'}`}></i>
        </button>
      </div>
    </div>
  )

  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--gray-150)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--gray-150)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: 'var(--text-base)',
      }}>
        <i className="bi bi-shield-lock" style={{ color: 'var(--brand-red)' }}></i>
        Change Password
      </div>

      <div style={{ padding: '1.25rem', maxWidth: '480px' }}>

        <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
          <i className="bi bi-info-circle"></i>
          <div className="alert-content">
            Use a strong password with at least 8 characters, including numbers and symbols.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <PasswordField
            label="Current Password"
            field="old_password"
            showKey="old"
          />
          <PasswordField
            label="New Password"
            field="new_password"
            showKey="new"
          />
          <PasswordField
            label="Confirm New Password"
            field="new_password2"
            showKey="confirm"
          />

          {/* Password match indicator */}
          {formData.new_password2 && (
            <div style={{
              fontSize: 'var(--text-xs)',
              color: formData.new_password === formData.new_password2
                ? 'var(--color-success)' : 'var(--color-danger)',
              marginTop: '-0.75rem',
              marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
            }}>
              <i className={`bi ${formData.new_password === formData.new_password2
                ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}
              ></i>
              {formData.new_password === formData.new_password2
                ? 'Passwords match' : 'Passwords do not match'}
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Account