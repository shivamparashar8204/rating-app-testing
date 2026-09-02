import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedActionProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedAction({ children, fallback }: ProtectedActionProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="protected-action-prompt">
        <span className="protected-action-icon">🔒</span>
        <p>Log in or sign up to access this feature</p>
        <div className="protected-action-buttons">
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Log In
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/signup')}>
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
