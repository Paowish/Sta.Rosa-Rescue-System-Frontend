import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { authService } from '../../services/api';

// ✅ Pending Approval Modal Component
function PendingApprovalModal({ isOpen, onClose, onLoginClick }) {
  if (!isOpen) return null;
  // ... (Keep your existing modal code here) ...
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

// ✅ Rejected, NotApproved, Deactivated Modals... (Keep your existing code for these)
function RejectedModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
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

// ✅ NEW: Forgot Password Modal Component
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
      // Assuming authService has a forgotPassword method. 
      // If your backend uses a different route, adjust here.
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


// ✅ Main Login Component
export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Modal states
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showNotApprovedModal, setShowNotApprovedModal] = useState(false);
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false); // ✅ New state

  const navigate = useNavigate();

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

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await authService.login(email, password);

      if (response.success === false) {
        // Check for specific status codes for modals
        if (response.code === 'PENDING_APPROVAL' || (response.message && response.message.includes('pending approval'))) {
          setLoading(false); setShowPendingModal(true); return;
        }
        if (response.code === 'REJECTED' || (response.message && response.message.includes('rejected'))) {
          setLoading(false); setShowRejectedModal(true); return;
        }
        if (response.code === 'NOT_APPROVED' || (response.message && response.message.includes('not yet approved'))) {
          setLoading(false); setShowNotApprovedModal(true); return;
        }
        if (response.message && response.message.includes('deactivated')) {
          setLoading(false); setShowDeactivatedModal(true); return;
        }

        setError(response.message || "Login failed.");
        setLoading(false);
        return;
      }

      // ✅ Successful login
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
          profileImage: userData.profileImage || ""
        };

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userToStore));
        localStorage.setItem('userRole', userData.role || 'civilian');

        if (userData.profileImage) localStorage.setItem('profileImage', userData.profileImage);

        const userRole = userData.role || 'civilian';
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (userRole === "admin") navigate("/admin/overview");
        else if (userRole === "dispatcher" || userRole === "responder") navigate("/dashboard");
        else if (userRole === "volunteer") navigate("/volunteer-dashboard");
        else if (userRole === "civilian") navigate("/civilian-dashboard");
        else navigate("/dashboard");
      } else {
        setError("Invalid response from server");
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center px-4 sm:px-6 md:px-10 py-6">
      {/* ✅ Modals */}
      <PendingApprovalModal isOpen={showPendingModal} onClose={() => setShowPendingModal(false)} onLoginClick={() => { setEmail(""); setPassword(""); setError(""); }} />
      <RejectedModal isOpen={showRejectedModal} onClose={() => setShowRejectedModal(false)} />
      <NotApprovedModal isOpen={showNotApprovedModal} onClose={() => setShowNotApprovedModal(false)} /> {/* Keep your existing NotApprovedModal component */}
      <DeactivatedModal isOpen={showDeactivatedModal} onClose={() => setShowDeactivatedModal(false)} /> {/* Keep your existing DeactivatedModal component */}

      {/* ✅ New Forgot Password Modal */}
      <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />

      <div className="w-full max-w-6xl py-10">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.png" alt="logo" className="h-10 w-10 object-cover" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E252B]">Rescue Team</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-4xl font-semibold text-gray-800 mb-3">Login to your account</h2>
            <p className="text-gray-500 text-sm mb-8">Access the Central Luzon Emergency Response operations command platform.</p>

            {error && (
              <div className={`mb-4 p-3 rounded-md text-sm ${error.includes('⏳') || error.includes('⚠️') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {error}
              </div>
            )}

            <div className="w-full mb-5">
              <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${validationErrors.email ? 'border-red-500' : 'border-gray-400'}`}>
                <legend className="text-sm px-2 text-gray-700">Email</legend>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (validationErrors.email) setValidationErrors({ ...validationErrors, email: null }); }} placeholder="john.doe@gmail.com" className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base" />
              </fieldset>
              {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
            </div>

            <div className="w-full">
              <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${validationErrors.password ? 'border-red-500' : 'border-gray-400'}`}>
                <legend className="text-sm px-2 text-gray-700">Password</legend>
                <div className="flex items-center">
                  <input type={showPass ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); if (validationErrors.password) setValidationErrors({ ...validationErrors, password: null }); }} placeholder="••••••••" className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base" />
                  <span onClick={() => setShowPass(!showPass)} className="cursor-pointer text-gray-500 ml-2">{showPass ? <FaEyeSlash /> : <FaEye />}</span>
                </div>
              </fieldset>
              {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
            </div>

            <div className="flex items-center justify-between mt-2 mb-6">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="w-4 h-4" /> Remember me
              </label>
              {/* ✅ Functional Forgot Password Button */}
              <button onClick={() => setShowForgotModal(true)} className="text-sm text-red-400 hover:underline">
                Forgot Password
              </button>
            </div>

            <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">Login</button>

            <button onClick={() => navigate('/Guest')} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-md font-medium transition flex items-center justify-center gap-2 mt-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Report as Guest
            </button>

            <p className="text-center text-sm text-gray-600 mt-5">
              Don't have an account? <Link to="/signup" className="text-red-400 font-medium hover:underline cursor-pointer">Sign up</Link>
            </p>

          </div>

          <div className="hidden md:block">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="/shers.png" alt="building" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ Keep your existing NotApprovedModal and DeactivatedModal components here below
function NotApprovedModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
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

function DeactivatedModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
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