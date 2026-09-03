import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from "@iconify/react";
import notificationService from "../../services/notificationService";
import io from 'socket.io-client';

// Import split components
import {
  ConfirmationModal, ToastModal, FullScreenSpinner, DispatchModal
} from './VolunteerModals';
import {
  StatBox, ApplicantStatBox, PanelStatusBadge, RosterStatusBadge,
  SectionHeader, DetailRow, IncidentTag
} from './VolunteerUI';
import { RosterView, ApplicantView } from './VolunteerList';

/**
 * Volunteer Approval Component
 * Manages volunteer roster and applicant approvals with real-time updates
 */
export default function VolunteerApproval() {
  const navigate = useNavigate();

  // Search and filter state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  // Tab and selection state
  const [activeTab, setActiveTab] = useState('roster');
  const [selectedRosterId, setSelectedRosterId] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Modal states
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // Data state
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Real-time status tracking
  const [liveStatuses, setLiveStatuses] = useState({});

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Modal data
  const [modalData, setModalData] = useState({
    title: '', message: '', confirmText: 'Confirm', confirmColor: 'bg-green-600 hover:bg-green-700',
    icon: 'success', iconColor: 'text-green-500', onConfirm: null, action: null
  });
  const [pendingApplicant, setPendingApplicant] = useState(null);

  // Refs for loading and refresh
  const isLoadingRef = useRef(false);
  const lastRefreshTimeRef = useRef(0);
  const MIN_REFRESH_INTERVAL = 3000;
  const socketRef = useRef(null);

  /**
   * Get API URL based on environment
   */
  const getApiUrl = useCallback(() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return '/api';
  }, []);

  /**
 * Load all volunteers from API
 */
  const loadAllVolunteers = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastRefreshTimeRef.current) < MIN_REFRESH_INTERVAL) {
      console.log(`⏳ Skipping refresh - only ${Math.round((now - lastRefreshTimeRef.current) / 1000)}s since last refresh`);
      return;
    }
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);
    setApiError(null);
    lastRefreshTimeRef.current = now;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('Not authenticated. Please login again.');
        isLoadingRef.current = false;
        setLoading(false);
        return;
      }

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/admin/all-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        // Filter only users with role = 'volunteer'
        const volunteersOnly = data.data.filter(user => user.role === 'volunteer');

        const transformedData = volunteersOnly.map(volunteer => {
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

          // ✅ FIX: COMBINE STREET ADDRESS AND BARANGAY
          const street = volunteer.address1 || volunteer.application?.address1 || '';
          const barangay = volunteer.address2 || volunteer.application?.address2 || '';
          const loc = [street, barangay].filter(Boolean).join(', ') || "N/A";

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
            createdAtTimestamp: volunteer.createdAt ? new Date(volunteer.createdAt).getTime() : 0,
            profileImage: volunteer.profileImage || null,
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

        // Apply search filter
        let filteredApplicants = pendingApplicants;
        if (searchQuery.trim() !== "") {
          const lowerQuery = searchQuery.toLowerCase();
          filteredApplicants = filteredApplicants.filter(app =>
            app.name.toLowerCase().includes(lowerQuery)
          );
        }

        // Apply sort
        filteredApplicants.sort((a, b) => {
          switch (sortOption) {
            case 'newest': return b.createdAtTimestamp - a.createdAtTimestamp;
            case 'oldest': return a.createdAtTimestamp - b.createdAtTimestamp;
            case 'a-z': return a.name.localeCompare(b.name);
            case 'z-a': return b.name.localeCompare(a.name);
            default: return 0;
          }
        });

        setAllVolunteers(acceptedVolunteers);
        setApplicants(filteredApplicants);
      } else {
        setApiError(data.message || 'Failed to load volunteers');
        setAllVolunteers([]);
        setApplicants([]);
      }
    } catch (error) {
      setApiError(error.message || 'Network error. Please check your connection.');
      setAllVolunteers([]);
      setApplicants([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
      isLoadingRef.current = false;
    }
  }, [getApiUrl, searchQuery, sortOption]);

  /**
   * Setup WebSocket for real-time status updates
   */
  useEffect(() => {
    const setupSocket = () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!token || !user._id) return;

        const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5000'
          : 'https://sta-rosa-rescue-system-backend.onrender.com';

        socketRef.current = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        socketRef.current.on('connect', () => {
          socketRef.current.emit('join', user._id);
          socketRef.current.emit('join-room', 'admin');
        });

        // Real-time incident status updates
        socketRef.current.on('volunteer_status_update', (data) => {
          setLiveStatuses(prev => ({
            ...prev,
            [data.volunteerId || data.id]: {
              status: data.status,
              location: data.location,
              timestamp: new Date().toISOString()
            }
          }));
          loadAllVolunteers(true);
        });

        socketRef.current.on('volunteer_location_update', (data) => {
          setLiveStatuses(prev => ({
            ...prev,
            [data.volunteerId || data.id]: {
              status: 'en-route',
              location: data.location,
              timestamp: new Date().toISOString()
            }
          }));
          loadAllVolunteers(true);
        });

        socketRef.current.on('volunteer_arrived', (data) => {
          setLiveStatuses(prev => ({
            ...prev,
            [data.volunteerId || data.id]: {
              status: 'arrived',
              location: data.location,
              timestamp: new Date().toISOString()
            }
          }));
          loadAllVolunteers(true);
        });

        socketRef.current.on('new_volunteer_application', () => loadAllVolunteers(true));
        socketRef.current.on('volunteer_application_updated', () => loadAllVolunteers(true));
        socketRef.current.on('new_notification', (notification) => {
          if (notification.type === 'new_volunteer' || notification.type === 'volunteer_status' || notification.type === 'volunteer_application') {
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

  /**
   * Polling for updates
   */
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (!document.hidden && !isLoadingRef.current) {
        const now = Date.now();
        if ((now - lastRefreshTimeRef.current) > 10000) loadAllVolunteers(false);
      }
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [loadAllVolunteers]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadAllVolunteers(true);
  }, []);

  /**
   * Get volunteer status
   */
  const getVolunteerStatus = (volunteerId) => {
    const live = liveStatuses[volunteerId];
    if (live) {
      if (live.status === 'en-route') return 'En Route';
      if (live.status === 'arrived') return 'On Scene';
      if (live.status === 'dispatched') return 'Dispatched';
    }
    return 'Available';
  };

  // Data setters
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

  /**
   * Handle accept click
   */
  const handleAcceptClick = (applicant) => {
    setPendingApplicant(applicant);
    setModalData({
      title: `Accept ${applicant.name}?`,
      message: `Are you sure you want to ACCEPT ${applicant.name} as a volunteer?`,
      confirmText: 'Yes, Accept',
      confirmColor: 'bg-green-600 hover:bg-green-700',
      icon: 'success',
      iconColor: 'text-green-500',
      action: 'accept',
      onConfirm: () => handleConfirmAccept(applicant)
    });
    setShowConfirmModal(true);
  };

  /**
   * Handle reject click
   */
  const handleRejectClick = (applicant) => {
    setPendingApplicant(applicant);
    setModalData({
      title: `Reject ${applicant.name}?`,
      message: `Are you sure you want to REJECT ${applicant.name}?`,
      confirmText: 'Yes, Reject',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      icon: 'error',
      iconColor: 'text-red-500',
      action: 'reject',
      onConfirm: () => handleConfirmReject(applicant)
    });
    setShowConfirmModal(true);
  };

  /**
   * Confirm accept action
   */
  const handleConfirmAccept = async (applicant) => {
    setIsProcessing(true);
    setProcessingMessage(`Accepting ${applicant.name}...`);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/admin/approve-volunteer/${applicant.userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setIsProcessing(false);
      if (data.success) {
        setModalData({
          title: 'Accepted!',
          message: `${applicant.name} has been ACCEPTED.`,
          confirmText: 'OK',
          confirmColor: 'bg-green-600',
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
          message: data.message || 'Failed to accept.',
          confirmText: 'OK',
          confirmColor: 'bg-red-600',
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
        message: 'Error accepting volunteer.',
        confirmText: 'OK',
        confirmColor: 'bg-red-600',
        icon: 'error',
        iconColor: 'text-red-500',
        action: null,
        onConfirm: null
      });
      setShowResultModal(true);
    }
  };

  /**
   * Confirm reject action
   */
  const handleConfirmReject = async (applicant) => {
    setIsProcessing(true);
    setProcessingMessage(`Rejecting ${applicant.name}...`);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/admin/reject-volunteer/${applicant.userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setIsProcessing(false);
      if (data.success) {
        setModalData({
          title: 'Rejected',
          message: `${applicant.name} has been rejected.`,
          confirmText: 'OK',
          confirmColor: 'bg-red-600',
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
          message: data.message || 'Failed to reject.',
          confirmText: 'OK',
          confirmColor: 'bg-red-600',
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
        message: 'Error rejecting volunteer.',
        confirmText: 'OK',
        confirmColor: 'bg-red-600',
        icon: 'error',
        iconColor: 'text-red-500',
        action: null,
        onConfirm: null
      });
      setShowResultModal(true);
    }
  };

  const pendingApplicantCount = applicants.length;

  // Render error state
  if (apiError && !loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] p-6 font-sans flex flex-col items-center justify-center">
        <Icon icon="mdi:alert-circle" className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Data</h2>
        <p className="text-gray-600 text-center max-w-md">{apiError}</p>
        <button onClick={() => loadAllVolunteers(true)} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Retry
        </button>
      </div>
    );
  }

  // Render loading state
  if (loading && allVolunteers.length === 0 && applicants.length === 0) {
    return (
      <div className="min-h-screen bg-white p-6 flex justify-center items-center">
        <div className="text-gray-500">Loading volunteers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] p-4 pt-2 font-sans relative">
      {isProcessing && <FullScreenSpinner message={processingMessage} />}
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
      <ToastModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={modalData.title}
        message={modalData.message}
        type={modalData.icon === 'success' ? 'success' : modalData.icon === 'error' ? 'error' : 'warning'}
      />

      {/* Searching Modal */}
      {isSearching && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center gap-4 max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-700 font-medium text-sm">Updating results...</p>
            <p className="text-gray-400 text-xs">Please wait a moment</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-110px)]">
        {/* Left Column - Main Content */}
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-gray-200 px-4 pt-2 pb-0 bg-white">
            <button
              onClick={() => handleSwitchTab('roster')}
              className={`flex items-center gap-2 pb-4 border-b-2 text-sm font-bold ${activeTab === 'roster'
                ? 'border-[#1f4e6f] text-[#1f4e6f]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Icon icon="mdi:list" className="w-4 h-4" /> Roster
            </button>
            <button
              onClick={() => handleSwitchTab('applicant')}
              className={`flex items-center gap-2 pb-4 border-b-2 text-sm font-bold ${activeTab === 'applicant'
                ? 'border-[#1f4e6f] text-[#1f4e6f]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Icon icon="mdi:card-account-details" className="w-4 h-4" /> Applicant
              {pendingApplicantCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {pendingApplicantCount}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-white p-6">
            {activeTab === 'roster' && (
              <>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <StatBox number={allVolunteers.length} label="Total Volunteers" barColor="border-gray-400" />
                  <StatBox
                    number={allVolunteers.filter(v => getVolunteerStatus(v.id) === 'On Scene' || getVolunteerStatus(v.id) === 'En Route').length}
                    label="Active"
                    barColor="border-green-600"
                  />
                  <StatBox
                    number={allVolunteers.filter(v => getVolunteerStatus(v.id) === 'Dispatched').length}
                    label="Deployed"
                    barColor="border-orange-400"
                  />
                  <StatBox
                    number={allVolunteers.filter(v => getVolunteerStatus(v.id) === 'Available').length}
                    label="Stand By"
                    barColor="border-yellow-400"
                  />
                </div>
                <RosterView
                  volunteers={allVolunteers}
                  selectedId={selectedRosterId}
                  onSelect={setSelectedRosterId}
                  getStatus={getVolunteerStatus}
                />
              </>
            )}
            {activeTab === 'applicant' && (
              <>
                {/* Search & Sort Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-gray-200 pb-3">
                  {/* Search Input */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Search:</span>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => {
                          setIsSearching(true);
                          setSearchQuery(e.target.value);
                          loadAllVolunteers(true);
                        }}
                        className="pl-7 pr-3 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                      />
                      <Icon icon="mdi:magnify" className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Sort By:</span>
                    <select
                      value={sortOption}
                      onChange={(e) => {
                        setIsSearching(true);
                        setSortOption(e.target.value);
                        loadAllVolunteers(true);
                      }}
                      className="border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="newest">Latest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="a-z">Name A-Z</option>
                      <option value="z-a">Name Z-A</option>
                    </select>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <ApplicantStatBox number={applicants.length + allVolunteers.length} label="Total Applicants" color="border-gray-400" />
                  <ApplicantStatBox number={pendingApplicantCount} label="Pending Review" color="border-orange-400" />
                  <ApplicantStatBox number={allVolunteers.length} label="Accepted" color="border-green-600" />
                  <ApplicantStatBox number={0} label="Rejected" color="border-gray-200" />
                </div>

                {/* Applicant List */}
                <ApplicantView
                  applicants={applicants}
                  onView={setSelectedApplicant}
                  onAccept={handleAcceptClick}
                  onReject={handleRejectClick}
                  isProcessing={isProcessing}
                />
              </>
            )}
          </div>
        </div>

        {/* Right Column - Details Sidebar */}
        <div className="w-[380px] bg-white rounded-xl border border-gray-200 shadow-lg max-h-[calc(100vh-80px)] sticky top-0 shrink-0 flex flex-col">
          {activeTab === 'roster' && !activeVolunteer && (
            <div className="h-full flex flex-col items-center justify-center p-6">
              <Icon icon="mdi:account-search" className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-800">No Selection</h3>
              <p className="text-sm text-gray-500 font-medium max-w-[250px] text-center">Click a volunteer card to view details.</p>
            </div>
          )}
          {activeTab === 'roster' && activeVolunteer && (
            <div className="h-full flex flex-col relative">
              <div className="p-6 flex items-center gap-4 border-b border-gray-200">
                <div className="w-16 h-16 rounded-full bg-[#dbe0e8] flex items-center justify-center overflow-hidden">
                  {activeVolunteer.profileImage ? (
                    <img src={activeVolunteer.profileImage} alt={activeVolunteer.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon icon="mdi:account" className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-[20px] font-bold text-gray-800">{activeVolunteer.name}</h3>
                  <p className="text-[13px] text-gray-500 font-medium">{activeVolunteer.role}</p>
                  <div className="mt-1.5">
                    <PanelStatusBadge label={getVolunteerStatus(activeVolunteer.id)} />
                  </div>
                </div>
                <button onClick={handleCloseRoster} className="text-gray-400 hover:text-gray-600 absolute top-4 right-4">
                  <Icon icon="mdi:close" className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pb-20">
                <SectionHeader title="Profile" />
                <DetailRow label="Volunteer ID" value={activeVolunteer.appId} />
                <DetailRow label="Contact" value={activeVolunteer.details?.contact || 'N/A'} />
                <DetailRow label="Current Assignment" value={activeVolunteer.status === 'accepted' ? 'Active' : 'N/A'} />

                <SectionHeader title="Recent Incidents" />
                <div className="p-6 space-y-4 border-b border-gray-200">
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
                    <p className="text-xs text-gray-500 font-medium">No recent incidents assigned.</p>
                  </div>
                </div>

                <SectionHeader title="Certification and Skills" />
                <div className="p-6 flex flex-wrap gap-1.5">
                  {activeVolunteer.details?.skills?.slice(0, 8).map((s, idx) => (
                    <span key={idx} className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded text-[11px] font-medium shadow-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3">
                <button onClick={handleDispatchClick} className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white text-[13px] font-medium py-2 rounded">
                  Dispatch
                </button>
              </div>
            </div>
          )}
          {activeTab === 'applicant' && !activeApplicant && (
            <div className="h-full flex flex-col items-center justify-center p-6">
              <Icon icon="mdi:card-account-details" className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-800">No Selection</h3>
              <p className="text-sm text-gray-500 font-medium">Click "View Full Application" to inspect a candidate.</p>
            </div>
          )}
          {activeTab === 'applicant' && activeApplicant && (
            <div className="h-full flex flex-col relative bg-white rounded-xl">
              {/* Header */}
              <div className="pt-4 pb-3 px-4 flex flex-col border-b border-gray-200 relative">
                <button onClick={handleCloseApplicant} className="absolute top-3 right-4 text-gray-400 hover:text-gray-600">
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#dbeafe] flex items-center justify-center text-blue-400 border-2 border-[#bfdbfe] flex-shrink-0">
                    <Icon icon="mdi:account" className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{activeApplicant.name}</h2>
                    <p className="text-xs text-gray-500 truncate">{activeApplicant.role} · {activeApplicant.experience}</p>
                    <p className="text-xs text-gray-400 truncate">Applied {activeApplicant.appliedDate}</p>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Pending Application
                      </span>
                      <span className="text-[10px] text-gray-400">{activeApplicant.appId}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 overflow-y-auto bg-white pb-14">
                {/* Personal Information */}
                <div className="bg-[#f0f2f5] py-1.5 px-4 text-xs font-semibold text-gray-600 border-y border-gray-200">
                  Personal Information
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between py-3 px-4 text-sm">
                    <span className="text-gray-500 font-medium">Age</span>
                    <span className="font-medium text-gray-800">{activeApplicant.details?.age || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3 px-4 text-sm">
                    <span className="text-gray-500 font-medium">Email</span>
                    <span className="font-medium text-gray-800 truncate max-w-[150px]">{activeApplicant.details?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3 px-4 text-sm">
                    <span className="text-gray-500 font-medium">Contact</span>
                    <span className="font-medium text-gray-800">{activeApplicant.details?.contact || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3 px-4 text-sm">
                    <span className="text-gray-500 font-medium">Location</span>
                    <span className="font-medium text-gray-800">{activeApplicant.details?.location || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3 px-4 text-sm">
                    <span className="text-gray-500 font-medium">Availability</span>
                    <span className="font-medium text-gray-800">
                      {activeApplicant.availability && Array.isArray(activeApplicant.availability) && activeApplicant.availability.length > 0
                        ? activeApplicant.availability.join(', ')
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Certifications */}
                <div className="bg-[#f0f2f5] py-1.5 px-4 text-xs font-semibold text-gray-600 border-y border-gray-200 mt-1">
                  Certifications
                </div>
                <div className="p-3 flex flex-wrap gap-1.5">
                  {activeApplicant.details?.certs?.length > 0 ? (
                    activeApplicant.details.certs.map((c, idx) => (
                      <span key={idx} className="bg-[#e6f2ff] text-[#007bff] border border-[#b8daff] text-xs font-medium px-2.5 py-1 rounded">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 italic px-4 py-1">No certifications listed</span>
                  )}
                </div>

                {/* Uploaded Certifications */}
                <div className="bg-[#f0f2f5] py-1.5 px-4 text-xs font-semibold text-gray-600 border-y border-gray-200 mt-1">
                  Uploaded Certifications
                </div>
                <div className="p-3 flex flex-wrap gap-2">
                  {activeApplicant.details?.files?.length > 0 ? (
                    activeApplicant.details.files.map((file, idx) => (
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
                        className="flex flex-col items-center justify-center border border-gray-200 bg-gray-50 rounded p-1.5 w-14 h-14 hover:shadow-md hover:border-blue-300 cursor-pointer group"
                      >
                        {file.type && file.type.startsWith('image/') ? (
                          <Icon icon="mdi:image" className="text-xl text-blue-500 mb-0.5 group-hover:scale-110" />
                        ) : (
                          <Icon icon="mdi:file-pdf-box" className="text-xl text-red-500 mb-0.5 group-hover:scale-110" />
                        )}
                        <span className="text-[9px] text-gray-600 text-center truncate w-full group-hover:text-blue-600">
                          {file.name || 'File'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 italic px-4 py-1">No documents uploaded</span>
                  )}
                </div>

                {/* Bottom Spacer */}
                <div className="h-12"></div>
              </div>

              {/* Action Buttons */}
              <div className="absolute bottom-0 left-0 right-0 py-3 px-5 bg-white border-t border-gray-200 flex justify-between items-center gap-2">
                <button
                  onClick={() => handleRejectClick(activeApplicant)}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-3 bg-white border border-red-200 text-red-600 rounded-md text-xs font-medium hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="mdi:close" className="w-4 h-4" /> Reject
                </button>

                <button
                  onClick={handleCloseApplicant}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-3 bg-white border border-gray-300 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Close
                </button>

                <button
                  onClick={() => handleAcceptClick(activeApplicant)}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-3 bg-white border border-green-300 text-green-600 rounded-md text-xs font-medium hover:bg-green-50 hover:border-green-400 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="mdi:check" className="w-4 h-4" /> Accept
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