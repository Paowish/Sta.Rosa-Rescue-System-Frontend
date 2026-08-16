// src/services/volunteerService.js
import api from './api';

// ============ VOLUNTEER APPLICATION ============

/**
 * Submit a new volunteer application
 * @param {Object} applicationData - The application data
 * @returns {Promise} - API response
 */
export const submitVolunteerApplication = async (applicationData) => {
    try {
        const formData = new FormData();

        // Append all fields to FormData
        Object.keys(applicationData).forEach(key => {
            if (key === 'files' && Array.isArray(applicationData.files)) {
                applicationData.files.forEach(file => {
                    formData.append('files', file);
                });
            } else if (key === 'certifications' && Array.isArray(applicationData.certifications)) {
                formData.append('certifications', JSON.stringify(applicationData.certifications));
            } else if (applicationData[key] !== null && applicationData[key] !== undefined) {
                formData.append(key, applicationData[key]);
            }
        });

        const response = await api.post('/volunteer/apply', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error submitting volunteer application:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get all volunteer applications (Admin only)
 * @param {Object} params - Query parameters (status, page, limit)
 * @returns {Promise} - API response
 */
export const getVolunteerApplications = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams(params).toString();
        const response = await api.get(`/volunteer/applications?${queryParams}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching volunteer applications:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get a specific volunteer application by ID
 * @param {string} id - Application ID
 * @returns {Promise} - API response
 */
export const getVolunteerApplicationById = async (id) => {
    try {
        const response = await api.get(`/volunteer/applications/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching volunteer application:', error);
        throw error.response?.data || error;
    }
};

/**
 * Review a volunteer application (Accept/Reject)
 * @param {string} id - Application ID
 * @param {Object} data - Review data (status, reviewNotes)
 * @returns {Promise} - API response
 */
export const reviewVolunteerApplication = async (id, data) => {
    try {
        const response = await api.put(`/volunteer/applications/${id}/review`, data);
        return response.data;
    } catch (error) {
        console.error('Error reviewing volunteer application:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get volunteer application statistics
 * @returns {Promise} - API response
 */
export const getVolunteerApplicationStats = async () => {
    try {
        const response = await api.get('/volunteer/applications/stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching volunteer application stats:', error);
        throw error.response?.data || error;
    }
};

// ============ VOLUNTEER DASHBOARD ============

/**
 * Get volunteer dashboard statistics
 * @returns {Promise} - API response
 */
export const getVolunteerStats = async () => {
    try {
        const response = await api.get('/volunteer/stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching volunteer stats:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get volunteer profile
 * @returns {Promise} - API response
 */
export const getVolunteerProfile = async () => {
    try {
        const response = await api.get('/volunteer/profile');
        return response.data;
    } catch (error) {
        console.error('Error fetching volunteer profile:', error);
        throw error.response?.data || error;
    }
};

/**
 * Update volunteer profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise} - API response
 */
export const updateVolunteerProfile = async (profileData) => {
    try {
        const response = await api.put('/volunteer/profile', profileData);
        return response.data;
    } catch (error) {
        console.error('Error updating volunteer profile:', error);
        throw error.response?.data || error;
    }
};

// ============ INCIDENT MANAGEMENT ============

/**
 * Get incidents for volunteer
 * @param {Object} params - Query parameters (status, limit, page)
 * @returns {Promise} - API response
 */
export const getVolunteerIncidents = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams(params).toString();
        const response = await api.get(`/volunteer/incidents?${queryParams}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching incidents:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get incident by ID
 * @param {string} incidentId - The incident ID
 * @returns {Promise} - API response
 */
export const getIncidentById = async (incidentId) => {
    try {
        const response = await api.get(`/volunteer/incidents/${incidentId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching incident:', error);
        throw error.response?.data || error;
    }
};

/**
 * Respond to an incident
 * @param {string} incidentId - The incident ID
 * @returns {Promise} - API response
 */
export const respondToIncident = async (incidentId) => {
    try {
        const response = await api.post(`/volunteer/incidents/${incidentId}/respond`);
        return response.data;
    } catch (error) {
        console.error('Error responding to incident:', error);
        throw error.response?.data || error;
    }
};

/**
 * Accept an incident
 * @param {string} incidentId - The incident ID
 * @returns {Promise} - API response
 */
export const acceptIncident = async (incidentId) => {
    try {
        const response = await api.post(`/volunteer/incidents/${incidentId}/accept`);
        return response.data;
    } catch (error) {
        console.error('Error accepting incident:', error);
        throw error.response?.data || error;
    }
};

/**
 * Decline an incident
 * @param {string} incidentId - The incident ID
 * @returns {Promise} - API response
 */
export const declineIncident = async (incidentId) => {
    try {
        const response = await api.post(`/volunteer/incidents/${incidentId}/decline`);
        return response.data;
    } catch (error) {
        console.error('Error declining incident:', error);
        throw error.response?.data || error;
    }
};

/**
 * Update incident status
 * @param {string} incidentId - The incident ID
 * @param {string} status - New status (active, resolved, closed)
 * @returns {Promise} - API response
 */
export const updateIncidentStatus = async (incidentId, status) => {
    try {
        const response = await api.put(`/volunteer/incidents/${incidentId}/status`, { status });
        return response.data;
    } catch (error) {
        console.error('Error updating incident status:', error);
        throw error.response?.data || error;
    }
};

// ============ NOTIFICATIONS ============

/**
 * Get notifications for volunteer
 * @param {Object} params - Query parameters (read, limit, page)
 * @returns {Promise} - API response
 */
export const getNotifications = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams(params).toString();
        const response = await api.get(`/volunteer/notifications?${queryParams}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error.response?.data || error;
    }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise} - API response
 */
export const markNotificationRead = async (notificationId) => {
    try {
        const response = await api.put(`/volunteer/notifications/${notificationId}/read`);
        return response.data;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error.response?.data || error;
    }
};

/**
 * Mark all notifications as read
 * @returns {Promise} - API response
 */
export const markAllNotificationsRead = async () => {
    try {
        const response = await api.put('/volunteer/notifications/read-all');
        return response.data;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error.response?.data || error;
    }
};

// ============ VOLUNTEER STATUS ============

/**
 * Update volunteer availability status
 * @param {string} availability - Status (available, on-duty, off-duty)
 * @returns {Promise} - API response
 */
export const updateVolunteerStatus = async (availability) => {
    try {
        const response = await api.put('/volunteer/status', { availability });
        return response.data;
    } catch (error) {
        console.error('Error updating volunteer status:', error);
        throw error.response?.data || error;
    }
};

// ============ AUTHENTICATION HELPERS ============

/**
 * Check if current user is a volunteer/responder
 * @returns {boolean} - True if user is a volunteer
 */
export const isVolunteer = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.role === 'responder' || user?.role === 'volunteer';
    } catch {
        return false;
    }
};

/**
 * Get current volunteer ID
 * @returns {string|null} - Volunteer ID or null
 */
export const getVolunteerId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.id || user?._id || null;
    } catch {
        return null;
    }
};

// ============ EXPORT ALL FUNCTIONS ============
export default {
    // Application
    submitVolunteerApplication,
    getVolunteerApplications,
    getVolunteerApplicationById,
    reviewVolunteerApplication,
    getVolunteerApplicationStats,

    // Dashboard
    getVolunteerStats,
    getVolunteerProfile,
    updateVolunteerProfile,

    // Incidents
    getVolunteerIncidents,
    getIncidentById,
    respondToIncident,
    acceptIncident,
    declineIncident,
    updateIncidentStatus,

    // Notifications
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,

    // Status
    updateVolunteerStatus,

    // Helpers
    isVolunteer,
    getVolunteerId
};