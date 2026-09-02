// src/components/layout/CivilianDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";
import NotificationBell from "../../components/layout/NotificationBell";
import { authService } from "../../services/api";

/**
 * Civilian Dashboard Layout Component
 * Provides responsive layout with navigation sidebar for civilian users
 */
export default function CivilianDashboard({ children }) {
  // State for mobile sidebar
  const [open, setOpen] = useState(false);

  // State for user data
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImage] = useState("");

  // State for logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();

  /**
   * Load user data from localStorage or provided data
   */
  const loadUserData = (data = null) => {
    const user = data || JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      // Set user display name
      if (user.firstName && user.lastName) {
        setUserName(`${user.firstName} ${user.lastName}`);
      } else if (user.firstName) {
        setUserName(user.firstName);
      } else if (user.email) {
        setUserName(user.email.split('@')[0]);
      } else {
        setUserName("Civilian User");
      }

      // Set profile image
      if (user.profileImage && user.profileImage !== "") {
        if (user.profileImage.startsWith('http') || user.profileImage.startsWith('data:')) {
          setProfileImage(user.profileImage);
        } else {
          setProfileImage(`http://localhost:5000/${user.profileImage}`);
        }
      } else {
        setProfileImage("");
      }
    } else {
      setUserName("Civilian User");
      setProfileImage("");
    }
  };

  /**
   * Initialize dashboard - load user data and fetch fresh from backend
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    loadUserData();

    // Redirect if not authenticated
    if (!token || !user) {
      navigate('/login');
    }

    // Fetch fresh user data from backend
    const fetchUser = async () => {
      try {
        const res = await authService.getCurrentUser();
        if (res && res.data) {
          const freshUser = {
            ...res.data,
            id: res.data._id || res.data.id,
          };
          localStorage.setItem('user', JSON.stringify(freshUser));
          loadUserData(freshUser);
        }
      } catch (error) {
        console.error("Failed to fetch latest user data:", error);
      }
    };

    fetchUser();
  }, [navigate]);

  /**
   * Handle logout button click
   */
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  /**
   * Cancel logout action
   */
  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  /**
   * Confirm and execute logout
   */
  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('profileImage');

      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  /**
   * Handle logo click navigation
   */
  const handleLogoClick = () => {
    navigate('/overview');
    setOpen(false);
  };

  // Render loading state during logout
  if (isLoggingOut) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-700 font-medium text-lg">Logging out...</p>
          <p className="text-gray-400 text-sm">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40">
          <div className="bg-white rounded-lg shadow-2xl w-[400px] max-w-[90vw] p-6 flex flex-col">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <Icon icon="material-symbols:logout" className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">Logout</h3>
            <p className="text-gray-600 text-center text-sm mb-6">
              Are you sure you want to logout from your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelLogout}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="h-16 bg-[#1f6b75] flex items-center justify-between px-4 text-white">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Open Menu"
          >
            <Icon icon="mdi:menu" className="w-6 h-6" />
          </button>

          {/* Logo and Brand */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img src="/logo.png" className="w-9 h-9 sm:w-10 sm:h-10" alt="logo" />
            <div className="justify-center text-left">
              <h1 className="font-semibold text-base sm:text-lg">Civilian</h1>
              <p className="text-[10px] sm:text-xs opacity-70">Municipality of Santa Rosa</p>
            </div>
          </button>
        </div>
        <NotificationBell />
      </div>

      {/* Main Layout Body */}
      <div className="flex flex-1 overflow-hidden relative bg-[#EEF2F6]">
        {/* Mobile Overlay */}
        {open && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Responsive Sidebar */}
        <div
          className={`
            fixed md:static z-50 top-0 left-0 h-full w-72 sm:w-64 bg-white border-r border-gray-200 shadow-md
            p-5 flex flex-col justify-between
            transform transition-transform duration-300 ease-in-out
            ${open ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
          `}
        >
          <div>
            {/* Mobile Close Button */}
            <div className="flex justify-between items-center mb-6 md:hidden">
              <span className="font-bold text-gray-800 text-lg">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close Menu"
              >
                <Icon icon="mdi:close" className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Profile Section */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 mb-6 border border-blue-200">
              <div className="flex items-center gap-3 w-full overflow-hidden">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white shadow-md overflow-hidden flex items-center justify-center flex-shrink-0">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Icon icon="mdi:account" className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* User Info */}
                <div className="min-w-0 flex-1 w-full">
                  <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider truncate">Civilian</p>
                  <p
                    className="text-sm font-bold text-gray-800 truncate w-full"
                    title={userName || "Civilian User"}
                  >
                    {userName || "Civilian User"}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="space-y-1.5">
              <NavLink
                to="/overview"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-[#1f6b75] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#f0f4f8] hover:text-[#1f6b75]'
                  }`
                }
              >
                <Icon icon="material-symbols-light:home-rounded" className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Overview</span>
              </NavLink>

              <NavLink
                to="/report"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-[#1f6b75] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#f0f4f8] hover:text-[#1f6b75]'
                  }`
                }
              >
                <Icon icon="mdi:report" className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Report Incident</span>
              </NavLink>

              <NavLink
                to="/track-reports"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-[#1f6b75] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#f0f4f8] hover:text-[#1f6b75]'
                  }`
                }
              >
                <Icon icon="material-symbols:track-changes" className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Track Reports</span>
              </NavLink>

              <NavLink
                to="/edit-profile"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-[#1f6b75] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#f0f4f8] hover:text-[#1f6b75]'
                  }`
                }
              >
                <Icon icon="material-symbols:settings" className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Profile</span>
              </NavLink>
            </div>
          </div>

          {/* Logout Button */}
          <div
            onClick={handleLogoutClick}
            className="group flex items-center gap-3 p-3 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50/80 transition-all duration-300 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100 transition-all duration-300 flex items-center justify-center flex-shrink-0">
              <Icon icon="material-symbols:logout" className="w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors duration-300" />
            </div>
            <span className="font-medium group-hover:translate-x-0.5 transition-transform duration-300">Logout</span>
            <Icon icon="mdi:chevron-right" className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-red-500" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-[#EEF2F6] overflow-y-auto p-3 sm:p-4 md:p-6 z-0">
          {children}
        </div>
      </div>
    </div>
  );
}