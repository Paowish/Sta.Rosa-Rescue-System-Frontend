// src/services/authInterceptor.js
import { authService } from './api';

export const setupAuthInterceptor = (navigate) => {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);

        const url = args[0];
        const isLoginEndpoint = typeof url === 'string' && url.includes('/api/auth/login');
        const isSessionStatusEndpoint = typeof url === 'string' && url.includes('/api/auth/session-status');

        // ✅ Skip interceptor for login and session-status endpoints completely
        if (isLoginEndpoint || isSessionStatusEndpoint) {
            return response;
        }

        // For 401 responses on non-login endpoints, redirect to login
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            navigate('/login');
            throw new Error('Session expired. Please login again.');
        }

        // For 403 responses on non-login endpoints
        if (response.status === 403) {
            try {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();

                // If it's a volunteer status message, let the component handle it
                if (data.code === 'PENDING_APPROVAL' ||
                    data.code === 'REJECTED' ||
                    data.code === 'NOT_APPROVED' ||
                    (data.message && (
                        data.message.includes('pending approval') ||
                        data.message.includes('rejected') ||
                        data.message.includes('not yet approved')
                    ))) {
                    return response;
                }
            } catch (e) {
                // If can't parse JSON, proceed with redirect
            }

            // For other 403 errors, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            navigate('/login');
            throw new Error('Session expired. Please login again.');
        }

        // Only filter incident responses if the user is logged in
        if (response.url && response.url.includes('/api/incidents/')) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    return response;
                }

                const data = await response.clone().json();
                if (data.data && Array.isArray(data.data)) {
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    if (currentUser.id) {
                        data.data = data.data.filter(incident =>
                            incident.reporterId === currentUser.id ||
                            incident.assignedTo?.includes(currentUser.id) ||
                            incident.volunteerId === currentUser.id ||
                            incident.reportedBy === currentUser.id
                        );
                        const newResponse = new Response(JSON.stringify(data), {
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers
                        });
                        return newResponse;
                    }
                }
            } catch (error) {
                console.error('Error filtering incidents:', error);
            }
        }

        return response;
    };
};