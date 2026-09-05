// src/pages/rescueTeam/IncidentDetailModal.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const orangeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function IncidentDetailModal({ isOpen, onClose, incident, onDispatch }) {
    const [activeTab, setActiveTab] = useState('overview');

    const [reportData, setReportData] = useState({
        actionsTaken: '',
        narrative: '',
        victimsFinal: incident?.victimsAffected || 1,
        agenciesNotified: '',
        recommendations: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (incident) {
            setReportData({
                actionsTaken: incident.afterActionReport?.actionsTaken || '',
                narrative: incident.afterActionReport?.narrative || '',
                victimsFinal: incident.victimsAffected || 1,
                agenciesNotified: incident.afterActionReport?.agenciesNotified || '',
                recommendations: incident.afterActionReport?.recommendations || ''
            });
        }
    }, [incident]);

    if (!isOpen || !incident) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'text-green-600';
            case 'Active': return 'text-red-600';
            case 'Pending': return 'text-orange-500';
            case 'Dispatched': return 'text-blue-600';
            default: return 'text-orange-500';
        }
    };

    const lat = incident.location?.coordinates?.latitude ||
        incident.location?.coordinates?.lat ||
        15.3611;
    const lng = incident.location?.coordinates?.longitude ||
        incident.location?.coordinates?.lng ||
        120.9371;
    const position = [lat, lng];

    const getRespondersList = (incident) => {
        if (!incident?.assignedTo || incident.assignedTo.length === 0) {
            return [];
        }
        return incident.assignedTo.map(assignment => {
            const responder = assignment.responder || {};
            const name = responder.firstName && responder.lastName
                ? `${responder.firstName} ${responder.lastName}`
                : responder.name || 'Assigned Volunteer';
            return {
                id: responder._id || assignment.responder,
                name: name,
                status: assignment.status || 'Pending',
                email: responder.email || '',
                phone: responder.phoneNumber || ''
            };
        });
    };

    const getRespondersDisplay = (incident) => {
        if (incident.dispatchType === 'team' || incident.teamName) {
            return incident.teamName || 'Rescue Team';
        }
        const responders = getRespondersList(incident);
        if (responders.length === 0) return "--";
        return responders.map(r => r.name).join(', ');
    };

    const handleSaveReport = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

            const response = await fetch(`${apiUrl}/incidents/${incident._id}/report`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ afterActionReport: reportData })
            });

            const data = await response.json();
            if (data.success) {
                setSaveSuccess(true);
                setTimeout(() => {
                    setSaveSuccess(false);
                    onClose();
                }, 1500);
            } else {
                alert('Failed to save report: ' + data.message);
            }
        } catch (error) {
            console.error('Error saving report:', error);
            alert('Failed to save report. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateReportData = (field, value) => {
        setReportData(prev => ({ ...prev, [field]: value }));
    };

    const responders = getRespondersList(incident);

    return createPortal(
        <>
            {/* Main Details Modal */}
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm overflow-y-auto">
                <div className="min-h-full flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 max-h-[85vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-[#5B7486] px-6 py-4 flex justify-between items-center text-white shrink-0">
                            <div>
                                <p className="text-xs opacity-80 font-medium tracking-wide">
                                    {incident.incidentId || "INC-001"}
                                </p>
                                <h2 className="text-lg font-bold mt-0.5">
                                    {incident.type || "Incident Report"}
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 shrink-0 bg-gray-50/30">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                                    ? 'border-blue-600 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('report')}
                                className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${activeTab === 'report'
                                    ? 'border-blue-600 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Report
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-6">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="animate-in fade-in duration-300">
                                    {/* Incident Details */}
                                    <div className="border-b border-gray-200 pb-4 mb-4">
                                        <h3 className="text-sm font-medium text-gray-600 mb-3">Incident Details</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 mb-1">Location</p>
                                                <p className="font-medium text-gray-900 leading-snug">
                                                    {incident.location?.address || "N/A"}
                                                </p>
                                                <p className="text-gray-500 text-xs">
                                                    {incident.location?.barangay || "N/A"}, {incident.location?.city || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Barangay</p>
                                                <p className="font-medium text-gray-900">{incident.location?.barangay || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Victim</p>
                                                <p className="font-medium text-gray-900">
                                                    {incident.victimCount || incident.victimsAffected || "0"} People
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Responders</p>
                                                <p className="font-medium text-gray-900">
                                                    {incident.dispatchType === 'team' || incident.teamName
                                                        ? `${incident.teamName || 'Rescue Team'} (Team)`
                                                        : getRespondersDisplay(incident)
                                                    }
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-500 mb-1">Status</p>
                                                <p className={`font-medium text-sm ${getStatusColor(incident.status)}`}>
                                                    {incident.status || "Pending"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Responders List */}
                                    {responders.length > 0 && (
                                        <div className="border-b border-gray-200 pb-4 mb-4">
                                            <h3 className="text-sm font-medium text-gray-600 mb-3">Assigned Responders</h3>
                                            <div className="space-y-2">
                                                {responders.map((responder, idx) => (
                                                    <div key={responder.id || idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                                                            <Icon icon="mdi:account" className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-800">{responder.name}</p>
                                                            <p className="text-xs text-gray-500">{responder.email || responder.phone || 'N/A'}</p>
                                                        </div>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded ${responder.status === 'En Route' ? 'bg-blue-100 text-blue-700' :
                                                            responder.status === 'On Scene' ? 'bg-green-100 text-green-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {responder.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Location Section */}
                                    <div className="border-b border-gray-200 pb-6 mb-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Icon icon="mdi:map-marker" className="w-5 h-5 text-red-500" />
                                            <h3 className="text-sm font-medium text-gray-700">Location</h3>
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2 text-xs">
                                            <p className="font-medium text-gray-900">{incident.location?.address || "N/A"}</p>
                                            <p className="text-gray-500 whitespace-nowrap">{lat}°N {lng}°E</p>
                                        </div>

                                        {/* Map */}
                                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 z-0">
                                            <MapContainer
                                                center={position}
                                                zoom={15}
                                                scrollWheelZoom={false}
                                                style={{ height: '100%', width: '100%' }}
                                            >
                                                <TileLayer
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                />
                                                <Marker position={position} icon={orangeIcon}>
                                                    <Popup>{incident.location?.address || "Incident Location"}</Popup>
                                                </Marker>
                                            </MapContainer>
                                        </div>
                                    </div>

                                    {/* Activity Timeline */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Activity Timeline</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-400/70"></div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-700">Incident reported by {incident.reporterName || "community member"}</p>
                                                    <p className="text-xs text-gray-400">{incident.reportedAt ? new Date(incident.reportedAt).toLocaleTimeString() : "N/A"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full bg-orange-400/70"></div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-700">Incident status: {incident.status || "Pending"}</p>
                                                    <p className="text-xs text-gray-400">{incident.updatedAt ? new Date(incident.updatedAt).toLocaleTimeString() : "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Report Tab */}
                            {activeTab === 'report' && (
                                <div className="animate-in fade-in duration-300 space-y-5 pb-4">
                                    {/* Header Section */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800 mb-1">After-Action Report — Responder Section</h3>
                                        <div className="flex items-center gap-2 bg-blue-50 p-3 rounded text-xs text-blue-700">
                                            <div className="w-4 h-4 rounded-full bg-blue-400 text-white flex items-center justify-center text-[10px] font-bold">i</div>
                                            <p>Fill in the fields below after the incident is handled. This forms part of the official incident record.</p>
                                        </div>
                                    </div>

                                    {/* Actions Taken */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Actions Taken at Scene</label>
                                        <p className="text-xs text-gray-500 mb-2">Describe what the rescue team did on the scene - e.g. administered first aid, evacuated residents.</p>
                                        <textarea
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            rows={3}
                                            placeholder="Type here..."
                                            value={reportData.actionsTaken}
                                            onChange={(e) => updateReportData('actionsTaken', e.target.value)}
                                        ></textarea>
                                    </div>

                                    {/* Narrative */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Responder Narrative / Observations</label>
                                        <p className="text-xs text-gray-500 mb-2">Describe conditions observed on arrival, hazards, people involved.</p>
                                        <textarea
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            rows={3}
                                            placeholder="Type here..."
                                            value={reportData.narrative}
                                            onChange={(e) => updateReportData('narrative', e.target.value)}
                                        ></textarea>
                                    </div>

                                    {/* Casualties and Agencies */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Casualties & Victims (Final Count)</label>
                                            <p className="text-xs text-gray-500 mb-2">Victims Affected</p>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => updateReportData('victimsFinal', Math.max(0, Number(reportData.victimsFinal) - 1))} className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">-</button>
                                                <div className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-sm font-medium bg-white">{reportData.victimsFinal}</div>
                                                <button onClick={() => updateReportData('victimsFinal', Number(reportData.victimsFinal) + 1)} className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">+</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Other Agencies Notified</label>
                                            <p className="text-xs text-gray-500 mb-1 mt-1">Role / Position</p>
                                            <select
                                                className="block w-full border border-gray-300 rounded py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                                value={reportData.agenciesNotified}
                                                onChange={(e) => updateReportData('agenciesNotified', e.target.value)}
                                            >
                                                <option value="">Select Other Agencies</option>
                                                <option value="Barangay">Barangay</option>
                                                <option value="City Hall">City Hall</option>
                                                <option value="Red Cross">Red Cross</option>
                                                <option value="Police">Police</option>
                                                <option value="Fire Dept">Fire Dept</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Recommendations */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations / Follow-up Actions</label>
                                        <p className="text-xs text-gray-500 mb-2">Any follow-up needed?</p>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Type here..."
                                            value={reportData.recommendations}
                                            onChange={(e) => updateReportData('recommendations', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky Footer - Report Tab */}
                        {activeTab === 'report' && (
                            <div className="shrink-0 bg-white p-4 border-t border-gray-200 flex justify-center gap-4">
                                <button onClick={onClose} className="px-8 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-w-[120px]">Cancel</button>
                                <button onClick={handleSaveReport} disabled={isSaving} className={`px-8 py-2 bg-[#1d4ed8] text-white text-sm font-medium rounded hover:bg-blue-800 transition-colors min-w-[120px] ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isSaving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Report'}
                                </button>
                            </div>
                        )}

                        {/* Sticky Footer - Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="shrink-0 bg-white p-4 border-t border-gray-200 flex justify-center gap-4">
                                <button onClick={onClose} className="px-8 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-w-[120px]">Cancel</button>
                                <button onClick={() => onDispatch(incident)} className="px-8 py-2 bg-[#1d4ed8] text-white text-sm font-medium rounded hover:bg-blue-800 transition-colors min-w-[120px]">Dispatch</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}