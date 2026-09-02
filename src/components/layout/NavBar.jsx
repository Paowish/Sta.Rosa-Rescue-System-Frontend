import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function Navbar() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Initialize and listen for unread notification count changes
   */
  useEffect(() => {
    // Load unread count from localStorage on mount
    const storedCount = localStorage.getItem('unreadCount');
    if (storedCount) {
      setUnreadCount(parseInt(storedCount));
    }

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = () => {
      const newCount = localStorage.getItem('unreadCount');
      if (newCount) {
        setUnreadCount(parseInt(newCount));
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /**
   * Navigate to dashboard on logo click
   */
  const handleLogoClick = () => {
    navigate("/dashboard");
  };

  /**
   * Navigate to notifications page
   */
  const handleNotificationClick = () => {
    navigate("/notifications");
  };

  return (
    <div className="bg-[#1f6b75] h-16 px-6 flex items-center justify-between shadow">
      {/* Logo and Brand Section */}
      <div
        onClick={handleLogoClick}
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <img
          src="src/assets/logo.png"
          alt="logo"
          className="w-10 h-10"
        />

        <div className="leading-tight">
          <h1 className="text-white font-semibold text-lg">
            Rescue Team
          </h1>
          <p className="text-white/70 text-xs">
            Municipality of Santa Rosa
          </p>
        </div>
      </div>

      {/* Notification Bell with Unread Badge */}
      <div className="relative">
        <button
          onClick={handleNotificationClick}
          className="text-white hover:opacity-80 transition-opacity"
        >
          <Icon icon="material-symbols-light:notifications" className="w-6 h-6" />
        </button>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}