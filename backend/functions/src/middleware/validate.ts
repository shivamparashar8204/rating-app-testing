import { Request, Response, NextFunction } from 'express';

export interface ValidationErrors {
  [field: string]: string;
}

export function validateName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Name is required';
  }
  const trimmed = name.trim();
  if (trimmed.length < 20) {
    return 'Name must be at least 20 characters long';
  }
  if (trimmed.length > 60) {
    return 'Name must be at most 60 characters long';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return 'Email is required';
  }
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Invalid email format';
  }
  if (trimmed.length > 255) {
    return 'Email must be at most 255 characters long';
  }
  return null;
}

export function validateAddress(address: string): string | null {
  if (!address || typeof address !== 'string') {
    return 'Address is required';
  }
  const trimmed = address.trim();
  if (trimmed.length > 400) {
    return 'Address must be at most 400 characters long';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (password.length > 16) {
    return 'Password must be at most 16 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
}

export function validateRating(rating: unknown): string | null {
  if (rating === undefined || rating === null) {
    return 'Rating is required';
  }
  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    return 'Rating must be an integer between 1 and 5';
  }
  return null;
}

export function validateSignup(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationErrors = {};
  const { name, email, address, password, role } = req.body;

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const addressError = validateAddress(address);
  if (addressError) errors.address = addressError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  const validSignupRoles = ['CUSTOMER', 'STORE_OWNER'];
  if (!role || typeof role !== 'string' || !validSignupRoles.includes(role.toUpperCase())) {
    errors.role = 'Role must be either CUSTOMER or STORE_OWNER';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationErrors = {};
  const { email, password, role } = req.body;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email is required';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  }

  const validRoles = ['ADMIN', 'CUSTOMER', 'STORE_OWNER'];
  if (!role || typeof role !== 'string' || !validRoles.includes(role.toUpperCase())) {
    errors.role = 'Role must be one of: ADMIN, CUSTOMER, STORE_OWNER';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
}

export function validateChangePassword(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationErrors = {};
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.currentPassword = 'Current password is required';
  }

  const newPasswordError = validatePassword(newPassword);
  if (newPasswordError) errors.newPassword = newPasswordError;

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
}

export function validateAdminCreateUser(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationErrors = {};
  const { name, email, address, password, role } = req.body;

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const addressError = validateAddress(address);
  if (addressError) errors.address = addressError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  const validRoles = ['ADMIN', 'CUSTOMER', 'STORE_OWNER'];
  if (!role || typeof role !== 'string' || !validRoles.includes(role.toUpperCase())) {
    errors.role = 'Role must be one of: ADMIN, CUSTOMER, STORE_OWNER';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
}

export function validateAdminCreateStore(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationErrors = {};
  const { name, email, address, storeOwnerId } = req.body;

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const addressError = validateAddress(address);
  if (addressError) errors.address = addressError;

  if (!storeOwnerId) {
    errors.storeOwnerId = 'Valid store owner ID is required';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
}

export function validateCustomerRating(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationErrors = {};
  const { storeId, rating } = req.body;

  if (!storeId) {
    errors.storeId = 'Valid store ID is required';
  }

  const ratingError = validateRating(rating);
  if (ratingError) errors.rating = ratingError;

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
}

export function validateCustomerUpdateRating(req: Request, res: Response, next: NextFunction): void {
  const errors: ValidationErrors = {};
  const { rating } = req.body;

  const ratingError = validateRating(rating);
  if (ratingError) errors.rating = ratingError;

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
}
