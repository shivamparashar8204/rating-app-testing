import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function ChangePassword() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (!pwd) return 'Password is required';
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (pwd.length > 16) return 'Password must be at most 16 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd)) return 'Password must contain at least one special character';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Current password is required');
      return;
    }

    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) {
      setError(newPasswordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="auth-header">
        <span className="auth-logo">🔑</span>
        <h1>Change Password</h1>
        <p>Update your account password</p>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="8-16 chars, 1 uppercase, 1 special"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
