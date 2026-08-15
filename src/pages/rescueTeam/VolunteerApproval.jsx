import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from "@iconify/react";
import notificationService from "../../services/notificationService";
import io from 'socket.io-client';

// --- CONFIRMATION MODAL COMPONENT ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor = 'bg-green-600 hover:bg-green-700', icon, iconColor = 'text-green-500' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] p-6 flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${iconColor === 'text-green-500' ? 'bg-green-100' : iconColor === 'text-red-500' ? 'bg-red-100' : 'bg-blue-100'}`}>
            {icon === 'success' ? (
              <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-500" />
            ) : icon === 'error' ? (
              <Icon icon="mdi:close-circle" className="w-8 h-8 text-red-500" />
            ) : icon === 'warning' ? (
              <Icon icon="mdi:alert-circle" className="w-8 h-8 text-yellow-500" />
            ) : (
              <Icon icon="mdi:information" className="w-8 h-8 text-blue-500" />
            )}
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 text-center mb-2">{title}</h3>
        <p className="text-gray-600 text-center text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition ${confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SUCCESS/ERROR TOAST MODAL ---
const ToastModal = ({ isOpen, onClose, title, message, type = 'success' }) => {
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] p-6 flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getBgColor()}`}>
            {getIcon()}
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 text-center mb-2">{title}</h3>
        <p className="text-gray-600 text-center text-sm mb-6">{message}</p>
        <button
          onClick={onClose}
          className={`py-2.5 rounded-lg text-sm font-medium text-white transition ${getButtonColor()}`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

// --- FULL SCREEN SPINNER COMPONENT ---
const FullScreenSpinner = ({ message = 'Processing...' }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-700 font-medium text-lg">{message}</p>
        <p className="text-gray-400 text-sm">Please wait while we process your request</p>
      </div>
    </div>
  );
};

// --- Status Badge for the Roster Cards ---
const RosterStatusBadge = ({ status }) => {
  let textColor = 'text-green-700';
  let bgColor = 'bg-green-100';
  let borderColor = 'border-green-300';
  let dotColor = 'bg-green-500';

  if (status === 'On Scene') {
    textColor = 'text-orange-700';
    bgColor = 'bg-orange-100';
    borderColor = 'border-orange-300';
    dotColor = 'bg-orange-500';
  } else if (status === 'En Route') {
    textColor = 'text-blue-700';
    bgColor = 'bg-blue-100';
    borderColor = 'border-blue-300';
    dotColor = 'bg-blue-500';
  } else if (status === 'Stand By') {
    textColor = 'text-yellow-700';
    bgColor = 'bg-yellow-100';
    borderColor = 'border-yellow-300';
    dotColor = 'bg-yellow-500';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${bgColor} ${borderColor} ${textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
      • {status}
    </span>
  );
};

// Status Pill for Side Panel
const PanelStatusBadge = ({ label }) => (
  <span className="inline-block bg-[#e6f2ff] text-[#0066cc] border border-[#b3d9ff] px-2.5 py-0.5 rounded-full text-[11px] font-medium">
    <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5 bg-[#0066cc]"></span>
    • {label}
  </span>
);

// Stat Box
const StatBox = ({ number, label, barColor }) => (
  <div className="bg-white rounded border border-gray-200 p-4 flex flex-col justify-between shadow-sm h-24">
    <span className="text-3xl font-bold text-gray-800">{number}</span>
    <div>
      <div className={`border-b-2 ${barColor} pb-1`}>
        <span className="text-[13px] font-medium text-gray-500 pb-0.5">{label}</span>
      </div>
    </div>
  </div>
);

// Applicant Stat Box
const ApplicantStatBox = ({ number, label, color }) => (
  <div className="bg-white rounded border border-gray-200 p-4 flex flex-col justify-between shadow-sm h-24">
    <span className="text-3xl font-bold text-gray-800">{number}</span>
    <div>
      <div className={`border-b-2 ${color} pb-1`}>
        <span className="text-[13px] font-medium text-gray-500 pb-0.5">{label}</span>
      </div>
    </div>
  </div>
);

// Detail Row
const DetailRow = ({ label, value }) => (
  <div className="flex justify-between py-2.5 px-6 border-b border-gray-100 text-[13px]">
    <span className="text-gray-500 font-medium">{label}</span>
    <span className="text-gray-800 font-bold">{value}</span>
  </div>
);

// Section Header
const SectionHeader = ({ title }) => (
  <div className="bg-[#e5e9ee] py-2 px-6 font-medium text-gray-600 border-y border-gray-200 text-[12px]">
    {title}
  </div>
);

// Incident Tag
const IncidentTag = ({ type, title, date, location }) => (
  <div className="flex flex-col mb-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
    <div className="flex items-center gap-2 mb-0.5">
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border ${type === 'Critical' ? 'text-red-600 bg-red-50 border-red-200' :
        'text-green-600 bg-green-50 border-green-200'
        }`}>
        {type}
      </span>
    </div>
    <div className="text-xs font-bold text-gray-800">{title}</div>
    <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
      <span>• {date}</span>
      <span>• {location}</span>
    </div>
  </div>
);

// --- DISPATCH MODAL ---
const DispatchModal = ({ volunteer, onClose, onDispatch }) => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/incidents', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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

  const handleDispatch = async () => {
    if (!selectedIncident) {
      alert('Please select an incident to dispatch to');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/incidents/${selectedIncident}/assign`, {
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
        alert(`✅ ${volunteer.name} has been dispatched successfully!`);
        onDispatch();
        onClose();
      } else {
        alert(`❌ Dispatch failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Dispatch error:', error);
      alert('❌ Failed to dispatch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 font-sans backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        <div className="bg-[#5e747f] px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-white text-lg font-semibold">Dispatch Volunteer</h2>
            <p className="text-blue-100 text-xs opacity-90">Assign a volunteer to an active incident</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition">
            <Icon icon="mdi:close" className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          <div className="w-full md:w-1/3 border-r border-gray-200 bg-[#f5f6f8] overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
            <div className="p-6 flex items-center gap-4 border-b border-gray-200 bg-white">
              <div className="relative w-16 h-16 shrink-0">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
                    <Icon icon="mdi:account" className="w-8 h-8" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{volunteer.name}</h3>
                <p className="text-xs text-gray-500 font-medium">{volunteer.role}</p>
                <div className="mt-1.5 inline-block bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-sm">• {volunteer.status || 'Available'}</div>
              </div>
            </div>
            <div className="p-0 text-xs">
              <div className="bg-[#e5e9ee] py-2 px-6 font-semibold text-gray-600 border-b border-gray-200 text-[11px] uppercase tracking-wider">Profile</div>
              <div className="bg-white divide-y divide-gray-100">
                <div className="flex justify-between py-2.5 px-6"><span className="text-gray-500 font-medium">Volunteer ID</span><span className="text-gray-800 font-semibold">{volunteer.volunteerId || 'V-0861'}</span></div>
                <div className="flex justify-between py-2.5 px-6 bg-[#f7f8fa]"><span className="text-gray-500 font-medium">Contact</span><span className="text-gray-800 font-semibold">{volunteer.details?.contact || 'N/A'}</span></div>
                <div className="flex justify-between py-2.5 px-6"><span className="text-gray-500 font-medium">Years Active</span><span className="text-gray-800 font-semibold">7 Years</span></div>
                <div className="flex justify-between py-2.5 px-6 bg-[#f7f8fa]"><span className="text-gray-500 font-medium">Current Assignment</span><span className="text-gray-800 font-semibold">INC-0322 · ETA 2 mins</span></div>
              </div>
              <div className="bg-[#e5e9ee] py-2 px-6 font-semibold text-gray-600 border-y border-gray-200 text-[11px] uppercase tracking-wider">Recent Incidents</div>
              <div className="bg-white p-5 space-y-3">
                <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-red-600 bg-red-50 border-red-200">Critical</span>
                    <span className="text-[10px] text-gray-500">INC-0322</span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700">Structure Fire</div>
                  <div className="text-[10px] text-gray-500 flex justify-between border-b border-gray-100 pb-1.5">
                    <span>• Today · 9:54</span>
                    <span>• En Route</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-green-600 bg-green-50 border-green-200">Resolved</span>
                    <span className="text-[10px] text-gray-500">INC-862</span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700">Medical Emergency</div>
                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span>• 11/25/25 · 13:24</span>
                    <span>• Resolved</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#e5e9ee] py-2 px-6 font-semibold text-gray-600 border-y border-gray-200 text-[11px] uppercase tracking-wider">Certification and Skills</div>
              <div className="bg-white p-5 flex flex-wrap gap-1.5">
                {volunteer.details?.skills?.slice(0, 8).map((s, idx) => (
                  <span key={idx} className="bg-blue-50 border border-blue-200 text-blue-600 px-2 py-1 rounded text-[10px] font-medium">{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/3 flex flex-col h-full">
            <div className="relative h-48 md:h-64 w-full bg-gray-200 overflow-hidden border-b border-gray-200 shrink-0">
              <div className="absolute inset-0 bg-[#f1f3f4] bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Santa+Rosa,Nueva+Ecija&zoom=13&size=600x300&maptype=roadmap&key=YOUR_API_KEY_HERE')] bg-cover bg-center"></div>
              <div className="absolute top-2 left-2 bg-white rounded shadow text-xs overflow-hidden flex flex-col text-gray-600">
                <button className="px-3 py-1 border-b border-gray-200 hover:bg-gray-50 font-medium">Map</button>
                <button className="px-3 py-1 hover:bg-gray-50 font-medium">Satellite</button>
              </div>
              <div className="absolute top-[30%] left-[55%]"><div className="w-8 h-8 rounded-full bg-yellow-300 opacity-30 animate-ping absolute"></div><Icon icon="mdi:map-marker" className="w-6 h-6 text-yellow-500 drop-shadow-md" /></div>
              <div className="absolute top-[45%] left-[75%]"><div className="w-8 h-8 rounded-full bg-orange-300 opacity-30 animate-ping absolute"></div><Icon icon="mdi:map-marker" className="w-6 h-6 text-orange-500 drop-shadow-md" /></div>
              <div className="absolute top-[60%] left-[35%]"><Icon icon="mdi:map-marker" className="w-6 h-6 text-green-600 drop-shadow-md" /></div>
              <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-4 py-1.5 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-500"><span>Active incidents - Select to assign</span><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span><span>3 Incidents</span></span></div>
            </div>
            <div className="bg-white flex-1 p-5 space-y-5 overflow-y-auto">
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
                  <div key={incident._id} onClick={() => setSelectedIncident(incident._id)} className={`flex gap-3 group cursor-pointer p-3 rounded-lg transition-colors border ${selectedIncident === incident._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${incident.severity === 'Critical' ? 'text-red-600 border-red-300 bg-red-50' : incident.severity === 'Medium' ? 'text-yellow-600 border-yellow-300 bg-yellow-50' : 'text-green-600 border-green-300 bg-green-50'}`}>
                          {incident.severity}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">{incident.incidentId}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${incident.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
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
        <div className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 shrink-0">
          <p className="text-sm text-gray-500">
            Assigning <span className="font-bold text-gray-800">{volunteer.name}</span> to {selectedIncident ? 'selected incident' : 'select an incident above'}
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={onClose} className="flex-1 sm:flex-none bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium py-2 px-6 rounded">Cancel</button>
            <button onClick={handleDispatch} disabled={loading || !selectedIncident} className="flex-1 sm:flex-none bg-[#0081d6] hover:bg-[#006bb3] text-white text-sm font-medium py-2 px-6 rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Dispatching...' : 'Dispatch'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function VolunteerApproval() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('roster');
  const [selectedRosterId, setSelectedRosterId] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // ✅ Loading spinner state for accept/reject
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmColor: 'bg-green-600 hover:bg-green-700',
    icon: 'success',
    iconColor: 'text-green-500',
    onConfirm: null,
    action: null
  });
  const [pendingApplicant, setPendingApplicant] = useState(null);

  // Use refs to prevent multiple requests
  const isLoadingRef = useRef(false);
  const lastRefreshTimeRef = useRef(0);
  const MIN_REFRESH_INTERVAL = 3000;
  const socketRef = useRef(null);

  const getApiUrl = useCallback(() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // For production, use /api (Vercel will proxy it)
    return '/api';  // ✅ CHANGE THIS!
  }, []);

  // Data Fetching - with proper error handling and rate limiting
  const loadAllVolunteers = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastRefreshTimeRef.current) < MIN_REFRESH_INTERVAL) {
      console.log(`⏳ Skipping refresh - only ${Math.round((now - lastRefreshTimeRef.current) / 1000)}s since last refresh`);
      return;
    }

    if (isLoadingRef.current) {
      console.log('⏳ Already loading, skipping...');
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setApiError(null);
    lastRefreshTimeRef.current = now;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token found, user may not be authenticated');
        setApiError('Not authenticated. Please login again.');
        setAllVolunteers([]);
        setApplicants([]);
        isLoadingRef.current = false;
        setLoading(false);
        return;
      }

      const apiUrl = getApiUrl();
      const endpoint = `${apiUrl}/admin/all-volunteers`;
      console.log('📡 Fetching from:', endpoint);

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        if (response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please check server configuration.';
          console.warn('⚠️ Endpoint not found:', endpoint);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('📊 API Response received');

      if (data.success) {
        const transformedData = data.data.map(volunteer => {
          let status = 'pending';
          if (volunteer.applicationStatus === 'approved' || volunteer.isApproved) status = 'accepted';
          else if (volunteer.applicationStatus === 'rejected') status = 'rejected';
          else if (volunteer.applicationStatus === 'pending') status = 'pending';

          let certs = volunteer.certifications || [];
          if (typeof certs === 'string') {
            try { certs = JSON.parse(certs); } catch (e) { certs = []; }
          }

          let availability = volunteer.availability || [];
          if (typeof availability === 'string') {
            try { availability = JSON.parse(availability); } catch (e) { availability = []; }
          }

          let description = volunteer.description || `I am ${volunteer.firstName || 'Applicant'} ${volunteer.lastName || ''}.`;

          let experienceDisplay = 'N/A';
          const expRaw = volunteer.yearsOfExperience;
          if (expRaw && expRaw !== '') {
            const numExp = Number(expRaw);
            if (!isNaN(numExp)) {
              if (numExp === 0) experienceDisplay = '< 1 Year';
              else if (numExp === 1) experienceDisplay = '1 Year';
              else experienceDisplay = `${numExp} Years`;
            } else {
              experienceDisplay = String(expRaw);
            }
          }

          const loc = volunteer.address1 || volunteer.application?.address1 || volunteer.address2 || volunteer.application?.address2 || "N/A";

          return {
            id: volunteer._id,
            userId: volunteer._id,
            appId: `APP-${volunteer._id ? volunteer._id.slice(-5) : '00000'}`,
            name: `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim() || "Unknown User",
            role: volunteer.preferredRole || volunteer.application?.preferredRole || "Volunteer Applicant",
            experience: experienceDisplay,
            location: loc,
            status: status,
            tags: certs.slice(0, 3).map(s => s.length > 15 ? s.substring(0, 15) + '...' : s),
            hasMoreSkills: certs.length > 3,
            availability: availability,
            description: description,
            appliedDate: volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
            details: {
              age: volunteer.age || 'N/A',
              email: volunteer.email || 'N/A',
              contact: volunteer.phoneNumber || 'N/A',
              location: loc,
              preferredRole: volunteer.preferredRole || volunteer.application?.preferredRole || 'N/A',
              certs: certs,
              skills: certs,
              files: volunteer.files || []
            }
          };
        });

        const acceptedVolunteers = transformedData.filter(v => v.status === 'accepted');
        const pendingApplicants = transformedData.filter(v => v.status === 'pending');

        setAllVolunteers(acceptedVolunteers);
        setApplicants(pendingApplicants);

        window.dispatchEvent(new CustomEvent('volunteerCountUpdated', {
          detail: {
            pendingCount: pendingApplicants.length
          }
        }));

        console.log(`📊 Loaded: ${acceptedVolunteers.length} volunteers, ${pendingApplicants.length} applicants`);
      } else {
        console.error('API returned error:', data.message);
        setApiError(data.message || 'Failed to load volunteers');
        setAllVolunteers([]);
        setApplicants([]);
      }
    } catch (error) {
      console.error("❌ Failed to load volunteers:", error);
      setApiError(error.message || 'Network error. Please check your connection.');
      setAllVolunteers([]);
      setApplicants([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [getApiUrl, navigate]);

  // Setup WebSocket for real-time volunteer updates
  useEffect(() => {
    const setupSocket = () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || !user._id) {
          console.warn('No token or user ID found for socket connection');
          return;
        }

        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5000'
          : 'https://sta-rosa-rescue-system-backend.onrender.com';  // ✅ Your Render URL

        socketRef.current = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        socketRef.current.on('connect', () => {
          console.log('✅ VolunteerApproval socket connected');
          socketRef.current.emit('join', user._id);
          socketRef.current.emit('join-room', 'admin');
        });

        socketRef.current.on('disconnect', () => {
          console.log('❌ VolunteerApproval socket disconnected');
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        socketRef.current.on('new_volunteer_application', (data) => {
          console.log('👤 New volunteer application received via socket:', data);
          loadAllVolunteers(true);
        });

        socketRef.current.on('volunteer_application_updated', (data) => {
          console.log('🔄 Volunteer application updated via socket:', data);
          loadAllVolunteers(true);
        });

        socketRef.current.on('new_notification', (notification) => {
          console.log('📢 New notification via socket:', notification);
          if (notification.type === 'new_volunteer' ||
            notification.type === 'volunteer_status' ||
            notification.type === 'volunteer_application') {
            loadAllVolunteers(true);
          }
        });

      } catch (error) {
        console.error("Failed to setup socket:", error);
      }
    };

    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [loadAllVolunteers]);

  // Subscribe to notification service events
  useEffect(() => {
    const unsubscribe = notificationService.addListener((data) => {
      console.log('📢 Notification service event:', data);
      if (data.type === 'show') {
        const notification = data.notification || {};
        if (notification.type === 'volunteer_status' ||
          notification.type === 'new_volunteer' ||
          notification.type === 'volunteer_application' ||
          notification.title?.toLowerCase().includes('volunteer') ||
          notification.message?.toLowerCase().includes('volunteer')) {
          console.log('🔄 Volunteer notification detected, refreshing...');
          loadAllVolunteers(true);
        }
      }
    });

    return unsubscribe;
  }, [loadAllVolunteers]);

  // Listen for refresh events from the layout
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Manual refresh requested');
      loadAllVolunteers(true);
    };

    const handleCountUpdate = (event) => {
      console.log('📊 Count update event received:', event.detail);
      if (event.detail && event.detail.pendingCount !== undefined) {
        loadAllVolunteers(true);
      }
    };

    const handleNewVolunteerApplication = () => {
      console.log('👤 New volunteer application detected via event');
      loadAllVolunteers(true);
    };

    window.addEventListener('refreshVolunteerList', handleRefresh);
    window.addEventListener('volunteerCountUpdated', handleCountUpdate);
    window.addEventListener('newVolunteerApplication', handleNewVolunteerApplication);
    window.addEventListener('volunteerApplicationReceived', handleNewVolunteerApplication);

    return () => {
      window.removeEventListener('refreshVolunteerList', handleRefresh);
      window.removeEventListener('volunteerCountUpdated', handleCountUpdate);
      window.removeEventListener('newVolunteerApplication', handleNewVolunteerApplication);
      window.removeEventListener('volunteerApplicationReceived', handleNewVolunteerApplication);
    };
  }, [loadAllVolunteers]);

  // Polling fallback - every 10 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (!document.hidden && !isLoadingRef.current) {
        const now = Date.now();
        if ((now - lastRefreshTimeRef.current) > 10000) {
          console.log('🔄 Polling for updates...');
          loadAllVolunteers(false);
        }
      }
    }, 10000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [loadAllVolunteers]);

  // Initial load
  useEffect(() => {
    loadAllVolunteers(true);
  }, []);

  // Find selected volunteer/applicant
  const activeVolunteer = allVolunteers.find(v => v.id === selectedRosterId);
  const activeApplicant = applicants.find(a => a.id === selectedApplicant?.id);

  const handleCloseRoster = () => setSelectedRosterId(null);
  const handleCloseApplicant = () => setSelectedApplicant(null);

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    setSelectedRosterId(null);
    setSelectedApplicant(null);
  };

  const handleDispatchClick = () => {
    if (activeVolunteer) setIsDispatchModalOpen(true);
  };

  const handleDispatchComplete = () => {
    loadAllVolunteers(true);
  };

  // Handle Accept
  const handleAcceptClick = (applicant) => {
    setPendingApplicant(applicant);
    setModalData({
      title: `Accept ${applicant.name}?`,
      message: `Are you sure you want to ACCEPT ${applicant.name} as a volunteer? This action cannot be undone.`,
      confirmText: 'Yes, Accept',
      confirmColor: 'bg-green-600 hover:bg-green-700',
      icon: 'success',
      iconColor: 'text-green-500',
      action: 'accept',
      onConfirm: () => handleConfirmAccept(applicant)
    });
    setShowConfirmModal(true);
  };

  // Handle Reject
  const handleRejectClick = (applicant) => {
    setPendingApplicant(applicant);
    setModalData({
      title: `Reject ${applicant.name}?`,
      message: `Are you sure you want to REJECT ${applicant.name}? This action cannot be undone.`,
      confirmText: 'Yes, Reject',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      icon: 'error',
      iconColor: 'text-red-500',
      action: 'reject',
      onConfirm: () => handleConfirmReject(applicant)
    });
    setShowConfirmModal(true);
  };

  // ✅ Confirm Accept with loading spinner
  const handleConfirmAccept = async (applicant) => {
    setIsProcessing(true);
    setProcessingMessage(`Accepting ${applicant.name}...`);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/admin/approve-volunteer/${applicant.userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      setIsProcessing(false);

      if (data.success) {
        setModalData({
          title: 'Accepted!',
          message: `${applicant.name} has been ACCEPTED as a volunteer. They will receive an email notification.`,
          confirmText: 'OK',
          confirmColor: 'bg-green-600 hover:bg-green-700',
          icon: 'success',
          iconColor: 'text-green-500',
          action: null,
          onConfirm: null
        });
        setShowResultModal(true);
        loadAllVolunteers(true);
        setSelectedApplicant(null);
      } else {
        setModalData({
          title: '❌ Failed',
          message: data.message || 'Failed to accept volunteer. Please try again.',
          confirmText: 'OK',
          confirmColor: 'bg-red-600 hover:bg-red-700',
          icon: 'error',
          iconColor: 'text-red-500',
          action: null,
          onConfirm: null
        });
        setShowResultModal(true);
      }
    } catch (error) {
      setIsProcessing(false);
      setModalData({
        title: '❌ Error',
        message: 'Error accepting volunteer. Please try again.',
        confirmText: 'OK',
        confirmColor: 'bg-red-600 hover:bg-red-700',
        icon: 'error',
        iconColor: 'text-red-500',
        action: null,
        onConfirm: null
      });
      setShowResultModal(true);
    }
  };

  // ✅ Confirm Reject with loading spinner
  const handleConfirmReject = async (applicant) => {
    setIsProcessing(true);
    setProcessingMessage(`Rejecting ${applicant.name}...`);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/admin/reject-volunteer/${applicant.userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      setIsProcessing(false);

      if (data.success) {
        setModalData({
          title: 'Rejected',
          message: `${applicant.name} has been rejected. They will receive an email notification.`,
          confirmText: 'OK',
          confirmColor: 'bg-red-600 hover:bg-red-700',
          icon: 'error',
          iconColor: 'text-red-500',
          action: null,
          onConfirm: null
        });
        setShowResultModal(true);
        loadAllVolunteers(true);
        setSelectedApplicant(null);
      } else {
        setModalData({
          title: '❌ Failed',
          message: data.message || 'Failed to reject volunteer. Please try again.',
          confirmText: 'OK',
          confirmColor: 'bg-red-600 hover:bg-red-700',
          icon: 'error',
          iconColor: 'text-red-500',
          action: null,
          onConfirm: null
        });
        setShowResultModal(true);
      }
    } catch (error) {
      setIsProcessing(false);
      setModalData({
        title: '❌ Error',
        message: 'Error rejecting volunteer. Please try again.',
        confirmText: 'OK',
        confirmColor: 'bg-red-600 hover:bg-red-700',
        icon: 'error',
        iconColor: 'text-red-500',
        action: null,
        onConfirm: null
      });
      setShowResultModal(true);
    }
  };

  const pendingApplicantCount = applicants.length;

  // Mock statuses for roster display
  const mockStatuses = ['On Scene', 'En Route', 'Available', 'Stand By'];
  const mockAssignments = ['INC-004', 'INC-006', 'INC-007', 'INC-008'];
  const mockETAs = ['2 Mins', '3 Mins', '5 Mins', '1 Min'];

  // Show error state if API failed
  if (apiError && !loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] p-6 font-sans flex flex-col items-center justify-center">
        <Icon icon="mdi:alert-circle" className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Data</h2>
        <p className="text-gray-600 text-center max-w-md">{apiError}</p>
        <button
          onClick={() => loadAllVolunteers(true)}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading && allVolunteers.length === 0 && applicants.length === 0) {
    return (
      <div className="min-h-screen bg-white p-6 font-sans flex justify-center items-center">
        <div className="text-gray-500">Loading volunteers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 font-sans relative">

      {/* ✅ FULL SCREEN SPINNER - Shows during accept/reject */}
      {isProcessing && <FullScreenSpinner message={processingMessage} />}

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={modalData.onConfirm}
        title={modalData.title}
        message={modalData.message}
        confirmText={modalData.confirmText}
        confirmColor={modalData.confirmColor}
        icon={modalData.icon}
        iconColor={modalData.iconColor}
      />

      {/* RESULT TOAST MODAL */}
      <ToastModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.icon === 'success' ? 'success' : modalData.icon === 'error' ? 'error' : 'warning'}
      />

      {/* Header */}
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Icon icon="mdi:account-group" className="w-8 h-8 text-[#1f4e6f]" />
          <div>
            <h1 className="text-2xl font-bold text-[#1f4e6f] tracking-tight">Volunteers</h1>
            <p className="text-xs text-gray-400 font-medium">Volunteer roster & deployment status</p>
            <p className="text-xs text-gray-400 font-medium">Santa Rosa Emergency Response</p>
          </div>
        </div>
        <div className="relative w-80">
          <Icon icon="mdi:search" className="absolute left-3 top-2.5 text-gray-400 text-sm" />
          <input type="text" placeholder="Search ID, type, location..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex gap-6 h-[calc(100vh-140px)]">

        {/* LEFT COLUMN (LIST) */}
        <div className="flex-1 flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-gray-200 px-6 pt-4 pb-0 bg-white">
            <button onClick={() => handleSwitchTab('roster')} className={`flex items-center gap-2 pb-4 border-b-2 text-sm font-bold ${activeTab === 'roster' ? 'border-[#1f4e6f] text-[#1f4e6f]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon icon="mdi:list" className="w-4 h-4" /> Roster
            </button>
            <button onClick={() => handleSwitchTab('applicant')} className={`flex items-center gap-2 pb-4 border-b-2 text-sm font-bold ${activeTab === 'applicant' ? 'border-[#1f4e6f] text-[#1f4e6f]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon icon="mdi:card-account-details" className="w-4 h-4" /> Applicant
              {pendingApplicantCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {pendingApplicantCount}
                </span>
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-white p-6">

            {/* --- ROSTER VIEW --- */}
            {activeTab === 'roster' && (
              <>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <StatBox number={allVolunteers.length} label="Total Volunteers" barColor="border-gray-400" />
                  <StatBox number={allVolunteers.filter(v => v.status === 'Active').length} label="Active" barColor="border-green-600" />
                  <StatBox number={allVolunteers.filter(v => v.status === 'Deployed').length} label="Deployed" barColor="border-orange-400" />
                  <StatBox number={allVolunteers.filter(v => v.status === 'Stand By').length} label="Stand By" barColor="border-yellow-400" />
                </div>

                <div className="flex gap-6 mb-6">
                  <div className="flex items-center gap-2"><span className="text-sm text-gray-600 font-medium">Status</span><select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white"><option>All Roles</option></select></div>
                  <div className="flex items-center gap-2"><span className="text-sm text-gray-600 font-medium">Role</span><select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white"><option>All Roles</option></select></div>
                </div>

                {/* Card Grid */}
                <div className="grid grid-cols-2 gap-5">
                  {allVolunteers.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-400">
                      No volunteers found. Add volunteers to get started.
                    </div>
                  ) : (
                    allVolunteers.map((v, index) => {
                      const statusIndex = index % 4;
                      const mockStatus = mockStatuses[statusIndex];
                      const mockAssignment = mockAssignments[index % 4];
                      const mockETA = mockETAs[index % 4];

                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedRosterId(v.id)}
                          className={`bg-[#f5f7fc] rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative ${selectedRosterId === v.id ? 'ring-2 ring-blue-400' : ''}`}
                        >
                          <div className={`h-1.5 w-full ${mockStatus === 'On Scene' ? 'bg-orange-500' :
                            mockStatus === 'En Route' ? 'bg-blue-500' :
                              mockStatus === 'Available' ? 'bg-green-600' :
                                'bg-yellow-400'
                            }`}></div>

                          <div className="p-5 pb-3">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-[#dbe0e8] flex-shrink-0 flex items-center justify-center text-gray-400">
                                <Icon icon="mdi:account" className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="font-bold text-[15px] text-gray-800">{v.name}</div>
                                <div className="text-[12px] text-gray-500">{v.role}</div>
                                <div className="mt-1.5">
                                  <RosterStatusBadge status={mockStatus} />
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-gray-200 pt-3 mt-2">
                              <div className="text-[12px] font-medium text-gray-500 mb-1.5">Speciality</div>
                              <div className="flex flex-wrap">
                                {v.details?.skills?.slice(0, 3).map((s, idx) => (
                                  <span key={idx} className="inline-block bg-blue-50 text-blue-600 text-[11px] font-medium px-2.5 py-1 rounded border border-blue-100 mr-1.5 mb-1.5">
                                    {s}
                                  </span>
                                ))}
                                {v.hasMoreSkills && (
                                  <span className="inline-block bg-white border border-gray-200 text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded">
                                    +{v.details?.certs?.length - 3 || 0}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[12px] bg-gray-100/60 rounded px-3 py-1.5 mt-3 -mx-1">
                              <div>
                                <span className="text-gray-500">Assignment: </span>
                                <span className="font-semibold text-[#3b82f6]">{mockAssignment}</span>
                              </div>
                              <div className="text-orange-400 font-semibold">
                                ETA <span className="bg-[#fff2e5] px-2 py-0.5 rounded ml-1 text-orange-400">{mockETA}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* --- APPLICANT VIEW --- */}
            {activeTab === 'applicant' && (
              <>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <ApplicantStatBox number={applicants.length + allVolunteers.length} label="Total Applicants" color="border-gray-400" />
                  <ApplicantStatBox number={pendingApplicantCount} label="Pending Review" color="border-orange-400" />
                  <ApplicantStatBox number={allVolunteers.length} label="Accepted" color="border-green-600" />
                  <ApplicantStatBox number="0" label="Rejected" color="border-gray-200" />
                </div>

                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 font-medium">Sort By:</span>
                    <button className="text-[11px] px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700 font-medium">Latest First</button>
                    <button className="text-[11px] px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700 font-medium">Name A-Z</button>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">{pendingApplicantCount} Applicants</span>
                </div>

                <div className="flex flex-col gap-3">
                  {applicants.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      No pending applicants. All good!
                    </div>
                  ) : (
                    applicants.map((app) => (
                      <div key={app.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                        <div className="p-4 pb-3 relative">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 mt-1"></div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="font-bold text-[17px] text-gray-800 leading-tight">{app.name}</div>
                              <div className="text-[13px] text-gray-500 leading-snug">{app.role} · {app.experience}</div>
                              <div className="text-[13px] text-gray-400 leading-snug">{app.location}</div>
                              <div className="-ml-[44px] flex flex-col gap-1.5 mt-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  {app.tags && app.tags.length > 0 ? (
                                    <>
                                      {app.tags.map((t, idx) => (
                                        <span key={idx} className="bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-medium px-2.5 py-1 rounded-full truncate max-w-[120px]">
                                          {t}
                                        </span>
                                      ))}
                                      {app.hasMoreSkills && (
                                        <span className="bg-white border border-gray-200 text-gray-600 text-[10px] font-medium px-2.5 py-1 rounded-full">
                                          + {app.details?.certs?.length - 3 || 0} Skills
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-xs text-gray-400 italic">No certifications listed</div>
                                  )}
                                </div>
                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[13px] text-gray-600 font-medium">
                                  <span>Availability:</span>
                                  <div className="flex items-center gap-[2px]">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                      <div key={day} className={`w-5 h-2.5 rounded-sm ${app.availability && app.availability.includes(day) ? 'bg-[#15803d]' : 'bg-gray-200'}`}></div>
                                    ))}
                                  </div>
                                  <span className="ml-1 font-normal text-gray-500">
                                    {app.availability && Array.isArray(app.availability) && app.availability.length > 0
                                      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter(day => app.availability.includes(day)).join(' · ')
                                      : 'None selected'}
                                  </span>
                                </div>
                                <div className="text-[13px] text-gray-700 leading-relaxed">
                                  {app.description}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex border-t border-gray-200 bg-white divide-x divide-gray-200">
                          <button onClick={() => setSelectedApplicant(app)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-gray-600 text-sm hover:bg-gray-50 transition-colors font-medium">
                            <Icon icon="mdi:magnify" className="w-4 h-4" /> View Full Application
                          </button>
                          <button
                            onClick={() => handleAcceptClick(app)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-green-600 text-sm hover:bg-green-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Icon icon="mdi:check" className="w-4 h-4" /> Accept
                          </button>
                          <button
                            onClick={() => handleRejectClick(app)}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-red-500 text-sm hover:bg-red-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Icon icon="mdi:close" className="w-4 h-4" /> Reject
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN (SIDEBAR) --- */}
        <div className="w-[380px] bg-white rounded-xl border border-gray-200 shadow-lg h-[calc(100vh-140px)] sticky top-6 overflow-hidden shrink-0">

          {/* ROSTER EMPTY STATE */}
          {activeTab === 'roster' && !activeVolunteer && (
            <div className="h-full flex flex-col items-center justify-center p-6">
              <Icon icon="mdi:account-search" className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-800">No Selection</h3>
              <p className="text-sm text-gray-500 font-medium max-w-[250px] text-center">
                Click a volunteer card to view full details.
              </p>
            </div>
          )}

          {/* ROSTER PANEL */}
          {activeTab === 'roster' && activeVolunteer && (
            <div className="h-full flex flex-col relative">
              <div className="p-6 flex items-center gap-4 relative border-b border-gray-200">
                <div className="w-16 h-16 rounded-full bg-[#dbe0e8] flex-shrink-0 relative flex items-center justify-center">
                  <Icon icon="mdi:account" className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-[20px] font-bold text-gray-800">{activeVolunteer.name}</h3>
                  <p className="text-[13px] text-gray-500 font-medium">{activeVolunteer.role}</p>
                  <div className="mt-1.5">
                    <PanelStatusBadge label="Available" />
                  </div>
                </div>
                <button onClick={handleCloseRoster} className="text-gray-400 hover:text-gray-600 p-1 absolute top-4 right-4 transition-colors">
                  <Icon icon="mdi:close" className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto text-[13px] pb-20">
                <SectionHeader title="Profile" />
                <div className="flex flex-col bg-white">
                  <DetailRow label="Volunteer ID" value="V-0861" />
                  <DetailRow label="Contact" value={activeVolunteer.details?.contact || 'N/A'} />
                  <DetailRow label="Years Active" value="7 Years" />
                  <DetailRow label="Current Assignment" value="INC-0322 · ETA 2 mins" />
                </div>

                <SectionHeader title="Recent Incidents" />
                <div className="p-6 space-y-4 bg-white border-b border-gray-200">
                  <IncidentTag type="Critical" title="Structure Fire" date="Today · 9:54" location="En Route" />
                  <IncidentTag type="Resolved" title="Medical Emergency" date="11/25/25 · 13:24" location="Resolved" />
                </div>

                <SectionHeader title="Certification and Skills" />
                <div className="p-6 flex flex-wrap gap-1.5 bg-white">
                  {activeVolunteer.details?.skills?.slice(0, 8).map((s, idx) => (
                    <span key={idx} className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded text-[11px] font-medium shadow-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3">
                <button onClick={handleDispatchClick} className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white text-[13px] font-medium py-2 rounded transition-colors">
                  Dispatch
                </button>
                <button className="flex-1 bg-white border border-blue-300 hover:bg-blue-50 text-gray-700 text-[13px] font-medium py-2 rounded transition-colors">
                  Stand by
                </button>
              </div>
            </div>
          )}

          {/* APPLICANT EMPTY STATE */}
          {activeTab === 'applicant' && !activeApplicant && (
            <div className="h-full flex flex-col items-center justify-center p-6">
              <Icon icon="mdi:card-account-details" className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-800">No Selection</h3>
              <p className="text-sm text-gray-500 font-medium max-w-[250px] text-center">
                Click "View Full Application" to inspect a candidate.
              </p>
            </div>
          )}

          {/* APPLICANT DETAIL PANEL */}
          {activeTab === 'applicant' && activeApplicant && (
            <div className="h-full flex flex-col relative">
              <div className="relative pt-4 pr-4 flex justify-end">
                <button onClick={handleCloseApplicant} className="text-gray-400 hover:text-gray-600 text-xl">
                  <Icon icon="mdi:close" className="w-6 h-6" />
                </button>
              </div>

              <div className="px-6 pb-4 flex gap-4 border-b border-gray-200">
                <div className="w-16 h-16 rounded-full bg-[#dbeafe] flex-shrink-0 flex items-center justify-center text-blue-400 text-2xl border-2 border-[#bfdbfe]">
                  <Icon icon="mdi:account" className="w-8 h-8" />
                </div>
                <div className="flex-1 pt-1">
                  <h2 className="text-xl font-bold text-gray-900">{activeApplicant.name}</h2>
                  <p className="text-xs text-gray-500 font-medium">{activeApplicant.role} · {activeApplicant.experience}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Applied {activeApplicant.appliedDate}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <PanelStatusBadge label="Pending Application" />
                    <span className="text-[11px] text-gray-400 font-medium">{activeApplicant.appId}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-white pb-20">
                <SectionHeader title="Personal Information" />
                <div className="flex flex-col bg-white">
                  <DetailRow label="Age" value={activeApplicant.details?.age || 'N/A'} />
                  <DetailRow label="Email" value={activeApplicant.details?.email || 'N/A'} />
                  <DetailRow label="Contact" value={activeApplicant.details?.contact || 'N/A'} />
                  <DetailRow label="Location" value={activeApplicant.details?.location || 'N/A'} />
                  <DetailRow label="Preferred Role" value={activeApplicant.details?.preferredRole || 'N/A'} />
                  <DetailRow label="Availability" value={
                    activeApplicant.availability && Array.isArray(activeApplicant.availability) && activeApplicant.availability.length > 0
                      ? activeApplicant.availability.join(', ')
                      : 'N/A'
                  } />
                </div>

                <SectionHeader title="Certifications" />
                <div className="px-6 py-3 flex flex-wrap gap-2">
                  {activeApplicant.details?.certs?.length > 0 ? (
                    activeApplicant.details.certs.map((c, idx) => (
                      <span key={idx} className="bg-[#e6f2ff] text-[#007bff] border border-[#b8daff] text-[11px] font-medium px-3 py-1 rounded">{c}</span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No certifications listed</span>
                  )}
                </div>

                <SectionHeader title="Skills" />
                <div className="px-6 py-3 flex flex-wrap gap-2">
                  {activeApplicant.details?.skills?.length > 0 ? (
                    activeApplicant.details.skills.map((s, idx) => (
                      <span key={idx} className="bg-white text-gray-600 border border-gray-200 text-[11px] font-medium px-3 py-1 rounded">{s}</span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No skills listed</span>
                  )}
                </div>

                <SectionHeader title="Uploaded Certifications" />
                <div className="px-6 py-3 flex flex-wrap gap-3">
                  {activeApplicant.details?.files?.length > 0 ? (
                    activeApplicant.details.files.map((file, idx) => {
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (file.url) {
                              const link = document.createElement('a');
                              link.href = file.url;
                              link.download = file.name || 'document.pdf';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              alert("No file data found.");
                            }
                          }}
                          className="flex flex-col items-center justify-center border border-gray-200 bg-gray-50 rounded p-2 w-20 h-20 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                        >
                          {file.type && file.type.startsWith('image/') ? (
                            <Icon icon="mdi:image" className="text-2xl text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
                          ) : (
                            <Icon icon="mdi:file-pdf-box" className="text-2xl text-red-500 mb-1 group-hover:scale-110 transition-transform" />
                          )}
                          <span className="text-[9px] text-gray-600 text-center truncate w-full group-hover:text-blue-600 transition-colors">
                            {file.name || 'File'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-gray-400 italic">No documents uploaded</span>
                  )}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => handleRejectClick(activeApplicant)}
                  disabled={isProcessing}
                  className="flex-1 bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb] text-[11px] font-medium py-1.5 px-2 rounded hover:bg-[#f1c0c5] transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="mdi:close" className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={handleCloseApplicant}
                  disabled={isProcessing}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 text-[11px] font-medium py-1.5 px-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Close
                </button>
                <button
                  onClick={() => handleAcceptClick(activeApplicant)}
                  disabled={isProcessing}
                  className="flex-1 bg-[#28a745] text-white text-[11px] font-medium py-1.5 px-2 rounded hover:bg-[#218838] transition-colors shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="mdi:check" className="w-4 h-4" /> Accept Volunteer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isDispatchModalOpen && activeVolunteer && (
        <DispatchModal
          volunteer={activeVolunteer}
          onClose={() => setIsDispatchModalOpen(false)}
          onDispatch={handleDispatchComplete}
        />
      )}
    </div>
  );
}