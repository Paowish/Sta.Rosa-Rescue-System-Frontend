// src/services/api.js
// ==================== DYNAMIC API URL CONFIGURATION ====================
import DOMPurify from 'dompurify';
import axios from 'axios';

// ============================================================================
// SANITIZATION HELPERS
// ============================================================================

/**
 * Sanitize a string to prevent XSS attacks
 */
const sanitizeString = (input) => {
    if (typeof input !== 'string') return input;

    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],      // No HTML tags allowed
        ALLOWED_ATTR: [],      // No attributes allowed
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'img'],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus']
    });
};

/**
 * Recursively sanitize data object
 */
const sanitizeData = (data) => {
    if (typeof data === 'string') {
        return sanitizeString(data);
    }
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeData(value);
        }
        return sanitized;
    }
    return data;
};

/**
 * Safe display for user-generated content
 */
export const safeDisplay = (htmlContent) => {
    return DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: []
    });
};

// ============================================================================
// API URL CONFIGURATION
// ============================================================================

/**
 * Get the appropriate API URL based on environment
 */
const getApiUrl = () => {
    // Localhost development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }

    // Production - use absolute Render URL
    return 'https://sta-rosa-rescue-system-backend.onrender.com/api';
};

const API_URL = getApiUrl();
console.log('🔵 API URL:', API_URL);

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

/**
 * Create axios instance with base configuration
 */
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true,
    timeout: 30000 // 30 second timeout
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('🔵 API Request:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - handle 401 and logging
api.interceptors.response.use(
    (response) => {
        console.log('📡 API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', error.response?.status, error.message);

        // Handle 401 Unauthorized - redirect to login
        if (error.response && error.response.status === 401) {
            console.log('🔒 Token expired or invalid - clearing session');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            localStorage.removeItem('profileImage');

            // Redirect to login if not already there
            if (window.location.pathname !== '/login' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// ============================================================================
// BASE API REQUEST FUNCTIONS
// ============================================================================

/**
 * Make an authenticated API request
 */
const apiRequest = async (endpoint, method = 'GET', data = null, requiresAuth = true) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (requiresAuth) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    // ✅ NEW CODE (KEEPS teamName!):
    let sanitizedData = data;
    if (data && typeof data === 'object') {
        sanitizedData = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === 'teamName') {
                sanitizedData[key] = value; // ✅ KEEP teamName AS IS!
            } else {
                sanitizedData[key] = sanitizeData(value);
            }
        }
    }
    const config = {
        method,
        headers,
        ...(sanitizedData && { body: JSON.stringify(sanitizedData) })
    };

    try {
        const fullUrl = `${API_URL}${endpoint}`;
        console.log(`🔵 Fetching: ${fullUrl}`);

        const response = await fetch(fullUrl, config);

        // Get the response text first
        const text = await response.text();
        console.log(`📡 Response from ${endpoint}:`, text.substring(0, 200));

        // Parse JSON
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            throw new Error('Invalid response from server');
        }

        if (!response.ok) {
            // Handle validation errors
            if (result.errors) {
                const errorMessage = result.errors.map(err => err.message || err.msg).join(', ');
                throw new Error(errorMessage);
            }
            throw new Error(result.message || 'Something went wrong');
        }

        return result;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

/**
 * Make an authenticated FormData API request
 */
const apiRequestFormData = async (endpoint, method = 'POST', formData, requiresAuth = true) => {
    const headers = {};

    if (requiresAuth) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Sanitize text fields in FormData
    const sanitizedFormData = new FormData();
    for (let [key, value] of formData.entries()) {
        if (typeof value === 'string') {
            sanitizedFormData.append(key, sanitizeString(value));
        } else {
            sanitizedFormData.append(key, value);
        }
    }

    const config = {
        method,
        headers,
        body: sanitizedFormData
    };

    try {
        const fullUrl = `${API_URL}${endpoint}`;
        console.log(`🔵 Fetching (FormData): ${fullUrl}`);

        const response = await fetch(fullUrl, config);

        // Parse response as JSON
        let result;
        try {
            result = await response.json();
        } catch (e) {
            result = { message: await response.text() };
        }

        console.log('📡 Response status:', response.status);
        console.log('📡 Response data:', result);

        if (!response.ok) {
            const errorMessage = result.message || `HTTP error! status: ${response.status}`;
            const error = new Error(errorMessage);
            error.response = result;
            error.status = response.status;
            throw error;
        }

        return result;
    } catch (error) {
        console.error('❌ FormData API error:', error);
        throw error;
    }
};

// ============================================================================
// AUTH SERVICES
// ============================================================================

export const authService = {
    /**
     * Register with JSON (for civilians)
     */
    register: async (userData) => {
        console.log("🔵 Register (JSON) called with:", userData);

        try {
            const response = await apiRequest('/auth/register', 'POST', userData, false);
            return response;
        } catch (error) {
            console.error('❌ Register error:', error);
            throw error;
        }
    },

    /**
     * Register with FormData (for volunteers with files)
     */
    registerWithFormData: async (formData) => {
        console.log("🔵 registerWithFormData called");

        console.log("🔵 FormData contents:");
        for (let pair of formData.entries()) {
            const value = pair[1];
            if (value instanceof File) {
                console.log(`  ${pair[0]}: File(${value.name}, ${value.size} bytes, ${value.type})`);
            } else {
                console.log(`  ${pair[0]}: ${typeof value === 'string' ? value.substring(0, 50) : value}`);
            }
        }

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });

            let result;
            const text = await response.text();

            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('❌ Failed to parse JSON:', text);
                throw new Error('Server returned invalid response');
            }

            console.log('📡 Response status:', response.status);
            console.log('📡 Response data:', result);

            if (!response.ok) {
                const errorMessage = result.message || `HTTP error! status: ${response.status}`;
                const error = new Error(errorMessage);
                error.response = result;
                error.status = response.status;
                throw error;
            }

            return result;
        } catch (error) {
            console.error('❌ FormData register error:', error);
            throw error;
        }
    },

    /**
     * Login user
     */
    login: async (email, password) => {
        console.log('🔵 Login called for:', email);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            console.log('📡 Login response status:', response.status);

            let result;
            const text = await response.text();
            console.log('📡 Raw response:', text);

            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                return {
                    success: false,
                    message: 'Invalid response from server'
                };
            }

            console.log('📡 Parsed response:', result);

            if (!response.ok) {
                console.log('🔴 Login failed with status:', response.status);
                console.log('🔴 Error message:', result.message);
                console.log('🔴 Error code:', result.code);

                if (result.code === 'PENDING_APPROVAL' ||
                    (result.message && result.message.toLowerCase().includes('pending approval'))) {
                    return {
                        success: false,
                        message: '⏳ Your volunteer application is pending approval. Please wait for the rescue team to review your application.',
                        code: 'PENDING_APPROVAL',
                        status: response.status
                    };
                }

                if (result.code === 'REJECTED' ||
                    (result.message && result.message.toLowerCase().includes('rejected'))) {
                    return {
                        success: false,
                        message: '❌ Your volunteer application has been rejected. Please contact support for more information.',
                        code: 'REJECTED',
                        status: response.status
                    };
                }

                if (result.code === 'NOT_APPROVED' ||
                    (result.message && result.message.toLowerCase().includes('not yet approved'))) {
                    return {
                        success: false,
                        message: '⚠️ Your volunteer account is not yet approved. Please contact the rescue team.',
                        code: 'NOT_APPROVED',
                        status: response.status
                    };
                }

                return {
                    success: false,
                    message: result.message || 'Login failed',
                    code: result.code || null,
                    status: response.status
                };
            }

            let userData, token;

            if (result.data) {
                userData = result.data.user;
                token = result.data.token;
            } else if (result.user) {
                userData = result.user;
                token = result.token;
            } else {
                userData = result.user || result.data?.user;
                token = result.token || result.data?.token;
            }

            console.log('✅ User data:', userData);
            console.log('✅ Token:', token);

            if (token && userData) {
                const userToStore = {
                    id: userData.id || userData._id,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    role: userData.role || 'civilian',
                    phoneNumber: userData.phoneNumber || '',
                    profileImage: userData.profileImage || ''
                };

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userToStore));
                localStorage.setItem('userRole', userData.role || 'civilian');

                if (userData.profileImage) {
                    localStorage.setItem('profileImage', userData.profileImage);
                }

                console.log('✅ Login successful, user stored:', userToStore);
                return {
                    success: true,
                    user: userData,
                    token: token,
                    message: result.message || 'Login successful'
                };
            } else {
                console.error('❌ Invalid response format:', result);
                return {
                    success: false,
                    message: 'Invalid response from server'
                };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return {
                success: false,
                message: error.message || 'Login failed. Please try again.'
            };
        }
    },

    /**
     * Google OAuth login
     */
    googleLogin: async (credential) => {
        try {
            // ✅ ALWAYS SEND AS CREDENTIAL (JWT token) - WORKS ON ALL ENVIRONMENTS
            const response = await axios.post(`${API_URL}/auth/google`, { credential });
            return response.data;
        } catch (error) {
            console.error('❌ Google login error:', error);

            // ✅ RETURN THE 403 DATA (WITH CODE) SO FRONTEND CAN HANDLE IT
            if (error.response && error.response.data) {
                console.log('🔴 Google login 403 data:', error.response.data);
                return error.response.data;  // ✅ THIS IS KEY!
            }

            return {
                success: false,
                message: "Google authentication failed.",
                code: error.response?.data?.code || null
            };
        }
    },

    /**
     * Forgot password
     */
    forgotPassword: async (email) => {
        try {
            const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
            return response.data;
        } catch (error) {
            return error.response?.data || { success: false, message: "Network error" };
        }
    },

    /**
     * Reset password
     */
    resetPassword: async (token, newPassword) => {
        try {
            const response = await axios.post(`${API_URL}/auth/reset-password/${token}`, { newPassword });
            return response.data;
        } catch (error) {
            return error.response?.data || { success: false, message: "Network error" };
        }
    },

    /**
     * Get current user
     */
    getCurrentUser: async () => {
        return await apiRequest('/auth/me', 'GET', null, true);
    },

    /**
     * Update profile
     */
    updateProfile: async (profileData) => {
        const response = await apiRequest('/auth/profile', 'PUT', profileData, true);
        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response;
    },

    /**
     * Logout
     */
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        console.log('✅ Logged out');
    }
};

// ============================================================================
// INCIDENT SERVICES
// ============================================================================

export const incidentService = {
    /**
     * Report an incident with optional photo
     */
    reportIncident: async (incidentData) => {
        console.log("📸 API - reportIncident called");
        console.log("📸 API - Has photo:", !!incidentData.photo);
        console.log("📸 API - API URL:", API_URL);

        const sanitizedIncidentData = sanitizeData(incidentData);

        if (sanitizedIncidentData.photo && sanitizedIncidentData.photo.startsWith('data:image')) {
            console.log("📸 API - Creating FormData for photo upload");

            const formData = new FormData();

            const photoResponse = await fetch(sanitizedIncidentData.photo);
            const blob = await photoResponse.blob();
            formData.append('photo', blob, `incident_${Date.now()}.jpg`);

            formData.append('type', sanitizeString(sanitizedIncidentData.type));
            formData.append('severity', sanitizeString(sanitizedIncidentData.severity));
            formData.append('description', sanitizeString(sanitizedIncidentData.description));
            formData.append('location', JSON.stringify(sanitizedIncidentData.location));
            formData.append('reporterName', sanitizeString(sanitizedIncidentData.reporterName || "Anonymous"));
            formData.append('reporterNumber', sanitizeString(sanitizedIncidentData.reporterNumber || ""));
            formData.append('victimsAffected', String(sanitizedIncidentData.victimsAffected || 0));
            formData.append('incidentId', sanitizeString(sanitizedIncidentData.incidentId));
            formData.append('reportedAt', sanitizeString(sanitizedIncidentData.reportedAt));
            formData.append('status', sanitizeString(sanitizedIncidentData.status));

            const result = await apiRequestFormData('/incidents', 'POST', formData, true);
            console.log("📸 API - Incident report result:", result);
            return result;
        } else {
            console.log("📸 API - No photo, sending JSON");
            return await apiRequest('/incidents', 'POST', sanitizedIncidentData, true);
        }
    },

    /**
 * Get available volunteers
 */
    getAvailableVolunteers: async () => {
        console.log('🎯 [API] Fetching available volunteers...');
        const token = localStorage.getItem('token');
        console.log('🎯 [API] Token exists:', !!token);

        try {
            // ✅ USE AXIOS INSTEAD OF FETCH!
            const response = await axios.get(`${API_URL}/volunteers/available`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ [API] Volunteers response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ [API] Failed to fetch volunteers:', error);
            throw error;
        }
    },

    /**
     * Get all teams from the database
     */
    getTeams: async () => {
        return await apiRequest('/teams', 'GET', null, true);
    },

    /**
     * Get all incidents (Admin/Dispatcher only)
     */
    getAllIncidents: async (filters = {}) => {
        const sanitizedFilters = sanitizeData(filters);
        const queryParams = new URLSearchParams(sanitizedFilters).toString();
        const endpoint = `/incidents${queryParams ? `?${queryParams}` : ''}`;
        return await apiRequest(endpoint, 'GET', null, true);
    },

    /**
     * Get incidents assigned to a specific volunteer
     */
    getVolunteerIncidents: async (volunteerId, filters = {}) => {
        const sanitizedFilters = sanitizeData(filters);
        const queryParams = new URLSearchParams({
            ...sanitizedFilters,
            volunteerId: sanitizeString(volunteerId)
        }).toString();
        const endpoint = `/incidents/volunteer/${sanitizeString(volunteerId)}${queryParams ? `?${queryParams}` : ''}`;
        return await apiRequest(endpoint, 'GET', null, true);
    },

    /**
     * Get incidents reported by a specific user
     */
    getUserReportedIncidents: async (userId, filters = {}) => {
        const sanitizedFilters = sanitizeData(filters);
        const queryParams = new URLSearchParams({
            ...sanitizedFilters,
            reporterId: sanitizeString(userId)
        }).toString();
        const endpoint = `/incidents/reporter/${sanitizeString(userId)}${queryParams ? `?${queryParams}` : ''}`;
        return await apiRequest(endpoint, 'GET', null, true);
    },

    /**
     * Get filtered incidents
     */
    getFilteredIncidents: async (filters = {}) => {
        const sanitizedFilters = sanitizeData(filters);
        const queryParams = new URLSearchParams(sanitizedFilters).toString();
        const endpoint = `/incidents${queryParams ? `?${queryParams}` : ''}`;
        return await apiRequest(endpoint, 'GET', null, true);
    },

    /**
     * Get incident by ID
     */
    getIncidentById: async (id) => {
        return await apiRequest(`/incidents/${sanitizeString(id)}`, 'GET', null, true);
    },

    /**
     * Get incident statistics
     */
    getStats: async () => {
        return await apiRequest('/incidents/stats', 'GET', null, true);
    },

    /**
     * Get nearby incidents
     */
    getNearbyIncidents: async (latitude, longitude, radius = 5) => {
        return await apiRequest(
            `/incidents/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`,
            'GET',
            null,
            true
        );
    },

    /**
     * Resolve an incident
     */
    resolveIncident: async (id, resolutionNotes) => {
        return await apiRequest(
            `/incidents/${id}/resolve`,
            'PUT',
            { resolutionNotes: sanitizeString(resolutionNotes) },
            true
        );
    },

    /**
     * Update incident status
     */
    updateIncidentStatus: async (id, status) => {
        return await apiRequest(
            `/incidents/${id}/status`,
            'PUT',
            { status: sanitizeString(status) },
            true
        );
    },

    /**
     * Assign responders to an incident
     */
    assignResponders: async (incidentId, responderIds, teamName, dispatchNotes, dispatchType = 'volunteers') => {
        console.log('🎯 [API] RECEIVED teamName:', teamName);
        console.log('🎯 [API] RECEIVED dispatchType:', dispatchType);

        return await apiRequest(
            `/incidents/${incidentId}/dispatch`,
            'POST',
            {
                volunteerIds: sanitizeData(responderIds),
                teamName: teamName,
                dispatchNotes: sanitizeString(dispatchNotes),
                dispatchType: dispatchType  // ✅ ADD THIS!
            },
            true
        );
    }
};

// ============================================================================
// VOLUNTEER SERVICES
// ============================================================================

export const volunteerService = {
    /**
     * Submit volunteer application
     */
    submitApplication: async (applicationData) => {
        const sanitizedData = sanitizeData(applicationData);
        return await apiRequest('/volunteers/apply', 'POST', sanitizedData, false);
    },

    /**
     * Submit volunteer application with files
     */
    submitApplicationWithFiles: async (formData) => {
        return await apiRequestFormData('/volunteers/apply', 'POST', formData, false);
    },

    /**
     * Get all volunteer applications
     */
    getAllApplications: async (status = null, page = 1) => {
        const sanitizedStatus = status ? sanitizeString(status) : null;
        const query = new URLSearchParams({
            page,
            ...(sanitizedStatus && { status: sanitizedStatus })
        }).toString();
        return await apiRequest(`/volunteers/applications?${query}`, 'GET', null, true);
    },

    /**
     * Get application by ID
     */
    getApplicationById: async (id) => {
        return await apiRequest(`/volunteers/applications/${sanitizeString(id)}`, 'GET', null, true);
    },

    /**
     * Review volunteer application
     */
    reviewApplication: async (id, status, reviewNotes) => {
        return await apiRequest(
            `/volunteers/applications/${id}/review`,
            'PUT',
            {
                status: sanitizeString(status),
                reviewNotes: sanitizeString(reviewNotes)
            },
            true
        );
    },

    /**
     * Delete volunteer application
     */
    deleteApplication: async (id) => {
        return await apiRequest(`/volunteers/applications/${sanitizeString(id)}`, 'DELETE', null, true);
    },

    /**
     * Get volunteer statistics
     */
    getStats: async () => {
        return await apiRequest('/volunteers/stats', 'GET', null, true);
    }
};

// ============================================================================
// NOTIFICATION SERVICES
// ============================================================================

export const notificationService = {
    /**
     * Get all notifications
     */
    getNotifications: async () => {
        return await apiRequest('/notifications', 'GET', null, true);
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (id) => {
        return await apiRequest(`/notifications/${id}/read`, 'PUT', null, true);
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async () => {
        return await apiRequest('/notifications/read-all', 'PUT', null, true);
    }
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default api;