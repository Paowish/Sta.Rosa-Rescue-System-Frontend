// src/pages/rescueTeam/IncidentDetails.jsx
import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import LoadingModal from "./LoadingModal";
import SuccessModal from "./SuccessModal";
import DispatchModal from "./DispatchModal";
import PoliceModal from "./PoliceModal";
import FireModal from "./FireModal";
import IncidentHeader from "./IncidentHeader";
import LocationSection from "./LocationSection";
import ReporterSection from "./ReporterSection";
import DescriptionSection from "./DescriptionSection";
import TimelineSection from "./TimelineSection";
import { useNavigate } from 'react-router-dom';

export default function IncidentDetails({ data, onClose, onDispatch, onResolve, onViewReport }) {
    const [imageError, setImageError] = useState(false);
    const [volunteers, setVolunteers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [dispatchNotes, setDispatchNotes] = useState("");
    const [isDispatching, setIsDispatching] = useState(false);

    // Modal States
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [showPoliceModal, setShowPoliceModal] = useState(false);
    const [showFireModal, setShowFireModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [loadingVolunteers, setLoadingVolunteers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState('volunteers');
    const navigate = useNavigate();

    // Success Data
    const [successData, setSuccessData] = useState(null);

    // Animation
    const [isVisible, setIsVisible] = useState(false);

    // Store incident data in ref
    const incidentDataRef = useRef(data);
    const persistentStatusRef = useRef(null);

    // Add local status to update immediately after actions
    const [localStatus, setLocalStatus] = useState(data?.status || "Pending");

    // ✅ 1. Generate a unique Session Key for this specific Incident ID
    const getSessionLockKey = () => {
        const id = getIncidentId();
        return id !== "N/A" ? `incident_lock_${id}` : null;
    };

    // Update ref and local status when data changes
    useEffect(() => {
        incidentDataRef.current = data;
        if (data) {
            const sessionKey = getSessionLockKey();
            const savedLock = sessionKey ? sessionStorage.getItem(sessionKey) : null;
            const apiStatus = data.status || "Pending";

            // ✅ PRIORITY CHECK: Server says Resolved? 
            // Ignore the lock and clear it permanently!
            if (apiStatus === "Resolved" || apiStatus === "Solved") {
                if (sessionKey) sessionStorage.removeItem(sessionKey);
                persistentStatusRef.current = null;
                setLocalStatus(apiStatus);
            }
            // Otherwise, use the saved session lock if it exists
            else if (savedLock && savedLock === "Dispatched") {
                persistentStatusRef.current = "Dispatched";
                setLocalStatus("Dispatched");
            } else {
                // Fallback to API data
                persistentStatusRef.current = null;
                setLocalStatus(apiStatus);
            }
        }
    }, [data]);

    // Entrance animation
    useEffect(() => {
        if (data) {
            setIsVisible(false);
            const timer = setTimeout(() => setIsVisible(true), 50);
            return () => clearTimeout(timer);
        }
    }, [data]);

    // Load volunteers
    useEffect(() => {
        loadAvailableVolunteers();
    }, []);

    // ✅ 3. Prefer the permanent lock, then localStatus, then API data
    const finalStatus = persistentStatusRef.current || localStatus || data?.status || "Pending";
    const isResolved = finalStatus === "Resolved" || finalStatus === "Solved" || finalStatus === "resolved" || finalStatus === "solved";
    const isDispatched = finalStatus === "Dispatched" || finalStatus === "dispatched";
    const isActionLocked = isResolved || isDispatched;

    // ===== Helper Functions =====
    const getIncidentId = () => {
        const incident = incidentDataRef.current || data;
        return incident.incidentId || incident.id || incident._id || "N/A";
    };

    const getValue = (value, defaultValue = "N/A") => {
        return value && value !== "" && value !== null ? value : defaultValue;
    };

    const getReporterName = () => {
        const incident = incidentDataRef.current || data;
        return getValue(incident.reporterName || incident.reporter?.name || incident.reporter, "Anonymous");
    };

    const getReporterContact = () => {
        const incident = incidentDataRef.current || data;
        return getValue(incident.reporterContact || incident.reporterNumber || incident.reporter?.contact || incident.contact);
    };

    const getImageUrl = () => {
        const incident = incidentDataRef.current || data;
        return incident.image || incident.photo || incident.images?.[0]?.url || null;
    };

    const getCoordinates = () => {
        const incident = incidentDataRef.current || data;
        if (incident.coordinates && incident.coordinates !== "Coordinates not available") {
            return incident.coordinates;
        }
        if (incident.location?.coordinates) {
            const lat = incident.location.coordinates.latitude || incident.location.coordinates.lat;
            const lng = incident.location.coordinates.longitude || incident.location.coordinates.lng;
            if (lat && lng) return `${lat}, ${lng}`;
        }
        return "Coordinates not available";
    };

    const getAddress = () => {
        const incident = incidentDataRef.current || data;
        return incident.address || incident.location?.address || "Unknown address";
    };

    const getTitle = () => {
        const incident = incidentDataRef.current || data;
        return incident.title || incident.type || "Untitled Incident";
    };

    const getStatusInfo = () => {
        const status = finalStatus || "Pending";
        const colorMap = {
            'Critical': 'bg-red-100 text-red-600',
            'Active': 'bg-red-100 text-red-600',
            'Dispatched': 'bg-purple-100 text-purple-600',
            'Pending': 'bg-blue-100 text-blue-600',
            'Solved': 'bg-green-100 text-green-600',
            'Resolved': 'bg-green-100 text-green-600',
            'On Scene': 'bg-yellow-100 text-yellow-600',
        };
        return {
            display: status,
            color: colorMap[status] || 'bg-orange-100 text-orange-600'
        };
    };

    const getTimeline = () => {
        const incident = incidentDataRef.current || data;
        if (incident.timeline?.length > 0) return incident.timeline;
        if (incident.reportedAt) {
            return [`Reported: ${new Date(incident.reportedAt).toLocaleString()}`];
        }
        if (incident.createdAt) {
            return [`Created: ${new Date(incident.createdAt).toLocaleString()}`];
        }
        return [];
    };

    // ===== Load Volunteers =====
    const loadAvailableVolunteers = async () => {
        setLoadingVolunteers(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/volunteers/available', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setVolunteers(result.data);
            }
        } catch (error) {
            console.error('Failed to load volunteers:', error);
        } finally {
            setLoadingVolunteers(false);
        }
    };

    // ===== Handlers =====
    const handleVolunteerToggle = (volunteerId) => {
        setSelectedIds(prev =>
            prev.includes(volunteerId) ? prev.filter(id => id !== volunteerId) : [...prev, volunteerId]
        );
    };

    const handleRemoveSelected = (volunteerId) => {
        setSelectedIds(prev => prev.filter(id => id !== volunteerId));
    };

    const handleDispatch = async () => {
        const incident = incidentDataRef.current || data;

        if (isActionLocked) {
            alert('This incident is already resolved or dispatched.');
            return;
        }

        if (selectedIds.length === 0) {
            alert('Please select at least one volunteer to dispatch');
            return;
        }

        setShowDispatchModal(false);
        setShowLoadingModal(true);
        setIsDispatching(true);

        try {
            // ✅ Get API URL dynamically
            const getApiUrl = () => {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    return 'http://localhost:5000/api';
                }
                return '/api';
            };

            const token = localStorage.getItem('token');
            const apiUrl = getApiUrl();

            console.log('📡 Dispatching to:', `${apiUrl}/incidents/${incident._id || incident.id}/dispatch`);
            console.log('📡 Selected IDs:', selectedIds);

            const response = await fetch(`${apiUrl}/incidents/${incident._id || incident.id}/dispatch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    volunteerIds: selectedIds,
                    dispatchNotes: dispatchNotes || `Dispatch for ${getTitle()} at ${getAddress()}`
                })
            });

            const result = await response.json();
            console.log('📡 Dispatch result:', result);

            setShowLoadingModal(false);
            setIsDispatching(false);

            if (result.success) {
                // ✅ Save the lock to Session Storage
                const sessionKey = getSessionLockKey();
                if (sessionKey) {
                    sessionStorage.setItem(sessionKey, "Dispatched");
                }

                persistentStatusRef.current = "Dispatched";
                setLocalStatus("Dispatched");

                const dispatchedVolunteers = volunteers.filter(v => selectedIds.includes(v._id));
                setSuccessData({
                    incidentId: getIncidentId(),
                    title: getTitle(),
                    address: getAddress(),
                    volunteersDispatched: result.data.volunteersDispatched || selectedIds.length,
                    volunteers: dispatchedVolunteers,
                    message: result.message || `Incident successfully dispatched to ${selectedIds.length} volunteer(s)!`,
                    isError: false
                });
                setShowSuccessModal(true);
                setSelectedIds([]);
                setDispatchNotes("");
                if (onDispatch) onDispatch(result.data);
            } else {
                setSuccessData({
                    incidentId: getIncidentId(),
                    title: getTitle(),
                    address: getAddress(),
                    volunteersDispatched: 0,
                    volunteers: [],
                    message: result.message || 'Failed to dispatch. Please try again.',
                    isError: true
                });
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error('❌ Dispatch error:', error);
            setShowLoadingModal(false);
            setIsDispatching(false);
            setSuccessData({
                incidentId: getIncidentId(),
                title: getTitle(),
                address: getAddress(),
                volunteersDispatched: 0,
                volunteers: [],
                message: error.message || 'Network error. Please try again.',
                isError: true
            });
            setShowSuccessModal(true);
        }
    };

    const handleReferToPolice = async () => {
        const incident = incidentDataRef.current || data;
        if (isActionLocked) {
            alert('This incident is already resolved or dispatched.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/incidents/${incident._id || incident.id}/refer-police`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ incidentData: incident })
            });
            setShowPoliceModal(false);
            alert("✅ Incident successfully referred to the Police Department.");
        } catch (error) {
            console.error('Referral error:', error);
            alert('Failed to refer to police. Please try again.');
        }
    };

    const handleReferToFire = async () => {
        const incident = incidentDataRef.current || data;
        if (isActionLocked) {
            alert('This incident is already resolved or dispatched.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/incidents/${incident._id || incident.id}/refer-fire`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ incidentData: incident })
            });
            setShowFireModal(false);
            alert("✅ Incident successfully referred to the Fire Department.");
        } catch (error) {
            console.error('Referral error:', error);
            alert('Failed to refer to fire department. Please try again.');
        }
    };

    const handleResolve = async () => {
        const incident = incidentDataRef.current || data;

        // ✅ Check if dispatched - if not, show warning
        if (!isDispatched) {
            alert('⚠️ This incident must be dispatched before it can be resolved.');
            return;
        }

        if (isActionLocked) {
            alert('This incident is already resolved or dispatched.');
            return;
        }

        if (window.confirm(`Are you sure you want to mark this incident as Resolved?`)) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/incidents/${incident._id || incident.id}/resolve`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ resolutionNotes: 'Incident resolved by responder.' })
                });
                const result = await response.json();
                if (result.success) {
                    // ✅ Clear the session lock
                    const sessionKey = getSessionLockKey();
                    if (sessionKey) {
                        sessionStorage.removeItem(sessionKey);
                    }

                    persistentStatusRef.current = null;
                    setLocalStatus("Resolved");

                    if (onResolve) onResolve(result.data);

                    // ✅ Wait a tiny bit before closing to let the UI breathe
                    setTimeout(() => {
                        if (onClose) onClose();
                    }, 300);
                } else {
                    alert('Failed to resolve: ' + result.message);
                }
            } catch (error) {
                console.error('Resolve error:', error);
                alert('Error resolving incident. Please try again.');
            }
        }
    };

    // ✅ FIXED: handleViewReport with better error handling and debugging
    const handleViewReport = () => {
        const incident = incidentDataRef.current || data;
        const incidentId = incident._id || incident.id || incident.incidentId;

        console.log('🔍 View Report clicked');
        console.log('📋 Incident data:', incident);
        console.log('📋 Incident ID:', incidentId);

        // ✅ Check if user is authenticated
        const token = localStorage.getItem('token');
        console.log('🔑 Token exists:', !!token);

        if (!token) {
            alert('Please log in to view the report.');
            navigate('/login');
            return;
        }

        if (incidentId && incidentId !== "N/A") {
            // Close the details panel first
            if (onClose) onClose();

            // ✅ Navigate to the incidents page with view parameter
            const targetPath = `/incidents?view=${incidentId}`;
            console.log('🚀 Navigating to:', targetPath);
            navigate(targetPath);
        } else {
            console.error("No incident ID found");
            alert("Cannot view report: Incident ID not found");
        }
    };

    // ✅ Just closes the modal
    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        setSuccessData(null);
    };

    const imageUrl = getImageUrl();
    const hasImage = imageUrl && imageUrl !== "" && imageUrl !== null;
    const defaultImage = "https://www.kraftlaw.com/wp-content/uploads/2021/10/common-injuries-car-accidents.jpg";
    const imageSrc = (!imageError && hasImage) ? imageUrl : defaultImage;

    const statusInfo = getStatusInfo();
    const timeline = getTimeline();

    if (!data) {
        return (
            <div className="h-full flex flex-col bg-white">
                <div className="sticky top-0 bg-white z-10 p-4 border-b relative">
                    <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 text-xl hover:text-gray-600">
                        ✕
                    </button>
                    <h2 className="font-semibold text-[#262D31]">Incident Details</h2>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">No incident selected</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`h-full flex flex-col bg-white transition-all duration-400 ease-out transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
            style={{
                transitionProperty: 'opacity, transform',
                transitionDuration: '400ms',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            {/* Modals */}
            <LoadingModal isOpen={showLoadingModal} />
            <SuccessModal isOpen={showSuccessModal} data={successData} onClose={handleCloseSuccessModal} />
            <DispatchModal
                isOpen={showDispatchModal}
                onClose={() => setShowDispatchModal(false)}
                onDispatch={handleDispatch}
                title={getTitle()}
                incidentId={getIncidentId()}
                volunteers={volunteers}
                loadingVolunteers={loadingVolunteers}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                isDispatching={isDispatching}
                isResolved={isResolved}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleVolunteerToggle={handleVolunteerToggle}
                handleRemoveSelected={handleRemoveSelected}
            />
            <PoliceModal
                isOpen={showPoliceModal}
                onClose={() => setShowPoliceModal(false)}
                onRefer={handleReferToPolice}
                address={getAddress()}
                description={data.description}
                incidentId={getIncidentId()}
            />
            <FireModal
                isOpen={showFireModal}
                onClose={() => setShowFireModal(false)}
                onRefer={handleReferToFire}
                address={getAddress()}
                description={data.description}
                incidentId={getIncidentId()}
            />

            {/* Header */}
            <div className="sticky top-0 bg-white z-10 p-4 border-b relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 text-xl hover:text-gray-600 transition-transform duration-200 hover:scale-110"
                >
                    ✕
                </button>
                <h2 className="font-semibold text-[#262D31]">Incident Details</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <IncidentHeader
                    title={getTitle()}
                    statusDisplay={statusInfo.display}
                    statusColor={statusInfo.color}
                    isResolved={isResolved}
                    incidentId={getIncidentId()}
                />

                <LocationSection address={getAddress()} coordinates={getCoordinates()} />
                <ReporterSection name={getReporterName()} contact={getReporterContact()} />
                <DescriptionSection
                    description={data.description}
                    imageSrc={imageSrc}
                    hasImage={hasImage}
                    onImageError={() => setImageError(true)}
                />
                <TimelineSection timeline={timeline} />
            </div>

            {/* =========================================== */}
            {/* ✅ UPDATED ACTIONS FOOTER WITH DISPATCH LOCK */}
            {/* =========================================== */}
            <div className="sticky bottom-0 bg-white z-10 p-3 border-t space-y-2">
                {isActionLocked ? (
                    <div className="rounded-lg p-3 text-center border bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-center gap-2">
                            {isResolved ? (
                                <>
                                    <Icon icon="material-symbols:check-circle" className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700 font-semibold">This incident has been resolved</span>
                                </>
                            ) : (
                                <>
                                    <Icon icon="material-symbols:sync" className="w-5 h-5 text-blue-600 animate-spin" />
                                    <span className="text-blue-700 font-semibold">Incident is currently dispatched to volunteers</span>
                                </>
                            )}
                        </div>
                        <p className="text-xs mt-1 text-gray-600">
                            {isResolved
                                ? "No further actions are available."
                                : "Actions are disabled while volunteers are en route."
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => setShowDispatchModal(true)}
                            className="w-full py-2 rounded text-sm flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                        >
                            <Icon icon="material-symbols:send" className="w-5 h-5" />
                            Dispatch
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPoliceModal(true)}
                                className="flex-1 py-2 rounded text-sm flex items-center justify-center gap-1 border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                            >
                                <Icon icon="material-symbols:shield" width="16" />
                                Refer to Police
                            </button>
                            <button
                                onClick={() => setShowFireModal(true)}
                                className="flex-1 py-2 rounded text-sm flex items-center justify-center gap-1 border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                            >
                                <Icon icon="material-symbols:local-fire-department" width="16" />
                                Refer to Fire Dept
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleResolve}
                                disabled={!isDispatched}  // ✅ Disabled until dispatched
                                className={`flex-1 py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors duration-200 ${isDispatched
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <Icon icon="material-symbols:check-circle" width="16" />
                                Resolve
                            </button>
                            <button
                                onClick={handleViewReport}
                                className="flex-1 py-2 rounded text-sm flex items-center justify-center gap-1 bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
                            >
                                <Icon icon="material-symbols:description" width="16" />
                                View Report
                            </button>
                        </div>

                    </>
                )}
            </div>
        </div>
    );
}