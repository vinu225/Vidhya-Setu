import React, { useState } from 'react';
import { api, UserInfo } from '../services/api';
import '../apaar.css';
import { ClerkLogin } from '../components/ClerkLogin';

interface LoginPageProps {
  onLoginSuccess: (userInfo: UserInfo) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  const [authMethod, setAuthMethod] = useState<'password' | 'clerk'>('password');
  const [username, setUsername] = useState('aicte_admin');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username/email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.login(username.trim(), password);
      onLoginSuccess(res.user_info);
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect email/username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div className="ap">
      <div className="login">
        {/* Left Hero Panel */}
        <div className="l">
          <div className="brand" style={{ padding: 0, marginBottom: 24 }}>
            <i>✓</i>
            <span>APAAR-Verify</span>
          </div>
          <h1>One verified record for every student.</h1>
          <p style={{ maxWidth: 460, color: '#CBD5E1', fontSize: 15, lineHeight: 1.6 }}>
            AICTE sovereign student verification platform for real-time institutional intake surveillance,
            Verhoeff checksum validation, and DPDP Act 2023 verifiable credentials.
          </p>

          <div style={{ marginTop: 32, display: 'grid', gap: 12, maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94A3B8', fontSize: 13 }}>
              <span className="badge green" style={{ width: 22, height: 22, padding: 0, justifyContent: 'center' }}>✓</span>
              <span>241 approved institutions live in Supabase PostgreSQL</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94A3B8', fontSize: 13 }}>
              <span className="badge sky" style={{ width: 22, height: 22, padding: 0, justifyContent: 'center' }}>i</span>
              <span>NEP 2020 & APAAR ID sovereign academic key standard</span>
            </div>
          </div>
        </div>

        {/* Right Sign-in Form Panel */}
        <div className="r">
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2>Sign in</h2>
                <p className="sub" style={{ margin: '4px 0 0' }}>Use your registered credentials.</p>
              </div>
              {hasClerk && (
                <div className="row" style={{ gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('password')}
                    className={`btn ${authMethod === 'password' ? 'pri' : ''}`}
                    style={{ padding: '4px 10px', fontSize: 12 }}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('clerk')}
                    className={`btn ${authMethod === 'clerk' ? 'pri' : ''}`}
                    style={{ padding: '4px 10px', fontSize: 12 }}
                  >
                    Clerk SSO
                  </button>
                </div>
              )}
            </div>

            {authMethod === 'clerk' ? (
              <div style={{ marginTop: 16 }}>
                <ClerkLogin onLoginSuccess={onLoginSuccess} />
              </div>
            ) : (
              <form onSubmit={handleLogin} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
                {errorMsg && (
                  <div className="badge red" style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
                    <span aria-hidden style={{ fontWeight: 700 }}>✕</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <label className="field">
                  <span>Email or username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="name@institution.edu.in"
                    disabled={loading}
                    autoComplete="username"
                    required
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <div className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      autoComplete="current-password"
                      style={{ flex: 1 }}
                      required
                    />
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ minWidth: 64 }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  className="btn pri"
                  disabled={loading}
                  style={{ width: '100%', padding: '11px', marginTop: 8, fontWeight: 600 }}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>

                {/* Quick Persona Access for Evaluators */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--mist)' }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Quick evaluation personas:</div>
                  <div className="row" style={{ gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setDemoCredentials('aicte_admin', 'Admin@123')}
                      className="btn"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      AICTE Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoCredentials('dtu_admin', 'College@123')}
                      className="btn"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      DTU Delhi
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoCredentials('knit_deo', 'College@123')}
                      className="btn"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      KNIT DEO
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoCredentials('auditor', 'Auditor@123')}
                      className="btn"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      Auditor
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoCredentials('verifier', 'Verifier@123')}
                      className="btn"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      Verifier
                    </button>
                  </div>
                </div>

                <p className="sub" style={{ marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                  Role-based portal. All sign-ins are immutably logged to the DPDP Audit Vault.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
