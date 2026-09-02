import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import NotificationBell from "./NotificationBell";
import notificationService from "../../services/notificationService";
import { incidentService, notificationService as apiNotificationService } from "../../services/api";
import IncidentDetails from "../../pages/rescueTeam/IncidentDetails";
import io from 'socket.io-client';

/**
 * Professional Page Transition Component - Slide from Left
 * Handles smooth page transitions with directional awareness
 */
const PageTransition = ({ children, location }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [prevLocation, setPrevLocation] = useState(location);
  const [direction, setDirection] = useState('right');

  useEffect(() => {
    if (location !== prevLocation) {
      setIsVisible(false);

      // Define page order for directional transitions
      const pathOrder = ['/dashboard', '/incidents', '/units', '/volunteer-approval', '/profile'];
      const prevIndex = pathOrder.indexOf(prevLocation.pathname);
      const currIndex = pathOrder.indexOf(location.pathname);

      if (prevIndex !== -1 && currIndex !== -1) {
        setDirection(currIndex > prevIndex ? 'right' : 'left');
      } else {
        setDirection('right');
      }

      // Trigger enter animation after a brief delay
      const timer = setTimeout(() => {
        setPrevLocation(location);
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [location, prevLocation]);

  return (
    <div className={`page-transition ${isVisible ? 'page-enter-active' : 'page-enter'} direction-${direction}`}>
      {children}
    </div>
  );
};

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // State for incident details sidebar
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarClosing, setIsSidebarClosing] = useState(false);

  // State for incident popup notifications
  const [showIncidentPopup, setShowIncidentPopup] = useState(false);
  const [latestIncidentAlert, setLatestIncidentAlert] = useState(null);
  const [isSlidingOut, setIsSlidingOut] = useState(false);

  // State for user profile data
  const [userName, setUserName] = useState("Loading...");
  const [userRole, setUserRole] = useState("Rescuer");
  const [profileImage, setProfileImage] = useState(null);

  // State for logout functionality
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // State for volunteer approval badge
  const [pendingVolunteerCount, setPendingVolunteerCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const [hasNewApplication, setHasNewApplication] = useState(false);

  // Refs for socket and polling
  const socketRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastKnownUnreadCountRef = useRef(0);

  /**
   * Listen for volunteer count updates via custom event
   */
  useEffect(() => {
    const handleVolunteerCountUpdate = (event) => {
      if (event.detail && event.detail.pendingCount !== undefined) {
        const newCount = event.detail.pendingCount;
        if (location.pathname !== '/volunteer-approval') {
          setPendingVolunteerCount(newCount);
          if (newCount > 0) {
            setShowBadge(true);
            setHasNewApplication(true);
          }
        } else {
          setPendingVolunteerCount(newCount);
          setShowBadge(false);
        }
      }
    };

    window.addEventListener('volunteerCountUpdated', handleVolunteerCountUpdate);
    return () => {
      window.removeEventListener('volunteerCountUpdated', handleVolunteerCountUpdate);
    };
  }, [location.pathname]);

  /**
   * Control badge visibility based on current route and application status
   */
  useEffect(() => {
    if (location.pathname === '/volunteer-approval') {
      setShowBadge(false);
      setHasNewApplication(false);
    } else if (hasNewApplication && pendingVolunteerCount > 0) {
      setShowBadge(true);
    }
  }, [location.pathname, hasNewApplication, pendingVolunteerCount]);

  /**
   * Load user data from localStorage
   */
  const loadUserData = () => {
    try {
      const user = localStorage.getItem('user');
      const storedImage = localStorage.getItem('profileImage');

      if (user) {
        const userData = JSON.parse(user);
        const firstName = userData.firstName || "";
        const lastName = userData.lastName || "";

        // Set user display name
        if (firstName && lastName) {
          setUserName(`${firstName} ${lastName}`);
        } else if (firstName) {
          setUserName(firstName);
        } else if (lastName) {
          setUserName(lastName);
        } else {
          setUserName("Rescue member 01");
        }

        // Map role to display value
        if (userData.role) {
          const roleMap = {
            'admin': 'Admin',
            'dispatcher': 'Dispatcher',
            'responder': 'Rescuer',
            'volunteer': 'Volunteer',
            'civilian': 'Civilian'
          };
          setUserRole(roleMap[userData.role] || userData.role);
        }
      } else {
        setUserName("Rescue member 01");
      }

      // Load profile image
      if (storedImage && storedImage !== "") {
        if (storedImage.startsWith('http') || storedImage.startsWith('data:')) {
          setProfileImage(storedImage);
        } else {
          setProfileImage(`http://localhost:5000/${storedImage}`);
        }
      } else if (user) {
        const userData = JSON.parse(user);
        if (userData.profileImage) {
          const img = userData.profileImage;
          if (img.startsWith('http') || img.startsWith('data:')) {
            setProfileImage(img);
          } else {
            setProfileImage(`http://localhost:5000/${img}`);
          }
        } else {
          setProfileImage(null);
        }
      } else {
        setProfileImage(null);
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
      setUserName("Rescue member 01");
      setProfileImage(null);
    }
  };

  /**
   * Fetch pending volunteer applications count
   */
  const loadPendingVolunteerCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/volunteers/applications?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const count = data.data.length || 0;
        setPendingVolunteerCount(count);
        if (count > 0 && location.pathname !== '/volunteer-approval') {
          setShowBadge(true);
          setHasNewApplication(true);
        }
      }
    } catch (error) {
      console.error('Failed to load pending volunteer count:', error);
    }
  };

  /**
   * Subscribe to notification service events
   */
  useEffect(() => {
    const unsubscribe = notificationService.addListener((data) => {
      if (data.type === 'show') {
        setLatestIncidentAlert(data.notification);
        setShowIncidentPopup(true);
        setIsSlidingOut(false);
      } else if (data.type === 'dismiss') {
        setShowIncidentPopup(false);
        setLatestIncidentAlert(null);
        setIsSlidingOut(false);
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Dismiss the incident popup with animation
   */
  const dismissPopup = () => {
    setIsSlidingOut(true);
    setTimeout(() => {
      notificationService.dismissNotification();
    }, 500);
  };

  /**
   * Check for new notifications via API
   */
  const checkForNewNotifications = async () => {
    try {
      const response = await apiNotificationService.getNotifications();
      if (response.success) {
        const newCount = response.unreadCount;
        const unreadIncidents = response.data.filter(n => n.type === 'new_incident' && !n.isRead);

        if (unreadIncidents.length > 0 && newCount !== lastKnownUnreadCountRef.current) {
          const latestIncident = unreadIncidents[0];
          notificationService.showNotification(latestIncident);
        }
        lastKnownUnreadCountRef.current = newCount;
      }
    } catch (error) {
      console.error("Failed to check notifications:", error);
    }
  };

  /**
   * Establish Socket.IO connection for real-time updates
   */
  const setupSocketConnection = () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (token && user._id) {
        const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5000'
          : 'https://sta-rosa-rescue-system-backend.onrender.com';

        socketRef.current = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling']
        });

        // Socket event handlers
        socketRef.current.on('connect', () => {
          console.log('✅ Socket connected');
          socketRef.current.emit('join', user._id);
          socketRef.current.emit('join-room', 'rescue-team');
        });

        socketRef.current.on('new_notification', (notification) => {
          if (notification.type === 'new_incident') {
            notificationService.resetForNewNotification();
            notificationService.showNotification(notification);
          }
          if (notification.type === 'volunteer_status' || notification.type === 'new_volunteer') {
            loadPendingVolunteerCount();
            setHasNewApplication(true);
            setShowBadge(true);
            window.dispatchEvent(new CustomEvent('refreshVolunteerList'));
            window.dispatchEvent(new CustomEvent('volunteerCountUpdated', {
              detail: { pendingCount: pendingVolunteerCount }
            }));
          }
        });

        socketRef.current.on('new_incident', (data) => {
          const notification = {
            _id: data._id || Date.now().toString(),
            type: 'new_incident',
            title: data.title || 'New Incident',
            message: data.message || 'A new incident has been reported',
            data: data,
            createdAt: data.createdAt || new Date().toISOString()
          };
          notificationService.resetForNewNotification();
          notificationService.showNotification(notification);
        });

        socketRef.current.on('new_volunteer_application', (data) => {
          loadPendingVolunteerCount();
          setHasNewApplication(true);
          setShowBadge(true);
          window.dispatchEvent(new CustomEvent('refreshVolunteerList'));
          window.dispatchEvent(new CustomEvent('volunteerCountUpdated', {
            detail: { pendingCount: pendingVolunteerCount }
          }));
        });

        socketRef.current.on('volunteer_application_updated', (data) => {
          loadPendingVolunteerCount();
          window.dispatchEvent(new CustomEvent('refreshVolunteerList'));
          window.dispatchEvent(new CustomEvent('volunteerCountUpdated', {
            detail: { pendingCount: pendingVolunteerCount }
          }));
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });
      }
    } catch (error) {
      console.error("Failed to setup socket:", error);
    }
  };

  /**
   * Initial check for unread notifications on mount
   */
  const initialCheck = async () => {
    try {
      const response = await apiNotificationService.getNotifications();
      if (response.success) {
        const unreadIncidents = response.data.filter(n => n.type === 'new_incident' && !n.isRead);
        if (unreadIncidents.length > 0) {
          const latestIncident = unreadIncidents[0];
          notificationService.showNotification(latestIncident);
        }
        lastKnownUnreadCountRef.current = response.unreadCount;
      }
    } catch (error) {
      console.error("Initial check failed:", error);
    }
  };

  /**
   * Initialize dashboard - load data, setup socket, start polling
   */
  useEffect(() => {
    loadUserData();
    setupSocketConnection();
    initialCheck();
    loadPendingVolunteerCount();

    // Poll for new notifications every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      checkForNewNotifications();
    }, 5000);

    // Poll for volunteer count updates every 10 seconds when tab is visible
    const volunteerPollInterval = setInterval(() => {
      if (!document.hidden) {
        loadPendingVolunteerCount();
      }
    }, 10000);

    // Listen for storage changes (profile updates)
    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      clearInterval(volunteerPollInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

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
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('profileImage');

      // Brief delay for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));

      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  /**
   * Handle incident click to open details sidebar
   */
  const handleIncidentClick = (incident) => {
    setSelectedIncident(incident);
    setIsSidebarOpen(true);
    setIsSidebarClosing(false);
  };

  /**
   * Close incident details sidebar with animation
   */
  const handleCloseSidebar = () => {
    setIsSidebarClosing(true);
    setTimeout(() => {
      setIsSidebarOpen(false);
      setSelectedIncident(null);
      setIsSidebarClosing(false);
    }, 300);
  };

  // Render loading state during logout
  if (isLoggingOut) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
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
      {/* Global Incident Popup - Professional */}
      <div className={`fixed top-6 right-6 z-[999] transition-all duration-500 ease-in-out transform ${showIncidentPopup && latestIncidentAlert
        ? isSlidingOut
          ? 'translate-x-[calc(100%+20px)] opacity-0'
          : 'translate-x-0 opacity-100'
        : 'translate-x-[calc(100%+20px)] opacity-0 pointer-events-none'
        }`}>
        <div className="bg-white/95 backdrop-blur-sm border border-red-200 shadow-2xl rounded-xl p-5 max-w-sm min-w-[300px] flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
            <Icon icon="mdi:alert-circle" className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 text-sm">{latestIncidentAlert?.title || "New Incident Reported"}</h4>
            <p className="text-sm text-gray-600 mt-0.5 break-words">{latestIncidentAlert?.message}</p>
            <p className="text-xs text-gray-400 mt-1">Just now</p>
          </div>
          <button
            onClick={dismissPopup}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-[400px] max-w-[90vw] p-6 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                <Icon icon="material-symbols:logout" className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">Logout</h3>
            <p className="text-gray-500 text-center text-sm mb-6">
              Are you sure you want to logout from your account?
            </p>
            <div className="flex gap-3">
              <button onClick={handleCancelLogout} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleConfirmLogout} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition shadow-sm">Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="h-16 bg-[#1f6b75] flex items-center justify-between px-6 text-white flex-shrink-0 z-10 shadow-md">
        <NavLink to="/dashboard" className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
          <img src="/logo.png" className="w-10 h-10" alt="logo" />
          <div>
            <h1 className="font-semibold text-lg tracking-tight">Rescue Team</h1>
            <p className="text-xs opacity-80">Municipality of Santa Rosa</p>
          </div>
        </NavLink>
        <NotificationBell />
      </div>

      {/* Main Layout with Sidebars */}
      <div className="flex flex-1 overflow-hidden relative bg-[#F0F2F5]">
        {/* Left Sidebar - Elevated & Professional */}
        <div className="w-64 bg-[#F5F4FF] flex flex-col justify-between flex-shrink-0 border-r border-gray-200 shadow-sm sidebar-container">
          <div className="flex flex-col h-full">
            {/* Profile Header Section */}
            <div className="bg-gradient-to-br from-[#f8f9fc] to-[#f1f3f8] p-4 border-b border-gray-200 relative overflow-hidden">
              <div className="flex items-center gap-2 relative z-10 w-full">
                {/* Avatar Circle */}
                <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center profile-avatar">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <svg
                      className="w-6 h-6 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  )}
                </div>

                {/* User Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider user-role line-clamp-1">
                    {userRole}
                  </p>
                  <p
                    className="text-xs font-semibold text-gray-800 user-name line-clamp-2 break-words"
                    title={userName}
                  >
                    {userName}
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Links */}
            <div className="p-4 space-y-1 text-gray-600 text-sm nav-links flex-1">
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon icon="material-symbols-light:home-rounded" className="w-5 h-5" /> Dashboard
              </NavLink>
              <NavLink to="/incidents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon icon="ic:baseline-emergency" className="w-5 h-5" /> Incidents
              </NavLink>
              <NavLink to="/units" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon icon="material-symbols:group" className="w-5 h-5" /> Units
              </NavLink>
              <NavLink to="/volunteer-approval" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon icon="material-symbols:groups" className="w-5 h-5" /> Volunteers
                {showBadge && pendingVolunteerCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {pendingVolunteerCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon icon="material-symbols:account-circle" className="w-5 h-5" /> Profile
              </NavLink>
            </div>
          </div>

          {/* Logout Button */}
          <div onClick={handleLogoutClick} className="m-4 p-3 text-gray-500 text-sm cursor-pointer hover:text-red-600 flex items-center gap-3 rounded-lg transition-colors duration-200 hover:bg-red-50 logout-btn">
            <Icon icon="material-symbols:logout" className="w-5 h-5" /> Logout
          </div>
        </div>

        {/* Main Content with Page Transitions */}
        <div className="flex-1 bg-[#F0F2F5] overflow-y-auto main-content">
          <div className="p-6 max-w-[1600px] mx-auto">
            <PageTransition location={location}>
              {React.isValidElement(children)
                ? React.cloneElement(children, { onIncidentClick: handleIncidentClick })
                : children}
            </PageTransition>
          </div>
        </div>

        {/* Right Sidebar - Incident Details with Smooth Transitions */}
        {isSidebarOpen && selectedIncident && (
          <>
            <div
              className={`fixed inset-0 z-10 transition-opacity duration-300 ${isSidebarClosing ? 'opacity-0' : 'opacity-100'}`}
              onClick={handleCloseSidebar}
            >
              <div className="w-full h-full bg-black/20 backdrop-blur-[1px]"></div>
            </div>
            <div
              className={`absolute top-0 right-0 h-full w-[450px] border-l border-gray-200 shadow-2xl z-20 transition-transform duration-300 ease-in-out ${isSidebarClosing ? 'translate-x-full' : 'translate-x-0'}`}
            >
              <IncidentDetails
                key={selectedIncident?._id || selectedIncident?.id}
                data={selectedIncident}
                onClose={handleCloseSidebar}
                onDispatch={() => { console.log('Dispatched'); }}
                onResolve={() => {
                  console.log('Resolved');
                  handleCloseSidebar();
                }}
                onViewReport={(incident) => console.log('View Report:', incident)}
              />
            </div>
          </>
        )}
      </div>

      {/* Global Professional Animations CSS */}
      <style>{`
        .page-transition {
          will-change: transform, opacity;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .page-enter {
          opacity: 0;
          transform: translateX(-30px);
        }
        .page-enter-active {
          opacity: 1;
          transform: translateX(0);
        }
        .page-exit {
          opacity: 1;
          transform: translateX(0);
        }
        .page-exit-active {
          opacity: 0;
          transform: translateX(30px);
        }
        .direction-right.page-enter {
          transform: translateX(-30px);
        }
        .direction-left.page-enter {
          transform: translateX(30px);
        }
        .direction-right.page-enter-active {
          transform: translateX(0);
        }
        .direction-left.page-enter-active {
          transform: translateX(0);
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          border-radius: 0.75rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          color: #6b7280;
          font-weight: 500;
        }
        .nav-link:hover {
          background: #f3f4f6;
          color: #1f2937;
          transform: translateX(4px);
        }
        .nav-link.active {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 600;
          box-shadow: inset 3px 0 0 #2563eb;
        }

        .profile-avatar {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .profile-avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .logout-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .logout-btn:hover {
          transform: translateX(4px);
        }

        .main-content::-webkit-scrollbar {
          width: 6px;
        }
        .main-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .main-content::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .main-content::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @media (max-width: 768px) {
          .sidebar-container {
            width: 90px;
          }
          .nav-link {
            justify-content: center;
            padding: 0.7rem 0.5rem;
            font-size: 10px;
            text-align: center;
            flex-direction: column;
          }
          .nav-link span:not(.ml-auto) {
            display: block;
            text-align: center;
          }
          .user-name, .user-role {
            display: block;
            text-align: left;
          }
          .logout-btn {
            justify-content: center;
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}