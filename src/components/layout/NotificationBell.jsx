import { useState, useEffect, useRef } from "react";
import { notificationService } from "../../services/api";
import io from 'socket.io-client';
import { Icon } from "@iconify/react";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [newNotification, setNewNotification] = useState(null);
    const dropdownRef = useRef(null);
    const socketRef = useRef(null);
    const notificationTimeoutRef = useRef(null);
    const bellButtonRef = useRef(null);

    useEffect(() => {
        loadNotifications();

        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (token && user._id) {
            // Use dynamic URL based on environment
            const socketUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:5000'
                : window.location.origin;

            socketRef.current = io(socketUrl, {
                auth: { token }
            });

            socketRef.current.on('connect', () => {
                console.log('✅ Socket connected for notifications');
                socketRef.current.emit('join', user._id);
            });

            socketRef.current.on('new_notification', (notification) => {
                const formattedNotif = {
                    _id: notification._id || Date.now().toString(),
                    type: notification.type || 'system_announcement',
                    title: notification.title || 'New Notification',
                    message: notification.message || '',
                    createdAt: notification.createdAt || new Date().toISOString(),
                    isRead: notification.isRead || false,
                    data: notification.data || {}
                };

                showSlideNotification(formattedNotif);
                addNotification(formattedNotif);
            });

            socketRef.current.on('disconnect', () => {
                console.log('🔌 Socket disconnected');
            });
        }

        const interval = setInterval(loadNotifications, 30000);

        return () => {
            clearInterval(interval);
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
        };
    }, []);

    const showSlideNotification = (notification) => {
        setNewNotification(notification);

        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = setTimeout(() => {
            const notifElement = document.getElementById('slide-notification');
            if (notifElement) {
                notifElement.classList.add('animate-slide-out-left');
                notifElement.classList.remove('animate-slide-in-left');
                setTimeout(() => {
                    setNewNotification(null);
                }, 500);
            } else {
                setNewNotification(null);
            }
        }, 5000);
    };

    const dismissNotification = () => {
        const notifElement = document.getElementById('slide-notification');
        if (notifElement) {
            notifElement.classList.add('animate-slide-out-left');
            notifElement.classList.remove('animate-slide-in-left');
            setTimeout(() => {
                setNewNotification(null);
            }, 500);
        } else {
            setNewNotification(null);
        }
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
    };

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        const currentCount = parseInt(localStorage.getItem('unreadCount') || '0');
        localStorage.setItem('unreadCount', (currentCount + 1).toString());
        const audio = new Audio('/notificationsound.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
    };

    // ✅ FIX: Simplified outside click logic
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const loadNotifications = async () => {
        try {
            const response = await notificationService.getNotifications();
            if (response.success) {
                setNotifications(response.data);
                setUnreadCount(response.unreadCount || response.data.filter(n => !n.isRead).length);
                localStorage.setItem('unreadCount', (response.unreadCount || response.data.filter(n => !n.isRead).length).toString());
            }
        } catch (error) {
            console.error("Failed to load notifications:", error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            loadNotifications();
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            loadNotifications();
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'new_incident': return '🚨';
            case 'incident_update': return '📝';
            case 'emergency_alert': return '⚠️';
            case 'volunteer_status': return '👤';
            case 'response_assignment': return '🚑';
            case 'dispatch_update': return '📡';
            case 'system_announcement': return '📢';
            default: return '📢';
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'new_incident': return 'border-red-500 bg-red-50';
            case 'emergency_alert': return 'border-orange-500 bg-orange-50';
            case 'response_assignment': return 'border-blue-500 bg-blue-50';
            case 'dispatch_update': return 'border-purple-500 bg-purple-50';
            case 'volunteer_status': return 'border-green-500 bg-green-50';
            default: return 'border-gray-500 bg-gray-50';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* ✅ Slide Notification Popup - Slides in from left */}
            {newNotification && (
                <div id="slide-notification" className="absolute top-full left-0 mt-2 z-[200] w-80 sm:w-96 animate-slide-in-left">
                    <div className={`rounded-lg shadow-2xl border-l-4 p-4 ${getNotificationColor(newNotification.type)} bg-white`}>
                        <div className="flex items-start gap-3">
                            <div className="text-2xl flex-shrink-0">{getIcon(newNotification.type)}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 break-words">
                                    {newNotification.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1 break-words leading-relaxed">
                                    {newNotification.message}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-2">
                                    {formatTime(newNotification.createdAt)}
                                </p>
                            </div>
                            <button
                                onClick={dismissNotification}
                                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                            >
                                <Icon icon="mdi:close" className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bell Button */}
            <button
                ref={bellButtonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative focus:outline-none text-white text-xl sm:text-2xl p-1 sm:p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
            >
                <Icon
                    icon="material-symbols-light:notifications"
                    className="w-6 h-6 sm:w-7 sm:h-7"
                />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-[10px] sm:text-xs rounded-full min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] flex items-center justify-center px-1 font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <div
                className={`
                    absolute 
                    mt-2 
                    z-50
                    right-0
                    w-80
                    sm:w-96
                    transform transition-all duration-300 ease-in-out origin-top-right
                    ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
                `}
            >
                <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
                    {/* Header */}
                    <div className="p-3 sm:p-4 border-b sticky top-0 bg-white">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-blue-500 hover:text-blue-700 transition-colors duration-200 hover:underline"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="text-4xl mb-2">🔔</div>
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    className={`p-3 sm:p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${!notif.isRead ? 'bg-blue-50' : ''}`}
                                    onClick={() => handleMarkAsRead(notif._id)}
                                >
                                    <div className="flex items-start gap-2 sm:gap-3">
                                        <div className="text-xl sm:text-2xl flex-shrink-0">{getIcon(notif.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm sm:text-base font-semibold text-gray-800 break-words">
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1 break-words leading-relaxed">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] sm:text-xs text-gray-400 mt-2">
                                                {formatTime(notif.createdAt)}
                                            </p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 sm:mt-2 flex-shrink-0"></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}