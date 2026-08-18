// src/pages/volunteer/volunteerdashboard.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import NotificationBell from "../../components/layout/NotificationBell";
import io from 'socket.io-client';
import { incidentService, authService } from "../../services/api";
import EditProfileForm from "../civilian/EditProfile.jsx";

// Import all components
import ConfirmModal from "./ConfirmModal";
import ArrivalModal from "./ArrivalModal";
import IncidentDetailModal from "./IncidentDetailModal";
import DispatchCard from "./DispatchCard";
import OffDutyCard from "./OffDutyCard";
import LogoutModal from "./LogoutModal";
import IncidentFilters from "./IncidentFilters";
import StatsCards from "./StatsCards";
import MapComponent from "./MapComponent";

export default function VolunteerDashboard() {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [open, setOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mapView, setMapView] = useState('map');
    const [imageError, setImageError] = useState(false);
    const [notification, setNotification] = useState(null);
    const [showNotificationPopup, setShowNotificationPopup] = useState(false);
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDispatchCard, setShowDispatchCard] = useState(false);
    const [dispatchAction, setDispatchAction] = useState(null);
    const [showOffDutyCard, setShowOffDutyCard] = useState(false);
    const [isOnDuty, setIsOnDuty] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);
    const [actionedIncidents, setActionedIncidents] = useState({});
    const [isNotReadyMode, setIsNotReadyMode] = useState(() => {
        const saved = localStorage.getItem('volunteerNotReadyMode');
        return saved === 'true';
    });

    const [isModalClosing, setIsModalClosing] = useState(false);

    // Dispatch Request Modal state
    const [showDispatchRequestModal, setShowDispatchRequestModal] = useState(false);
    const [incomingDispatch, setIncomingDispatch] = useState(null);
    const [isProcessingDispatch, setIsProcessingDispatch] = useState(false);

    // Modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({
        title: '',
        message: '',
        confirmText: 'OK',
        confirmColor: 'bg-green-500 hover:bg-green-600',
        icon: 'success',
        onConfirm: () => { }
    });

    // Arrival Modal state
    const [showArrivalModal, setShowArrivalModal] = useState(false);
    const [arrivalIncident, setArrivalIncident] = useState(null);

    const [originalUser, setOriginalUser] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        profileImage: ""
    });

    const [user, setUser] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        profileImage: ""
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [photoError, setPhotoError] = useState("");
    const [photoSuccess, setPhotoSuccess] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isEditingLocal, setIsEditingLocal] = useState(false);

    // Location tracking states
    const [isTracking, setIsTracking] = useState(false);
    const [locationWatchId, setLocationWatchId] = useState(null);
    const [isEnRoute, setIsEnRoute] = useState(false);
    const [isArrived, setIsArrived] = useState(false);
    const [arrivalNotified, setArrivalNotified] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(null);

    // Directions states
    const [distanceToIncident, setDistanceToIncident] = useState(0);
    const [timeToIncident, setTimeToIncident] = useState(0);
    const [isDirectionsReady, setIsDirectionsReady] = useState(false);

    const navigate = useNavigate();
    const mapRef = useRef(null);
    const socketRef = useRef(null);
    const audioRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [pendingIncident, setPendingIncident] = useState(null);
    const isTrackingRef = useRef(false);
    const watchIdRef = useRef(null);
    const arrivalCheckInterval = useRef(null);
    const routingTimeoutRef = useRef(null);

    const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

    // Active Dispatch Persistence States
    const [activeDispatch, setActiveDispatch] = useState(null);
    const [isEnRoutePersisted, setIsEnRoutePersisted] = useState(false);
    const [incidentCoords, setIncidentCoords] = useState(null);

    // Helper function to dispatch location update
    const dispatchLocationUpdate = (incidentId, lat, lng) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const volunteerName = `${user.firstName} ${user.lastName}`;
        window.dispatchEvent(new CustomEvent('responder-location-update', {
            detail: {
                incidentId: incidentId,
                location: { lat: lat, lng: lng },
                volunteerName: volunteerName || 'Responder',
                timestamp: new Date().toISOString()
            }
        }));
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // ✅ Check arrival (20 meter threshold = 0.02 km)
    const checkArrival = useCallback((currentLat, currentLng, incidentLat, incidentLng) => {
        const dist = calculateDistance(currentLat, currentLng, incidentLat, incidentLng);
        const ARRIVAL_THRESHOLD = 0.02; // 20 meters
        const incident = selectedIncident || activeDispatch;

        // Don't trigger if already resolved or in "Not Ready" mode
        if (incident?.status === 'resolved' || isNotReadyMode) {
            return false;
        }

        const distanceInMeters = (dist * 1000).toFixed(0);
        console.log(`📏 Distance to incident: ${distanceInMeters}m (Threshold: ${ARRIVAL_THRESHOLD * 1000}m)`);

        // ✅ Check if distance is less than or equal to threshold
        if (dist <= ARRIVAL_THRESHOLD && !isArrived && !arrivalNotified) {
            console.log('✅ ARRIVAL DETECTED! Showing modal...');
            setIsArrived(true);
            setArrivalNotified(true);
            if (incident) {
                setArrivalIncident(incident);
                setShowArrivalModal(true);
                notifyArrival(incident);
            }
            return true;
        }
        return false;
    }, [isArrived, arrivalNotified, selectedIncident, activeDispatch, isNotReadyMode]);

    // ✅ Monitor distance continuously
    useEffect(() => {
        if (currentPosition && incidentCoords) {
            const dist = calculateDistance(
                currentPosition.lat,
                currentPosition.lng,
                incidentCoords[0],
                incidentCoords[1]
            );
            console.log(`🔍 MONITOR: Distance to incident: ${(dist * 1000).toFixed(0)}m`);

            // Auto trigger if distance is less than 20 meters
            if (dist <= 0.02 && !isArrived && !arrivalNotified) {
                console.log('🔍 AUTO-TRIGGER: Distance is less than 20 meters!');
                const incident = selectedIncident || activeDispatch;
                if (incident) {
                    setArrivalIncident(incident);
                    setShowArrivalModal(true);
                    setIsArrived(true);
                    setArrivalNotified(true);
                    notifyArrival(incident);
                }
            }
        }
    }, [currentPosition, incidentCoords, calculateDistance, isArrived, arrivalNotified, selectedIncident, activeDispatch]);

    // Notify rescue team of arrival
    const notifyArrival = async (incident) => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const volunteerName = `${user.firstName} ${user.lastName}`.trim() || 'Volunteer';

            const response = await fetch(`/api/incidents/${incident._id || incident.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'On Scene' })
            });

            if (response.ok) {
                if (socketRef.current && socketRef.current.connected) {
                    socketRef.current.emit('volunteer-arrived', {
                        incidentId: incident._id || incident.id,
                        volunteerName: volunteerName,
                        message: `${volunteerName} has arrived at the incident location`
                    });
                }

                window.dispatchEvent(new CustomEvent('volunteer-arrived', {
                    detail: {
                        incidentId: incident._id || incident.id,
                        volunteerName: volunteerName,
                        message: `${volunteerName} has arrived at the incident location`
                    }
                }));

                console.log('✅ Arrival notification sent');
            }
        } catch (error) {
            console.error('Failed to notify arrival:', error);
        }
    };

    // ✅ Load incidents with real-time updates
    const loadIncidents = useCallback(async () => {
        try {
            setLoading(true);
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserId = currentUser.id || currentUser._id;
            const response = await incidentService.getAllIncidents();
            if (response.success) {
                const userIncidents = response.data.filter(incident => {
                    const isAssigned = (incident.assignedTo && Array.isArray(incident.assignedTo) &&
                        incident.assignedTo.some(assigned => {
                            if (typeof assigned === 'string') {
                                return assigned === currentUserId || assigned === currentUser._id;
                            }
                            if (typeof assigned === 'object') {
                                return assigned.responder === currentUserId ||
                                    assigned.responder === currentUser._id ||
                                    assigned.id === currentUserId ||
                                    assigned.id === currentUser._id;
                            }
                            return false;
                        })) ||
                        incident.volunteerId === currentUserId ||
                        incident.volunteerId === currentUser._id ||
                        incident.responderId === currentUserId ||
                        incident.responderId === currentUser._id ||
                        incident.reportedBy === currentUserId ||
                        incident.reportedBy === currentUser._id ||
                        incident.reporterId === currentUserId ||
                        incident.reporterId === currentUser._id;
                    return isAssigned;
                });
                const formattedIncidents = userIncidents.map(incident => {
                    const lat = incident.location?.coordinates?.latitude || incident.location?.coordinates?.lat || 15.428991;
                    const lng = incident.location?.coordinates?.longitude || incident.location?.coordinates?.lng || 120.938698;
                    return {
                        id: incident.incidentId || incident._id,
                        _id: incident._id,
                        title: incident.type || 'Untitled Incident',
                        location: incident.location?.address || 'Unknown location',
                        shortLocation: incident.location?.address?.split(',')[0] || 'Unknown',
                        date: new Date(incident.reportedAt || incident.createdAt).toLocaleString(),
                        status: incident.status?.toLowerCase() || 'pending',
                        priority: incident.severity || 'Medium',
                        borderColor: incident.status === 'Dispatched' ? 'border-purple-500' :
                            incident.status === 'Active' ? 'border-red-500' :
                                incident.status === 'Resolved' ? 'border-green-500' :
                                    'border-yellow-500',
                        badge: incident.status === 'Dispatched' ? 'Dispatch' :
                            incident.status === 'Active' ? 'Active' :
                                incident.status === 'Resolved' ? 'Resolved' : 'Pending',
                        badgeColor: incident.status === 'Dispatched' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            incident.status === 'Active' ? 'bg-red-100 text-red-700 border-red-200' :
                                incident.status === 'Resolved' ? 'bg-green-100 text-green-700 border-green-200' :
                                    'bg-yellow-100 text-yellow-700 border-yellow-200',
                        description: incident.description || 'No description provided',
                        reporter: incident.reporterName || 'Anonymous',
                        reporterPhone: incident.reporterNumber || 'N/A',
                        coordinates: [parseFloat(lat), parseFloat(lng)],
                        victims: incident.victimsAffected || 0,
                        image: incident.image || null,
                        dispatchNotes: incident.dispatchNotes || null,
                        assignedTo: incident.assignedTo || []
                    };
                });
                setIncidents(formattedIncidents);
                applyFilter(formattedIncidents);

                // ✅ Force map to update markers with new incidents
                if (mapRef.current) {
                    setTimeout(() => {
                        mapRef.current.updateMarkers();
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Failed to load incidents:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Apply filter to incidents
    const applyFilter = useCallback((incidentList) => {
        if (!incidentList) incidentList = incidents;
        if (!searchTerm || searchTerm.trim() === "") {
            setFilteredIncidents(incidentList);
            return;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        const filtered = incidentList.filter(incident => {
            const searchableFields = [
                incident.incidentId,
                incident.type,
                incident.location?.address,
                incident.location?.barangay,
                incident.location?.city,
                incident.reporterName,
                incident.reporterNumber,
                incident.status,
                incident.severity,
                incident.description,
                incident.responder?.name,
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
    }, [searchTerm, incidents]);

    // Filter when search changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            applyFilter(incidents);
        }, 150);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, incidents, applyFilter]);

    // Setup socket connection
    const setupSocketConnection = useCallback(() => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            if (token && user.id) {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }

                const hostname = window.location.hostname;
                let socketUrl;

                if (hostname === 'localhost' || hostname === '127.0.0.1') {
                    socketUrl = 'http://localhost:5000';
                } else {
                    // ✅ CHANGE THIS TO YOUR ACTUAL BACKEND URL
                    socketUrl = 'https://sta-rosa-rescue-system-backend.onrender.com';
                }

                console.log('🔌 Socket URL:', socketUrl);

                socketRef.current = io(socketUrl, {
                    auth: { token },
                    transports: ['websocket', 'polling'],
                    withCredentials: true,
                    reconnection: true,
                    reconnectionAttempts: 10,
                    reconnectionDelay: 1000,
                    timeout: 20000
                });

                socketRef.current.on('connect', () => {
                    console.log('✅ Socket connected');
                    socketRef.current.emit('join', user.id);
                    socketRef.current.emit('join-room', 'volunteers');
                    loadIncidents();
                });

                socketRef.current.on('new_notification', (notification) => {
                    console.log('📢 New notification received:', notification);

                    if (notification.type === 'response_assignment') {
                        const incidentData = notification.data || notification;
                        setIncomingDispatch({
                            _id: incidentData.incidentId || incidentData._id || Date.now().toString(),
                            id: incidentData.incidentId || incidentData._id || Date.now().toString(),
                            title: incidentData.title || incidentData.type || 'Untitled Incident',
                            type: incidentData.type || incidentData.title || 'Untitled Incident',
                            location: incidentData.location?.address || incidentData.location || 'Unknown location',
                            priority: incidentData.severity || incidentData.priority || 'Medium',
                            status: incidentData.status || 'Pending',
                            description: incidentData.description || 'No description provided',
                            reporter: incidentData.reporterName || incidentData.reporter || 'Anonymous',
                            victims: incidentData.victimsAffected || incidentData.victims || 0,
                            coordinates: incidentData.coordinates || null,
                            assignedTo: incidentData.assignedTo || []
                        });
                        setShowDispatchRequestModal(true);

                        const audio = new Audio('/dispatch-sound.mp3');
                        audio.play().catch(e => console.log('Audio play failed:', e));
                    }

                    loadIncidents();
                    showNotification(notification);
                });

                // ✅ Real-time incident updates
                socketRef.current.on('incident_updated', (data) => {
                    console.log('🔄 Incident updated:', data);
                    loadIncidents();
                });

                socketRef.current.on('new_incident', (data) => {
                    console.log('🆕 New incident received in real-time:', data);
                    loadIncidents();
                });

                socketRef.current.on('dispatch_created', (data) => {
                    console.log('📋 Dispatch created in real-time:', data);
                    loadIncidents();
                });

                socketRef.current.on('volunteer_assigned', (data) => {
                    console.log('👤 Volunteer assigned in real-time:', data);
                    loadIncidents();
                });

                socketRef.current.on('incident_status_change', (data) => {
                    console.log('📊 Status changed in real-time:', data);
                    loadIncidents();
                });

                socketRef.current.on('connect_error', (error) => {
                    console.error('Socket connection error:', error);
                    if (error.message.includes('websocket')) {
                        console.log('⚠️ WebSocket failed, trying polling only...');
                        socketRef.current.io.opts.transports = ['polling'];
                    }
                });

                socketRef.current.on('reconnect', (attemptNumber) => {
                    console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
                    socketRef.current.emit('join', user.id);
                    socketRef.current.emit('join-room', 'volunteers');
                    loadIncidents();
                });
            }
        } catch (error) {
            console.error("Failed to setup socket:", error);
        }
    }, [loadIncidents]);

    // Handle accepting dispatch request from modal
    const handleAcceptDispatch = async (incident) => {
        if (!incident) return;

        setIsProcessingDispatch(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const volunteerName = `${user.firstName} ${user.lastName}`.trim() || 'Volunteer';

            const incidentId = incident._id || incident.id;

            const response = await fetch(`/api/incidents/${incidentId}/accept`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    volunteerId: user.id,
                    responderName: volunteerName
                })
            });

            const data = await response.json();

            if (data.success) {
                setShowDispatchRequestModal(false);
                setIncomingDispatch(null);
                await loadIncidents();
                await loadActiveDispatch();

                if (incident.coordinates) {
                    setIncidentCoords(incident.coordinates);
                    console.log('📍 Incident coords set:', incident.coordinates);
                }
                startLocationTracking(incidentId);

                alert(`✅ You have accepted the dispatch for ${incident.title || 'incident'}!`);
            } else {
                alert('❌ Failed to accept dispatch: ' + data.message);
            }
        } catch (error) {
            console.error('Error accepting dispatch:', error);
            alert('❌ Error accepting dispatch. Please try again.');
        } finally {
            setIsProcessingDispatch(false);
        }
    };

    // Handle declining dispatch request from modal
    const handleDeclineDispatch = async (incident) => {
        if (!incident) return;

        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const incidentId = incident._id || incident.id;

            const response = await fetch(`/api/incidents/${incidentId}/decline`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ volunteerId: user.id })
            });

            const data = await response.json();

            if (data.success) {
                setShowDispatchRequestModal(false);
                setIncomingDispatch(null);
                console.log('✅ Dispatch declined');
            } else {
                console.error('Failed to decline:', data.message);
            }
        } catch (error) {
            console.error('Error declining dispatch:', error);
        }
    };

    const handleResolveFromButton = async () => {
        const incident = selectedIncident || activeDispatch;
        if (!incident) return;

        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const volunteerName = `${user.firstName} ${user.lastName}`.trim() || 'Volunteer';

            const incidentId = incident._id || incident.id;

            const response = await fetch(`/api/incidents/${incidentId}/resolve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resolutionNotes: `Incident resolved by volunteer ${volunteerName}`
                })
            });

            const data = await response.json();

            if (data.success) {
                stopLocationTracking();
                setActiveDispatch(null);
                setIsEnRoutePersisted(false);
                setIncidentCoords(null);
                localStorage.removeItem('activeDispatchId');
                localStorage.removeItem('isEnRoute');

                if (mapRef.current) {
                    mapRef.current.clearVolunteerMarker();
                    mapRef.current.clearRouting();
                }

                setIsNotReadyMode(false);
                localStorage.removeItem('volunteerNotReadyMode');

                const resolvedIncidentId = incident._id || incident.id;
                const updatedActioned = { ...actionedIncidents };
                delete updatedActioned[resolvedIncidentId];
                setActionedIncidents(updatedActioned);
                localStorage.setItem('volunteerActionedIncidents', JSON.stringify(updatedActioned));

                setSelectedIncident(null);

                if (socketRef.current && socketRef.current.connected) {
                    socketRef.current.emit('incident-resolved', {
                        incidentId: incidentId,
                        volunteerName: volunteerName,
                        message: `Incident ${incident.id || incidentId} has been resolved by ${volunteerName}`
                    });
                }

                setConfirmModalData({
                    title: '✅ Incident Resolved!',
                    message: `You have successfully resolved ${incident.title || 'the incident'}. The rescue team has been notified.`,
                    confirmText: 'OK',
                    confirmColor: 'bg-green-500 hover:bg-green-600',
                    icon: 'success',
                    onConfirm: () => {
                        loadIncidents();
                        setSelectedIncident(null);
                    }
                });
                setShowConfirmModal(true);
                loadIncidents();

            } else {
                setConfirmModalData({
                    title: '❌ Failed',
                    message: data.message || 'Failed to resolve incident. Please try again.',
                    confirmText: 'OK',
                    confirmColor: 'bg-red-500 hover:bg-red-600',
                    icon: 'error',
                    onConfirm: () => { }
                });
                setShowConfirmModal(true);
            }
        } catch (error) {
            console.error('Failed to resolve incident:', error);
            setConfirmModalData({
                title: '❌ Error',
                message: 'Failed to resolve incident. Please try again.',
                confirmText: 'OK',
                confirmColor: 'bg-red-500 hover:bg-red-600',
                icon: 'error',
                onConfirm: () => { }
            });
            setShowConfirmModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSolveIncident = async () => {
        const incident = arrivalIncident || selectedIncident || activeDispatch;
        if (!incident) return;

        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const volunteerName = `${user.firstName} ${user.lastName}`.trim() || 'Volunteer';

            const incidentId = incident._id || incident.id;

            const response = await fetch(`/api/incidents/${incidentId}/resolve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resolutionNotes: `Incident resolved by volunteer ${volunteerName}`
                })
            });

            const data = await response.json();

            if (data.success) {
                setShowArrivalModal(false);
                setArrivalIncident(null);
                stopLocationTracking();
                setActiveDispatch(null);
                setIsEnRoutePersisted(false);
                setIncidentCoords(null);
                localStorage.removeItem('activeDispatchId');
                localStorage.removeItem('isEnRoute');

                if (mapRef.current) {
                    mapRef.current.clearVolunteerMarker();
                    mapRef.current.clearRouting();
                }

                setIsNotReadyMode(false);
                localStorage.removeItem('volunteerNotReadyMode');

                const resolvedIncidentId = incident._id || incident.id;
                const updatedActioned = { ...actionedIncidents };
                delete updatedActioned[resolvedIncidentId];
                setActionedIncidents(updatedActioned);
                localStorage.setItem('volunteerActionedIncidents', JSON.stringify(updatedActioned));

                if (socketRef.current && socketRef.current.connected) {
                    socketRef.current.emit('incident-resolved', {
                        incidentId: incidentId,
                        volunteerName: volunteerName,
                        message: `Incident ${incident.id || incidentId} has been resolved by ${volunteerName}`
                    });
                }

                setConfirmModalData({
                    title: '✅ Incident Resolved!',
                    message: `You have successfully resolved ${incident.title || 'the incident'}. The rescue team has been notified.`,
                    confirmText: 'OK',
                    confirmColor: 'bg-green-500 hover:bg-green-600',
                    icon: 'success',
                    onConfirm: () => {
                        loadIncidents();
                    }
                });
                setShowConfirmModal(true);
                loadIncidents();
            } else {
                setConfirmModalData({
                    title: '❌ Failed',
                    message: data.message || 'Failed to resolve incident. Please try again.',
                    confirmText: 'OK',
                    confirmColor: 'bg-red-500 hover:bg-red-600',
                    icon: 'error',
                    onConfirm: () => { }
                });
                setShowConfirmModal(true);
            }
        } catch (error) {
            console.error('Failed to resolve incident:', error);
            setConfirmModalData({
                title: '❌ Error',
                message: 'Failed to resolve incident. Please try again.',
                confirmText: 'OK',
                confirmColor: 'bg-red-500 hover:bg-red-600',
                icon: 'error',
                onConfirm: () => { }
            });
            setShowConfirmModal(true);
        }
    };

    // ✅ TEST FUNCTION: Manually trigger arrival (for testing)
    const testArrival = useCallback(() => {
        console.log('🧪 TEST: Manually triggering arrival modal...');
        const incident = selectedIncident || activeDispatch;
        if (incident) {
            setArrivalIncident(incident);
            setShowArrivalModal(true);
            setIsArrived(true);
            setArrivalNotified(true);
            notifyArrival(incident);
        } else {
            alert('No incident selected or active!');
        }
    }, [selectedIncident, activeDispatch]);

    // Start location tracking
    const startLocationTracking = useCallback((incidentId) => {
        if (isTrackingRef.current) {
            console.log('⚠️ Tracking already active, skipping...');
            return;
        }

        if (!navigator.geolocation) {
            console.warn('⚠️ Geolocation not available');
            return;
        }

        console.log('📍 Starting tracking for incident:', incidentId);
        setIsTracking(true);
        setIsEnRoute(true);
        setIsDirectionsReady(false);
        setIsArrived(false);
        setArrivalNotified(false);
        isTrackingRef.current = true;

        const incident = incidents.find(inc => inc._id === incidentId || inc.id === incidentId);
        let coords = incident?.coordinates || incidentCoords || [15.428991, 120.938698];

        // Get initial position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log(`📍 Current position: ${latitude}, ${longitude}`);
                setCurrentPosition({ lat: latitude, lng: longitude });

                if (mapRef.current) {
                    mapRef.current.updateVolunteerMarker({ lat: latitude, lng: longitude });
                    mapRef.current.updateDirections(latitude, longitude, coords[0], coords[1]);
                    mapRef.current.flyTo(latitude, longitude, 17);
                }

                dispatchLocationUpdate(incidentId, latitude, longitude);
                checkArrival(latitude, longitude, coords[0], coords[1]);
            },
            (error) => {
                console.error('❌ Geolocation error:', error);
                const fallbackLat = 15.428991;
                const fallbackLng = 120.938698;
                setCurrentPosition({ lat: fallbackLat, lng: fallbackLng });

                if (mapRef.current) {
                    mapRef.current.updateVolunteerMarker({ lat: fallbackLat, lng: fallbackLng });
                    mapRef.current.updateDirections(fallbackLat, fallbackLng, coords[0], coords[1]);
                    mapRef.current.flyTo(fallbackLat, fallbackLng, 17);
                }

                dispatchLocationUpdate(incidentId, fallbackLat, fallbackLng);
                checkArrival(fallbackLat, fallbackLng, coords[0], coords[1]);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );

        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const dist = calculateDistance(latitude, longitude, coords[0], coords[1]);

                console.log(`📍 Position update: ${latitude}, ${longitude}, Distance: ${(dist * 1000).toFixed(0)}m`);

                setCurrentPosition({ lat: latitude, lng: longitude });

                if (mapRef.current) {
                    mapRef.current.updateVolunteerMarker({ lat: latitude, lng: longitude });
                    mapRef.current.updateDirections(latitude, longitude, coords[0], coords[1]);
                }

                dispatchLocationUpdate(incidentId, latitude, longitude);

                const arrived = checkArrival(latitude, longitude, coords[0], coords[1]);

                if (arrived) {
                    console.log('✅ Arrived! Stopping watch...');
                    if (watchIdRef.current) {
                        navigator.geolocation.clearWatch(watchIdRef.current);
                        watchIdRef.current = null;
                    }
                }

                if (socketRef.current && socketRef.current.connected) {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    socketRef.current.emit('volunteer-location', {
                        volunteerId: user.id,
                        volunteerName: `${user.firstName} ${user.lastName}`,
                        incidentId: incidentId,
                        location: { lat: latitude, lng: longitude },
                        status: isArrived ? 'arrived' : 'en-route',
                        distance: dist
                    });
                }
            },
            (error) => {
                console.log('⚠️ Watch error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
                frequency: 1000
            }
        );

        setLocationWatchId(watchIdRef.current);

        if (arrivalCheckInterval.current) {
            clearInterval(arrivalCheckInterval.current);
        }

        arrivalCheckInterval.current = setInterval(() => {
            if (currentPosition && coords) {
                const dist = calculateDistance(
                    currentPosition.lat,
                    currentPosition.lng,
                    coords[0],
                    coords[1]
                );
                console.log(`⏱️ Interval check: ${(dist * 1000).toFixed(0)}m away`);
                checkArrival(currentPosition.lat, currentPosition.lng, coords[0], coords[1]);
            }
        }, 2000);
    }, [incidents, incidentCoords, checkArrival, isArrived, currentPosition]);

    // Stop location tracking
    const stopLocationTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (arrivalCheckInterval.current) {
            clearInterval(arrivalCheckInterval.current);
            arrivalCheckInterval.current = null;
        }
        if (locationWatchId !== null) {
            navigator.geolocation.clearWatch(locationWatchId);
            setLocationWatchId(null);
        }

        setIsTracking(false);
        setIsEnRoute(false);
        setIsEnRoutePersisted(false);
        setIsArrived(false);
        setArrivalNotified(false);
        setActiveDispatch(null);
        setIncidentCoords(null);
        setCurrentPosition(null);
        isTrackingRef.current = false;

        if (mapRef.current) {
            mapRef.current.clearRouting();
        }

        setDistanceToIncident(0);
        setTimeToIncident(0);
        setIsDirectionsReady(false);
        localStorage.removeItem('activeDispatchId');
        localStorage.removeItem('isEnRoute');
    }, []);

    // Clean up tracking on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (arrivalCheckInterval.current) {
                clearInterval(arrivalCheckInterval.current);
            }
            stopLocationTracking();
        };
    }, [stopLocationTracking]);

    // Load actioned incidents from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('volunteerActionedIncidents');
        if (saved) {
            try {
                setActionedIncidents(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load actioned incidents:', e);
            }
        }
    }, []);

    // Prevent body scroll when modals are open
    useEffect(() => {
        const isModalOpen = selectedIncident !== null || showArrivalModal || showConfirmModal || showDispatchRequestModal || showDispatchCard || showOffDutyCard || showLogoutModal;

        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [selectedIncident, showArrivalModal, showConfirmModal, showDispatchRequestModal, showDispatchCard, showOffDutyCard, showLogoutModal]);

    // Authentication check
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!token || !user.id) {
            navigate('/login');
            return;
        }
        const verifyUser = async () => {
            try {
                const response = await authService.getCurrentUser();
                if (!response.success || response.data.id !== user.id) {
                    navigate('/login');
                }
            } catch (error) {
                navigate('/login');
            }
        };
        verifyUser();
    }, [navigate]);

    const getUserRole = () => {
        const role = localStorage.getItem('userRole');
        if (role) {
            return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        }
        return 'Volunteer';
    };

    const loadUserData = () => {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                setUserName(`${userData.firstName} ${userData.lastName}`);
                if (userData.profileImage && userData.profileImage !== "") {
                    if (userData.profileImage.startsWith('http')) {
                        setProfileImage(userData.profileImage);
                    } else {
                        setProfileImage(`http://localhost:5000/${userData.profileImage}`);
                    }
                } else {
                    setProfileImage("");
                }
            } catch (e) {
                setUserName("Volunteer");
                setProfileImage("");
            }
        }
    };

    const loadUserProfile = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const storedImage = storedUser?.profileImage || localStorage.getItem('profileImage') || "";
            if (storedImage) {
                const imageUrl = storedImage.startsWith('http') ? storedImage : `http://localhost:5000/${storedImage}`;
                setPreviewUrl(imageUrl);
            }
            const response = await authService.getCurrentUser();
            if (response.success) {
                const userData = {
                    firstName: response.data.firstName || storedUser?.firstName || "",
                    lastName: response.data.lastName || storedUser?.lastName || "",
                    phoneNumber: response.data.phoneNumber || storedUser?.phoneNumber || "",
                    email: response.data.email || storedUser?.email || "",
                    profileImage: response.data.profileImage || storedImage || ""
                };
                setOriginalUser(userData);
                setUser(userData);
                const updatedStoredUser = {
                    ...storedUser,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phoneNumber: userData.phoneNumber,
                    email: userData.email,
                    profileImage: userData.profileImage
                };
                localStorage.setItem('user', JSON.stringify(updatedStoredUser));
                if (userData.profileImage) {
                    localStorage.setItem('profileImage', userData.profileImage);
                }
                if (userData.profileImage) {
                    const imageUrl = userData.profileImage.startsWith('http') ? userData.profileImage : `http://localhost:5000/${userData.profileImage}`;
                    setPreviewUrl(imageUrl);
                } else {
                    setPreviewUrl(null);
                }
            }
        } catch (error) {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const storedImage = storedUser?.profileImage || localStorage.getItem('profileImage') || "";
            if (storedImage) {
                const imageUrl = storedImage.startsWith('http') ? storedImage : `http://localhost:5000/${storedImage}`;
                setPreviewUrl(imageUrl);
            }
            if (storedUser) {
                setOriginalUser(storedUser);
                setUser(storedUser);
            }
        }
    };

    // Profile validation and handlers (keep existing)
    const validateProfile = () => {
        const errors = {};
        if (!user.firstName.trim()) {
            errors.firstName = "First name is required";
        } else if (user.firstName.trim().length < 2) {
            errors.firstName = "First name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s\-']+$/.test(user.firstName.trim())) {
            errors.firstName = "First name can only contain letters, spaces, hyphens, and apostrophes";
        }
        if (!user.lastName.trim()) {
            errors.lastName = "Last name is required";
        } else if (user.lastName.trim().length < 2) {
            errors.lastName = "Last name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s\-']+$/.test(user.lastName.trim())) {
            errors.lastName = "Last name can only contain letters, spaces, hyphens, and apostrophes";
        }
        if (!user.phoneNumber.trim()) {
            errors.phoneNumber = "Contact number is required";
        } else {
            const phoneDigits = user.phoneNumber.replace(/\D/g, '');
            if (phoneDigits.length < 10 || phoneDigits.length > 11) {
                errors.phoneNumber = "Please enter a valid phone number (10-11 digits)";
            }
            if (!phoneDigits.startsWith('09') && !phoneDigits.startsWith('63')) {
                errors.phoneNumber = "Phone number must start with 09 or 63";
            }
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCancelLocal = () => {
        setUser({ ...originalUser });
        setIsEditingLocal(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordError("");
        setPasswordSuccess("");
        setPhotoError("");
        setPhotoSuccess("");
        setValidationErrors({});
        if (originalUser.profileImage) {
            const imageUrl = originalUser.profileImage.startsWith('http') ? originalUser.profileImage : `http://localhost:5000/${originalUser.profileImage}`;
            setPreviewUrl(imageUrl);
        } else {
            setPreviewUrl(null);
        }
        setSelectedFile(null);
        setShowEditProfile(false);
    };

    const handleSave = async () => {
        if (!validateProfile()) return;
        const hasChanges = user.firstName.trim() !== originalUser.firstName ||
            user.lastName.trim() !== originalUser.lastName ||
            user.phoneNumber.trim() !== originalUser.phoneNumber;

        if (!hasChanges) {
            alert("No changes were made to your profile.");
            setIsEditingLocal(false);
            setShowEditProfile(false);
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            // ✅ CHANGE THIS TO HIT YOUR NEW BACKEND ROUTE
            const response = await fetch('/api/volunteer/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: user.firstName.trim(),
                    lastName: user.lastName.trim(),
                    phoneNumber: user.phoneNumber.trim(),
                    // You can pass these optional fields too if your form has them:
                    // address: user.address,
                    // certifications: user.certifications,
                    // availability: user.availability,
                    // description: user.description
                })
            });

            const data = await response.json();

            if (data.success) {
                const updatedUser = { ...user, profileImage: originalUser.profileImage };
                setOriginalUser(updatedUser);
                setUser(updatedUser);
                const storedUser = JSON.parse(localStorage.getItem('user'));
                if (storedUser) {
                    storedUser.firstName = user.firstName.trim();
                    storedUser.lastName = user.lastName.trim();
                    storedUser.phoneNumber = user.phoneNumber.trim();
                    storedUser.profileImage = originalUser.profileImage;
                    localStorage.setItem('user', JSON.stringify(storedUser));
                    if (originalUser.profileImage) {
                        localStorage.setItem('profileImage', originalUser.profileImage);
                    }
                }
                window.dispatchEvent(new Event('storage'));
                alert("Profile updated successfully!");
                setIsEditingLocal(false);
                setValidationErrors({});
                setShowEditProfile(false);
            } else {
                alert(data.message || "Failed to update profile");
            }
        } catch (error) {
            alert(error.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };
    const validatePassword = () => {
        const errors = {};
        if (!passwordData.currentPassword) {
            errors.currentPassword = "Current password is required";
        }
        if (!passwordData.newPassword) {
            errors.newPassword = "New password is required";
        } else {
            if (passwordData.newPassword.length < 12) {
                errors.newPassword = "Password must be at least 12 characters";
            } else if (!/[A-Z]/.test(passwordData.newPassword)) {
                errors.newPassword = "Password must contain an uppercase letter";
            } else if (!/[a-z]/.test(passwordData.newPassword)) {
                errors.newPassword = "Password must contain a lowercase letter";
            } else if (!/[0-9]/.test(passwordData.newPassword)) {
                errors.newPassword = "Password must contain a number";
            } else if (!/[^A-Za-z0-9]/.test(passwordData.newPassword)) {
                errors.newPassword = "Password must contain a special character";
            } else if (passwordData.newPassword === passwordData.currentPassword) {
                errors.newPassword = "New password must be different from current password";
            }
        }
        if (!passwordData.confirmPassword) {
            errors.confirmPassword = "Please confirm your new password";
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePasswordChange = async () => {
        setPasswordError("");
        setPasswordSuccess("");
        if (!validatePassword()) return;
        setChangingPassword(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            const data = await response.json();
            if (data.success) {
                setPasswordSuccess("Password changed successfully!");
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setValidationErrors({});
                setTimeout(() => setPasswordSuccess(""), 5000);
            } else {
                setPasswordError(data.message || "Failed to change password");
            }
        } catch (error) {
            setPasswordError("Error changing password. Please try again.");
        } finally {
            setChangingPassword(false);
        }
    };

    const handleChangePhoto = () => { fileInputRef.current.click(); };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoError("");
        setPhotoSuccess("");
        setUploadingPhoto(true);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
        setSelectedFile(file);
        const formData = new FormData();
        formData.append('profileImage', file);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/auth/upload-profile-image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                setPhotoSuccess("Profile photo updated successfully!");
                const updatedUser = { ...user, profileImage: data.imagePath };
                setUser(updatedUser);
                setOriginalUser(updatedUser);
                const storedUser = JSON.parse(localStorage.getItem('user'));
                if (storedUser) {
                    storedUser.profileImage = data.imagePath;
                    localStorage.setItem('user', JSON.stringify(storedUser));
                    localStorage.setItem('profileImage', data.imagePath);
                }
                setPreviewUrl(data.imagePath);
                window.dispatchEvent(new Event('storage'));
                setTimeout(() => setPhotoSuccess(""), 5000);
            } else {
                setPhotoError(data.message || "Failed to upload photo");
                setTimeout(() => setPhotoError(""), 5000);
            }
        } catch (error) {
            setPhotoError("Failed to upload photo. Please try again.");
            setTimeout(() => setPhotoError(""), 5000);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleFileInputClick = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const showNotification = (notification) => {
        setNotification(notification);
        setShowNotificationPopup(true);
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
        setTimeout(() => setShowNotificationPopup(false), 6000);
    };

    // Load active dispatch from backend on mount
    const loadActiveDispatch = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/volunteer/active-dispatch', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success && data.data) {
                console.log('✅ Active dispatch found:', data.data);
                setActiveDispatch(data.data);
                setSelectedIncident(data.data);
                setIsRightSidebarOpen(true);

                if (data.data.coordinates) {
                    setIncidentCoords(data.data.coordinates);
                }

                if (data.isEnRoute) {
                    setIsEnRoutePersisted(true);
                    setIsEnRoute(true);

                    const restoreTracking = () => {
                        if (mapRef.current) {
                            const coords = data.data.coordinates || [15.428991, 120.938698];
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        const { latitude, longitude } = position.coords;
                                        console.log('📍 Restoring tracking at:', latitude, longitude);

                                        if (mapRef.current) {
                                            mapRef.current.flyTo(latitude, longitude, 17);
                                            mapRef.current.updateDirections(latitude, longitude, coords[0], coords[1]);
                                            mapRef.current.updateVolunteerMarker({ lat: latitude, lng: longitude });
                                        }

                                        setIsEnRoute(true);
                                        setIsDirectionsReady(true);
                                    },
                                    () => {
                                        if (mapRef.current) {
                                            mapRef.current.flyTo(15.428991, 120.938698, 17);
                                            mapRef.current.updateDirections(15.428991, 120.938698, coords[0], coords[1]);
                                            mapRef.current.updateVolunteerMarker({ lat: 15.428991, lng: 120.938698 });
                                        }
                                        setIsEnRoute(true);
                                        setIsDirectionsReady(true);
                                    }
                                );
                            }
                            return true;
                        }
                        return false;
                    };

                    if (!restoreTracking()) {
                        const checkMap = setInterval(() => {
                            if (restoreTracking()) {
                                clearInterval(checkMap);
                            }
                        }, 500);
                        setTimeout(() => clearInterval(checkMap), 10000);
                    }
                }
            } else {
                console.log('ℹ️ No active dispatch found');
                setActiveDispatch(null);
            }
        } catch (error) {
            console.error('Failed to load active dispatch:', error);
        }
    }, []);

    // Restore tracking when map and incidents are ready
    useEffect(() => {
        if (activeDispatch && isEnRoutePersisted && mapRef.current && !isTrackingRef.current) {
            const incidentId = activeDispatch._id || activeDispatch.id;
            const incident = incidents.find(inc => inc._id === incidentId || inc.id === incidentId);
            if (incident || incidentCoords) {
                const coords = incident?.coordinates || incidentCoords;
                if (coords && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const { latitude, longitude } = position.coords;
                            if (mapRef.current) {
                                mapRef.current.updateDirections(latitude, longitude, coords[0], coords[1]);
                                mapRef.current.updateVolunteerMarker({ lat: latitude, lng: longitude });
                            }
                            setIsEnRoute(true);
                            setIsDirectionsReady(true);
                        },
                        () => {
                            if (mapRef.current) {
                                mapRef.current.updateDirections(15.428991, 120.938698, coords[0], coords[1]);
                                mapRef.current.updateVolunteerMarker({ lat: 15.428991, lng: 120.938698 });
                            }
                            setIsEnRoute(true);
                            setIsDirectionsReady(true);
                        }
                    );
                }
            }
        }
    }, [activeDispatch, isEnRoutePersisted, incidents, incidentCoords]);

    // Polling fallback for mobile
    useEffect(() => {
        const isMobile = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

        if (isMobile) {
            console.log('📱 Mobile device detected - enabling real-time polling fallback');
            const pollInterval = setInterval(() => {
                if (!document.hidden) {
                    console.log('⏰ Polling for incidents...');
                    loadIncidents();
                }
            }, 5000);

            return () => clearInterval(pollInterval);
        }
    }, [loadIncidents]);

    // Reload incidents when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('👁️ Tab visible - refreshing incidents');
                loadIncidents();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [loadIncidents]);

    // Main useEffect
    useEffect(() => {
        loadUserData();
        loadIncidents();
        loadUserProfile();
        loadActiveDispatch();
        setupSocketConnection();
        audioRef.current = new Audio('/notification-sound.mp3');

        const handleStorageChange = () => loadUserData();
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            if (socketRef.current) socketRef.current.disconnect();
            stopLocationTracking();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogoutClick = () => setShowLogoutModal(true);
    const handleConfirmLogout = () => {
        setShowLogoutModal(false);
        setIsLoggingOut(true);
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            localStorage.removeItem('profileImage');
            if (socketRef.current) socketRef.current.disconnect();
            navigate('/login');
        }, 2000);
    };
    const handleCancelLogout = () => setShowLogoutModal(false);

    const stats = {
        allIncidents: incidents.length,
        active: incidents.filter(i => i.status === 'active' || i.status === 'dispatched').length,
        pending: incidents.filter(i => i.status === 'pending').length,
        solved: incidents.filter(i => i.status === 'resolved' || i.status === 'accepted').length
    };

    // Rest of the component handlers...
    const handleIncidentClick = (incident) => {
        console.log('🔵 Incident clicked - Full data:', incident);
        setSelectedIncident(incident);
        setImageError(false);
        setIsRightSidebarOpen(true);
        setShowDispatchCard(false);
        setDispatchAction(null);
        setShowEditProfile(false);
        if (mapRef.current && incident.coordinates) {
            mapRef.current.flyTo(incident.coordinates[0], incident.coordinates[1], 16);
        }
    };

    const handleCloseRightSidebar = () => {
        setIsRightSidebarOpen(false);
        setSelectedIncident(null);
        setImageError(false);
        setShowDispatchCard(false);
        setDispatchAction(null);
        setShowEditProfile(false);
        if (mapRef.current) {
            mapRef.current.updateMarkers();
        }
    };

    const handleAccept = (incident) => {
        console.log('🔵 Accept called with incident:', incident);
        const incidentData = incident || selectedIncident;
        if (!incidentData) {
            setConfirmModalData({
                title: '⚠️ Error',
                message: 'No incident selected. Please select an incident first.',
                confirmText: 'OK',
                confirmColor: 'bg-orange-500 hover:bg-orange-600',
                icon: 'error',
                onConfirm: () => { }
            });
            setShowConfirmModal(true);
            return;
        }

        const incidentId = incidentData._id || incidentData.id;
        const isActioned = actionedIncidents && actionedIncidents[incidentId];

        if (isActioned) {
            setConfirmModalData({
                title: '⚠️ Already Actioned',
                message: `You have already ${actionedIncidents[incidentId]?.action || 'actioned'} this incident.`,
                confirmText: 'OK',
                confirmColor: 'bg-yellow-500 hover:bg-yellow-600',
                icon: 'warning',
                onConfirm: () => { }
            });
            setShowConfirmModal(true);
            return;
        }

        setSelectedIncident(incidentData);
        setPendingIncident(incidentData);
        setTimeout(() => {
            setShowDispatchCard(true);
            setDispatchAction('accept');
        }, 150);
    };

    const handleDecline = (incident) => {
        console.log('🔵 Decline called with incident:', incident);
        const incidentData = incident || selectedIncident;
        if (!incidentData) {
            setConfirmModalData({
                title: '⚠️ Error',
                message: 'No incident selected. Please select an incident first.',
                confirmText: 'OK',
                confirmColor: 'bg-orange-500 hover:bg-orange-600',
                icon: 'error',
                onConfirm: () => { }
            });
            setShowConfirmModal(true);
            return;
        }

        const incidentId = incidentData._id || incidentData.id;
        const isActioned = actionedIncidents && actionedIncidents[incidentId];

        if (isActioned) {
            setConfirmModalData({
                title: '⚠️ Already Actioned',
                message: `You have already ${actionedIncidents[incidentId]?.action || 'actioned'} this incident.`,
                confirmText: 'OK',
                confirmColor: 'bg-yellow-500 hover:bg-yellow-600',
                icon: 'warning',
                onConfirm: () => { }
            });
            setShowConfirmModal(true);
            return;
        }

        setSelectedIncident(incidentData);
        setPendingIncident(incidentData);
        setTimeout(() => {
            setShowDispatchCard(true);
            setDispatchAction('decline');
        }, 150);
    };

    const handleConfirmAccept = async () => {
        const incident = pendingIncident || selectedIncident;
        if (incident) {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const volunteerName = `${user.firstName} ${user.lastName}`.trim() || 'Volunteer';

                const incidentId = incident._id || incident.id;

                const updatedActioned = {
                    ...actionedIncidents,
                    [incidentId]: {
                        action: 'accepted',
                        timestamp: new Date().toISOString(),
                        title: incident.title
                    }
                };
                setActionedIncidents(updatedActioned);
                localStorage.setItem('volunteerActionedIncidents', JSON.stringify(updatedActioned));

                const response = await fetch(`/api/incidents/${incidentId}/accept`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        volunteerId: user.id,
                        responderName: volunteerName
                    })
                });
                const data = await response.json();

                if (data.success) {
                    setConfirmModalData({
                        title: 'Success!',
                        message: `You accepted ${incident.title} (${incident.id})`,
                        confirmText: 'OK',
                        confirmColor: 'bg-green-500 hover:bg-green-600',
                        icon: 'success',
                        onConfirm: () => { }
                    });
                    setShowConfirmModal(true);

                    if (incident.coordinates) {
                        setIncidentCoords(incident.coordinates);
                        console.log('📍 Incident coords set:', incident.coordinates);
                    }
                    startLocationTracking(incidentId);
                    setOpen(false);

                    setActiveDispatch(incident);
                    setIsEnRoutePersisted(true);

                    localStorage.setItem('activeDispatchId', incidentId);
                    localStorage.setItem('isEnRoute', 'true');

                    window.dispatchEvent(new CustomEvent('dispatch-accepted', {
                        detail: {
                            incidentId: incidentId,
                            volunteerName: volunteerName,
                            message: `${volunteerName} has been dispatched to this incident`
                        }
                    }));

                    window.dispatchEvent(new CustomEvent('dispatch-notification', {
                        detail: {
                            incidentId: incidentId,
                            responderName: volunteerName,
                            message: `${volunteerName} has been dispatched to your incident`
                        }
                    }));

                    // 🔥 BROADCAST TO TRACK PAGE
                    try {
                        const channel = new BroadcastChannel('incident_updates');
                        channel.postMessage({
                            type: 'RELOAD_TRACK_PAGE', // 👈 Change this type!
                            incidentId: incidentId,
                        });
                        channel.close();
                    } catch (error) {
                        console.log('Broadcast not supported');
                    }

                    // 🔥 LocalStorage Backup (Works even if BroadcastChannel fails)
                    try {
                        localStorage.setItem('force_track_refresh', Date.now().toString());
                    } catch (error) {
                        console.log('LocalStorage not available');
                    }

                    // 🛑 REMOVED loadIncidents() - We don't need to fetch again

                    setSelectedIncident(null);
                    setPendingIncident(null);
                    handleCloseRightSidebar(); // Close the sidebar

                } else {
                    const rollback = { ...actionedIncidents };
                    delete rollback[incidentId];
                    setActionedIncidents(rollback);
                    localStorage.setItem('volunteerActionedIncidents', JSON.stringify(rollback));

                    setConfirmModalData({
                        title: '❌ Failed',
                        message: 'Failed to accept: ' + (data.message || 'Unknown error'),
                        confirmText: 'OK',
                        confirmColor: 'bg-red-500 hover:bg-red-600',
                        icon: 'error',
                        onConfirm: () => { }
                    });
                    setShowConfirmModal(true);
                }
            } catch (error) {
                const incidentId = incident._id || incident.id;
                const rollback = { ...actionedIncidents };
                delete rollback[incidentId];
                setActionedIncidents(rollback);
                localStorage.setItem('volunteerActionedIncidents', JSON.stringify(rollback));

                setConfirmModalData({
                    title: '❌ Error',
                    message: 'Failed to accept dispatch. Please try again.',
                    confirmText: 'OK',
                    confirmColor: 'bg-red-500 hover:bg-red-600',
                    icon: 'error',
                    onConfirm: () => { }
                });
                setShowConfirmModal(true);
            } finally {
                setIsLoading(false);
                setShowDispatchCard(false);
                setDispatchAction(null);
            }
        }
    };

    const handleConfirmDecline = async () => {
        const incident = pendingIncident || selectedIncident;
        if (incident) {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const incidentId = incident._id || incident.id;

                const updatedActioned = {
                    ...actionedIncidents,
                    [incidentId]: {
                        action: 'declined',
                        timestamp: new Date().toISOString(),
                        title: incident.title
                    }
                };
                setActionedIncidents(updatedActioned);
                localStorage.setItem('volunteerActionedIncidents', JSON.stringify(updatedActioned));

                const response = await fetch(`/api/incidents/${incidentId}/decline`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ volunteerId: user.id })
                });
                const data = await response.json();
                if (data.success) {
                    setConfirmModalData({
                        title: '❌ Declined',
                        message: `You declined ${incident.title} (${incident.id})`,
                        confirmText: 'OK',
                        confirmColor: 'bg-red-500 hover:bg-red-600',
                        icon: 'error',
                        onConfirm: () => { }
                    });
                    setShowConfirmModal(true);
                    loadIncidents();
                    setSelectedIncident(null);
                    setPendingIncident(null);
                    handleCloseRightSidebar();
                } else {
                    const rollback = { ...actionedIncidents };
                    delete rollback[incidentId];
                    setActionedIncidents(rollback);
                    localStorage.setItem('volunteerActionedIncidents', JSON.stringify(rollback));

                    setConfirmModalData({
                        title: '❌ Failed',
                        message: 'Failed to decline: ' + (data.message || 'Unknown error'),
                        confirmText: 'OK',
                        confirmColor: 'bg-red-500 hover:bg-red-600',
                        icon: 'error',
                        onConfirm: () => { }
                    });
                    setShowConfirmModal(true);
                }
            } catch (error) {
                const incidentId = incident._id || incident.id;
                const rollback = { ...actionedIncidents };
                delete rollback[incidentId];
                setActionedIncidents(rollback);
                localStorage.setItem('volunteerActionedIncidents', JSON.stringify(rollback));

                setConfirmModalData({
                    title: '❌ Error',
                    message: 'Failed to decline dispatch. Please try again.',
                    confirmText: 'OK',
                    confirmColor: 'bg-red-500 hover:bg-red-600',
                    icon: 'error',
                    onConfirm: () => { }
                });
                setShowConfirmModal(true);
            } finally {
                setIsLoading(false);
                setShowDispatchCard(false);
                setDispatchAction(null);
            }
        }
    };

    const handleCancelDispatch = () => {
        setShowDispatchCard(false);
        setDispatchAction(null);
    };

    const handleToggleDuty = (checked) => {
        if (!checked) {
            setShowOffDutyCard(true);
        } else {
            setIsOnDuty(true);
            setConfirmModalData({
                title: 'Back on Duty',
                message: 'You are now back on duty! You will receive new dispatch requests.',
                confirmText: 'OK',
                confirmColor: 'bg-green-500 hover:bg-green-600',
                icon: 'success',
                onConfirm: () => { }
            });
            setShowConfirmModal(true);
        }
    };

    const handleConfirmOffDuty = () => {
        setIsOnDuty(false);
        setShowOffDutyCard(false);
        setConfirmModalData({
            title: 'Off Duty',
            message: 'You are now off duty. You will not receive new dispatch requests.',
            confirmText: 'OK',
            confirmColor: 'bg-yellow-500 hover:bg-yellow-600',
            icon: 'warning',
            onConfirm: () => { }
        });
        setShowConfirmModal(true);
    };

    const handleCancelOffDuty = () => setShowOffDutyCard(false);

    const handleViewOnMap = () => {
        if (selectedIncident && mapRef.current && selectedIncident.coordinates) {
            mapRef.current.flyTo(selectedIncident.coordinates[0], selectedIncident.coordinates[1], 18);
        }
    };

    const handleEditProfile = () => {
        setShowEditProfile(true);
        setSelectedIncident(null);
        setIsRightSidebarOpen(false);
        setIsEditingLocal(true);
        setOpen(false);
    };

    const handleLogoClick = () => {
        setOpen(false);
        setShowEditProfile(false);
        setSelectedIncident(null);
        setIsRightSidebarOpen(false);
        if (mapRef.current) {
            mapRef.current.updateMarkers();
        }
    };

    const getFilteredIncidents = () => {
        return filteredIncidents;
    };

    const filteredIncidentsList = getFilteredIncidents();

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return 'bg-red-600 text-white';
            case 'High': return 'bg-orange-500 text-white';
            case 'Medium': return 'bg-yellow-500 text-white';
            default: return 'bg-blue-500 text-white';
        }
    };

    if (isLoggingOut) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[999]">
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
        <div className="min-h-screen bg-[#FAFAFF] flex flex-col">
            {/* Modals */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmModalData.onConfirm}
                title={confirmModalData.title}
                message={confirmModalData.message}
                confirmText={confirmModalData.confirmText}
                confirmColor={confirmModalData.confirmColor}
                icon={confirmModalData.icon}
            />

            <ArrivalModal
                isOpen={showArrivalModal}
                onClose={() => {
                    setShowArrivalModal(false);
                    setArrivalNotified(true);
                    setIsNotReadyMode(true);
                    localStorage.setItem('volunteerNotReadyMode', 'true');
                }}
                onSolve={handleSolveIncident}
                incident={arrivalIncident}
            />

            <DispatchRequestModal
                isOpen={showDispatchRequestModal}
                onClose={() => {
                    setShowDispatchRequestModal(false);
                    setIncomingDispatch(null);
                }}
                onAccept={handleAcceptDispatch}
                onDecline={handleDeclineDispatch}
                incident={incomingDispatch}
                isLoading={isProcessingDispatch}
            />

            {showLogoutModal && (
                <LogoutModal
                    handleCancelLogout={handleCancelLogout}
                    handleConfirmLogout={handleConfirmLogout}
                />
            )}

            {/* NAVBAR */}
            <div className="h-14 bg-[#0F5C73] flex items-center justify-between px-3 text-white fixed top-0 left-0 right-0 z-[100]">
                <div className="flex items-center gap-2">
                    <button onClick={() => setOpen(!open)} className="block lg:hidden text-xl">☰</button>
                    <button onClick={handleLogoClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                        <img src="/logo.png" className="w-8 h-8" alt="logo" />
                        <div className="hidden sm:block text-left">
                            <h1 className="font-semibold text-sm">Volunteer</h1>
                            <p className="text-[9px] opacity-70">Municipality of Santa Rosa</p>
                        </div>
                    </button>
                </div>
                <NotificationBell />
            </div>

            {/* Notification Popup */}
            {showNotificationPopup && notification && (
                <div className="fixed top-16 right-2 z-[500] max-w-xs">
                    <div className={`rounded-lg shadow-lg p-3 ${notification.type === 'response_assignment' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
                        <div className="flex items-start gap-2">
                            <div className="text-xl">{notification.type === 'response_assignment' ? '🚨' : '📢'}</div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-xs">{notification.title || 'New Notification'}</h4>
                                <p className="text-[10px] opacity-90 mt-1">{notification.message}</p>
                            </div>
                            <button onClick={() => setShowNotificationPopup(false)} className="text-white opacity-75">✕</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Incident Detail Modal - Mobile ONLY */}
            {(selectedIncident || isModalClosing) && (
                <IncidentDetailModal
                    incident={selectedIncident}
                    isOpen={!!selectedIncident}
                    isClosing={isModalClosing}
                    onClose={() => {
                        setIsModalClosing(true);
                        setTimeout(() => {
                            setSelectedIncident(null);
                            setIsModalClosing(false);
                        }, 350);
                    }}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    isOnDuty={isOnDuty}
                    isLoading={isLoading}
                    getPriorityColor={getPriorityColor}
                    actionedIncidents={actionedIncidents}
                    isNotReadyMode={isNotReadyMode}
                    onResolve={handleResolveFromButton}
                />
            )}

            {/* BODY */}
            <div className="flex flex-1 mt-14 relative overflow-hidden">
                {open && (
                    <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />
                )}

                {/* LEFT SIDEBAR */}
                <div className={`fixed lg:static top-14 left-0 h-[calc(100vh-56px)] w-64 lg:w-[280px] bg-[#F5F4FF] flex flex-col z-[60] transform transition-all duration-300 ease-in-out ${open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"} lg:translate-x-0 lg:opacity-100 border-r border-gray-200 shadow-lg lg:shadow-none`}>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 min-h-0">
                        {/* Profile Section */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 rounded-full border-2 border-blue-500 overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500">{getUserRole()}</p>
                                <p className="text-xs font-medium text-gray-700">{userName || "Volunteer"}</p>
                            </div>
                        </div>

                        {/* Duty Toggle */}
                        <div className="bg-[#E9F5FE] rounded-lg p-2 mb-2">
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${isOnDuty ? 'text-[#157A3B]' : 'text-gray-400'}`}>
                                    {isOnDuty ? 'On Duty' : 'Off Duty'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isOnDuty} onChange={(e) => handleToggleDuty(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        </div>

                        <button onClick={handleEditProfile} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 mb-2 border border-blue-200">
                            <Icon icon="material-symbols:edit" className="w-3 h-3" /> Edit Profile
                        </button>

                        {/* Search */}
                        <div className="relative mb-2">
                            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-7 pr-2 py-1.5 border border-[#D3D2DE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                            <Icon icon="material-symbols:search" className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#5D7285] w-3 h-3" />
                        </div>

                        {/* Filters */}
                        <IncidentFilters
                            filterType={filterType}
                            setFilterType={setFilterType}
                            incidents={incidents}
                        />

                        {/* Incident List */}
                        <div className="space-y-3">
                            {filteredIncidentsList.length === 0 ? (
                                <div className="text-center py-6 text-gray-500">
                                    <Icon icon="material-symbols:search-off" className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                                    <p className="text-xs">No incidents</p>
                                </div>
                            ) : (
                                filteredIncidentsList.map((incident) => {
                                    const statusColors = {
                                        'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                        'dispatched': 'bg-blue-100 text-blue-800 border-blue-200',
                                        'active': 'bg-red-100 text-red-800 border-red-200',
                                        'en route': 'bg-indigo-100 text-indigo-800 border-indigo-200',
                                        'on scene': 'bg-purple-100 text-purple-800 border-purple-200',
                                        'resolved': 'bg-green-100 text-green-800 border-green-200',
                                        'accepted': 'bg-green-100 text-green-800 border-green-200'
                                    };
                                    const statusColor = statusColors[incident.status] || 'bg-gray-100 text-gray-800 border-gray-200';
                                    const statusDisplay = incident.status?.charAt(0).toUpperCase() + incident.status?.slice(1) || 'Pending';

                                    return (
                                        <div key={incident.id} className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer ${selectedIncident?.id === incident.id ? 'ring-2 ring-blue-500' : ''} ${actionedIncidents[incident.id || incident._id] ? 'opacity-60' : ''}`} onClick={() => handleIncidentClick(incident)}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex flex-col gap-0.5 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>{statusDisplay}</span>
                                                        <span className="text-xs text-gray-400 font-medium">{incident.id}</span>
                                                    </div>
                                                    <h4 className="font-semibold text-gray-800 text-sm mt-1">{incident.title}</h4>
                                                    <p className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5">
                                                        <Icon icon="mdi:circle" className="w-1.5 h-1.5 text-gray-400" />
                                                        {incident.shortLocation || incident.location}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                                                        <Icon icon="mdi:calendar-outline" className="w-3 h-3" />
                                                        {incident.date}
                                                    </p>
                                                </div>
                                                <Icon icon="mdi:chevron-right" className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="h-4"></div>
                    </div>

                    {/* Logout Button */}
                    <div className="flex-shrink-0 p-2 border-t border-gray-200 bg-[#F5F4FF] sticky bottom-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                        <button onClick={handleLogoutClick} className="w-4/5 text-gray-500 text-xs hover:text-red-600 flex items-center relative left-4 gap-1 py-2.5 transition-colors rounded-lg hover:bg-red-50">
                            <Icon icon="material-symbols:logout" className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 bg-[#EEF2F6] overflow-hidden p-2 md:p-3 lg:p-4">
                    {showDispatchCard && (
                        <DispatchCard
                            dispatchAction={dispatchAction}
                            pendingIncident={pendingIncident}
                            selectedIncident={selectedIncident}
                            actionedIncidents={actionedIncidents}
                            isLoading={isLoading}
                            handleCancelDispatch={handleCancelDispatch}
                            handleConfirmAccept={handleConfirmAccept}
                            handleConfirmDecline={handleConfirmDecline}
                            setConfirmModalData={setConfirmModalData}
                            setShowConfirmModal={setShowConfirmModal}
                        />
                    )}
                    {showOffDutyCard && (
                        <OffDutyCard
                            handleCancelOffDuty={handleCancelOffDuty}
                            handleConfirmOffDuty={handleConfirmOffDuty}
                        />
                    )}

                    <div className="relative h-full overflow-hidden">
                        {/* Edit Profile View */}
                        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${showEditProfile ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-8 -z-10'}`}>
                            <div className="h-full overflow-y-auto">
                                <EditProfileForm />
                            </div>
                        </div>

                        {/* Main Dashboard View */}
                        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${showEditProfile ? 'opacity-0 -translate-x-8 -z-10' : 'opacity-100 translate-x-0 z-10'}`}>
                            <div className="flex flex-col h-full min-h-0">
                                <StatsCards stats={stats} />

                                <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-2">
                                    {/* Map Component */}
                                    <MapComponent
                                        ref={mapRef}
                                        incidents={incidents}
                                        selectedIncident={selectedIncident}
                                        mapView={mapView}
                                        setMapView={setMapView}
                                        onIncidentClick={handleIncidentClick}
                                        isEnRoute={isEnRoute}
                                        distanceToIncident={distanceToIncident}
                                        timeToIncident={timeToIncident}
                                        onStopTracking={stopLocationTracking}
                                    />

                                    {/* Incident Details Sidebar - Desktop */}
                                    <div className="hidden lg:block lg:w-80 xl:w-96 flex-shrink-0">
                                        <div className="bg-white rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                                            {selectedIncident ? (
                                                <>
                                                    <div className="sticky top-0 bg-white z-20 px-3 py-2 border-b rounded-t-lg flex-shrink-0 flex items-center justify-between">
                                                        <h2 className="font-semibold text-[#262D31] text-sm">Incident Details</h2>
                                                        <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                                        <div className="bg-[#F5F4FF] p-3 rounded">
                                                            <h1 className="font-bold text-base text-[#262D31]">{selectedIncident.title}</h1>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                <span className={`text-[10px] px-2 py-0.5 rounded ${getPriorityColor(selectedIncident.priority)}`}>{selectedIncident.priority}</span>
                                                                {selectedIncident.badge && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${selectedIncident.badgeColor}`}>{selectedIncident.badge}</span>}
                                                            </div>
                                                            <p className="text-[10px] text-gray-500">ID: {selectedIncident.id}</p>
                                                        </div>

                                                        {selectedIncident.image && (
                                                            <div className="border-t border-[#DFDFF0]">
                                                                <div className="bg-[#EBEDFA] px-3 py-1 font-medium text-[#656363] text-xs">📸 Incident Photo</div>
                                                                <div className="px-3 py-2">
                                                                    <img src={selectedIncident.image} alt={selectedIncident.title} className="w-full rounded-lg object-cover max-h-[200px] border border-gray-200" onError={(e) => { e.target.style.display = 'none'; }} />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="border-t border-[#DFDFF0]">
                                                            <div className="bg-[#EBEDFA] px-3 py-1 font-medium text-[#656363] text-xs">📍 Location</div>
                                                            <div className="px-3 py-2">
                                                                <p className="text-sm text-gray-700">{selectedIncident.location}</p>
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-[#DFDFF0]">
                                                            <div className="bg-[#EBEDFA] px-3 py-1 font-medium text-[#656363] text-xs">👤 Reporter</div>
                                                            <div className="px-3 py-2">
                                                                <p className="text-sm text-gray-700">{selectedIncident.reporter}</p>
                                                                <p className="text-xs text-gray-500">{selectedIncident.reporterPhone}</p>
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-[#DFDFF0]">
                                                            <div className="bg-[#EBEDFA] px-3 py-1 font-medium text-[#656363] text-xs">📝 Description</div>
                                                            <p className="px-3 py-2 text-sm text-gray-600">{selectedIncident.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="sticky bottom-0 bg-white z-20 p-3 border-t space-y-1.5 rounded-b-lg flex-shrink-0">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleAccept(selectedIncident)}
                                                                disabled={isLoading || selectedIncident.status === 'accepted' || selectedIncident.status === 'resolved' || !isOnDuty || actionedIncidents[selectedIncident.id || selectedIncident._id]}
                                                                className={`flex-1 py-1.5 rounded text-sm flex items-center justify-center gap-1 transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-95 ${selectedIncident.status === 'accepted' || selectedIncident.status === 'resolved' || !isOnDuty || actionedIncidents[selectedIncident.id || selectedIncident._id] ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                                            >
                                                                {isLoading ? (
                                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                ) : (
                                                                    <><Icon icon="material-symbols:check" className="w-3 h-3" /> Accept</>
                                                                )}
                                                            </button>

                                                            {isNotReadyMode && (
                                                                <button
                                                                    onClick={handleSolveIncident}
                                                                    disabled={isLoading}
                                                                    className="flex-1 py-1.5 rounded text-sm flex items-center justify-center gap-1 transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-95 bg-blue-600 text-white hover:bg-blue-700"
                                                                >
                                                                    {isLoading ? (
                                                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                    ) : (
                                                                        <><Icon icon="material-symbols:flag" className="w-3 h-3" /> Resolve?</>
                                                                    )}
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleDecline(selectedIncident)}
                                                                disabled={isLoading || selectedIncident.status === 'accepted' || selectedIncident.status === 'resolved' || !isOnDuty || actionedIncidents[selectedIncident.id || selectedIncident._id]}
                                                                className={`flex-1 py-1.5 rounded text-sm flex items-center justify-center gap-1 transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-95 ${selectedIncident.status === 'accepted' || selectedIncident.status === 'resolved' || !isOnDuty || actionedIncidents[selectedIncident.id || selectedIncident._id] ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                                            >
                                                                {isLoading ? (
                                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                ) : (
                                                                    <><Icon icon="material-symbols:close" className="w-3 h-3" /> Decline</>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                                                    <Icon icon="material-symbols:location-off" className="w-14 h-14 text-gray-300 mx-auto mb-2" />
                                                    <h3 className="text-sm font-semibold text-gray-700">No Incident Selected</h3>
                                                    <p className="text-xs text-gray-500">Click an incident to view details</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}