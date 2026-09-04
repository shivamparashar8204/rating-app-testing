import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import { AdminStoreDetail, AdminUserDetail } from '../types';

export function AdminStores() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<AdminStoreDetail[]>([]);
  const [storeOwners, setStoreOwners] = useState<AdminUserDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<AdminStoreDetail | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    storeOwnerId: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadStores();
    loadStoreOwners();
  }, [sortField, sortOrder]);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {
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
      const data = await adminApi.getStores(params);
      setStores(data);
    } catch (error) {
      showToast('Failed to load stores', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoreOwners = async () => {
    try {
      const data = await adminApi.getStoreOwners();
      setStoreOwners(data);
    } catch (error) {
      console.error('Failed to load store owners:', error);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = () => {
    loadStores();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
  };

  const validateForm = (data: typeof formData, isEdit = false): Record<string, string> => {
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

    if (!isEdit && !data.storeOwnerId) {
      errors.storeOwnerId = 'Please select a store owner';
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
      await adminApi.createStore({
        name: formData.name,
        email: formData.email,
        address: formData.address,
        storeOwnerId: formData.storeOwnerId,
      });
      showToast('Store created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', address: '', storeOwnerId: '' });
      loadStores();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showToast(apiError.response?.data?.message || 'Failed to create store', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;

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

    setEditFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setIsSubmitting(true);
      await adminApi.updateStore(selectedStore.id, editFormData);
      showToast('Store updated successfully', 'success');
      setShowEditModal(false);
      setSelectedStore(null);
      loadStores();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showToast(apiError.response?.data?.message || 'Failed to update store', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (store: AdminStoreDetail) => {
    setSelectedStore(store);
    setEditFormData({
      name: store.name,
      email: store.email,
      address: store.address,
    });
    setEditFormErrors({});
    setShowEditModal(true);
  };

  const getOwnerName = (ownerId: string) => {
    const owner = storeOwners.find(o => o.id === ownerId);
    return owner ? owner.name : 'Unknown';
  };

  return (
    <div className="admin-page">
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="admin-page-header">
        <h2>Stores</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Store
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
        <div className="admin-loading">Loading stores...</div>
      ) : stores.length === 0 ? (
        <div className="admin-empty-state">No stores found</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  Name {sortField === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th>Email</th>
                <th>Address</th>
                <th>Owner</th>
                <th>Avg Rating</th>
                <th>Reviews</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id}>
                  <td>{store.name}</td>
                  <td>{store.email}</td>
                  <td>{store.address}</td>
                  <td>{store.owner_name || getOwnerName(store.store_owner_id)}</td>
                  <td>{store.avg_rating ? store.avg_rating.toFixed(1) : '-'}</td>
                  <td>{store.total_ratings || 0}</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => navigate(`/admin/stores/${store.id}`)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEditModal(store)}
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
              <h3>Create Store</h3>
              <button className="admin-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className="admin-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter store name (20-60 characters)"
                />
                {formErrors.name && <span className="form-error">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter store email"
                />
                {formErrors.email && <span className="form-error">{formErrors.email}</span>}
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter store address"
                />
                {formErrors.address && <span className="form-error">{formErrors.address}</span>}
              </div>
              <div className="form-group">
                <label>Store Owner</label>
                <select
                  value={formData.storeOwnerId}
                  onChange={(e) => setFormData({ ...formData, storeOwnerId: e.target.value })}
                >
                  <option value="">Select a store owner</option>
                  {storeOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
                </select>
                {formErrors.storeOwnerId && <span className="form-error">{formErrors.storeOwnerId}</span>}
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedStore && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Edit Store</h3>
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
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
