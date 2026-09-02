// src/pages/rescueTeam/Dashboard.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { incidentService, notificationService } from "../../services/api";
import io from 'socket.io-client';
import { Icon } from "@iconify/react";
import IncidentDetails from "./IncidentDetails";
import DispatchModal from "./DispatchModal";

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Get custom marker icon based on severity
 */
const getMarkerIcon = (severity) => {
  const colors = { Critical: '#EF4444', High: '#F97316', Medium: '#EAB308', Low: '#3B82F6' };
  const color = colors[severity] || '#3B82F6';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; animation: pulse-marker 2s infinite; color: white;">!</div>`,
    iconSize: [32, 32],
    popupAnchor: [0, -16]
  });
};

/**
 * Map Center Component - Centers map on a specific position
 */
function MapCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [position, map]);
  return null;
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }) {
  const configs = {
    'Resolved': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'On Scene': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    'En Route': { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    'Dispatched': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    'Active': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    'Pending': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' }
  };
  const config = configs[status] || configs['Pending'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`}></span>
      {status}
    </span>
  );
}

/**
 * Severity Badge Component
 */
function SeverityBadge({ severity }) {
  const configs = {
    'Critical': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'High': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Medium': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Low': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
  };
  const config = configs[severity] || configs['Medium'];
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config.bg} ${config.text} ${config.border}`}>
      {severity}
    </span>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ title, value, icon, color, trend }) {
  const bgColorClass = color.replace('text-', 'bg-').replace('-600', '-100').replace('-700', '-100');
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColorClass}`}>
          <Icon icon={icon} className={`text-xl ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend.positive ? 'text-emerald-600' : 'text-red-600'}>{trend.positive ? '↑' : '↓'} {trend.value}%</span>
          <span className="text-gray-400">vs last week</span>
        </div>
      )}
    </div>
  );
}

/**
 * Incident Card Component
 */
function IncidentCard({ incident, isSelected, onClick, isNew, volunteerStatus, severity }) {
  const getStatusBorderColor = (status) => {
    const colors = {
      'Resolved': 'border-emerald-500',
      'On Scene': 'border-blue-500',
      'En Route': 'border-indigo-500',
      'Dispatched': 'border-purple-500',
      'Active': 'border-red-500',
      'Pending': 'border-amber-500'
    };
    return colors[status] || 'border-amber-500';
  };

  const borderColor = getStatusBorderColor(incident.status);
  const statusText = volunteerStatus?.status === 'en-route' ? 'En Route' :
    volunteerStatus?.status === 'arrived' ? 'On Scene' : incident.status || 'Pending';

  const formatTimestamp = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div
      onClick={() => onClick(incident)}
      className={`relative bg-white rounded-xl border-l-[6px] p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${borderColor} ${isSelected ? 'shadow-lg ring-2 ring-blue-100' : 'shadow-sm'}`}
    >
      {/* NEW Badge */}
      {isNew && (
        <div className="absolute -top-2 -left-2 z-10">
          <span className="bg-red-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
            NEW
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <SeverityBadge severity={severity} />
          <StatusBadge status={statusText} />
        </div>
        <span className="text-[11px] font-mono text-gray-400">{incident.incidentId || 'RES-2026'}</span>
      </div>

      <h4 className="text-[15px] font-semibold text-gray-800 mb-1 truncate">{incident.type || 'Incident'}</h4>

      <div className="flex items-center gap-2 text-[12px] text-gray-500 overflow-hidden">
        <span className="flex items-center gap-1 shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{incident.location?.address || 'Unknown location'}</span>
        </span>
      </div>

      {/* Timestamp */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{formatTimestamp(incident.reportedAt)}</span>
        </div>
      </div>

      {volunteerStatus && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 overflow-hidden">
            <span className="flex items-center gap-1 shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {volunteerStatus.status === 'en-route' ? 'En Route' : 'On Scene'}
            </span>
            {volunteerStatus.location && (
              <>
                <span className="text-gray-300 shrink-0">•</span>
                <span className="truncate">{volunteerStatus.location}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Rescue Team Dashboard Component
 * Main dashboard for incident monitoring and response coordination
 */
export default function Dashboard({ onIncidentClick }) {
  // State for statistics
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, resolved: 0 });
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // State for notifications
  const [showIncidentPopup, setShowIncidentPopup] = useState(false);
  const [latestIncidentAlert, setLatestIncidentAlert] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // State for selected incident and map
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [mapCenter, setMapCenter] = useState([15.3613, 120.9365]);

  // State for volunteer tracking
  const [latestNewIncidentId, setLatestNewIncidentId] = useState(null);
  const [volunteerStatuses, setVolunteerStatuses] = useState({});

  // Refs for socket and loading
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const isLoadingRef = useRef(false);
  const loadDataRef = useRef(null);

  // State for refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshStartTimeRef = useRef(0);

  // State for dispatch modal
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [dispatchNotes, setDispatchNotes] = useState("");

  /**
   * Load data from API
   */
  const loadData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const incidentResponse = await incidentService.getAllIncidents();
      if (incidentResponse.success) {
        // Sort by date descending (newest first)
        const sortedIncidents = [...incidentResponse.data].sort((a, b) => {
          return new Date(b.reportedAt) - new Date(a.reportedAt);
        });

        setIncidents(sortedIncidents);

        // Update badge to the newest incident
        setLatestNewIncidentId(prev => {
          if (sortedIncidents.length === 0) return null;
          if (prev) {
            const currentIncident = sortedIncidents.find(i => i._id === prev);
            if (currentIncident) {
              if (currentIncident._id !== sortedIncidents[0]._id) {
                return sortedIncidents[0]._id;
              }
              return prev;
            }
          }
          return sortedIncidents[0]._id;
        });

        // Calculate statistics
        const total = sortedIncidents.length;
        const active = sortedIncidents.filter(i => i.status === 'Active' || i.status === 'Pending' || i.status === 'Acknowledged' || i.status === 'Dispatched').length;
        const pending = sortedIncidents.filter(i => i.status === 'Pending').length;
        const resolved = sortedIncidents.filter(i => i.status === 'Resolved').length;
        setStats({ total, active, pending, resolved });
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      isLoadingRef.current = false;
      const elapsed = Date.now() - refreshStartTimeRef.current;
      const minimumLoadingTime = 1500;
      if (elapsed < minimumLoadingTime) {
        setTimeout(() => { setLoading(false); setIsRefreshing(false); }, minimumLoadingTime - elapsed);
      } else {
        setLoading(false); setIsRefreshing(false);
      }
    }
  }, []);

  /**
   * Set load data reference
   */
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  /**
   * Load notifications
   */
  const loadNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      if (response.success) {
        setUnreadCount(response.unreadCount);
        localStorage.setItem('unreadCount', response.unreadCount.toString());
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  /**
   * Handle volunteer status update
   */
  const handleVolunteerStatusUpdate = (data) => {
    setVolunteerStatuses(prev => ({
      ...prev,
      [data.volunteerId || data.id]: {
        status: data.status,
        location: data.location,
        timestamp: new Date().toISOString(),
        incidentId: data.incidentId
      }
    }));
    if (loadDataRef.current) loadDataRef.current();
  };

  /**
   * Setup Socket.IO connection
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

        socketRef.current.on('connect', () => {
          console.log('Rescue Team socket connected');
          socketRef.current.emit('join', user._id);
          socketRef.current.emit('join-room', 'rescue-team');
        });

        socketRef.current.on('new_incident', (notification) => {
          const incidentId = notification._id || notification.id || notification.incidentId;

          if (incidentId) setLatestNewIncidentId(incidentId);

          // Add to top instantly
          if (incidentId) {
            const newIncidentData = {
              _id: incidentId,
              type: notification.type || notification.title || 'New Incident',
              status: 'Pending',
              severity: notification.severity || 'Medium',
              reportedAt: new Date().toISOString(),
              location: { address: notification.message || 'Unknown location' }
            };
            setIncidents(prev => [newIncidentData, ...prev.filter(i => i._id !== incidentId)]);
          }

          showIncidentAlert(notification);
          loadNotifications();

          if (loadDataRef.current) loadDataRef.current();
        });

        socketRef.current.on('incident_updated', (data) => {
          if (loadDataRef.current) loadDataRef.current();
        });

        socketRef.current.on('dispatch_created', (data) => {
          if (loadDataRef.current) loadDataRef.current();
        });

        socketRef.current.on('volunteer_assigned', (data) => {
          if (loadDataRef.current) loadDataRef.current();
        });

        socketRef.current.on('incident_status_change', (data) => {
          if (loadDataRef.current) loadDataRef.current();
        });

        socketRef.current.on('volunteer_status_update', (data) => {
          handleVolunteerStatusUpdate(data);
        });

        socketRef.current.on('volunteer_location_update', (data) => {
          handleVolunteerStatusUpdate({ ...data, status: 'en-route' });
        });

        socketRef.current.on('volunteer_arrived', (data) => {
          handleVolunteerStatusUpdate({ ...data, status: 'arrived' });
        });

        socketRef.current.on('incident_resolved', (data) => {
          if (loadDataRef.current) loadDataRef.current();
        });

        socketRef.current.on('new_notification', (notification) => {
          if (notification.type === 'volunteer_status') return;
          loadNotifications();
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        socketRef.current.on('disconnect', () => {
          console.log('Socket disconnected');
        });

        socketRef.current.on('reconnect', () => {
          socketRef.current.emit('join', user._id);
          socketRef.current.emit('join-room', 'rescue-team');
          if (loadDataRef.current) loadDataRef.current();
        });
      }
    } catch (error) {
      console.error("Failed to setup socket:", error);
    }
  };

  /**
   * Show incident alert popup
   */
  const showIncidentAlert = (notification) => {
    setLatestIncidentAlert(notification);
    setShowIncidentPopup(true);
    setUnreadCount(prev => {
      const newCount = prev + 1;
      localStorage.setItem('unreadCount', newCount.toString());
      return newCount;
    });
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
    setTimeout(() => setShowIncidentPopup(false), 5000);
  };

  /**
   * Handle incident click
   */
  const handleIncidentClick = (incident) => {
    setSelectedIncident(incident);

    // Remove badge when clicking the latest incident
    if (incident._id === latestNewIncidentId) {
      setLatestNewIncidentId(null);
    }

    const lat = incident.location?.coordinates?.latitude || incident.location?.coordinates?.lat;
    const lng = incident.location?.coordinates?.longitude || incident.location?.coordinates?.lng;
    if (lat && lng) setMapCenter([parseFloat(lat), parseFloat(lng)]);
  };

  /**
   * Get filtered incidents based on search and filters
   */
  const getFilteredIncidents = () => {
    let filtered = incidents;
    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.location?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.incidentId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(incident => incident.status?.toLowerCase() === selectedFilter.toLowerCase());
    }
    return filtered;
  };

  /**
   * Get volunteer status for an incident
   */
  const getVolunteerStatusForIncident = (incidentId) => {
    const statuses = Object.values(volunteerStatuses).filter(s => s.incidentId === incidentId);
    if (statuses.length === 0) return null;
    return statuses[statuses.length - 1];
  };

  /**
   * Handle refresh button click
   */
  const handleRefresh = () => {
    refreshStartTimeRef.current = Date.now();
    setIsRefreshing(true);
    if (loadDataRef.current) loadDataRef.current();
    loadNotifications();
  };

  /**
   * Handle dispatch success
   */
  const handleDispatchSuccess = async (dispatchInfo) => {
    try {
      const response = await incidentService.assignResponders(
        selectedIncident._id,
        selectedVolunteers,
        dispatchNotes
      );
      if (response && response.success) {
        setShowDispatchModal(false);
        loadData();
        alert(`Success! ${dispatchInfo.count} responder(s) dispatched.`);
      }
    } catch (error) {
      alert("Failed to dispatch: " + error.message);
    }
  };

  /**
   * Initialize dashboard
   */
  useEffect(() => {
    loadDataRef.current = loadData;
    loadData();
    loadNotifications();
    setupSocketConnection();
    audioRef.current = new Audio('/notification-sound.mp3');

    const pollInterval = setInterval(() => {
      if (!document.hidden && loadDataRef.current) loadDataRef.current();
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      if (socketRef.current) socketRef.current.disconnect();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /**
   * Auto-center map on newest incident
   */
  useEffect(() => {
    if (incidents.length > 0) {
      const latest = incidents[0];
      const lat = latest.location?.coordinates?.latitude || latest.location?.coordinates?.lat;
      const lng = latest.location?.coordinates?.longitude || latest.location?.coordinates?.lng;
      if (lat && lng) setMapCenter([parseFloat(lat), parseFloat(lng)]);
    }
  }, [incidents.length]);

  const filteredIncidents = getFilteredIncidents();

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-gray-50 p-6 flex gap-6 overflow-hidden transition-all duration-300 ${selectedIncident ? 'pr-[420px]' : 'pr-6'}`}>
      {/* Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c7cd; border-radius: 10px; }
        .animate-slide-in { animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse-marker { 0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } }
      `}</style>

      {/* Refresh Overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">Refreshing dashboard...</p>
          </div>
        </div>
      )}

      {/* Incident Alert Popup */}
      {showIncidentPopup && latestIncidentAlert && (
        <div className="fixed top-20 right-4 z-[999] animate-slide-in">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-2xl p-5 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="text-3xl animate-pulse">!</div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{latestIncidentAlert.title || "New Incident Reported"}</h4>
                <p className="text-xs opacity-90 mb-1">{latestIncidentAlert.message}</p>
                <p className="text-xs opacity-75">Just now</p>
              </div>
              <button onClick={() => setShowIncidentPopup(false)} className="text-white/70 hover:text-white transition-colors">×</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="min-w-0 flex-1 pr-4">
            <h1 className="text-2xl font-bold text-gray-800 truncate">Incident Dashboard</h1>
            <p className="text-sm text-gray-500 truncate">Real-time incident monitoring and response coordination</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 shrink-0">
                <Icon icon="mdi:bell" className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">{unreadCount} new</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50 shrink-0"
            >
              <span className={`${isRefreshing ? 'animate-spin' : ''}`}>↻</span>
              Refresh
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incidents List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Active Incidents</h3>
                <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                  {stats.active}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar space-y-3">
              {filteredIncidents.slice(0, 20).map((incident) => {
                const volunteerStatus = getVolunteerStatusForIncident(incident._id);
                const severity = incident.severity || 'Medium';
                const isNew = (incident._id === latestNewIncidentId);

                return (
                  <IncidentCard
                    key={incident._id}
                    incident={incident}
                    isSelected={selectedIncident?._id === incident._id}
                    onClick={handleIncidentClick}
                    isNew={isNew}
                    volunteerStatus={volunteerStatus}
                    severity={severity}
                  />
                );
              })}
              {filteredIncidents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No incidents found</p>
                  <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "600px", width: "100%" }}
              key={mapCenter.toString()}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapCenter position={mapCenter} />

              {filteredIncidents.slice(0, 20).map((incident) => {
                const lat = incident.location?.coordinates?.latitude || incident.location?.coordinates?.lat;
                const lng = incident.location?.coordinates?.longitude || incident.location?.coordinates?.lng;

                if (lat && lng) {
                  return (
                    <Marker
                      key={incident._id}
                      position={[parseFloat(lat), parseFloat(lng)]}
                      icon={getMarkerIcon(incident.severity)}
                    >
                      <Popup>
                        <div className="p-1">
                          <h4 className="font-semibold text-sm mb-1">{incident.type}</h4>
                          <p className="text-xs text-gray-600 mb-1">{incident.location?.address}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <StatusBadge status={incident.status} />
                            <SeverityBadge severity={incident.severity} />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2">ID: {incident.incidentId}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Incident Details Sidebar */}
      {selectedIncident && (
        <IncidentDetails
          data={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onDispatch={() => setShowDispatchModal(true)}
          onResolve={() => { }}
          onViewReport={() => { }}
        />
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedIncident && (
        <DispatchModal
          isOpen={showDispatchModal}
          onClose={() => setShowDispatchModal(false)}
          onDispatch={handleDispatchSuccess}
          title={selectedIncident.type || 'Incident'}
          incidentId={selectedIncident.incidentId || selectedIncident._id}
          volunteers={selectedVolunteers}
          selectedIds={selectedVolunteers}
          setSelectedIds={setSelectedVolunteers}
          isDispatching={false}
          isResolved={selectedIncident.status === 'Resolved'}
          searchTerm={""}
          setSearchTerm={() => { }}
          handleVolunteerToggle={(id) => {
            setSelectedVolunteers(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
          }}
          handleRemoveSelected={(id) => {
            setSelectedVolunteers(prev => prev.filter(v => v !== id));
          }}
        />
      )}
    </div>
  );
}