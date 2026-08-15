import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { incidentService } from "../../services/api";
import { X, MapPin } from 'lucide-react';
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

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// --- SVGs ---
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="m6 9 6 6 6-6" /></svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);
const CheckboxCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const CheckboxAll = () => (
  <div className="bg-[#4081EE] rounded-[4px] w-5 h-5 flex items-center justify-center cursor-pointer mx-auto">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
  </div>
);

// --- STANDALONE DISPATCH MODAL (Real Data) ---
const DispatchSelectionModal = ({ isOpen, onClose, incidentTitle, incidentId, onDispatch }) => {
  const [volunteers, setVolunteers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('volunteers');

  useEffect(() => {
    if (isOpen) {
      loadAvailableVolunteers();
      setSelectedIds([]);
      setSearchTerm("");
    }
  }, [isOpen]);

  const loadAvailableVolunteers = async () => {
    setLoadingVolunteers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/volunteers/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const handleVolunteerToggle = (volunteerId) => {
    setSelectedIds(prev =>
      prev.includes(volunteerId)
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  const handleRemoveSelected = (volunteerId) => {
    setSelectedIds(prev => prev.filter(id => id !== volunteerId));
  };

  const handleDispatch = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one volunteer to dispatch');
      return;
    }
    setIsDispatching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/incidents/${incidentId}/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          volunteerIds: selectedIds,
          dispatchNotes: 'Dispatched from Incident Management'
        })
      });
      const result = await response.json();
      if (result.success) {
        alert(`✅ Incident dispatched to ${result.data.volunteersDispatched} responder(s)!`);
        if (onDispatch) onDispatch();
        onClose();
      } else {
        alert('Failed to dispatch: ' + result.message);
      }
    } catch (error) {
      console.error('Dispatch error:', error);
      alert('Error dispatching incident.');
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredVolunteers = volunteers.filter(v =>
    `${v.firstName} ${v.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selectedVolunteersData = volunteers.filter(v => selectedIds.includes(v._id));

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
        <div className="bg-[#9fb2c2] p-5 flex justify-between items-start relative">
          <div className="text-white">
            <p className="text-xs font-medium opacity-90">Dispatch to</p>
            <h2 className="text-2xl font-bold tracking-tight leading-tight truncate max-w-[250px]">
              {incidentTitle}
            </h2>
            <p className="text-[10px] font-medium opacity-80 mt-0.5">{incidentId}</p>
          </div>
          <button onClick={onClose} className="text-white hover:opacity-75 transition-opacity">
            <Icon icon="material-symbols:close" width="28" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 bg-white">
          <button onClick={() => setActiveTab('rescue')} className={`flex-1 py-4 text-center font-bold text-lg transition-colors relative ${activeTab === 'rescue' ? 'text-black' : 'text-gray-500'}`}>
            Rescue Team
            {activeTab === 'rescue' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d7aff]"></div>}
          </button>
          <button onClick={() => setActiveTab('volunteers')} className={`flex-1 py-4 text-center font-bold text-lg transition-colors relative ${activeTab === 'volunteers' ? 'text-black' : 'text-gray-500'}`}>
            Volunteers
            {activeTab === 'volunteers' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d7aff]"></div>}
          </button>
        </div>

        <div className="p-4 pt-5 pb-3 bg-white">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input type="text" placeholder="Search name, status, role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-3 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50/50 focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400" />
            </div>
          </div>
        </div>

        <div className="px-4 pb-2 bg-white">
          <p className="text-[11px] font-medium text-[#6b7280]">Within Incident Barangay Range (Publication)</p>
        </div>

        <div className="px-4 pb-4 h-[340px] overflow-y-auto custom-scrollbar">
          {loadingVolunteers ? (
            <p className="text-center py-4 text-gray-500 text-sm">Loading volunteers...</p>
          ) : filteredVolunteers.length === 0 ? (
            <p className="text-center py-4 text-gray-500 text-sm">No available volunteers found</p>
          ) : (
            filteredVolunteers.map((volunteer) => {
              const isSelected = selectedIds.includes(volunteer._id);
              return (
                <div key={volunteer._id} className="flex items-start gap-4 py-4 border-b border-gray-200">
                  <div className="pt-1.5">
                    <div onClick={() => handleVolunteerToggle(volunteer._id)} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer shadow-sm transition-colors ${isSelected ? 'bg-[#25d366]' : 'border-2 border-gray-300 bg-white hover:border-blue-400'}`}>
                      {isSelected && <Icon icon="material-symbols:check" width={14} className="text-white" strokeWidth={4} />}
                    </div>
                  </div>
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-[#cbd5e1] border-2 border-white shadow-sm flex items-center justify-center text-gray-500 text-lg font-bold">
                      {volunteer.firstName?.charAt(0)}{volunteer.lastName?.charAt(0)}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2d7aff] rounded-full border border-white"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{volunteer.firstName} {volunteer.lastName}</h3>
                      <span className="text-[10px] font-semibold text-[#25d366] uppercase tracking-wide">Active</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Volunteer Responder</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="px-2 py-0.5 bg-[#dbeafe] text-[#1d4ed8] text-[10px] font-bold rounded border border-[#bfdbfe]">BLS/CPR</span>
                      <span className="px-2 py-0.5 bg-[#dbeafe] text-[#1d4ed8] text-[10px] font-bold rounded border border-[#bfdbfe]">First Aid</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-[#6b7280]">
                      <Icon icon="material-symbols:location-on" width={12} className="text-gray-800" />
                      <span>{volunteer.address1 || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-white border-t border-gray-200 p-4">
          {selectedIds.length > 0 && (
            <div className="mb-3">
              <h4 className="text-base font-bold text-gray-800 mb-2">Selected</h4>
              <div className="flex flex-wrap gap-2">
                {selectedVolunteersData.map(v => (
                  <div key={v._id} className="flex items-center bg-[#dbeafe] text-[#1e40af] px-3 py-1 rounded text-sm font-medium">
                    {v.firstName} {v.lastName.charAt(0)}.
                    <button onClick={() => handleRemoveSelected(v._id)} className="ml-2 hover:bg-blue-200 rounded-full p-0.5 transition-colors">
                      <Icon icon="material-symbols:close" width={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button onClick={handleDispatch} disabled={isDispatching || selectedIds.length === 0} className="px-6 py-2 bg-[#1d7bf0] text-white font-bold rounded-md shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isDispatching ? 'Dispatching...' : 'Dispatch'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- THE DETAIL MODAL COMPONENT ---
const IncidentDetailModal = ({ isOpen, onClose, incident, onDispatch }) => {
  const [showDispatch, setShowDispatch] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'report'

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

  const lat = incident.location?.coordinates?.latitude || incident.location?.coordinates?.lat || 15.3611;
  const lng = incident.location?.coordinates?.longitude || incident.location?.coordinates?.lng || 120.9371;
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">

          {/* HEADER */}
          <div className="bg-[#5B7486] px-6 py-4 flex justify-between items-center text-white shrink-0">
            <div>
              <p className="text-xs opacity-80 font-medium tracking-wide">{incident.incidentId || "INC-001"}</p>
              <h2 className="text-lg font-bold mt-0.5">{incident.type || "Incident Report"}</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={24} strokeWidth={2.5} /></button>
          </div>

          {/* ✅ SPACED WIDE TABS */}
          <div className="flex border-b border-gray-200 shrink-0 bg-gray-50/30">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${activeTab === 'report' ? 'border-blue-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
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
                    <MapPin size={18} className="text-red-600 fill-red-600" />
                    <h3 className="text-sm font-medium text-gray-700">Location</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2 text-xs">
                    <p className="font-medium text-gray-900">{incident.location?.address || "N/A"}</p>
                    <p className="text-gray-500 whitespace-nowrap">{lat}°N {lng}°E</p>
                  </div>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 z-0">
                    <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={position} icon={orangeIcon}>
                        <Popup>{incident.location?.address || "Incident Location"}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>

                {/* Activity Timeline (using real reportedAt time) */}
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
                    {/* Counter Component - exact match screenshot */}
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

          {/* ✅ STICKY FOOTER - ONLY VISIBLE ON REPORT TAB */}
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
};

// --- MAIN PAGE COMPONENT ---
export default function IncidentManagement() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, resolved: 0 });

  useEffect(() => { loadIncidents(); }, []);
  useEffect(() => { applyFilters(); }, [incidents, searchTerm, statusFilter]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const response = await incidentService.getAllIncidents();
      let dataArray = [];
      if (response && response.success && Array.isArray(response.data)) dataArray = response.data;
      else if (Array.isArray(response)) dataArray = response;
      else if (response && Array.isArray(response.data)) dataArray = response.data;
      setIncidents(dataArray);
      setSelectedIds([]);
      const total = dataArray.length;
      const active = dataArray.filter(i => i.status === 'Active').length;
      const pending = dataArray.filter(i => i.status === 'Pending').length;
      const resolved = dataArray.filter(i => i.status === 'Resolved').length;
      setStats({ total, active, pending, resolved });
    } catch (error) {
      console.error("Failed to load incidents:", error);
      setIncidents([]);
    } finally { setLoading(false); }
  };

  const applyFilters = () => {
    let filtered = [...incidents];
    if (statusFilter !== "All Statuses") filtered = filtered.filter(i => i.status === statusFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.incidentId?.toLowerCase().includes(term) ||
        i.type?.toLowerCase().includes(term) ||
        (i.location?.address && i.location.address.toLowerCase().includes(term)) ||
        (i.location?.barangay && i.location.barangay.toLowerCase().includes(term))
      );
    }
    setFilteredIncidents(filtered);
  };

  const handleViewIncident = (incident) => { setSelectedIncident(incident); setIsModalOpen(true); };

  const handleResolveIncident = async (incident) => {
    if (window.confirm(`Mark incident ${incident.incidentId} as resolved?`)) {
      try {
        const response = await incidentService.resolveIncident(incident._id, "Resolved by team");
        if (response && response.success) {
          alert("Incident marked as resolved!");
          setIsModalOpen(false);
          loadIncidents();
        }
      } catch (error) { alert("Failed to resolve incident: " + error.message); }
    }
  };

  const handleDispatchSuccess = () => {
    setIsModalOpen(false);
    loadIncidents(); // Refresh the incidents list after dispatch
  };

  const clearFilters = () => { setSearchTerm(""); setStatusFilter("All Statuses"); };
  const toggleRowSelection = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };
  const formatAssignedTo = (assignees) => {
    if (!assignees || !Array.isArray(assignees) || assignees.length === 0) return "Unassigned";
    const first = assignees[0];
    if (first.responder) return `${first.responder.firstName} ${first.responder.lastName}`;
    return "Assigned";
  };
  const getStatusBadge = (status) => {
    const commonPill = "bg-gray-200/60 text-gray-700 px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'Resolved': return <div className={`${commonPill} bg-green-100/60 text-green-700`}>Resolved</div>;
      case 'Active': return <div className={`${commonPill} bg-red-100/60 text-red-700`}>Active</div>;
      case 'Pending': return <div className={`${commonPill} bg-yellow-100/60 text-yellow-700`}>Pending</div>;
      case 'Dispatched': return <div className={`${commonPill} bg-blue-100/60 text-blue-700`}>Dispatched</div>;
      default: return <div className={commonPill}>{status}</div>;
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="text-gray-500">Loading incidents...</div></div>;

  return (
    <div className="p-6 bg-white min-h-screen font-sans text-slate-700">
      <IncidentDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        incident={selectedIncident}
        onDispatch={handleDispatchSuccess}
      />
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2"><h1 className="text-2xl font-bold text-gray-700">INCIDENT MANAGEMENT</h1><span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Santa Rosa, Nueva Ecija</span></div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500"><p className="text-2xl font-bold text-gray-700">{stats.total}</p><p className="text-sm text-gray-500">All Incidents</p></div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500"><p className="text-2xl font-bold text-orange-600">{stats.active}</p><p className="text-sm text-gray-500">Active</p></div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500"><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p><p className="text-sm text-gray-500">Pending</p></div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500"><p className="text-2xl font-bold text-green-600">{stats.resolved}</p><p className="text-sm text-gray-500">Resolved</p></div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-6 mb-6">
        <div className="relative w-72"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div><input type="text" placeholder="Search ID, type, location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" /></div>
        <div className="relative w-40"><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none block w-full border border-slate-200 rounded-md pl-4 pr-10 py-2.5 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"><option>All Statuses</option><option>Pending</option><option>Active</option><option>Dispatched</option><option>Resolved</option></select><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown /></div></div>
        <div className="relative w-40"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CalendarIcon /></div><div className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-md text-sm bg-white text-slate-500">dd / mm / yy</div></div>
        <button onClick={clearFilters} className="flex items-center gap-2 border border-slate-200 rounded-md px-4 py-2.5 bg-white text-sm hover:bg-slate-50 text-slate-600"><XIcon /><span>clear</span></button>
      </div>
      <div className="border border-slate-200 rounded-sm overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b border-slate-200 bg-white">
              <th className="p-4 w-10 text-center border-r border-slate-200"><CheckboxAll /></th>
              <th className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200 w-[15%]">ID</th>
              <th className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200 w-[15%]">Status</th>
              <th className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200 w-[25%]">Location</th>
              <th className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200 w-[15%]">Assigned</th>
              <th className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200 w-[15%]">Reported</th>
              <th className="p-4 text-sm font-medium text-slate-600 w-[15%]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((incident) => {
                const isSelected = selectedIds.includes(incident._id);
                return (
                  <tr key={incident._id} className="hover:bg-slate-50/50 transition-colors h-16">
                    <td className="p-4 text-center border-r border-slate-200"><div onClick={() => toggleRowSelection(incident._id)} className={`w-5 h-5 rounded-[4px] border mx-auto cursor-pointer flex items-center justify-center transition-colors ${isSelected ? 'bg-[#4081EE] border-[#4081EE]' : 'border-slate-300'}`}>{isSelected && <CheckboxCheck />}</div></td>
                    <td className="p-4 text-sm text-slate-700 border-r border-slate-200 truncate">{incident.incidentId || "N/A"}</td>
                    <td className="p-4 border-r border-slate-200">{getStatusBadge(incident.status)}</td>
                    <td className="p-4 text-sm text-slate-700 border-r border-slate-200 truncate"><div className="truncate">{incident.location?.address || "N/A"}</div><div className="text-xs text-gray-400">{incident.location?.barangay}</div></td>
                    <td className="p-4 text-sm text-slate-700 border-r border-slate-200 truncate">{formatAssignedTo(incident.assignedTo)}</td>
                    <td className="p-4 text-sm text-slate-700 border-r border-slate-200 truncate">{incident.reportedAt ? new Date(incident.reportedAt).toLocaleString() : "N/A"}</td>
                    <td className="p-4"><div className="flex items-center gap-2"><button onClick={() => handleViewIncident(incident)} className="px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded bg-white hover:bg-blue-50 transition-colors whitespace-nowrap">View</button>{incident.status !== 'Resolved' && (<button onClick={() => handleResolveIncident(incident)} className="px-3 py-1.5 text-sm text-green-600 border border-green-300 rounded bg-white hover:bg-green-50 transition-colors whitespace-nowrap">Resolve</button>)}</div></td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="7" className="p-8 text-center text-gray-500">{searchTerm || statusFilter !== "All Statuses" ? "No incidents match your filters" : "No incidents found in the system."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}