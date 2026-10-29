import { apiClient } from '../core/api.client.js';

/**
 * Registers a new user.
 * @param {Object} userData - User details for registration.
 */
async function register(userData) {
  try {
    const response = await apiClient.post('/api/auth/register', userData);
    return { user: response.data.user };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs in an existing user and stores their session in localStorage.
 * @param {Object} credentials - User login credentials.
 */
async function login(credentials) {
  try {
    const response = await apiClient.post('/api/auth/login', credentials);
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { user, token };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs out the current user by clearing localStorage.
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Retrieves the stored JWT token from localStorage.
 */
function getStoredToken() {
  return localStorage.getItem('token');
}

/**
 * Retrieves the stored user object from localStorage.
 */
function getStoredUser() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    // If JSON parsing fails, clear invalid data
    localStorage.removeItem('user');
    return null;
  }
}

/**
 * Checks if the user is currently authenticated based on local storage.
 */
function isAuthenticated() {
  return !!getStoredToken();
}

/**
 * Centralized error handler for auth service requests.
 */
function handleAuthError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timed out. Please try again.');
    }
    return new Error(
      'Unable to connect to server. Please check your internet connection.',
    );
  }

  const status = error.response.status;
  const backendMessage =
    error.response.data?.msg || error.response.data?.message;

  switch (status) {
    case 400:
      return new Error(backendMessage || 'Invalid input data.');
    case 401:
      return new Error(backendMessage || 'Invalid email or password.');
    case 500:
      return new Error(
        'Something went wrong on our end. Please try again later.',
      );
    default:
      return new Error(backendMessage || 'An unexpected error occurred.');
  }
}

/**
 * Fetches fresh user data from server.
 */
async function getMe() {
  try {
    const response = await apiClient.get('/api/auth/me');
    const responseUser = response.data.user;
    const user = responseUser
      ? { ...responseUser, avatar: responseUser.avatarUrl || responseUser.avatar }
      : null;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    return user;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Sets 4-6 digit Security Plus PIN for premium user.
 */
async function setPin(pin, enabled = true) {
  try {
    const response = await apiClient.post('/api/auth/pin/set', { pin, enabled });
    // Update local user state
    const currentUser = getStoredUser() || {};
    currentUser.security_pin_enabled = enabled;
    localStorage.setItem('user', JSON.stringify(currentUser));
    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Toggles PIN protection on or off.
 */
async function togglePin(enabled) {
  try {
    const response = await apiClient.post('/api/auth/pin/toggle', { enabled });
    const currentUser = getStoredUser() || {};
    currentUser.security_pin_enabled = enabled;
    localStorage.setItem('user', JSON.stringify(currentUser));
    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Verifies PIN entered by user.
 */
async function verifyPin(pin) {
  try {
    const response = await apiClient.post('/api/auth/pin/verify', { pin });
    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Service for handling auth-related requests.
 */
export const authService = {
  register,
  login,
  logout,
  getMe,
  setPin,
  togglePin,
  verifyPin,
  getStoredToken,
  getStoredUser,
  isAuthenticated,
};

