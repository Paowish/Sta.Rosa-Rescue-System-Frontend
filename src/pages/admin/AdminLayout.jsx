import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
// ✅ CORRECT: Import EditProfile from civilian folder
import EditProfile from "../../pages/civilian/EditProfile";

// ✅ Professional Page Transition Component - Slide from Left
const PageTransition = ({ children, location }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [prevLocation, setPrevLocation] = useState(location);
    const [direction, setDirection] = useState('right');

    useEffect(() => {
        if (location !== prevLocation) {
            setIsVisible(false);

            const pathOrder = ['/admin/overview', '/admin/useraccounts', '/admin/incidentreports', '/admin/systemmaintenance', '/admin/systemsettings', '/admin/profile'];
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

export default function AdminLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [profileImage, setProfileImage] = useState("");
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [userName, setUserName] = useState("System Admin");
    const [userRole, setUserRole] = useState("Admin");

    useEffect(() => {
        loadUserData();
    }, []);

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
                    setUserName("System Admin");
                }

                if (userData.role) {
                    const roleMap = {
                        'admin': 'Admin',
                        'dispatcher': 'Dispatcher',
                        'responder': 'Responder',
                        'volunteer': 'Volunteer',
                        'civilian': 'Civilian'
                    };
                    setUserRole(roleMap[userData.role] || userData.role);
                }

                if (userData.profileImage) {
                    setProfileImage(userData.profileImage);
                }
            }

            if (storedImage && storedImage !== "") {
                if (storedImage.startsWith('http') || storedImage.startsWith('data:')) {
                    setProfileImage(storedImage);
                } else {
                    setProfileImage(`http://localhost:5000/${storedImage}`);
                }
            }
        } catch (e) {
            console.error("Error parsing user data:", e);
            setUserName("System Admin");
            setProfileImage("");
        }
    };

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
        <div className="h-screen flex flex-col overflow-hidden admin-layout bg-[#F0F2F5]">

            {/* LOGOUT CONFIRMATION MODAL */}
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
                            <button
                                onClick={handleCancelLogout}
                                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLogout}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition shadow-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🟢 KEPT ORIGINAL TEAL/DARK BLUE NAVBAR */}
            <div className="h-16 bg-[#155e75] flex items-center justify-between px-6 text-white flex-shrink-0 z-10 shadow-md">
                <div className="flex items-center gap-3">
                    {/* Standalone Logo */}
                    <img src="/logo.png" className="w-10 h-10" alt="logo" />
                    <div>
                        <h1 className="font-semibold text-lg tracking-tight">System Admin</h1>
                        <p className="text-xs opacity-80">Municipality of Santa Rosa</p>
                    </div>
                </div>
                <Icon icon="material-symbols-light:notifications" className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity" />
            </div>

            {/* ✅ BODY */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* SIDEBAR */}
                <div className="w-64 bg-white flex flex-col justify-between flex-shrink-0 border-r border-gray-200 shadow-sm sidebar-container overflow-y-auto">
                    <div className="flex flex-col h-full">

                        {/* PROFILE SECTION */}
                        <div className="bg-gradient-to-br from-[#f8f9fc] to-[#f1f3f8] p-5 border-b border-gray-200 relative">
                            <div className="flex items-center gap-3 relative z-10 profile-section">
                                <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center profile-avatar">
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
                                        /* ✅ BULLETPROOF DEFAULT AVATAR SVG */
                                        <svg
                                            className="w-6 h-6 text-gray-700"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider user-role">{userRole}</p>
                                    <p className="text-sm font-semibold text-gray-800 truncate user-name max-w-[140px]">{userName}</p>
                                </div>
                            </div>
                        </div>

                        {/* MENU */}
                        <div className="p-4 space-y-1 text-gray-600 text-sm nav-links flex-1">
                            <NavLink
                                to="/admin/overview"
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon icon="material-symbols-light:home-rounded" className="w-5 h-5" />
                                Overview
                            </NavLink>

                            <NavLink
                                to="/admin/useraccounts"
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon icon="ic:baseline-emergency" className="w-5 h-5" />
                                User Accounts
                            </NavLink>

                            <NavLink
                                to="/admin/incidentreports"
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon icon="material-symbols:group" className="w-5 h-5" />
                                Incident Reports
                            </NavLink>

                            <NavLink
                                to="/admin/systemmaintenance"
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon icon="material-symbols:settings" className="w-5 h-5" />
                                System Maintenance
                            </NavLink>

                            <NavLink
                                to="/admin/systemsettings"
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon icon="mdi:cog" className="w-5 h-5" />
                                System Settings
                            </NavLink>

                            <NavLink
                                to="/admin/profile"
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon icon="material-symbols:account-circle" className="w-5 h-5" />
                                Profile
                            </NavLink>
                        </div>
                    </div>

                    {/* LOGOUT */}
                    <div
                        onClick={handleLogoutClick}
                        className="m-4 p-3 text-gray-500 text-sm cursor-pointer hover:text-red-600 flex items-center gap-3 rounded-lg transition-colors duration-200 hover:bg-red-50 logout-btn"
                    >
                        <Icon icon="material-symbols:logout" className="w-5 h-5" />
                        Logout
                    </div>
                </div>

                {/* ✅ MAIN CONTENT WITH PAGE TRANSITIONS */}
                <div className="flex-1 bg-[#F0F2F5] p-6 overflow-y-auto main-content">
                    <PageTransition location={location}>
                        {children}
                    </PageTransition>
                </div>

            </div>

            {/* ✅ PROFESSIONAL ANIMATIONS CSS */}
            <style>{`
                /* ============================================
                   PAGE TRANSITIONS - SLIDE FROM LEFT
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
                    padding: 0.7rem 1rem;
                    border-radius: 0.75rem;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    position: relative;
                    color: #6b7280;
                    font-weight: 500;
                    text-decoration: none;
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

                /* ============================================
                   PROFILE AVATAR - SMOOTH
                   ============================================ */
                .profile-avatar {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    flex-shrink: 0;
                }

                .profile-avatar:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
                }

                /* ============================================
                   LOGOUT BUTTON - PROFESSIONAL
                   ============================================ */
                .logout-btn {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .logout-btn:hover {
                    transform: translateX(4px);
                }

                /* ============================================
                   MAIN CONTENT - SMOOTH SCROLL
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
                    background: #d1d5db;
                    border-radius: 3px;
                }

                .main-content::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }

                /* ============================================
                   ADMIN LAYOUT - GLOBAL
                   ============================================ */
                .admin-layout {
                    background: #F0F2F5;
                }

                /* ============================================
                   ANIMATION HELPERS
                   ============================================ */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes zoomIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-in {
                    animation-duration: 0.2s;
                    animation-fill-mode: both;
                }

                .fade-in {
                    animation-name: fadeIn;
                }

                .zoom-in-95 {
                    animation-name: zoomIn;
                }

                /* ============================================
                   RESPONSIVE
                   ============================================ */
                @media (max-width: 768px) {
                    .sidebar-container {
                        width: 64px;
                    }
                    .nav-link span:not(.ml-auto) {
                        display: none;
                    }
                    .user-name, .user-role, .logout-btn span:last-child {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}