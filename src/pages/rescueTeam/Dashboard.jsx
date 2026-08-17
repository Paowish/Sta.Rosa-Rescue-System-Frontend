import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { incidentService, notificationService } from "../../services/api";
import io from 'socket.io-client';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons based on severity
const getMarkerIcon = (severity) => {
  const colors = {
    Critical: 'red',
    High: 'orange',
    Medium: 'yellow',
    Low: 'blue'
  };
  const color = colors[severity] || 'blue';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">📍</div>`,
    iconSize: [24, 24],
    popupAnchor: [0, -12]
  });
};

// Component to center map on marker
function MapCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
}

export default function Dashboard({ onIncidentClick }) {
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, resolved: 0 });
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showIncidentPopup, setShowIncidentPopup] = useState(false);
  const [latestIncidentAlert, setLatestIncidentAlert] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [mapCenter, setMapCenter] = useState([15.3613, 120.9365]);
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  const [newIncidentIds, setNewIncidentIds] = useState([]);
  const [volunteerStatuses, setVolunteerStatuses] = useState({});

  const isLoadingRef = useRef(false);
  const loadDataRef = useRef(null);

  // ✅ State to trigger a refresh pulse in the UI
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshStartTimeRef = useRef(0); // Track when the refresh started

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const incidentResponse = await incidentService.getAllIncidents();
      if (incidentResponse.success) {
        setIncidents(incidentResponse.data);
        const total = incidentResponse.data.length;
        const active = incidentResponse.data.filter(i =>
          i.status === 'Active' || i.status === 'Pending' || i.status === 'Acknowledged' || i.status === 'Dispatched'
        ).length;
        const pending = incidentResponse.data.filter(i => i.status === 'Pending').length;
        const resolved = incidentResponse.data.filter(i => i.status === 'Resolved').length;
        setStats({ total, active, pending, resolved });
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      isLoadingRef.current = false;

      // Calculate elapsed time
      const elapsed = Date.now() - refreshStartTimeRef.current;
      const minimumLoadingTime = 1500; // 1.5 seconds

      // If it finished too fast, delay the hide to meet the minimum time
      if (elapsed < minimumLoadingTime) {
        setTimeout(() => {
          setLoading(false);
          setIsRefreshing(false);
        }, minimumLoadingTime - elapsed);
      } else {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

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

  const markAsNew = (incidentId) => {
    setNewIncidentIds(prev => {
      if (!prev.includes(incidentId)) {
        return [...prev, incidentId];
      }
      return prev;
    });
    setTimeout(() => {
      setNewIncidentIds(prev => prev.filter(id => id !== incidentId));
    }, 15000);
  };

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
          console.log('✅ Rescue Team socket connected');
          socketRef.current.emit('join', user._id);
          socketRef.current.emit('join-room', 'rescue-team');
        });

        socketRef.current.on('new_incident', (notification) => {
          const incidentId = notification._id || notification.id || notification.incidentId;
          if (incidentId) markAsNew(incidentId);
          showIncidentAlert(notification);
          if (loadDataRef.current) loadDataRef.current();
          loadNotifications();
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
          console.log('⚠️ Socket disconnected');
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

  const handleIncidentClick = (incident) => {
    if (incident._id) {
      setNewIncidentIds(prev => prev.filter(id => id !== incident._id));
    }
    if (typeof onIncidentClick === 'function') {
      onIncidentClick(incident);
    }
    setSelectedIncident(incident);
    const lat = incident.location?.coordinates?.latitude || incident.location?.coordinates?.lat;
    const lng = incident.location?.coordinates?.longitude || incident.location?.coordinates?.lng;
    if (lat && lng) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
    }
  };

  const filteredIncidents = incidents.filter(incident =>
    incident.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.location?.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVolunteerStatusForIncident = (incidentId) => {
    const statuses = Object.values(volunteerStatuses).filter(s => s.incidentId === incidentId);
    if (statuses.length === 0) return null;
    return statuses[statuses.length - 1];
  };

  // ✅ Time ago function
  const getTimeAgo = (date) => {
    if (!date) return 'N/A';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // ✅ Wrapper to handle refresh from child
  const handleRefresh = () => {
    refreshStartTimeRef.current = Date.now(); // Record start time
    setIsRefreshing(true); // Start the spinner immediately
    if (loadDataRef.current) {
      loadDataRef.current(); // Load the data
    }
    loadNotifications(); // Load notifications too
  };

  useEffect(() => {
    loadDataRef.current = loadData;
    loadData();
    loadNotifications();
    setupSocketConnection();
    audioRef.current = new Audio('/notification-sound.mp3');

    const pollInterval = setInterval(() => {
      if (!document.hidden && loadDataRef.current) {
        loadDataRef.current();
      }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ FULL-SCREEN CENTERED LOADING SPINNER */}
      {isRefreshing && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">Refreshing dashboard...</p>
          </div>
        </div>
      )}

      {/* ✅ RED INCIDENT POPUP - SIMPLE DESIGN */}
      {showIncidentPopup && latestIncidentAlert && (
        <div className="fixed top-20 right-4 z-[999] animate-slide-in">
          <div className="bg-red-500 text-white rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🚨</div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{latestIncidentAlert.title || "New Incident Reported"}</h4>
                <p className="text-xs opacity-90 mt-1">{latestIncidentAlert.message}</p>
                <p className="text-xs opacity-75 mt-1">Just now</p>
              </div>
              <button
                onClick={() => setShowIncidentPopup(false)}
                className="text-white opacity-75 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATS CARDS - SIMPLE DESIGN */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
          <p className="text-sm text-gray-500">All Incidents</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-2xl font-bold text-orange-600">{stats.active}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          <p className="text-sm text-gray-500">Resolved</p>
        </div>
      </div>

      {/* UNREAD NOTIFICATIONS - SIMPLE DESIGN */}
      {unreadCount > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-500"></span>
            <span className="text-sm text-blue-700">You have {unreadCount} new notification{unreadCount > 1 ? 's' : ''}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing} // Disable while refreshing
            className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition"
          >
            Refresh
          </button>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-3 gap-6">
        {/* RECENT INCIDENTS */}
        <div className="bg-white rounded-lg shadow col-span-1">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[#262D31]">Active Incidents</h3>
              <div className="flex gap-2">
                <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">{stats.active}</span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <input
              type="text"
              placeholder="Search type, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-md p-2 mb-3 text-sm placeholder-[#5D7285] focus:outline-none focus:border-[#0C7FDA]"
            />
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredIncidents.slice(0, 10).map((incident) => {
                const isNew = newIncidentIds.includes(incident._id);
                const volunteerStatus = getVolunteerStatusForIncident(incident._id);
                const timeAgo = getTimeAgo(incident.reportedAt);

                // ✅ NEW BORDER COLOR LOGIC BASED ON STATUS
                const getStatusBorderColor = (status) => {
                  if (status === 'Resolved') return 'border-green-500';
                  if (status === 'On Scene') return 'border-blue-500';
                  if (status === 'En Route') return 'border-blue-500';
                  if (status === 'Dispatched') return 'border-blue-500';
                  if (status === 'Active') return 'border-red-500';
                  // Default for Pending and everything else
                  return 'border-yellow-500';
                };

                const borderColor = getStatusBorderColor(incident.status);

                // Keep severity for the text badge only
                const severityText = incident.severity || 'Medium';
                const statusText = volunteerStatus?.status === 'en-route' ? 'En Route' :
                  volunteerStatus?.status === 'arrived' ? 'On Scene' :
                    incident.status || 'Pending';

                return (
                  <div
                    key={incident._id}
                    onClick={() => handleIncidentClick(incident)}
                    className={`
                      relative bg-[#FAFAFA] rounded-lg border-l-[5px] p-3 cursor-pointer transition-all duration-200
                      hover:bg-gray-100 ${borderColor}
                      ${selectedIncident?._id === incident._id ? 'shadow-md border-gray-200' : 'border-y-0 border-r-0 border-t-0 border-b-0 shadow-sm'}
                    `}
                  >
                    {/* "NEW" Badge positioned absolute top-left */}
                    {isNew && (
                      <div className="absolute -top-2 -left-2 z-20">
                        <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">
                          NEW
                        </span>
                      </div>
                    )}

                    {/* Tags Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-[2px] border border-red-300 text-[#4B5563] rounded-[2px]">
                        {severityText}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-[2px] rounded-[2px] ${statusText === 'Resolved' ? 'bg-green-100 text-green-700' :
                        statusText === 'On Scene' ? 'bg-blue-100 text-blue-700' :
                          statusText === 'En Route' ? 'bg-blue-100 text-blue-700' :
                            statusText === 'Dispatched' ? 'bg-blue-100 text-blue-700' :
                              statusText === 'Active' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                        }`}>
                        {statusText}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {incident.incidentId || 'RES-2026'}
                      </span>
                    </div>

                    <p className="text-[14px] font-medium text-gray-800 mt-1.5 truncate leading-snug">
                      {incident.type || 'Incident'}
                    </p>
                    <p className="text-[12px] text-[#6B7280] mt-0.5 truncate font-normal">
                      {incident.location?.address || 'Unknown location'}
                    </p>
                    <p className="text-[12px] text-[#6B7280] mt-1 font-normal">
                      {timeAgo}
                    </p>
                  </div>
                );
              })}
              {filteredIncidents.length === 0 && (
                <p className="text-gray-500 text-center py-4">No incidents found</p>
              )}
            </div>
          </div>
        </div>

        {/* MAP with Leaflet */}
        <div className="col-span-2 bg-white rounded-lg shadow overflow-hidden relative" style={{ zIndex: 1 }}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "500px", width: "100%" }}
            key={mapCenter.toString()}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenter position={mapCenter} />

            {filteredIncidents.slice(0, 10).map((incident) => {
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
                      <div>
                        <strong>{incident.type}</strong><br />
                        {incident.location?.address}<br />
                        <span className="text-xs">Status: {incident.status}</span><br />
                        <span className="text-xs">ID: {incident.incidentId}</span>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          </MapContainer>
          {selectedIncident && (
            <div className="p-2 text-center text-xs text-gray-400 border-t">
              📍 Showing location for: {selectedIncident.type}
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .animate-slide-in {
          animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}