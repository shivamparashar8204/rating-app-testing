import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { DEMO_CUSTOMER, DEMO_STORE_OWNER, DEMO_ADMIN } from '../config/demo';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export function LoginPage() {
  const { login, googleLogin, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'STORE_OWNER':
          navigate('/store-owner');
          break;
        case 'CUSTOMER':
          navigate('/customer');
          break;
        default:
          navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const initializeGoogle = () => {
      if (!googleClientId) {
        console.error('[auth] VITE_GOOGLE_CLIENT_ID is not set. Configure it in Vercel and redeploy to enable Google sign-in.');
        setGoogleError('Google sign-in is not configured. Please use email and password instead.');
        return;
      }
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
        });

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
          });
        }
      }
    };

    const handleScriptError = () => {
      console.error('[auth] Google Identity Services script failed to load.');
      setGoogleError('Google sign-in is temporarily unavailable. Please use email and password instead.');
    };

    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      initializeGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      script.onerror = handleScriptError;
      document.head.appendChild(script);
    }
  }, [googleClientId]);

  const handleGoogleResponse = async (response: { credential: string }) => {
    setError('');
    setIsLoading(true);

    try {
      await googleLogin(response.credential);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!role) {
      setError('Please select an account type');
      return;
    }

    setIsLoading(true);

    try {
      await login({ email, password, role: role as UserRole });
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">★</span>
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {googleError && <div className="auth-google-warning">{googleError}</div>}

        <div ref={googleButtonRef} className="google-button-container"></div>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole | '')}
              className="role-select"
              required
            >
              <option value="">Select account type</option>
              <option value="CUSTOMER">Customer</option>
              <option value="STORE_OWNER">Store Owner</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>

          {role === 'CUSTOMER' && (
            <div className="demo-section">
              <div className="demo-badge">Testing Mode</div>
              <p className="demo-info">
                Don't have an account? Use the demo customer to explore.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-full demo-btn"
                onClick={() => {
                  setEmail(DEMO_CUSTOMER.email);
                  setPassword(DEMO_CUSTOMER.password);
                }}
              >
                Use Demo Customer
              </button>
              <div className="demo-credentials">
                <span className="demo-cred-label">Demo Customer</span>
                <span className="demo-cred-value">{DEMO_CUSTOMER.email}</span>
                <span className="demo-cred-value">{'•'.repeat(DEMO_CUSTOMER.password.length)}</span>
              </div>
            </div>
          )}

          {role === 'STORE_OWNER' && (
            <div className="demo-section">
              <div className="demo-badge">Testing Mode</div>
              <p className="demo-info">
                Use the demo store owner to explore the store-owner dashboard.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-full demo-btn"
                onClick={() => {
                  setEmail(DEMO_STORE_OWNER.email);
                  setPassword(DEMO_STORE_OWNER.password);
                }}
              >
                Use Demo Store Owner
              </button>
              <div className="demo-credentials">
                <span className="demo-cred-label">Demo Store Owner</span>
                <span className="demo-cred-value">{DEMO_STORE_OWNER.email}</span>
                <span className="demo-cred-value">{'•'.repeat(DEMO_STORE_OWNER.password.length)}</span>
              </div>
            </div>
          )}

          {role === 'ADMIN' && (
            <div className="demo-section">
              <div className="demo-badge">Testing Mode</div>
              <p className="demo-info">
                Use the demo admin to explore the admin dashboard.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-full demo-btn"
                onClick={() => {
                  setEmail(DEMO_ADMIN.email);
                  setPassword(DEMO_ADMIN.password);
                }}
              >
                Use Demo Admin
              </button>
              <div className="demo-credentials">
                <span className="demo-cred-label">Demo Admin</span>
                <span className="demo-cred-value">{DEMO_ADMIN.email}</span>
                <span className="demo-cred-value">{'•'.repeat(DEMO_ADMIN.password.length)}</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
