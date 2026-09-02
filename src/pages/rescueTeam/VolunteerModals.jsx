// src/components/modals/DispatchModal.jsx
import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icons
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
    const colors = {
        Critical: '#DC2626',
        High: '#EA580C',
        Medium: '#EAB308',
        Low: '#3B82F6'
    };
    const color = colors[severity] || '#3B82F6';
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        popupAnchor: [0, -10]
    });
};

/**
 * Confirmation Modal Component
 */
export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor = 'bg-green-600 hover:bg-green-700', icon, iconColor = 'text-green-500' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 backdrop-blur-sm pt-8">
            <div className="bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] p-6 flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${iconColor === 'text-green-500' ? 'bg-green-100' :
                            iconColor === 'text-red-500' ? 'bg-red-100' :
                                'bg-blue-100'
                        }`}>
                        {icon === 'success' ? <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-500" /> :
                            icon === 'error' ? <Icon icon="mdi:close-circle" className="w-8 h-8 text-red-500" /> :
                                icon === 'warning' ? <Icon icon="mdi:alert-circle" className="w-8 h-8 text-yellow-500" /> :
                                    <Icon icon="mdi:information" className="w-8 h-8 text-blue-500" />}
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">{title}</h3>
                <p className="text-gray-600 text-center text-sm mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button onClick={() => { if (onConfirm) onConfirm(); onClose(); }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition ${confirmColor}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Toast Modal Component
 */
export const ToastModal = ({ isOpen, onClose, title, message, type = 'success' }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        if (type === 'success') return <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-500" />;
        if (type === 'error') return <Icon icon="mdi:close-circle" className="w-8 h-8 text-red-500" />;
        if (type === 'warning') return <Icon icon="mdi:alert-circle" className="w-8 h-8 text-yellow-500" />;
        return <Icon icon="mdi:information" className="w-8 h-8 text-blue-500" />;
    };

    const getBgColor = () => {
        if (type === 'success') return 'bg-green-100';
        if (type === 'error') return 'bg-red-100';
        if (type === 'warning') return 'bg-yellow-100';
        return 'bg-blue-100';
    };

    const getButtonColor = () => {
        if (type === 'success') return 'bg-green-500 hover:bg-green-600';
        if (type === 'error') return 'bg-red-500 hover:bg-red-600';
        if (type === 'warning') return 'bg-yellow-500 hover:bg-yellow-600';
        return 'bg-blue-500 hover:bg-blue-600';
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 backdrop-blur-sm pt-8">
            <div className="bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] p-6 flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getBgColor()}`}>
                        {getIcon()}
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">{title}</h3>
                <p className="text-gray-600 text-center text-sm mb-6">{message}</p>
                <button onClick={onClose} className={`py-2.5 rounded-lg text-sm font-medium text-white transition ${getButtonColor()}`}>
                    OK
                </button>
            </div>
        </div>
    );
};

/**
 * Full Screen Spinner Component
 */
export const FullScreenSpinner = ({ message = 'Processing...' }) => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-700 font-medium text-lg">{message}</p>
            <p className="text-gray-400 text-sm">Please wait...</p>
        </div>
    </div>
);

/**
 * Dispatch Modal Component
 */
export const DispatchModal = ({ volunteer, onClose, onDispatch }) => {
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [loading, setLoading] = useState(false);
    const [incidents, setIncidents] = useState([]);
    const [fetching, setFetching] = useState(true);

    const getApiUrl = () => window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

    /**
     * Fetch active incidents on mount
     */
    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${getApiUrl()}/incidents`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    const activeIncidents = data.data.filter(inc =>
                        inc.status === 'Pending' || inc.status === 'Dispatched' || inc.status === 'Acknowledged'
                    );
                    setIncidents(activeIncidents);
                }
            } catch (error) {
                console.error('Error fetching incidents:', error);
            } finally {
                setFetching(false);
            }
        };
        fetchIncidents();
    }, []);

    /**
     * Handle dispatch action
     */
    const handleDispatch = async () => {
        if (!selectedIncident) return alert('Please select an incident');
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiUrl()}/incidents/${selectedIncident}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    responderIds: [volunteer.id],
                    teamName: volunteer.name,
                    dispatchNotes: `Dispatched to ${volunteer.name}`
                })
            });
            const data = await response.json();
            if (data.success) {
                alert(`✅ ${volunteer.name} dispatched!`);
                onDispatch();
                onClose();
            } else {
                alert(`❌ Dispatch failed: ${data.message}`);
            }
        } catch (error) {
            alert('❌ Failed to dispatch.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Calculate years active
     */
    const getYearsActive = () => {
        if (!volunteer.createdAt) return '1 Year';
        const start = new Date(volunteer.createdAt);
        const now = new Date();
        const years = now.getFullYear() - start.getFullYear();
        return years > 0 ? `${years} Years` : 'New';
    };

    // Default map center (Santa Rosa, Nueva Ecija)
    const defaultMapCenter = [15.428991, 120.938698];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 backdrop-blur-sm overflow-y-auto pt-0">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-[#5e747f] px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-white text-lg font-semibold">Dispatch Volunteer</h2>
                        <p className="text-blue-100 text-xs opacity-90">Assign a volunteer to an active incident</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <Icon icon="mdi:close" className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Left Panel - Volunteer Profile */}
                    <div className="w-full md:w-1/3 border-r border-gray-200 bg-[#f5f6f8] overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
                        {/* Profile Header */}
                        <div className="p-6 flex items-center gap-4 border-b border-gray-200 bg-white">
                            <div className="relative w-16 h-16 shrink-0">
                                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center overflow-hidden">
                                    {volunteer.profileImage ? (
                                        <img src={volunteer.profileImage} alt={volunteer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
                                            <Icon icon="mdi:account" className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{volunteer.name}</h3>
                                <p className="text-xs text-gray-500 font-medium">{volunteer.role}</p>
                                <div className="mt-1.5 inline-block bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-sm">
                                    • {volunteer.status || 'Available'}
                                </div>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="p-0 text-xs">
                            <div className="bg-[#e5e9ee] py-2 px-6 font-semibold text-gray-600 border-b border-gray-200 text-[11px] uppercase tracking-wider">
                                Profile
                            </div>
                            <div className="bg-white divide-y divide-gray-100">
                                <div className="flex justify-between py-2.5 px-6">
                                    <span className="text-gray-500 font-medium">Volunteer ID</span>
                                    <span className="text-gray-800 font-semibold">{volunteer.appId || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-2.5 px-6 bg-[#f7f8fa]">
                                    <span className="text-gray-500 font-medium">Contact</span>
                                    <span className="text-gray-800 font-semibold">{volunteer.details?.contact || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-2.5 px-6">
                                    <span className="text-gray-500 font-medium">Years Active</span>
                                    <span className="text-gray-800 font-semibold">{getYearsActive()}</span>
                                </div>
                                <div className="flex justify-between py-2.5 px-6 bg-[#f7f8fa]">
                                    <span className="text-gray-500 font-medium">Current Assignment</span>
                                    <span className="text-gray-800 font-semibold">
                                        {selectedIncident ? incidents.find(i => i._id === selectedIncident)?.incidentId || 'None' : 'None'}
                                    </span>
                                </div>
                            </div>

                            {/* Recent Incidents */}
                            <div className="bg-[#e5e9ee] py-2 px-6 font-semibold text-gray-600 border-y border-gray-200 text-[11px] uppercase tracking-wider">
                                Recent Incidents
                            </div>
                            <div className="bg-white p-5 space-y-3">
                                <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-red-600 bg-red-50 border-red-200">Active</span>
                                        <span className="text-[10px] text-gray-500">Pending Dispatch</span>
                                    </div>
                                    <div className="text-xs font-semibold text-gray-700">No Recent Assignment</div>
                                    <div className="text-[10px] text-gray-500 flex justify-between border-b border-gray-100 pb-1.5">
                                        <span>• N/A</span>
                                        <span>• Stand By</span>
                                    </div>
                                </div>
                            </div>

                            {/* Certifications */}
                            <div className="bg-[#e5e9ee] py-2 px-6 font-semibold text-gray-600 border-y border-gray-200 text-[11px] uppercase tracking-wider">
                                Certification and Skills
                            </div>
                            <div className="bg-white p-5 flex flex-wrap gap-1.5">
                                {volunteer.details?.skills?.length > 0 ? (
                                    volunteer.details.skills.slice(0, 8).map((s, idx) => (
                                        <span key={idx} className="bg-blue-50 border border-blue-200 text-blue-600 px-2 py-1 rounded text-[10px] font-medium">
                                            {s}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic">No certifications listed</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Map & Incidents */}
                    <div className="w-full md:w-2/3 flex flex-col h-full">
                        {/* Map Section */}
                        <div className="h-48 md:h-64 w-full bg-gray-200 overflow-hidden border-b border-gray-200 shrink-0 relative z-0">
                            <MapContainer
                                center={defaultMapCenter}
                                zoom={13}
                                style={{ height: "100%", width: "100%" }}
                                scrollWheelZoom={false}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {incidents.map((incident) => {
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
                                                    <strong>{incident.type}</strong><br />
                                                    {incident.location?.address}<br />
                                                    <span className="text-xs">Status: {incident.status}</span>
                                                </Popup>
                                            </Marker>
                                        );
                                    }
                                    return null;
                                })}
                            </MapContainer>

                            {/* Map Controls */}
                            <div className="absolute top-2 left-2 bg-white rounded shadow text-xs overflow-hidden flex flex-col text-gray-600 z-[400]">
                                <button className="px-3 py-1 border-b border-gray-200 hover:bg-gray-50 font-medium">Map</button>
                                <button className="px-3 py-1 hover:bg-gray-50 font-medium">Satellite</button>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-white rounded shadow flex flex-col border border-gray-200 z-[400]">
                                <button className="p-1 border-b border-gray-200 hover:bg-gray-50"><Icon icon="mdi:plus" className="w-4 h-4" /></button>
                                <button className="p-1 hover:bg-gray-50"><Icon icon="mdi:minus" className="w-4 h-4" /></button>
                            </div>

                            {/* Bottom Bar */}
                            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-4 py-1.5 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-500 z-[400]">
                                <span>Active incidents - Select to assign</span>
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    <span>{incidents.length} Incidents</span>
                                </span>
                            </div>
                        </div>

                        {/* Incidents List */}
                        <div className="bg-white flex-1 p-5 space-y-5 overflow-y-auto max-h-[400px]">
                            {fetching ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="text-gray-400">Loading incidents...</div>
                                </div>
                            ) : incidents.length === 0 ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="text-gray-400">No active incidents available</div>
                                </div>
                            ) : (
                                incidents.map((incident) => (
                                    <div
                                        key={incident._id}
                                        onClick={() => setSelectedIncident(incident._id)}
                                        className={`flex gap-3 group cursor-pointer p-3 rounded-lg transition-colors border ${selectedIncident === incident._id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${incident.severity === 'Critical' ? 'text-red-600 border-red-300 bg-red-50' :
                                                        incident.severity === 'Medium' ? 'text-yellow-600 border-yellow-300 bg-yellow-50' :
                                                            'text-green-600 border-green-300 bg-green-50'
                                                    }`}>
                                                    {incident.severity}
                                                </span>
                                                <span className="text-[10px] text-gray-500 font-medium">{incident.incidentId}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded ${incident.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {incident.status}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-bold text-gray-800">{incident.type}</h4>
                                            {incident.location?.address && (
                                                <div className="flex items-center gap-1.5 mt-0.5 text-sm text-gray-600">
                                                    <Icon icon="mdi:map-marker" className="w-3.5 h-3.5 text-gray-400" />
                                                    {incident.location.address}
                                                </div>
                                            )}
                                        </div>
                                        {selectedIncident === incident._id && (
                                            <div className="flex items-center">
                                                <span className="text-blue-500">
                                                    <Icon icon="mdi:check-circle" className="w-6 h-6" />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 shrink-0">
                    <p className="text-sm text-gray-500">
                        Assigning <span className="font-bold text-gray-800">{volunteer.name}</span> to {selectedIncident ? 'selected incident' : 'select an incident above'}
                    </p>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium py-2 px-6 rounded">
                            Cancel
                        </button>
                        <button
                            onClick={handleDispatch}
                            disabled={loading || !selectedIncident}
                            className="flex-1 sm:flex-none bg-[#0081d6] hover:bg-[#006bb3] text-white text-sm font-medium py-2 px-6 rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Dispatching...' : 'Dispatch'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};