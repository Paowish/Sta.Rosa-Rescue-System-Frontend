import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { incidentService } from "../../services/api";
import { Icon } from "@iconify/react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers
const orangeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- Component to re-center map ---
function MapCenter({ position, shouldCenter }) {
    const map = useMap();
    const hasCentered = useRef(false);

    useEffect(() => {
        if (shouldCenter && position && !hasCentered.current) {
            map.setView(position, 15);
            hasCentered.current = true;
        }
    }, [map, position, shouldCenter]);

    return null;
}

// --- Progress Stepper Component ---
const ProgressStepper = ({ currentStatus }) => {
    const statusMap = {
        'Pending': 0,
        'Active': 1,
        'Dispatched': 2,
        'En Route': 2,
        'On Scene': 3,
        'Resolved': 4
    };
    const stepIndex = statusMap[currentStatus] || 0;

    const steps = [
        { label: 'Reported', icon: 'mdi:check', activeColor: 'bg-green-600', inactiveColor: 'bg-green-200' },
        { label: 'Verified', icon: 'mdi:check', activeColor: 'bg-green-600', inactiveColor: 'bg-green-200' },
        { label: 'Dispatched', icon: 'mdi:ambulance', activeColor: 'bg-blue-500', inactiveColor: 'bg-gray-300' },
        { label: 'On Scene', icon: 'mdi:counter', activeColor: 'bg-yellow-500', inactiveColor: 'bg-gray-300' },
        { label: 'Resolved', icon: 'mdi:counter', activeColor: 'bg-green-500', inactiveColor: 'bg-gray-300' }
    ];

    return (
        <div className="flex justify-between items-center w-full px-2 sm:px-4 py-4 sm:py-6 relative overflow-x-auto">
            <div className="hidden sm:block absolute top-[30px] sm:top-[33px] left-6 sm:left-10 right-6 sm:right-10 h-[2px] bg-gray-200 -z-10"></div>

            {steps.map((step, index) => {
                const isActive = index <= stepIndex;
                const isCurrent = index === stepIndex;
                return (
                    <div key={index} className="flex flex-col items-center gap-1 sm:gap-2 relative z-10 bg-white px-1 sm:px-2 shrink-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-base sm:text-xl shadow-sm transition-colors duration-300 ${isActive ? step.activeColor : step.inactiveColor} ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-300' : ''}`}>
                            {step.icon === 'mdi:counter' ? (
                                <span className="text-sm sm:text-lg font-bold">{index + 1}</span>
                            ) : (
                                <Icon icon={step.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
                            )}
                        </div>
                        <span className={`text-[10px] sm:text-xs font-medium transition-colors duration-300 ${isCurrent ? 'text-blue-600' : isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// --- Dispatch Notification Badge ---
const DispatchBadge = ({ status, responderName }) => {
    if (status === 'Dispatched' || status === 'En Route') {
        return (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-medium text-blue-700">
                    {responderName && responderName !== 'Responder (loading...)' ? `🚗 Dispatched to ${responderName}` : '🚗 Dispatched'}
                </span>
            </div>
        );
    }
    if (status === 'On Scene') {
        return (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-xs font-medium text-yellow-700">📍 On Scene</span>
            </div>
        );
    }
    if (status === 'Resolved') {
        return (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-green-700">✅ Resolved</span>
            </div>
        );
    }
    return null;
};

export default function TrackReports() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [mapReady, setMapReady] = useState({});
    const [dispatchNotification, setDispatchNotification] = useState(null);
    const [expanding, setExpanding] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    const socketRef = useRef(null);
    const loadRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const isPollingRef = useRef(false);
    const isLoadingRef = useRef(false);

    // ✅ Helper to check if user is a Guest
    const isGuest = !localStorage.getItem('token');

    // ✅ Helper to get API URL
    const getApiUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return '/api';
    };

    // ✅ Real-time status update function with force refresh
    const manuallyUpdateIncidentStatus = useCallback((incidentId, newStatus, responderName) => {
        if (!incidentId) return;
        console.log(`📡 Updating incident ${incidentId} to status: ${newStatus} with responder: ${responderName || 'N/A'}`);

        setIncidents(prev => {
            const index = prev.findIndex(inc => inc.incidentId === incidentId || inc._id === incidentId);
            if (index === -1) {
                console.warn(`⚠️ Incident ${incidentId} not found in state, will refresh from backend`);
                if (loadRef.current && !isLoadingRef.current) {
                    setTimeout(() => loadRef.current(), 300);
                }
                return prev;
            }

            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                status: newStatus,
                responderName: responderName || updated[index].responderName,
                updatedAt: new Date().toISOString()
            };
            return updated;
        });

        setFilteredIncidents(prev => {
            const index = prev.findIndex(inc => inc.incidentId === incidentId || inc._id === incidentId);
            if (index === -1) return prev;

            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                status: newStatus,
                responderName: responderName || updated[index].responderName,
                updatedAt: new Date().toISOString()
            };
            return updated;
        });

        setLastUpdate(new Date());
    }, []);

    // ✅ FETCH INCIDENTS
    const loadIncidents = useCallback(async () => {
        if (isLoadingRef.current) {
            console.log('⏳ Load already in progress, skipping...');
            return;
        }

        isLoadingRef.current = true;
        try {
            setLoading(true);
            console.log('🔄 Fetching incidents from backend...');

            let responseData;

            if (isGuest) {
                const apiUrl = getApiUrl();
                const guestEmail = localStorage.getItem('guestEmail'); // ✅ Get email

                const response = await fetch(`${apiUrl}/incidents`, {
                    headers: {
                        'X-Guest-Email': guestEmail // ✅ Send Email Header
                    }
                });
                responseData = await response.json();
            } else {
                // 🟢 CIVILIAN: Fetch with token
                const response = await incidentService.getAllIncidents();
                responseData = response;
            }

            if (responseData.success) {
                const sortedData = responseData.data.sort((a, b) =>
                    new Date(b.createdAt || b.reportedAt) - new Date(a.createdAt || a.reportedAt)
                );
                setIncidents(sortedData);
                setFilteredIncidents(sortedData);
                console.log(`✅ Loaded ${sortedData.length} incidents`);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error("Failed to load incidents:", error);
        } finally {
            setLoading(false);
            isLoadingRef.current = false;
        }
    }, [isGuest]);

    useEffect(() => {
        loadRef.current = loadIncidents;
        loadIncidents();
    }, [loadIncidents]);

    // ✅ POLLING - EVERY 20 SECONDS
    const startPolling = useCallback(() => {
        if (isPollingRef.current) return;

        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        isPollingRef.current = true;
        console.log('⏰ Starting polling every 20 seconds...');

        pollIntervalRef.current = setInterval(() => {
            if (!isLoadingRef.current && !document.hidden) {
                console.log('⏰ Polling: fetching incidents...');
                if (loadRef.current) {
                    loadRef.current();
                }
            }
        }, 20000);
    }, []);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        isPollingRef.current = false;
    }, []);

    // ✅ Start polling after initial load
    useEffect(() => {
        const timer = setTimeout(() => {
            if (incidents.length > 0) {
                startPolling();
            } else {
                setTimeout(() => {
                    if (incidents.length > 0) {
                        startPolling();
                    }
                }, 5000);
            }
        }, 3000);

        return () => {
            clearTimeout(timer);
            stopPolling();
        };
    }, [incidents.length, startPolling, stopPolling]);

    // ✅ BROADCAST LISTENER (Civilians Only)
    useEffect(() => {
        if (isGuest) return;

        try {
            const channel = new BroadcastChannel('incident_updates');
            channel.onmessage = (event) => {
                const data = event.data;
                console.log('📡 Broadcast message received:', data);

                stopPolling();

                if (data && data.type === 'FORCE_STATUS_UPDATE') {
                    manuallyUpdateIncidentStatus(data.incidentId, data.newStatus, data.responderName);
                    if (data.newStatus === 'Dispatched' || data.newStatus === 'En Route') {
                        setDispatchNotification({
                            incidentId: data.incidentId,
                            message: `🚗 ${data.responderName || 'Responder'} is en route!`,
                            responderName: data.responderName || 'Responder',
                            timestamp: new Date().toISOString()
                        });
                        setTimeout(() => setDispatchNotification(null), 8000);
                    }
                }

                if (data && data.type === 'FORCE_FETCH_INCIDENTS') {
                    console.log('🔄 Force fetching fresh incidents from backend.');
                    if (loadRef.current && !isLoadingRef.current) {
                        loadRef.current();
                    }
                }
            };
            return () => { channel.close(); };
        } catch (error) {
            console.warn('BroadcastChannel not supported:', error);
        }
    }, [isGuest, manuallyUpdateIncidentStatus, stopPolling]);

    // ✅ SOCKET CONNECTION - REAL-TIME UPDATES (Civilians Only)
    useEffect(() => {
        if (isGuest) {
            console.log("👤 Guest mode: Skipping Socket connection");
            return;
        }

        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000'
            : 'https://hammily-unscaled-synthia.ngrok-free.dev';

        let socket = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        const connectSocket = () => {
            if (!token || !user.id) return;

            try {
                socket = io(socketUrl, {
                    auth: { token },
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 10,
                    reconnectionDelay: 1000,
                    timeout: 20000
                });

                socket.on('connect', () => {
                    console.log('✅ Socket connected for TrackReports');
                    socket.emit('join', user.id);
                    socket.emit('join-room', 'track-reports');
                    reconnectAttempts = 0;
                });

                const eventNames = [
                    'incident-updated', 'incident_status_update', 'new_incident',
                    'incident_resolved', 'dispatch_created', 'volunteer_assigned',
                    'volunteer_arrived', 'incident_updated', 'status_changed', 'dispatch_notification'
                ];

                eventNames.forEach(eventName => {
                    socket.on(eventName, (data) => {
                        console.log(`📡 Socket event "${eventName}" received:`, data);
                        stopPolling();

                        const incidentId = data?.incidentId || data?.incident?._id || data?._id || data?.id;
                        const status = data?.status || data?.newStatus || data?.incident?.status;
                        const responderName = data?.responderName || data?.volunteerName || data?.responder?.name || data?.name;

                        if (incidentId && status) {
                            manuallyUpdateIncidentStatus(incidentId, status, responderName);

                            if (status === 'Dispatched' || status === 'En Route' || eventName === 'dispatch_created') {
                                setDispatchNotification({
                                    incidentId: incidentId,
                                    message: `🚗 ${responderName || 'Responder'} has been dispatched!`,
                                    responderName: responderName || 'Responder',
                                    timestamp: new Date().toISOString()
                                });
                                setTimeout(() => setDispatchNotification(null), 8000);
                            }

                            if (status === 'On Scene' || eventName === 'volunteer_arrived') {
                                setDispatchNotification({
                                    incidentId: incidentId,
                                    message: `📍 ${responderName || 'Responder'} has arrived on scene!`,
                                    responderName: responderName || 'Responder',
                                    timestamp: new Date().toISOString()
                                });
                                setTimeout(() => setDispatchNotification(null), 8000);
                            }

                            if (status === 'Resolved' || eventName === 'incident_resolved') {
                                setDispatchNotification({
                                    incidentId: incidentId,
                                    message: '✅ Incident has been resolved!',
                                    responderName: responderName || 'Responder',
                                    timestamp: new Date().toISOString()
                                });
                                setTimeout(() => setDispatchNotification(null), 8000);
                            }
                        } else {
                            if (loadRef.current && !isLoadingRef.current) {
                                setTimeout(() => loadRef.current(), 300);
                            }
                        }
                    });
                });

                socket.on('connect_error', (error) => {
                    console.warn('Socket connection error:', error.message);
                    reconnectAttempts++;
                    if (reconnectAttempts >= maxReconnectAttempts) {
                        startPolling();
                    }
                });

                socket.on('disconnect', () => {
                    console.log('⚠️ Socket disconnected');
                });

                socket.on('reconnect', () => {
                    console.log('🔄 Socket reconnected');
                    socket.emit('join', user.id);
                    socket.emit('join-room', 'track-reports');
                    if (loadRef.current && !isLoadingRef.current) {
                        loadRef.current();
                    }
                });

                socketRef.current = socket;
            } catch (error) {
                console.error('Failed to setup socket:', error);
                startPolling();
            }
        };

        connectSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
            stopPolling();
        };
    }, [isGuest, manuallyUpdateIncidentStatus, loadIncidents, startPolling, stopPolling]);

    // ✅ WINDOW DISPATCH LISTENER
    useEffect(() => {
        const handleDispatchNotification = (event) => {
            const data = event.detail;
            console.log('📡 Window dispatch notification:', data);
            if (data && data.incidentId) {
                stopPolling();
                setDispatchNotification({
                    incidentId: data.incidentId,
                    message: data.message || 'A responder has been dispatched to your incident',
                    responderName: data.responderName || 'Responder',
                    timestamp: new Date().toISOString()
                });
                setTimeout(() => setDispatchNotification(null), 10000);
                manuallyUpdateIncidentStatus(data.incidentId, 'Dispatched', data.responderName);
                if (loadRef.current && !isLoadingRef.current) {
                    setTimeout(() => loadRef.current(), 500);
                }
            }
        };
        window.addEventListener('dispatch-notification', handleDispatchNotification);
        return () => { window.removeEventListener('dispatch-notification', handleDispatchNotification); };
    }, [manuallyUpdateIncidentStatus, loadIncidents, stopPolling]);

    // ✅ FILTER LOGIC
    useEffect(() => {
        const filterIncidents = () => {
            if (!searchTerm || searchTerm.trim() === "") {
                setFilteredIncidents(incidents);
                return;
            }
            const searchLower = searchTerm.toLowerCase().trim();
            const filtered = incidents.filter(incident => {
                const searchableFields = [
                    incident.incidentId, incident.type, incident.location?.address,
                    incident.location?.barangay, incident.location?.city,
                    incident.reporterName, incident.reporterNumber, incident.status,
                    incident.severity, incident.description, incident.responder?.name,
                    incident.responderName
                ];
                if (incident.assignedTo && Array.isArray(incident.assignedTo)) {
                    incident.assignedTo.forEach(assignment => {
                        if (assignment.name) searchableFields.push(assignment.name);
                        if (assignment.responder?.name) searchableFields.push(assignment.responder.name);
                    });
                }
                return searchableFields.some(field =>
                    field && String(field).toLowerCase().includes(searchLower)
                );
            });
            setFilteredIncidents(filtered);
        };
        const timeoutId = setTimeout(filterIncidents, 150);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, incidents]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'text-green-600 bg-green-50 border-green-200';
            case 'Active': return 'text-red-600 bg-red-50 border-red-200';
            case 'On Scene': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'En Route': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Dispatched': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
            default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "Date not available";
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const toggleExpand = (id) => {
        setExpanding(true);
        setExpandedId(prev => prev === id ? null : id);
        if (expandedId !== id) {
            setMapReady(prev => ({ ...prev, [id]: true }));
        }
        setTimeout(() => {
            setExpanding(false);
        }, 300);
    };

    const getResponderName = (incident) => {
        if (!incident) return null;
        if (incident.responderName && incident.responderName !== '') return incident.responderName;
        if (incident.responder && typeof incident.responder === 'object' && incident.responder.name && incident.responder.name !== '') return incident.responder.name;
        if (incident.assignedTo && Array.isArray(incident.assignedTo) && incident.assignedTo.length > 0) {
            const firstAssigned = incident.assignedTo[0];
            if (typeof firstAssigned === 'object' && firstAssigned.name && firstAssigned.name !== '') return firstAssigned.name;
            if (firstAssigned.responder && typeof firstAssigned.responder === 'object' && firstAssigned.responder.name && firstAssigned.responder.name !== '') return firstAssigned.responder.name;
        }
        return null;
    };

    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const clearSearch = () => { setSearchTerm(""); setFilteredIncidents(incidents); };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading reports...</div>
            </div>
        );
    }

    if (incidents.length === 0 && !loading) {
        return (
            <div className="min-h-screen bg-gray-50/80 p-4 sm:p-6 font-sans">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <Icon icon="material-symbols:group-outline" width="28" className="text-[#1f4e6f] sm:w-8 sm:h-8" />
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#1f4e6f] tracking-tight">Track Incident Report</h1>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Enter your reference number to check the real-time status of your report.</p>
                    </div>
                    <div className="mb-6">
                        <div className="relative">
                            <Icon icon="material-symbols:search" width="20" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Search Incident Name, ID, Reference Number." value={searchTerm} onChange={handleSearchChange} className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 text-sm shadow-sm" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-8 sm:p-12 shadow-sm border border-gray-100 text-center">
                        <div className="flex justify-center mb-4"><div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center"><Icon icon="material-symbols:report-off" width="48" className="text-blue-400" /></div></div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Reports Found</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">There are currently no incident reports available. If you need to report an emergency, please use the button below.</p>
                        <button onClick={() => navigate("/report")} className="bg-[#0C7FDA] text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium inline-flex items-center gap-2"><Icon icon="mdi:plus" width="18" />Report Incident</button>
                    </div>
                </div>
            </div>
        );
    }

    if (filteredIncidents.length === 0 && searchTerm && !loading) {
        return (
            <div className="min-h-screen bg-gray-50/80 p-4 sm:p-6 font-sans">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <Icon icon="material-symbols:group-outline" width="28" className="text-[#1f4e6f] sm:w-8 sm:h-8" />
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#1f4e6f] tracking-tight">Track Incident Report</h1>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Enter your reference number to check the real-time status of your report.</p>
                    </div>
                    <div className="mb-6">
                        <div className="relative">
                            <Icon icon="material-symbols:search" width="20" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Search Incident Name, ID, Reference Number." value={searchTerm} onChange={handleSearchChange} className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 text-sm shadow-sm" />
                            {searchTerm && <button onClick={clearSearch} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"><Icon icon="mdi:close" width="18" /></button>}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-8 sm:p-12 shadow-sm border border-gray-100 text-center">
                        <div className="flex justify-center mb-4"><div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center"><Icon icon="material-symbols:search-off" width="48" className="text-yellow-400" /></div></div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Matching Reports</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">We couldn't find any reports matching "<span className="font-medium text-gray-700">{searchTerm}</span>". Please try a different search term.</p>
                        <button onClick={clearSearch} className="text-[#0C7FDA] hover:text-blue-700 text-sm font-medium">Clear Search</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/80 p-4 sm:p-6 font-sans">
            <div className="w-full max-w-7xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <Icon icon="material-symbols:group-outline" width="28" className="text-[#1f4e6f] sm:w-8 sm:h-8" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#1f4e6f] tracking-tight">Track Incident Report</h1>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Enter your reference number to check the real-time status of your report.</p>
                </div>

                {dispatchNotification && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between animate-slide-in">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Icon icon="mdi:ambulance" className="w-6 h-6 text-blue-600" /></div>
                            <div>
                                <p className="text-sm font-medium text-blue-800">{dispatchNotification.message}</p>
                                <p className="text-[10px] text-blue-400 mt-0.5">{new Date(dispatchNotification.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </div>
                        <button onClick={() => setDispatchNotification(null)} className="text-blue-400 hover:text-blue-600"><Icon icon="mdi:close" className="w-5 h-5" /></button>
                    </div>
                )}

                <div className="mb-6">
                    <div className="relative">
                        <Icon icon="material-symbols:search" width="20" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input type="text" id="searchInput" placeholder="Search Incident Name, ID, Reference Number, Location..." value={searchTerm} onChange={handleSearchChange} className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm shadow-sm transition-all" />
                        {searchTerm && <button onClick={clearSearch} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"><Icon icon="mdi:close" width="18" /></button>}
                    </div>
                    {searchTerm && <p className="text-xs text-gray-400 mt-1">Found {filteredIncidents.length} result{filteredIncidents.length !== 1 ? 's' : ''}</p>}
                </div>

                <div className="space-y-4 sm:space-y-5">
                    {filteredIncidents.map((incident) => {
                        const isExpanded = expandedId === incident._id;
                        const isDispatched = incident.status === 'Dispatched' || incident.status === 'En Route';
                        const isOnScene = incident.status === 'On Scene';
                        const isResolved = incident.status === 'Resolved';
                        const incidentLat = incident.location?.coordinates?.lat || incident.location?.coordinates?.latitude || 15.3613;
                        const incidentLng = incident.location?.coordinates?.lng || incident.location?.coordinates?.longitude || 120.9365;
                        const responderName = getResponderName(incident);

                        return (
                            <div key={incident._id} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                <div onClick={() => toggleExpand(incident._id)} className="p-4 sm:p-6 relative cursor-pointer hover:bg-gray-50/50 transition-colors duration-200">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 ${isResolved ? 'bg-green-500' : isOnScene ? 'bg-yellow-500' : isDispatched ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                    <div className="pl-2">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 mb-3">
                                            <h3 className="font-bold text-lg sm:text-xl text-[#1f4e6f]">{incident.type}</h3>
                                            <p className="text-xs sm:text-sm text-gray-400 font-medium">{incident.incidentId}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Icon icon="mdi:map-marker-outline" width="16" className="text-gray-500 flex-shrink-0" />
                                            <p className="text-xs sm:text-sm text-gray-600 break-words">{incident.location?.address || "Location not specified"}</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <Icon icon="mdi:calendar-clock" width="16" className="text-gray-500 flex-shrink-0" />
                                                <p className="text-xs sm:text-sm text-gray-500">{formatDateTime(incident.reportedAt)}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium border self-start sm:self-auto transition-colors duration-300 ${getStatusColor(incident.status)}`}>{incident.status || "Pending"}</span>
                                        </div>
                                        {isDispatched && <div className="mt-2"><DispatchBadge status={incident.status} responderName={responderName} /></div>}
                                    </div>
                                </div>

                                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="border-t border-gray-200 bg-gray-50/30 transform transition-all duration-500 ease-in-out origin-top">
                                        <div className="px-4 sm:px-6 pt-4 pb-2"><p className="text-xs sm:text-sm text-gray-500 mb-2">Response Progress</p><ProgressStepper currentStatus={incident.status} /></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-gray-200 bg-white">
                                            <div className="p-4 border-b sm:border-b-0 sm:border-r border-gray-200"><p className="text-[10px] sm:text-xs text-gray-500 mb-1">Type of Incident</p><p className="text-sm sm:text-base font-semibold text-gray-800">{incident.type}</p></div>
                                            <div className="p-4 border-b sm:border-b-0 border-gray-200"><p className="text-[10px] sm:text-xs text-gray-500 mb-1">Reported by</p><p className="text-sm sm:text-base font-semibold text-gray-800">{incident.reporterName || "Anonymous"}</p></div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-gray-200 bg-white">
                                            <div className="p-4 border-b sm:border-b-0 sm:border-r border-gray-200"><p className="text-[10px] sm:text-xs text-gray-500 mb-1">Victims / Casualties</p><p className="text-sm sm:text-base font-semibold text-gray-800">{incident.victimCount || incident.victimsAffected || "0"} People</p></div>
                                            <div className="p-4 border-b sm:border-b-0 border-gray-200"><p className="text-[10px] sm:text-xs text-gray-500 mb-1">Description</p><p className="text-sm sm:text-base text-gray-700">{incident.description || "No description provided."}</p></div>
                                        </div>
                                        <div className="h-48 sm:h-56 bg-gray-200 border-t border-gray-200 relative w-full z-0">
                                            <MapContainer key={`map-${incident._id}-${isExpanded}`} center={[incidentLat, incidentLng]} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false} scrollWheelZoom={true} dragging={true}>
                                                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <MapCenter position={[incidentLat, incidentLng]} shouldCenter={mapReady[incident._id]} />
                                                <Marker position={[incidentLat, incidentLng]} icon={isDispatched ? blueIcon : orangeIcon}>
                                                    <Popup><strong>{incident.type}</strong><br />{incident.location?.address}<br />{isDispatched && responderName && <span className="text-xs text-blue-600">🚗 Dispatched to {responderName}</span>}</Popup>
                                                </Marker>
                                            </MapContainer>
                                            <div className="absolute top-2 left-2 bg-white rounded shadow text-[10px] sm:text-xs overflow-hidden flex flex-col text-gray-600 border border-gray-200 z-[400]">
                                                <button className="px-2 sm:px-3 py-1 border-b border-gray-200 hover:bg-gray-50 font-medium">Map</button>
                                                <button className="px-2 sm:px-3 py-1 hover:bg-gray-50 font-medium">Satellite</button>
                                            </div>
                                            <div className="absolute bottom-2 right-2 bg-white rounded shadow flex flex-col border border-gray-200 z-[400]">
                                                <button className="p-1 border-b border-gray-200 hover:bg-gray-50"><Icon icon="mdi:plus" className="w-4 h-4" /></button>
                                                <button className="p-1 hover:bg-gray-50"><Icon icon="mdi:minus" className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                        <div className="border-t border-gray-200 bg-white">
                                            <div className="p-4 border-b border-gray-200 flex items-center gap-4">
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-200 flex-shrink-0 flex items-center justify-center transition-colors duration-300 ${isResolved ? 'bg-green-100' : isOnScene ? 'bg-yellow-100' : isDispatched ? 'bg-blue-100' : 'bg-gray-300'}`}>
                                                    {isResolved ? <Icon icon="mdi:check-circle" className="w-6 h-6 text-green-600" /> : isOnScene ? <Icon icon="mdi:map-marker" className="w-6 h-6 text-yellow-600" /> : isDispatched ? <Icon icon="mdi:ambulance" className="w-6 h-6 text-blue-600" /> : <Icon icon="mdi:account" className="w-6 h-6 text-gray-500" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm sm:text-base font-bold text-gray-800">{isResolved ? ' Incident Resolved' : isOnScene ? '📍 On Scene - Assessment in Progress' : isDispatched ? (responderName ? `🚗 ${responderName} En Route` : '🚗 Responder En Route') : '⏳ Awaiting Dispatch'}</p>
                                                    <p className="text-[10px] sm:text-xs text-gray-500">{isResolved ? ' Incident has been successfully resolved' : isOnScene ? '🚑 Rescue team is on site' : isDispatched ? '🚗 Responder is on the way' : '⏳ Waiting for responder assignment'}</p>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-3">Activity Timeline</p>
                                                <div className="space-y-4 relative pl-4 border-l-2 border-gray-200 ml-2">
                                                    <div className="relative"><div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-red-300 border-2 border-white"></div><p className="text-xs sm:text-sm text-gray-700">Incident reported by {incident.reporterName || "Juan Dela Cruz"} via mobile app.</p><p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(incident.reportedAt)}</p></div>
                                                    <div className="relative"><div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-orange-300 border-2 border-white"></div><p className="text-xs sm:text-sm text-gray-700">Report received and accepted by Rescue Team</p><p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(incident.updatedAt)}</p></div>
                                                    {isDispatched && <div className="relative"><div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-300 border-2 border-white"></div><p className="text-xs sm:text-sm text-gray-700">🚗 Responder dispatched to your location</p><p className="text-[10px] text-gray-400 mt-0.5">Responder is en route</p></div>}
                                                    {isOnScene && <div className="relative"><div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-yellow-300 border-2 border-white"></div><p className="text-xs sm:text-sm text-gray-700">📍 Responder on scene - Assessment in progress</p><p className="text-[10px] text-gray-400 mt-0.5">On site</p></div>}
                                                    {isResolved && <div className="relative"><div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-green-300 border-2 border-white"></div><p className="text-xs sm:text-sm text-gray-700">✅ Incident resolved</p><p className="text-[10px] text-gray-400 mt-0.5">Closed</p></div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}