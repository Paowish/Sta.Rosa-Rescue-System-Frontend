// src/pages/rescueTeam/IncidentDetailModal.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DispatchSelectionModal from "./DispatchSelectionModal";

// Leaflet setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const orangeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function IncidentDetailModal({ isOpen, onClose, incident, onDispatch }) {
    const [showDispatch, setShowDispatch] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

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

    const getResponderName = (incident) => {
        if (!incident || !incident.assignedTo || incident.assignedTo.length === 0) return "--";
        const first = incident.assignedTo[0];
        if (first.responder && first.responder.firstName && first.responder.lastName) {
            return `${first.responder.firstName} ${first.responder.lastName}`;
        }
        return "Assigned";
    };

    return (
        <>
            {/* Main Details Modal */}
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-15">
                <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">

                    {/* HEADER */}
                    <div className="bg-[#5B7486] px-6 py-4 flex justify-between items-center text-white shrink-0">
                        <div>
                            <p className="text-xs opacity-80 font-medium tracking-wide">{incident.incidentId || "INC-001"}</p>
                            <h2 className="text-lg font-bold mt-0.5">{incident.type || "Incident Report"}</h2>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <Icon icon="mdi:close" className="w-6 h-6" />
                        </button>
                    </div>

                    {/* TABS */}
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

                    {/* SCROLLABLE CONTENT */}
                    <div className="overflow-y-auto flex-1 p-6 space-y-6">

                        {/* === OVERVIEW TAB === */}
                        {activeTab === 'overview' && (
                            <div className="animate-in fade-in duration-300">
                                <div className="border-b border-gray-200 pb-4 mb-4">
                                    <h3 className="text-sm font-medium text-gray-600 mb-3">Incident Details</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 mb-1">Location</p>
                                            <p className="font-medium text-gray-900 leading-snug">{incident.location?.address || "N/A"}</p>
                                            <p className="text-gray-500 text-xs">{incident.location?.barangay || "N/A"}, {incident.location?.city || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 mb-1">Barangay</p>
                                            <p className="font-medium text-gray-900">{incident.location?.barangay || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 mb-1">Victim</p>
                                            <p className="font-medium text-gray-900">{incident.victimCount || incident.victimsAffected || "0"} People</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 mb-1">Responders</p>
                                            <p className="font-medium text-gray-900">{getResponderName(incident)}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-gray-500 mb-1">Status</p>
                                            <p className={`font-medium text-sm ${getStatusColor(incident.status)}`}>{incident.status || "Pending"}</p>
                                        </div>
                                    </div>
                                </div>

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

                        {/* === REPORT TAB === */}
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
                                    <textarea className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Type here..."></textarea>
                                </div>

                                {/* Narrative */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Responder Narrative / Observations</label>
                                    <p className="text-xs text-gray-500 mb-2">Describe conditions observed on arrival, hazards, people involved.</p>
                                    <textarea className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Type here..."></textarea>
                                </div>

                                {/* 2-Column Grid for Casualties and Agencies */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Casualties & Victims (Final Count)</label>
                                        <p className="text-xs text-gray-500 mb-2">Victims Affected</p>
                                        <div className="flex items-center gap-3">
                                            <button className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">-</button>
                                            <div className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-sm font-medium bg-white">1</div>
                                            <button className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Other Agencies Notified</label>
                                        <p className="text-xs text-gray-500 mb-1 mt-1">Role / Position</p>
                                        <select className="block w-full border border-gray-300 rounded py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                                            <option>Select Other Agencies</option>
                                            <option>Barangay</option>
                                            <option>City Hall</option>
                                            <option>Red Cross</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Recommendations */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations / Follow-up Actions</label>
                                    <p className="text-xs text-gray-500 mb-2">Any follow-up needed?</p>
                                    <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder="Type here..." />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* STICKY FOOTER - ONLY VISIBLE ON REPORT TAB */}
                    {activeTab === 'report' && (
                        <div className="shrink-0 bg-white p-4 border-t border-gray-200 flex justify-center gap-4">
                            <button
                                onClick={onClose}
                                className="px-8 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-w-[120px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    alert("Report saved successfully!");
                                    onClose();
                                }}
                                className="px-8 py-2 bg-[#1d4ed8] text-white text-sm font-medium rounded hover:bg-blue-800 transition-colors min-w-[120px]"
                            >
                                Save Report
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Dispatch Modal */}
            <DispatchSelectionModal
                isOpen={showDispatch}
                onClose={() => setShowDispatch(false)}
                incidentTitle={incident.type || "Incident Report"}
                incidentId={incident._id}
                onDispatch={onDispatch}
            />
        </>
    );
}