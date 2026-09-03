import { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { AdminRatingDetail, AdminUserDetail, AdminStoreDetail } from '../types';

export function AdminReviews() {
  const [ratings, setRatings] = useState<AdminRatingDetail[]>([]);
  const [customers, setCustomers] = useState<AdminUserDetail[]>([]);
  const [stores, setStores] = useState<AdminStoreDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [filterRating, setFilterRating] = useState<number | ''>('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState<AdminRatingDetail | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    storeId: '',
    rating: 5,
  });
  const [editFormData, setEditFormData] = useState({
    rating: 5,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadRatings();
    loadDropdownData();
  }, [sortField, sortOrder]);

  const loadRatings = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string | number> = {
        sortBy: sortField,
        order: sortOrder,
      };
      if (customerSearch) {
        params.customerName = customerSearch;
      }
      if (storeSearch) {
        params.storeName = storeSearch;
      }
      if (filterRating !== '') {
        params.rating = filterRating;
      }
      const data = await adminApi.getRatings(params as Record<string, string>);
      setRatings(data);
    } catch (error) {
      showToast('Failed to load reviews', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [customersData, storesData] = await Promise.all([
        adminApi.getCustomers(),
        adminApi.getStores(),
      ]);
      setCustomers(customersData);
      setStores(storesData);
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = () => {
    loadRatings();
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

    if (!isEdit) {
      if (!data.userId) {
        errors.userId = 'Please select a customer';
      }
      if (!data.storeId) {
        errors.storeId = 'Please select a store';
      }
    }

    if (data.rating < 1 || data.rating > 5) {
      errors.rating = 'Rating must be between 1 and 5';
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
      await adminApi.createRating({
        userId: formData.userId,
        storeId: formData.storeId,
        rating: formData.rating,
      });
      showToast('Review created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ userId: '', storeId: '', rating: 5 });
      loadRatings();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showToast(apiError.response?.data?.message || 'Failed to create review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRating) return;

    const errors: Record<string, string> = {};
    if (editFormData.rating < 1 || editFormData.rating > 5) {
      errors.rating = 'Rating must be between 1 and 5';
    }

    setEditFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setIsSubmitting(true);
      await adminApi.updateRating(selectedRating.id, editFormData);
      showToast('Review updated successfully', 'success');
      setShowEditModal(false);
      setSelectedRating(null);
      loadRatings();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showToast(apiError.response?.data?.message || 'Failed to update review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rating: AdminRatingDetail) => {
    if (!window.confirm(`Are you sure you want to delete this review from ${rating.user_name}?`)) {
      return;
    }

    try {
      await adminApi.deleteRating(rating.id);
      showToast('Review deleted successfully', 'success');
      loadRatings();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showToast(apiError.response?.data?.message || 'Failed to delete review', 'error');
    }
  };

  const openEditModal = (rating: AdminRatingDetail) => {
    setSelectedRating(rating);
    setEditFormData({ rating: rating.rating });
    setEditFormErrors({});
    setShowEditModal(true);
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="admin-page">
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="admin-page-header">
        <h2>Reviews & Ratings</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Review
        </button>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by customer..."
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="admin-search-input"
        />
        <input
          type="text"
          placeholder="Search by store..."
          value={storeSearch}
          onChange={(e) => setStoreSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="admin-search-input"
        />
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value === '' ? '' : Number(e.target.value))}
          className="admin-search-select"
        >
          <option value="">All Ratings</option>
          <option value="1">1 Star</option>
          <option value="2">2 Stars</option>
          <option value="3">3 Stars</option>
          <option value="4">4 Stars</option>
          <option value="5">5 Stars</option>
        </select>
        <button className="btn btn-secondary" onClick={handleSearch}>Search</button>
      </div>

      {isLoading ? (
        <div className="admin-loading">Loading reviews...</div>
      ) : ratings.length === 0 ? (
        <div className="admin-empty-state">No reviews found</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Store</th>
                <th onClick={() => handleSort('rating')} className="sortable">
                  Rating {sortField === 'rating' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('created_at')} className="sortable">
                  Date {sortField === 'created_at' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((rating) => (
                <tr key={rating.id}>
                  <td>{rating.user_name}</td>
                  <td>{rating.store_name}</td>
                  <td>
                    <span className="rating-stars">{getRatingStars(rating.rating)}</span>
                    <span className="rating-number"> ({rating.rating})</span>
                  </td>
                  <td>{new Date(rating.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEditModal(rating)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(rating)}
                      >
                        Delete
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
              <h3>Create Review</h3>
              <button className="admin-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className="admin-form">
              <div className="form-group">
                <label>Customer</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
                {formErrors.userId && <span className="form-error">{formErrors.userId}</span>}
              </div>
              <div className="form-group">
                <label>Store</label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                {formErrors.storeId && <span className="form-error">{formErrors.storeId}</span>}
              </div>
              <div className="form-group">
                <label>Rating</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`rating-star ${formData.rating >= star ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, rating: star })}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {formErrors.rating && <span className="form-error">{formErrors.rating}</span>}
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedRating && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Edit Review</h3>
              <button className="admin-modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEdit} className="admin-form">
              <div className="form-group">
                <label>Rating</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`rating-star ${editFormData.rating >= star ? 'active' : ''}`}
                      onClick={() => setEditFormData({ ...editFormData, rating: star })}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {editFormErrors.rating && <span className="form-error">{editFormErrors.rating}</span>}
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
