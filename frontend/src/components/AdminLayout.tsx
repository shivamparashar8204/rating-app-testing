import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Admin Dashboard',
  '/admin/customers': 'Manage Customers',
  '/admin/users': 'Manage Users',
  '/admin/store-owners': 'Manage Store Owners',
  '/admin/stores': 'Manage Stores',
  '/admin/reviews': 'Manage Reviews',
};

export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] || 'Admin Dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-logo">★</span>
          <span className="admin-sidebar-brand">Admin Panel</span>
        </div>
        <nav className="admin-sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">📊</span>
            Dashboard
          </NavLink>
          <NavLink to="/admin/customers" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">👤</span>
            Customers
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">🗂️</span>
            Users
          </NavLink>
          <NavLink to="/admin/store-owners" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">🏪</span>
            Store Owners
          </NavLink>
          <NavLink to="/admin/stores" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">🏬</span>
            Stores
          </NavLink>
          <NavLink to="/admin/reviews" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">⭐</span>
            Reviews
          </NavLink>
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            <span className="admin-nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <h1 className="admin-page-title">{pageTitle}</h1>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
