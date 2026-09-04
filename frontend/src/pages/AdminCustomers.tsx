import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import { AdminUserDetail } from '../types';

export function AdminCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<AdminUserDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminUserDetail | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadCustomers();
  }, [sortField, sortOrder]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {
        role: 'CUSTOMER',
        sortBy: sortField,
        order: sortOrder,
      };
      if (search) {
        params.name = search;
      }
      if (emailFilter) {
        params.email = emailFilter;
      }
      if (addressFilter) {
        params.address = addressFilter;
      }
      const data = await adminApi.getUsers(params);
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
      showToast('Failed to load customers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = () => {
    loadCustomers();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
  };

  const validateForm = (data: typeof formData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.name || data.name.length < 20) {
      errors.name = 'Name must be at least 20 characters';
    } else if (data.name.length > 60) {
      errors.name = 'Name must be at most 60 characters';
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!data.address) {
      errors.address = 'Address is required';
    } else if (data.address.length > 400) {
      errors.address = 'Address must be at most 400 characters';
    }

    if (!data.password) {
      errors.password = 'Password is required';
    } else if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (data.password.length > 16) {
      errors.password = 'Password must be at most 16 characters';
    } else if (!/[A-Z]/.test(data.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(data.password)) {
      errors.password = 'Password must contain at least one special character';
    }

    return errors;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      setIsSubmitting(true);
      await adminApi.createUser({ ...formData, role: 'CUSTOMER' });
      showToast('Customer created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', address: '', password: '' });
      loadCustomers();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showToast(apiError.response?.data?.message || 'Failed to create customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const errors: Record<string, string> = {};
    if (!editFormData.name || editFormData.name.length < 20) {
      errors.name = 'Name must be at least 20 characters';
    } else if (editFormData.name.length > 60) {
      errors.name = 'Name must be at most 60 characters';
    }
    if (!editFormData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!editFormData.address) {
      errors.address = 'Address is required';
    } else if (editFormData.address.length > 400) {
      errors.address = 'Address must be at most 400 characters';
    }
    if (editFormData.password && (editFormData.password.length < 8 || editFormData.password.length > 16)) {
      errors.password = 'Password must be 8-16 characters';
    } else if (editFormData.password && !/[A-Z]/.test(editFormData.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (editFormData.password && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(editFormData.password)) {
      errors.password = 'Password must contain at least one special character';
    }

    setEditFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setIsSubmitting(true);
      const updateData: Record<string, string> = {
        name: editFormData.name,
        email: editFormData.email,
        address: editFormData.address,
      };
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }
      await adminApi.updateUser(selectedCustomer.id, updateData);
      showToast('Customer updated successfully', 'success');
      setShowEditModal(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showToast(apiError.response?.data?.message || 'Failed to update customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (customer: AdminUserDetail) => {
    setSelectedCustomer(customer);
    setEditFormData({
      name: customer.name,
      email: customer.email,
      address: customer.address || '',
      password: '',
    });
    setEditFormErrors({});
    setShowEditModal(true);
  };

  return (
    <div className="admin-page">
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="admin-page-header">
        <h2>Customers</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Customer
        </button>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="admin-search-input"
        />
        <input
          type="text"
          placeholder="Filter by email..."
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="admin-search-input"
        />
        <input
          type="text"
          placeholder="Filter by address..."
          value={addressFilter}
          onChange={(e) => setAddressFilter(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="admin-search-input"
        />
        <button className="btn btn-secondary" onClick={handleSearch}>Search</button>
      </div>

      {isLoading ? (
        <div className="admin-loading">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="admin-empty-state">No customers found</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  Name {sortField === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('email')} className="sortable">
                  Email {sortField === 'email' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th>Address</th>
                <th onClick={() => handleSort('created_at')} className="sortable">
                  Created {sortField === 'created_at' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.address || '-'}</td>
                  <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => navigate(`/admin/users/${customer.id}`)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEditModal(customer)}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Create Customer</h3>
              <button className="admin-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className="admin-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name (20-60 characters)"
                />
                {formErrors.name && <span className="form-error">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
                {formErrors.email && <span className="form-error">{formErrors.email}</span>}
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                />
                {formErrors.address && <span className="form-error">{formErrors.address}</span>}
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password (8-16 chars, uppercase, special char)"
                />
                {formErrors.password && <span className="form-error">{formErrors.password}</span>}
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedCustomer && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Edit Customer</h3>
              <button className="admin-modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEdit} className="admin-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
                {editFormErrors.name && <span className="form-error">{editFormErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
                {editFormErrors.email && <span className="form-error">{editFormErrors.email}</span>}
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                />
                {editFormErrors.address && <span className="form-error">{editFormErrors.address}</span>}
              </div>
              <div className="form-group">
                <label>Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder="Enter new password (optional)"
                />
                {editFormErrors.password && <span className="form-error">{editFormErrors.password}</span>}
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
