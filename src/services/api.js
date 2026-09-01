// src/services/api.js
// ==================== DYNAMIC API URL CONFIGURATION ====================
import DOMPurify from 'dompurify';
import axios from 'axios';

const sanitizeString = (input) => {
    if (typeof input !== 'string') return input;

    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],      // No HTML tags allowed
        ALLOWED_ATTR: [],      // No attributes allowed
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'img'],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus']
    });
};

// Sanitize entire object recursively
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

// ✅ Export for displaying user content safely
export const safeDisplay = (htmlContent) => {
    return DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: []
    });
};

// ============================================
// ✅ FIXED: Dynamic API URL Configuration
// ============================================


const getApiUrl = () => {
    // 1. If on localhost, use localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }

    // 2. For ANY other domain (Vercel, custom domain, etc.), use the absolute Render URL
    return 'https://sta-rosa-rescue-system-backend.onrender.com/api';
};

const API_URL = getApiUrl();
console.log('🔵 API URL:', API_URL);

// ============================================
// ✅ ADDED: Axios instance for auth.service.js
// ============================================

// Create axios instance with the same base URL
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true,
    timeout: 30000 // 30 second timeout
});

// ✅ MOVE INTERCEPTORS HERE - AFTER api is created

// Add token interceptor
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

// Response interceptor for debugging and 401 handling
api.interceptors.response.use(
    (response) => {
        console.log('📡 API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', error.response?.status, error.message);

        // ✅ Handle 401 Unauthorized - redirect to login
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



// ============================================
// HELPER FUNCTIONS (using fetch)
// ============================================

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

    // Sanitize data before sending
    let sanitizedData = data;
    if (data && typeof data === 'object') {
        sanitizedData = sanitizeData(data);
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

// ============================================
// AUTH SERVICES
// ============================================

export const authService = {

    // Register with JSON (for civilians)
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

    // Register with FormData (for volunteers with files)
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

    // ✅ GOOGLE LOGIN
    googleLogin: async (credential) => {
        try {
            const response = await axios.post(`${API_URL}/auth/google`, { token: credential });
            return response.data;
        } catch (error) {
            console.error('❌ Google login error:', error);
            return error.response?.data || { success: false, message: "Google authentication failed." };
        }
    },

    forgotPassword: async (email) => {
        try {
            const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
            return response.data;
        } catch (error) {
            return error.response?.data || { success: false, message: "Network error" };
        }
    },
    resetPassword: async (token, newPassword) => {
        try {
            const response = await axios.post(`${API_URL}/auth/reset-password/${token}`, { newPassword });
            return response.data;
        } catch (error) {
            return error.response?.data || { success: false, message: "Network error" };
        }
    },
    // Get current user
    getCurrentUser: async () => {
        return await apiRequest('/auth/me', 'GET', null, true);
    },

    // Update profile
    updateProfile: async (profileData) => {
        const response = await apiRequest('/auth/profile', 'PUT', profileData, true);
        if (response.data) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response;
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        console.log('✅ Logged out');
    }
};

// ============================================
// INCIDENT SERVICES
// ============================================

export const incidentService = {
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

    // ✅ NEW: Get all teams from the database
    getTeams: async () => {
        return await apiRequest('/teams', 'GET', null, true);
    },

    // ✅ Get all incidents (Admin/Dispatcher only)
    getAllIncidents: async (filters = {}) => {
        const sanitizedFilters = sanitizeData(filters);
        const queryParams = new URLSearchParams(sanitizedFilters).toString();
        const endpoint = `/incidents${queryParams ? `?${queryParams}` : ''}`;
        return await apiRequest(endpoint, 'GET', null, true);
    },

    // ✅ NEW: Get incidents assigned to a specific volunteer
    getVolunteerIncidents: async (volunteerId, filters = {}) => {
        const sanitizedFilters = sanitizeData(filters);
        const queryParams = new URLSearchParams({
            ...sanitizedFilters,
            volunteerId: sanitizeString(volunteerId)
        }).toString();
        const endpoint = `/incidents/volunteer/${sanitizeString(volunteerId)}${queryParams ? `?${queryParams}` : ''}`;
        return await apiRequest(endpoint, 'GET', null, true);
    },

    // ✅ NEW: Get incidents reported by a specific user
    getUserReportedIncidents: async (userId, filters = {}) => {
        const sanitizedFilters = sanitizeData(filters);
        const queryParams = new URLSearchParams({
            ...sanitizedFilters,
            reporterId: sanitizeString(userId)
        }).toString();
        const endpoint = `/incidents/reporter/${sanitizeString(userId)}${queryParams ? `?${queryParams}` : ''}`;
        return await apiRequest(endpoint, 'GET', null, true);
    },

    // ✅ NEW: Get all incidents (with user filtering on frontend if needed)
    getFilteredIncidents: async (filters = {}) => {
        const sanitizedFilters = sanitizeData(filters);
        const queryParams = new URLSearchParams(sanitizedFilters).toString();
        const endpoint = `/incidents${queryParams ? `?${queryParams}` : ''}`;
        return await apiRequest(endpoint, 'GET', null, true);
    },

    getIncidentById: async (id) => {
        return await apiRequest(`/incidents/${sanitizeString(id)}`, 'GET', null, true);
    },

    getStats: async () => {
        return await apiRequest('/incidents/stats', 'GET', null, true);
    },

    getNearbyIncidents: async (latitude, longitude, radius = 5) => {
        return await apiRequest(`/incidents/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`, 'GET', null, true);
    },

    resolveIncident: async (id, resolutionNotes) => {
        return await apiRequest(`/incidents/${id}/resolve`, 'PUT', { resolutionNotes: sanitizeString(resolutionNotes) }, true);
    },

    updateIncidentStatus: async (id, status) => {
        return await apiRequest(`/incidents/${id}/status`, 'PUT', { status: sanitizeString(status) }, true);
    },

    assignResponders: async (incidentId, responderIds, teamName, dispatchNotes) => {
        return await apiRequest(`/incidents/${incidentId}/assign`, 'PUT', {
            responderIds: sanitizeData(responderIds),
            teamName: sanitizeString(teamName),
            dispatchNotes: sanitizeString(dispatchNotes)
        }, true);
    }
};

// ============================================
// VOLUNTEER SERVICES
// ============================================

export const volunteerService = {
    submitApplication: async (applicationData) => {
        const sanitizedData = sanitizeData(applicationData);
        return await apiRequest('/volunteers/apply', 'POST', sanitizedData, false);
    },

    submitApplicationWithFiles: async (formData) => {
        return await apiRequestFormData('/volunteers/apply', 'POST', formData, false);
    },

    getAllApplications: async (status = null, page = 1) => {
        const sanitizedStatus = status ? sanitizeString(status) : null;
        const query = new URLSearchParams({ page, ...(sanitizedStatus && { status: sanitizedStatus }) }).toString();
        return await apiRequest(`/volunteers/applications?${query}`, 'GET', null, true);
    },

    getApplicationById: async (id) => {
        return await apiRequest(`/volunteers/applications/${sanitizeString(id)}`, 'GET', null, true);
    },

    reviewApplication: async (id, status, reviewNotes) => {
        return await apiRequest(`/volunteers/applications/${id}/review`, 'PUT', {
            status: sanitizeString(status),
            reviewNotes: sanitizeString(reviewNotes)
        }, true);
    },

    deleteApplication: async (id) => {
        return await apiRequest(`/volunteers/applications/${sanitizeString(id)}`, 'DELETE', null, true);
    },

    getStats: async () => {
        return await apiRequest('/volunteers/stats', 'GET', null, true);
    }
};

// ============================================
// NOTIFICATION SERVICES
// ============================================

export const notificationService = {
    getNotifications: async () => {
        return await apiRequest('/notifications', 'GET', null, true);
    },

    markAsRead: async (id) => {
        return await apiRequest(`/notifications/${id}/read`, 'PUT', null, true);
    },

    markAllAsRead: async () => {
        return await apiRequest('/notifications/read-all', 'PUT', null, true);
    }
};

// ============================================
// DEFAULT EXPORT
// ============================================

// Export api as default
export default api;