// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

/**
 * Custom hook to access authentication context
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Authentication Provider Component
 * Manages user authentication state and provides login/logout functionality
 */
export const AuthProvider = ({ children }) => {
    // State for user data and authentication status
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    /**
     * Initialize user data from localStorage on mount
     */
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                // Clear corrupted user data
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    /**
     * Authenticate user and persist session data
     * @param {Object} userData - User information
     * @param {string} token - Authentication token
     */
    const login = (userData, token) => {
        setUser(userData);
        setToken(token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
    };

    /**
     * Logout user and clear session data
     */
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    // Context value object
    const value = {
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!user && !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;