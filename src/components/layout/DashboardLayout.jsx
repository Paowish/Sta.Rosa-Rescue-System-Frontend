import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import NotificationBell from "./NotificationBell";
import notificationService from "../../services/notificationService";
import { incidentService, notificationService as apiNotificationService } from "../../services/api";
import IncidentDetails from "../../pages/rescueTeam/IncidentDetails";
import io from 'socket.io-client';

// ✅ Professional Page Transition Component - Slide from Left
const PageTransition = ({ children, location }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [prevLocation, setPrevLocation] = useState(location);
  const [direction, setDirection] = useState('right');

  useEffect(() => {
    if (location !== prevLocation) {
      setIsVisible(false);

      // Determine direction based on path order
      const pathOrder = ['/dashboard', '/incidents', '/units', '/volunteer-approval', '/profile'];
      const prevIndex = pathOrder.indexOf(prevLocation.pathname);
      const currIndex = pathOrder.indexOf(location.pathname);

      if (prevIndex !== -1 && currIndex !== -1) {
        setDirection(currIndex > prevIndex ? 'right' : 'left');
      } else {
        setDirection('right');
      }

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
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarClosing, setIsSidebarClosing] = useState(false);

  const [showIncidentPopup, setShowIncidentPopup] = useState(false);
  const [latestIncidentAlert, setLatestIncidentAlert] = useState(null);
  const [isSlidingOut, setIsSlidingOut] = useState(false);

  const [userName, setUserName] = useState("Loading...");
  const [userRole, setUserRole] = useState("Rescuer");
  const [profileImage, setProfileImage] = useState(null);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Volunteer applicant count
  const [pendingVolunteerCount, setPendingVolunteerCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const [hasNewApplication, setHasNewApplication] = useState(false);

  const socketRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastKnownUnreadCountRef = useRef(0);

  // ✅ Listen for volunteer count updates from VolunteerApproval
  useEffect(() => {
    const handleVolunteerCountUpdate = (event) => {
      if (event.detail && event.detail.pendingCount !== undefined) {
        const newCount = event.detail.pendingCount;
        console.log('📊 Volunteer count updated from event:', newCount);

        // ✅ Only update if we're not on the Volunteer page
        if (location.pathname !== '/volunteer-approval') {
          setPendingVolunteerCount(newCount);
          // ✅ Show badge if there's a new application
          if (newCount > 0) {
            setShowBadge(true);
            setHasNewApplication(true);
          }
        } else {
          // ✅ On Volunteer page, hide badge but keep count
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

  // ✅ Hide badge when on Volunteer page, show when on other pages with new applications
  useEffect(() => {
    if (location.pathname === '/volunteer-approval') {
      setShowBadge(false);
      setHasNewApplication(false);
    } else if (hasNewApplication && pendingVolunteerCount > 0) {
      setShowBadge(true);
    }
  }, [location.pathname, hasNewApplication, pendingVolunteerCount]);

  const loadUserData = () => {
    try {
      const user = localStorage.getItem('user');
      const storedImage = localStorage.getItem('profileImage');

      if (user) {
        const userData = JSON.parse(user);
        const firstName = userData.firstName || "";
        const lastName = userData.lastName || "";

        if (firstName && lastName) {
          setUserName(`${firstName} ${lastName}`);
        } else if (firstName) {
          setUserName(firstName);
        } else if (lastName) {
          setUserName(lastName);
        } else {
          setUserName("Rescue member 01");
        }

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

  // Load pending volunteer count
  const loadPendingVolunteerCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/volunteers/applications?status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const count = data.data.length || 0;
        setPendingVolunteerCount(count);
        console.log('📊 Pending volunteer count:', count);

        // ✅ Only show badge if there are new applications and not on Volunteer page
        if (count > 0 && location.pathname !== '/volunteer-approval') {
          setShowBadge(true);
          setHasNewApplication(true);
        }
      }
    } catch (error) {
      console.error('Failed to load pending volunteer count:', error);
    }
  };

  // Subscribe to notification service events
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

  const dismissPopup = () => {
    setIsSlidingOut(true);
    setTimeout(() => {
      notificationService.dismissNotification();
    }, 500);
  };

  // Check for new notifications via polling
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

  // Setup socket connection
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

        socketRef.current.on('connect', () => {
          console.log('✅ Socket connected for notifications');
          socketRef.current.emit('join', user._id);
          socketRef.current.emit('join-room', 'rescue-team');
        });

        socketRef.current.on('new_notification', (notification) => {
          console.log('📢 New notification via socket:', notification);

          if (notification.type === 'new_incident') {
            console.log('🚨 New incident alert from socket!');
            notificationService.resetForNewNotification();
            notificationService.showNotification(notification);
          }

          // ✅ Check for volunteer application notifications
          if (notification.type === 'volunteer_status' || notification.type === 'new_volunteer') {
            console.log('👤 New volunteer application notification:', notification);
            loadPendingVolunteerCount();
            // ✅ Reset and show new count
            setHasNewApplication(true);
            setShowBadge(true);
            window.dispatchEvent(new CustomEvent('refreshVolunteerList'));
            window.dispatchEvent(new CustomEvent('volunteerCountUpdated', {
              detail: { pendingCount: pendingVolunteerCount }
            }));
          }
        });

        socketRef.current.on('new_incident', (data) => {
          console.log('🚨 Direct new_incident event received:', data);
          const notification = {
            _id: data._id || Date.now().toString(),
            type: 'new_incident',
            title: data.title || '🚨 New Incident',
            message: data.message || 'A new incident has been reported',
            data: data,
            createdAt: data.createdAt || new Date().toISOString()
          };
          notificationService.resetForNewNotification();
          notificationService.showNotification(notification);
        });

        // ✅ Volunteer application events
        socketRef.current.on('new_volunteer_application', (data) => {
          console.log('👤 New volunteer application received:', data);
          // ✅ Fetch fresh count
          loadPendingVolunteerCount();
          // ✅ Reset badge to show new application
          setHasNewApplication(true);
          setShowBadge(true);
          window.dispatchEvent(new CustomEvent('refreshVolunteerList'));
          window.dispatchEvent(new CustomEvent('volunteerCountUpdated', {
            detail: { pendingCount: pendingVolunteerCount }
          }));
        });

        socketRef.current.on('volunteer_application_updated', (data) => {
          console.log('👤 Volunteer application updated:', data);
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

  // Initial check for unread notifications
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

  useEffect(() => {
    loadUserData();
    setupSocketConnection();
    initialCheck();
    loadPendingVolunteerCount();

    // Poll for new notifications every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      checkForNewNotifications();
    }, 5000);

    // Poll for volunteer count every 10 seconds
    const volunteerPollInterval = setInterval(() => {
      if (!document.hidden) {
        loadPendingVolunteerCount();
      }
    }, 10000);

    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);

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

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

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

  const handleIncidentClick = (incident) => {
    setSelectedIncident(incident);
    setIsSidebarOpen(true);
    setIsSidebarClosing(false);
  };

  const handleCloseSidebar = () => {
    setIsSidebarClosing(true);
    setTimeout(() => {
      setIsSidebarOpen(false);
      setSelectedIncident(null);
      setIsSidebarClosing(false);
    }, 300);
  };

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
    <div className="h-screen flex flex-col overflow-hidden rescue-team">

      {/* GLOBAL INCIDENT POPUP - SHOWS ON ALL PAGES */}
      <div className={`fixed top-20 right-4 z-[999] transition-all duration-500 ease-in-out transform ${showIncidentPopup && latestIncidentAlert
        ? isSlidingOut
          ? 'translate-x-[calc(100%+20px)] opacity-0'
          : 'translate-x-0 opacity-100'
        : 'translate-x-[calc(100%+20px)] opacity-0 pointer-events-none'
        }`}>
        <div className="bg-red-500 text-white rounded-lg shadow-lg p-4 max-w-sm min-w-[280px]">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">🚨</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{latestIncidentAlert?.title || "New Incident Reported"}</h4>
              <p className="text-xs opacity-90 mt-1 break-words">{latestIncidentAlert?.message}</p>
              <p className="text-xs opacity-75 mt-1">Just now</p>
            </div>
            <button
              onClick={dismissPopup}
              className="text-white opacity-75 hover:opacity-100 transition-opacity flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-[400px] max-w-[90vw] p-6 flex flex-col animate-in zoom-in-95 duration-200">
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
              <button onClick={handleCancelLogout} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleConfirmLogout} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition">Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <div className="h-16 bg-[#1f6b75] flex items-center justify-between px-6 text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="w-10 h-10" alt="logo" />
          <div>
            <h1 className="font-semibold">Rescue Team</h1>
            <p className="text-xs opacity-70">Municipality of Santa Rosa</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      {/* BODY WITH SIDEBARS */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* LEFT SIDEBAR */}
        <div className="w-64 bg-[#F5F4FF] flex flex-col justify-between p-5 flex-shrink-0 sidebar-container">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0 profile-avatar">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg class="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                      parent.appendChild(icon);
                    }}
                  />
                ) : (
                  <Icon icon="iconamoon:profile-fill" className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 user-role">{userRole}</p>
                <p className="text-sm font-medium text-gray-700 truncate user-name">{userName}</p>
              </div>
            </div>

            {/* SIDEBAR NAVIGATION LINKS */}
            <div className="space-y-2 text-gray-600 text-sm nav-links">
              <NavLink to="/dashboard" className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }>
                <Icon icon="material-symbols-light:home-rounded" className="w-5 h-5" /> Dashboard
              </NavLink>
              <NavLink to="/incidents" className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }>
                <Icon icon="ic:baseline-emergency" className="w-5 h-5" /> Incidents
              </NavLink>
              <NavLink to="/units" className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }>
                <Icon icon="material-symbols:group" className="w-5 h-5" /> Units
              </NavLink>

              {/* ✅ Volunteers link with smart badge - only shows NEW applications */}
              <NavLink to="/volunteer-approval" className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }>
                <Icon icon="material-symbols:groups" className="w-5 h-5" /> Volunteers
                {showBadge && pendingVolunteerCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {pendingVolunteerCount}
                  </span>
                )}
              </NavLink>

              <NavLink to="/profile" className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }>
                <Icon icon="material-symbols:account-circle" className="w-5 h-5" /> Profile
              </NavLink>
            </div>
          </div>

          <div onClick={handleLogoutClick} className="text-gray-500 text-sm cursor-pointer hover:text-red-600 flex items-center gap-3 transition-colors duration-200 logout-btn">
            <Icon icon="material-symbols:logout" className="w-5 h-5" /> Logout
          </div>
        </div>

        {/* MAIN CONTENT WITH SLIDE FROM LEFT PAGE TRANSITIONS */}
        <div className="flex-1 bg-[#EEF2F6] overflow-y-auto main-content">
          <div className="p-6">
            <PageTransition location={location}>
              {React.isValidElement(children)
                ? React.cloneElement(children, { onIncidentClick: handleIncidentClick })
                : children}
            </PageTransition>
          </div>
        </div>

        {/* RIGHT SIDEBAR - WITH SMOOTH TRANSITIONS */}
        {isSidebarOpen && selectedIncident && (
          <>
            <div
              className={`fixed inset-0 z-10 transition-opacity duration-300 ${isSidebarClosing ? 'opacity-0' : 'opacity-100'
                }`}
              onClick={handleCloseSidebar}
            >
              <div className="w-full h-full bg-black/20"></div>
            </div>
            <div
              className={`absolute top-0 right-0 h-full w-[450px] bg-white border-l border-gray-200 shadow-lg flex flex-col z-20 transition-transform duration-300 ease-in-out ${isSidebarClosing ? 'translate-x-full' : 'translate-x-0'
                }`}
            >
              {/* ✅ FIX: Added key prop. When selectedIncident changes, React forces a hard reset. */}
              <IncidentDetails
                key={selectedIncident?._id || selectedIncident?.id}
                data={selectedIncident}
                onClose={handleCloseSidebar}
                onDispatch={() => {
                  console.log('Dispatched');
                  // Kept empty so sidebar stays open for SuccessModal
                }}
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

      {/* ✅ GLOBAL PROFESSIONAL ANIMATIONS CSS */}
      <style>{`
        /* ============================================
           PROFESSIONAL PAGE TRANSITIONS - SLIDE FROM LEFT
           ============================================ */
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

        /* Exit animation (when navigating away) */
        .page-exit {
          opacity: 1;
          transform: translateX(0);
        }

        .page-exit-active {
          opacity: 0;
          transform: translateX(30px);
        }

        /* Direction-specific entrance */
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

        /* ============================================
           SIDEBAR NAVIGATION LINKS - PROFESSIONAL
           ============================================ */
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          border-radius: 0.5rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          color: #6b7280;
          font-weight: 500;
        }

        .nav-link::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%) scaleY(0);
          width: 3px;
          height: 70%;
          background: #3b82f6;
          border-radius: 0 4px 4px 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-link:hover {
          background: rgba(59, 130, 246, 0.06);
          color: #1f2937;
          transform: translateX(4px);
        }

        .nav-link:hover::before {
          transform: translateY(-50%) scaleY(0.6);
        }

        .nav-link.active {
          background: rgba(59, 130, 246, 0.10);
          color: #2563eb;
          font-weight: 600;
        }

        .nav-link.active::before {
          transform: translateY(-50%) scaleY(1);
        }

        .nav-link.active:hover {
          background: rgba(59, 130, 246, 0.14);
          transform: translateX(4px);
        }

        /* ============================================
           PROFILE AVATAR - SMOOTH
           ============================================ */
        .profile-avatar {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .profile-avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
        }

        /* ============================================
           USER NAME & ROLE - ELEGANT
           ============================================ */
        .user-role {
          transition: color 0.2s ease;
        }

        .user-name {
          transition: color 0.2s ease;
        }

        .sidebar-container:hover .user-name {
          color: #1f2937;
        }

        /* ============================================
           LOGOUT BUTTON - PROFESSIONAL
           ============================================ */
        .logout-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.08);
          transform: translateX(4px);
        }

        /* ============================================
           SIDEBAR CONTAINER - ELEGANT BORDER
           ============================================ */
        .sidebar-container {
          position: relative;
        }

        .sidebar-container::after {
          content: '';
          position: absolute;
          right: 0;
          top: 20px;
          bottom: 20px;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.06), transparent);
        }

        /* ============================================
           MAIN CONTENT - SMOOTH
           ============================================ */
        .main-content {
          scroll-behavior: smooth;
        }

        .main-content::-webkit-scrollbar {
          width: 6px;
        }

        .main-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .main-content::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 3px;
          transition: all 0.2s ease;
        }

        .main-content::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }

        /* ============================================
           SIDEBAR SLIDE ANIMATION
           ============================================ */
        @keyframes slideIn {
          from { 
            transform: translateX(100%);
            opacity: 0;
          }
          to { 
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slideIn {
          animation: slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* ============================================
           INCIDENT POPUP - PROFESSIONAL
           ============================================ */
        .incident-popup {
          animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ============================================
           FADE IN ANIMATION FOR ELEMENTS
           ============================================ */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .fade-in {
          animation: fadeIn 0.3s ease-in-out forwards;
        }

        /* ============================================
           RESPONSIVE TWEAKS
           ============================================ */
        @media (max-width: 768px) {
          .sidebar-container::after {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}