// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../services/api';

/**
 * Session timeout warning component
 * Displays a warning when session is about to expire
 */
const SessionTimeoutWarning = ({ timeLeft, onExtend, onLogout }) => {
    const [showWarning, setShowWarning] = useState(false);

    /**
     * Show warning when time remaining is 2 minutes or less
     */
    useEffect(() => {
        if (timeLeft <= 120 && timeLeft > 0 && !showWarning) {
            setShowWarning(true);
        }
    }, [timeLeft, showWarning]);

    if (!showWarning) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 p-4 shadow-lg rounded-md z-50 max-w-sm">
            <p className="text-yellow-700 font-semibold">⚠️ Session Expiring Soon</p>
            <p className="text-sm text-yellow-600 mt-1">
                Your session will expire in {Math.ceil(timeLeft)} seconds
            </p>
            <div className="mt-3 flex gap-2">
                <button
                    onClick={() => { onExtend(); setShowWarning(false); }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                >
                    Stay Logged In
                </button>
                <button
                    onClick={onLogout}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                >
                    Logout Now
                </button>
            </div>
        </div>
    );
};

/**
 * Protected route wrapper component
 * Handles authentication, authorization, and session management
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [sessionTimeLeft, setSessionTimeLeft] = useState(null);

    /**
     * Check if user is authenticated and authorized
     */
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user') || '{}');

                // If no token, redirect to login
                if (!token || !user.id) {
                    console.log('❌ No token or user found');
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }

                // Validate token with backend
                try {
                    const response = await authService.getCurrentUser();
                    console.log('✅ Auth check response:', response);

                    if (!response || !response.success) {
                        console.log('❌ Auth failed - invalid response');
                        // Clear invalid data
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        localStorage.removeItem('userRole');
                        setAuthorized(false);
                        setLoading(false);
                        return;
                    }

                    // Check if user role is allowed
                    if (allowedRoles.length > 0) {
                        const userRole = response.data?.role || localStorage.getItem('userRole');
                        const isAuthorized = allowedRoles.some(role => {
                            // Map volunteer to responder for compatibility
                            if (role === 'volunteer') {
                                return userRole === 'volunteer' || userRole === 'responder';
                            }
                            if (role === 'responder') {
                                return userRole === 'responder' || userRole === 'volunteer';
                            }
                            return userRole === role;
                        });

                        if (!isAuthorized) {
                            console.log('❌ User role not authorized:', userRole);
                            setAuthorized(false);
                            setLoading(false);
                            return;
                        }
                    }

                    setAuthorized(true);
                    setLoading(false);
                } catch (authError) {
                    console.error('❌ Auth check failed:', authError);
                    // Clear invalid data on auth error
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('userRole');
                    setAuthorized(false);
                    setLoading(false);
                }
            } catch (error) {
                console.error('❌ Auth check error:', error);
                setAuthorized(false);
                setLoading(false);
            }
        };

        checkAuth();
    }, [token, userRole, allowedRoles]);

    /**
     * Session timeout tracking
     * Monitors session duration and provides warnings
     */
    useEffect(() => {
        if (!token || !authorized) return;

        let sessionStart = Date.now();

        /**
         * Check remaining session time
         */
        const checkSession = async () => {
            try {
                const response = await authService.getCurrentUser();
                if (response && response.success) {
                    const elapsed = (Date.now() - sessionStart) / 1000;
                    const timeLeft = Math.max(0, 1800 - elapsed);
                    setSessionTimeLeft(timeLeft);
                }
            } catch (error) {
                console.error('Session check failed:', error);
            }
        };

        /**
         * Extend session by resetting timer
         */
        const extendSession = async () => {
            try {
                const response = await authService.getCurrentUser();
                if (response && response.success) {
                    sessionStart = Date.now();
                    setSessionTimeLeft(1800);
                }
            } catch (error) {
                console.error('Session extend failed:', error);
            }
        };

        /**
         * Logout user and clear session data
         */
        const logout = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            window.location.href = '/login';
        };

        // Initialize session check
        checkSession();
        const interval = setInterval(checkSession, 10000);

        // Expose session functions globally
        window.__extendSession = extendSession;
        window.__logout = logout;

        // Cleanup on unmount
        return () => clearInterval(interval);
    }, [token, authorized]);

    // Show loading spinner during authentication check
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Redirect if not authorized
    if (!authorized) {
        if (!token) {
            return <Navigate to="/login" replace />;
        }

        // Clean up invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');

        // Redirect based on role
        const role = localStorage.getItem('userRole');
        if (role === 'volunteer' || role === 'responder') {
            return <Navigate to="/volunteer-dashboard" replace />;
        }
        if (role === 'civilian') {
            return <Navigate to="/civilian-dashboard" replace />;
        }
        if (['admin', 'dispatcher'].includes(role)) {
            return <Navigate to="/dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            <SessionTimeoutWarning
                timeLeft={sessionTimeLeft}
                onExtend={() => window.__extendSession && window.__extendSession()}
                onLogout={() => window.__logout && window.__logout()}
            />
            {children}
        </>
    );
};

export default ProtectedRoute;