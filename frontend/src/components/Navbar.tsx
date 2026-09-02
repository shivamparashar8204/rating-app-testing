import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export function Navbar({ onSearch }: NavbarProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'ADMIN':
        return '/admin';
      case 'STORE_OWNER':
        return '/store-owner';
      case 'CUSTOMER':
        return '/customer';
      default:
        return '/';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">★</span>
          <span className="navbar-brand-text">5 Star Reviews</span>
        </Link>

        <div className="navbar-search">
          <input
            type="text"
            placeholder="Search restaurants by name, cuisine or city..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="navbar-search-input"
          />
        </div>

        <button
          className="navbar-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>

        <div className={`navbar-actions ${isMobileMenuOpen ? 'open' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link to={getDashboardLink()} className="btn btn-nav">
                Dashboard
              </Link>
              <button className="btn btn-nav" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-nav">
                Log In
              </Link>
              <Link to="/signup" className="btn btn-nav btn-nav-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
