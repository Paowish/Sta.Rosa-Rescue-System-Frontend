import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import NotificationBell from "./NotificationBell";

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();

  /**
   * Handle user logout - clear local storage and redirect to login
   */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-16 bg-[#1f6b75] flex items-center justify-between px-6 text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/src/assets/logo.png" className="w-10 h-10" alt="logo" />
          <div>
            <h1 className="font-semibold">Rescue Team</h1>
            <p className="text-xs opacity-70">
              Municipality of Santa Rosa
            </p>
          </div>
        </div>
        <NotificationBell />
      </div>

      {/* Main Layout Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-[#F5F4FF] flex flex-col justify-between p-5 flex-shrink-0">
          <div>
            {/* Profile Section */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <Icon icon="iconamoon:profile-fill" className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">ADMIN</p>
                <p className="text-sm font-medium text-gray-700">
                  Rescue member 01
                </p>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="space-y-2 text-gray-600 text-sm">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-3 ${isActive ? 'bg-blue-100 text-blue-600 font-medium' : ''
                  }`
                }
              >
                <Icon icon="material-symbols-light:home-rounded" className="w-5 h-5" />
                Dashboard
              </NavLink>

              <NavLink
                to="/incidents"
                className={({ isActive }) =>
                  `p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-3 ${isActive ? 'bg-blue-100 text-blue-600 font-medium' : ''
                  }`
                }
              >
                <Icon icon="ic:baseline-emergency" className="w-5 h-5" />
                Incidents
              </NavLink>

              <NavLink
                to="/units"
                className={({ isActive }) =>
                  `p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-3 ${isActive ? 'bg-blue-100 text-blue-600 font-medium' : ''
                  }`
                }
              >
                <Icon icon="material-symbols:group" className="w-5 h-5" />
                Units
              </NavLink>

              <NavLink
                to="/volunteer-approval"
                className={({ isActive }) =>
                  `p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-3 ${isActive ? 'bg-blue-100 text-blue-600 font-medium' : ''
                  }`
                }
              >
                <Icon icon="material-symbols:groups" className="w-5 h-5" />
                Volunteers
              </NavLink>

              <NavLink
                to="/edit-profile"
                className={({ isActive }) =>
                  `p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-3 ${isActive ? 'bg-blue-100 text-blue-600 font-medium' : ''
                  }`
                }
              >
                <Icon icon="material-symbols:settings" className="w-5 h-5" />
                Settings
              </NavLink>
            </div>
          </div>

          {/* Logout Button - Fixed at Bottom */}
          <div
            onClick={handleLogout}
            className="text-gray-500 text-sm cursor-pointer hover:text-red-600 flex items-center gap-3"
          >
            <Icon icon="material-symbols:logout" className="w-5 h-5" />
            Logout
          </div>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 bg-[#EEF2F6] overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}