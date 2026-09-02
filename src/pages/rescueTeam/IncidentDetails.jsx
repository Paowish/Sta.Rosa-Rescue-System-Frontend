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

/**
 * Incident Details Component
 * Displays detailed incident information with dispatch and referral actions
 */
export default function IncidentDetails({ data, onClose, onDispatch, onResolve, onViewReport }) {
    const navigate = useNavigate();

    // State for image handling
    const [imageError, setImageError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // State for dispatch
    const [volunteers, setVolunteers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [dispatchNotes, setDispatchNotes] = useState("");
    const [isDispatching, setIsDispatching] = useState(false);
    const [loadingVolunteers, setLoadingVolunteers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [showPoliceModal, setShowPoliceModal] = useState(false);
    const [showFireModal, setShowFireModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [successData, setSuccessData] = useState(null);

    // Local state for status tracking
    const [localStatus, setLocalStatus] = useState(data?.status || "Pending");
    const [dispatchedTeamName, setDispatchedTeamName] = useState("");

    // Refs for persistent data
    const incidentDataRef = useRef(data);
    const persistentStatusRef = useRef(null);

    // Entrance animation
    const [isVisible, setIsVisible] = useState(false);

    /**
     * Get session lock key for this incident
     */
    const getSessionLockKey = () => {
        const id = getIncidentId();
        return id !== "N/A" ? `incident_lock_${id}` : null;
    };

    /**
     * Update local status when data changes
     */
    useEffect(() => {
        incidentDataRef.current = data;
        if (data) {
            const sessionKey = getSessionLockKey();
            const savedLock = sessionKey ? sessionStorage.getItem(sessionKey) : null;
            const apiStatus = data.status || "Pending";

            if (apiStatus === "Resolved" || apiStatus === "Solved") {
                if (sessionKey) sessionStorage.removeItem(sessionKey);
                persistentStatusRef.current = null;
                setLocalStatus(apiStatus);
            } else if (savedLock && savedLock === "Dispatched") {
                persistentStatusRef.current = "Dispatched";
                setLocalStatus("Dispatched");
            } else {
                persistentStatusRef.current = null;
                setLocalStatus(apiStatus);
            }
        }
    }, [data]);

    /**
     * Entrance animation
     */
    useEffect(() => {
        if (data) {
            setIsVisible(false);
            const timer = setTimeout(() => setIsVisible(true), 50);
            return () => clearTimeout(timer);
        }
    }, [data]);

    /**
     * Load available volunteers on mount
     */
    useEffect(() => {
        loadAvailableVolunteers();
    }, []);

    // Derived state
    const finalStatus = persistentStatusRef.current || localStatus || data?.status || "Pending";
    const isResolved = ["Resolved", "Solved", "resolved", "solved"].includes(finalStatus);
    const isDispatched = ["Dispatched", "dispatched"].includes(finalStatus);
    const isActionLocked = isResolved || isDispatched;

    /**
     * Get incident ID from data
     */
    const getIncidentId = () => {
        const incident = incidentDataRef.current || data;
        return incident.incidentId || incident.id || incident._id || "N/A";
    };

    /**
     * Get value with fallback
     */
    const getValue = (value, defaultValue = "N/A") => {
        return value && value !== "" && value !== null ? value : defaultValue;
    };

    /**
     * Get reporter name
     */
    const getReporterName = () => {
        const incident = incidentDataRef.current || data;
        return getValue(incident.reporterName || incident.reporter?.name || incident.reporter, "Anonymous");
    };

    /**
     * Get reporter contact
     */
    const getReporterContact = () => {
        const incident = incidentDataRef.current || data;
        return getValue(incident.reporterContact || incident.reporterNumber || incident.reporter?.contact || incident.contact);
    };

    /**
     * Get image URL
     */
    const getImageUrl = () => {
        const incident = incidentDataRef.current || data;
        return incident.image || incident.photo || incident.images?.[0]?.url || null;
    };

    /**
     * Get coordinates
     */
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

    /**
     * Get address
     */
    const getAddress = () => {
        const incident = incidentDataRef.current || data;
        return incident.address || incident.location?.address || "Unknown address";
    };

    /**
     * Get incident title
     */
    const getTitle = () => {
        const incident = incidentDataRef.current || data;
        return incident.title || incident.type || "Untitled Incident";
    };

    /**
     * Get status display info
     */
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

    /**
     * Get timeline data
     */
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

    /**
     * Load available volunteers from API
     */
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

    /**
     * Toggle volunteer selection
     */
    const handleVolunteerToggle = (volunteerId) => {
        setSelectedIds(prev =>
            prev.includes(volunteerId) ? prev.filter(id => id !== volunteerId) : [...prev, volunteerId]
        );
    };

    /**
     * Remove volunteer from selection
     */
    const handleRemoveSelected = (volunteerId) => {
        setSelectedIds(prev => prev.filter(id => id !== volunteerId));
    };

    /**
     * Handle dispatch action
     */
    const handleDispatch = async (dispatchInfo) => {
        const incident = incidentDataRef.current || data;

        if (isActionLocked) {
            alert('This incident is already resolved or dispatched.');
            return;
        }

        if (selectedIds.length === 0) {
            alert('Please select at least one volunteer to dispatch');
            return;
        }

        // Close dispatch modal and clear selections
        setShowDispatchModal(false);
        setSelectedIds([]);

        // Show loading
        setShowLoadingModal(true);
        setIsDispatching(true);

        try {
            const token = localStorage.getItem('token');
            const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000/api'
                : 'https://sta-rosa-rescue-system-backend.onrender.com/api';

            const idsToDispatch = [...selectedIds];

            const response = await fetch(`${apiUrl}/incidents/${incident._id || incident.id}/dispatch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    volunteerIds: idsToDispatch,
                    dispatchNotes: dispatchNotes || `Dispatch for ${getTitle()} at ${getAddress()}`
                })
            });

            const result = await response.json();

            // Hide loading
            setShowLoadingModal(false);
            setIsDispatching(false);

            if (result.success) {
                const sessionKey = getSessionLockKey();
                if (sessionKey) {
                    sessionStorage.setItem(sessionKey, "Dispatched");
                }

                persistentStatusRef.current = "Dispatched";
                setLocalStatus("Dispatched");

                // Save team name if team dispatch
                if (dispatchInfo?.type === 'team') {
                    setDispatchedTeamName(dispatchInfo.teamName || 'Team');
                } else {
                    setDispatchedTeamName("");
                }

                const dispatchedVolunteers = volunteers.filter(v => selectedIds.includes(v._id));

                // Show success modal
                setSuccessData({
                    incidentId: getIncidentId(),
                    title: getTitle(),
                    address: getAddress(),
                    count: dispatchInfo?.count || result.data.volunteersDispatched || selectedIds.length,
                    isTeam: dispatchInfo?.type === 'team',
                    teamName: dispatchInfo?.teamName || '',
                    volunteersDispatched: result.data.volunteersDispatched || selectedIds.length,
                    volunteers: dispatchedVolunteers,
                    message: result.message || `Incident successfully dispatched to ${selectedIds.length} responder(s)!`,
                    isError: false
                });
                setShowSuccessModal(true);

                // Clean up
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

    /**
     * Handle referral to Police
     */
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

    /**
     * Handle referral to Fire Department
     */
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

    /**
     * Handle resolve action
     */
    const handleResolve = async () => {
        const incident = incidentDataRef.current || data;

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
                    const sessionKey = getSessionLockKey();
                    if (sessionKey) {
                        sessionStorage.removeItem(sessionKey);
                    }

                    persistentStatusRef.current = null;
                    setLocalStatus("Resolved");

                    if (onResolve) onResolve(result.data);

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

    /**
     * Handle view report action
     */
    const handleViewReport = () => {
        const incident = incidentDataRef.current || data;
        const incidentId = incident._id || incident.id || incident.incidentId;

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to view the report.');
            navigate('/login');
            return;
        }

        if (incidentId && incidentId !== "N/A") {
            if (onClose) onClose();
            const targetPath = `/incidents?view=${incidentId}`;
            navigate(targetPath);
        } else {
            alert("Cannot view report: Incident ID not found");
        }
    };

    /**
     * Close success modal
     */
    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        setSuccessData(null);
    };

    // Image handling
    const imageUrl = getImageUrl();
    const hasImage = imageUrl && imageUrl !== "" && imageUrl !== null;
    const defaultImage = "https://www.kraftlaw.com/wp-content/uploads/2021/10/common-injuries-car-accidents.jpg";
    const imageSrc = (!imageError && hasImage) ? imageUrl : defaultImage;

    const statusInfo = getStatusInfo();
    const timeline = getTimeline();

    // Render empty state
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
        <div className="fixed top-0 right-0 h-screen w-[400px] bg-white shadow-2xl flex flex-col z-[999] border-l border-gray-200">
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

            {/* Fullscreen Image Overlay */}
            {isFullscreen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-transparent" onClick={() => setIsFullscreen(false)}>
                    <div className="relative max-w-[90vw] max-h-[90vh]">
                        <button
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white hover:text-gray-200 flex items-center justify-center transition-all duration-200 z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFullscreen(false);
                            }}
                            aria-label="Close fullscreen"
                        >
                            <Icon icon="material-symbols:close" className="w-5 h-5" />
                        </button>
                        <img
                            src={imageSrc}
                            alt="Fullscreen"
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="shrink-0 bg-white z-10 p-4 border-b relative">
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

                <div
                    className="cursor-pointer relative group"
                    onClick={() => setIsFullscreen(true)}
                >
                    <DescriptionSection
                        description={data.description}
                        imageSrc={imageSrc}
                        hasImage={hasImage}
                        onImageError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/90 rounded-full p-2">
                            <Icon icon="material-symbols:zoom-in" className="w-6 h-6 text-gray-800" />
                        </div>
                    </div>
                </div>

                <TimelineSection timeline={timeline} />
            </div>

            {/* Footer Actions */}
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
                                    <span className="text-blue-700 font-semibold">
                                        {dispatchedTeamName
                                            ? `Incident is currently dispatched to ${dispatchedTeamName}`
                                            : "Incident is currently dispatched to volunteers"
                                        }
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="text-xs mt-1 text-gray-600">
                            {isResolved
                                ? "No further actions are available."
                                : "Actions are disabled while the team is en route."
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
                                disabled={!isDispatched}
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