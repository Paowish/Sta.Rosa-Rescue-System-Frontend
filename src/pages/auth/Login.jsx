// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { authService } from '../../services/api';
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

/**
 * Pending Approval Modal Component
 * Displays when volunteer application is pending review
 */
function PendingApprovalModal({ isOpen, onClose, onLoginClick }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Pending Approval</h3>
          <p className="text-sm text-gray-600 mt-2">Your volunteer application is currently being reviewed.</p>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Close</button>
          <button onClick={() => { onClose(); onLoginClick(); }} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Try Again</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Rejected Modal Component
 * Displays when volunteer application has been rejected
 */
function RejectedModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Application Rejected</h3>
          <p className="text-sm text-gray-600 mt-2">Your volunteer application has been rejected.</p>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Close</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Not Approved Modal Component
 * Displays when account is not yet approved
 */
function NotApprovedModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Account Not Approved</h3>
          <p className="text-sm text-gray-600 mt-2">Your account is not yet approved.</p>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Close</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Deactivated Modal Component
 * Displays when account has been deactivated
 */
function DeactivatedModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Account Deactivated</h3>
          <p className="text-sm text-gray-600 mt-2">Your account has been deactivated.</p>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Close</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Forgot Password Modal Component
 * Handles password reset request
 */
function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setMessage("Password reset link has been sent to your email.");
        setTimeout(() => {
          onClose();
          setEmail("");
          setMessage("");
        }, 3000);
      } else {
        setError(response.message || "Failed to send reset email.");
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L12 17l-1 1-1 1H8v-3l3.257-3.257A6 6 0 0112 7a2 2 0 012-2h4a2 2 0 012 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Forgot Password</h3>
          <p className="text-sm text-gray-600 mt-2">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4">
            <fieldset className="border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 border-gray-400">
              <legend className="text-sm px-2 text-gray-700">Email Address</legend>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@gmail.com"
                required
                className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
              />
            </fieldset>
          </div>

          {message && <p className="text-green-600 text-sm mb-3 text-center">{message}</p>}
          {error && <p className="text-red-600 text-sm mb-3 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Login Component
 * Main authentication page with email/password and Google OAuth
 */
export default function Login() {
  // Form state
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [lockUntil, setLockUntil] = useState(null);

  // Modal states
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showNotApprovedModal, setShowNotApprovedModal] = useState(false);
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const navigate = useNavigate();


  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await authService.googleLogin(credentialResponse.credential);

      if (res.success) {
        if (res.user?.applicationStatus === 'pending' || res.user?.isApproved === false) {
          setShowPendingModal(true);
          return;
        }

        const userToStore = {
          id: res.user._id || res.user.id,
          firstName: res.user.firstName,
          lastName: res.user.lastName,
          email: res.user.email,
          role: res.user.role,
          profileImage: res.user.profileImage,
          isApproved: res.user.isApproved,
          applicationStatus: res.user.applicationStatus
        };

        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(userToStore));
        localStorage.setItem('userRole', userToStore.role);

        // ✅ Redirect based on role
        const roleRoutes = {
          civilian: "/overview",
          volunteer: "/volunteer-dashboard",
          responder: "/dashboard",
          dispatcher: "/dashboard",
          admin: "/admin/overview"
        };
        navigate(roleRoutes[userToStore.role] || "/login");
      } else {
        if (res.code === 'PENDING_APPROVAL' || res.message?.includes('pending approval')) {
          setShowPendingModal(true);
          return;
        }
        if (res.code === 'REJECTED' || res.message?.includes('rejected')) {
          setShowRejectedModal(true);
          return;
        }
        setError(res.message || "Google login failed.");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed.");
    }
  };
  // ✅ HANDLE GOOGLE CLICK - THIS MAKES THE BUTTON WORK
  const handleGoogleClick = () => {
    googleLogin();
  };

  /**
   * Navigate based on user role
   */
  const handleSuccessNavigate = () => {
    const role = localStorage.getItem('userRole');
    const roleRoutes = {
      civilian: "/overview",
      volunteer: "/volunteer-dashboard",
      responder: "/dashboard",
      dispatcher: "/dashboard",
      admin: "/admin/overview"
    };

    // ✅ FOR VOLUNTEERS - Check if approved before navigating
    if (role === 'volunteer') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // ✅ FIX: Only show pending if user is ACTUALLY pending
      if (user.applicationStatus === 'pending' || user.isApproved === false) {
        setShowPendingModal(true);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        return;
      }
    }

    navigate(roleRoutes[role] || "/login");
  };

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address (e.g., name@domain.com)";
    } else if (email.length > 254) {
      errors.email = "Email is too long";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (password.length > 128) {
      errors.password = "Password is too long";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle email/password login
   */
  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await authService.login(email, password);

      if (response.success === false) {
        // Handle specific error cases
        if (response.code === 'PENDING_APPROVAL' || (response.message && response.message.includes('pending approval'))) {
          setLoading(false);
          setShowPendingModal(true);
          return;
        }
        if (response.code === 'REJECTED' || (response.message && response.message.includes('rejected'))) {
          setLoading(false);
          setShowRejectedModal(true);
          return;
        }
        if (response.code === 'NOT_APPROVED' || (response.message && response.message.includes('not yet approved'))) {
          setLoading(false);
          setShowNotApprovedModal(true);
          return;
        }
        if (response.message && response.message.includes('deactivated')) {
          setLoading(false);
          setShowDeactivatedModal(true);
          return;
        }

        setError(response.message || "Login failed.");
        setLoading(false);
        return;
      }

      // Successful login
      let userData = response.user;
      let token = response.token;

      if (userData && token) {
        const userToStore = {
          id: userData.id || userData._id,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          role: userData.role || "civilian",
          phoneNumber: userData.phoneNumber || "",
          profileImage: userData.profileImage || "",
          isApproved: userData.isApproved,
          applicationStatus: userData.applicationStatus
        };

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userToStore));
        localStorage.setItem('userRole', userData.role || 'civilian');

        if (userData.profileImage) localStorage.setItem('profileImage', userData.profileImage);

        const userRole = userData.role || 'civilian';
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ✅ Redirect based on role (with approval check)
        handleSuccessNavigate();
      } else {
        setError("Invalid response from server");
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
      setLockUntil(Date.now() + 30000);
    }
  };

  // Render loading overlay
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-700 font-medium text-lg">Logging in...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center px-4 sm:px-6 md:px-10 py-6">
        {/* Modals */}
        <PendingApprovalModal
          isOpen={showPendingModal}
          onClose={() => setShowPendingModal(false)}
          onLoginClick={() => { setEmail(""); setPassword(""); setError(""); }}
        />
        <RejectedModal isOpen={showRejectedModal} onClose={() => setShowRejectedModal(false)} />
        <NotApprovedModal isOpen={showNotApprovedModal} onClose={() => setShowNotApprovedModal(false)} />
        <DeactivatedModal isOpen={showDeactivatedModal} onClose={() => setShowDeactivatedModal(false)} />
        <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />

        {/* Main Content with Slide Animation */}
        <motion.div
          key="login-page"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="w-full max-w-md md:max-w-6xl py-4 md:py-10"
        >
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="logo" className="h-10 w-10 object-cover" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E252B]">Rescue Team</h1>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Login Form */}
            <div>
              <h2 className="text-4xl font-semibold text-gray-800 mb-3">Login to your account</h2>
              <p className="text-gray-500 text-sm mb-8">Access the Central Luzon Emergency Response operations command platform.</p>

              <div className="w-full mb-5 relative">
                {/* ✅ GoogleLogin component (on top, receives click) */}
                <div className="absolute inset-0 opacity-0 z-10">
                  <GoogleLogin
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    width="400"
                    onSuccess={handleGoogleSuccess}
                    onError={() => console.log('Google Login Failed')}
                  />
                </div>

                {/* ✅ Custom SVG button (visual only, underneath) */}
                <div className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50 transition pointer-events-none">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-gray-700 font-medium text-sm sm:text-base">Sign in with Google</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <hr className="w-full border-gray-300" />
                <span className="text-sm text-gray-500 font-medium shrink-0">OR</span>
                <hr className="w-full border-gray-300" />
              </div>

              {/* Error Message */}
              {error && (
                <div className={`mb-4 p-3 rounded-md text-sm ${error.includes('⏳') || error.includes('⚠️')
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
                  }`}>
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="w-full mb-5">
                <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${validationErrors.email ? 'border-red-500' : 'border-gray-400'
                  }`}>
                  <legend className="text-sm px-2 text-gray-700">Email</legend>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationErrors.email) setValidationErrors({ ...validationErrors, email: null });
                    }}
                    placeholder="john.doe@gmail.com"
                    className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                  />
                </fieldset>
                {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
              </div>

              {/* Password Input */}
              <div className="w-full">
                <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${validationErrors.password ? 'border-red-500' : 'border-gray-400'
                  }`}>
                  <legend className="text-sm px-2 text-gray-700">Password</legend>
                  <div className="flex items-center">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (validationErrors.password) setValidationErrors({ ...validationErrors, password: null });
                      }}
                      placeholder="••••••••"
                      className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                    />
                    <span onClick={() => setShowPass(!showPass)} className="cursor-pointer text-gray-500 ml-2">
                      {showPass ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </fieldset>
                {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between mt-2 mb-6">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="w-4 h-4" /> Remember me
                </label>
                <button onClick={() => setShowForgotModal(true)} className="text-sm text-red-400 hover:underline">
                  Forgot Password
                </button>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={loading || (lockUntil && Date.now() < lockUntil)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : (lockUntil && Date.now() < lockUntil ? "Please wait 30s..." : "Login")}
              </button>

              {/* Guest Report Button */}
              <button
                onClick={() => navigate('/Guest/Report')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-md font-medium transition flex items-center justify-center gap-2 mt-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Report as Guest
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-gray-600 mt-5">
                Don't have an account? <Link to="/signup" className="text-red-400 font-medium hover:underline cursor-pointer">Sign up</Link>
              </p>

              {/* Back to Home */}
              <div className="mt-4 text-center text-sm text-gray-500">
                <Link to="/" className="text-[#FF6B6B] hover:text-[#E55A5A] transition-colors">
                  ← Back to Home
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="hidden md:block">
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img src="/shers.png" alt="building" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}