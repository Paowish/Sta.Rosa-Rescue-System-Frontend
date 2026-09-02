// src/pages/rescueTeam/IncidentManagement.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { incidentService } from "../../services/api";
import { Icon } from "@iconify/react";
import DispatchModal from "./DispatchModal";
import SuccessModal from "./SuccessModal";
import IncidentDetailModal from "./IncidentDetailModal";
import {
  StatCard,
  SearchIcon,
  ChevronDown,
  CalendarIcon,
  XIcon,
  CheckboxCheck,
  CheckboxAll
} from "./IncidentComponents";

/**
 * Incident Management Component
 * Main dashboard for managing and tracking all incidents
 */
export default function IncidentManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for incidents
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, resolved: 0 });

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // State for selection
  const [selectedIds, setSelectedIds] = useState([]);

  // State for modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchVolunteers, setDispatchVolunteers] = useState([]);
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [dispatchSelectedIds, setDispatchSelectedIds] = useState([]);
  const [dispatchSuccess, setDispatchSuccess] = useState(null);

  /**
   * Load data on component mount
   */
  useEffect(() => {
    loadIncidents();
    loadVolunteers();
  }, []);

  /**
   * Load available volunteers
   */
  const loadVolunteers = async () => {
    try {
      const response = await incidentService.getAvailableVolunteers();
      if (response && response.success) {
        setDispatchVolunteers(response.data || []);
      } else {
        setDispatchVolunteers([]);
      }
    } catch (error) {
      console.error("Failed to load volunteers:", error);
      setDispatchVolunteers([]);
    }
  };

  /**
   * Handle view parameter from URL
   */
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && incidents.length > 0) {
      const incident = incidents.find(i =>
        i._id === viewId || i.id === viewId || i.incidentId === viewId ||
        String(i._id) === viewId || String(i.id) === viewId || String(i.incidentId) === viewId
      );

      if (incident) {
        setSelectedIncident(incident);
        setIsModalOpen(true);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('view');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [incidents, searchParams, setSearchParams]);

  /**
   * Apply filters whenever dependencies change
   */
  useEffect(() => {
    applyFilters();
  }, [incidents, searchTerm, statusFilter, startDate, endDate]);

  /**
   * Load incidents from API
   */
  const loadIncidents = async () => {
    try {
      setLoading(true);
      const response = await incidentService.getAllIncidents();
      let dataArray = [];
      if (response && response.success && Array.isArray(response.data)) {
        dataArray = response.data;
      } else if (Array.isArray(response)) {
        dataArray = response;
      } else if (response && Array.isArray(response.data)) {
        dataArray = response.data;
      }
      setIncidents(dataArray);
      setSelectedIds([]);

      // Calculate statistics
      const total = dataArray.length;
      const active = dataArray.filter(i =>
        i.status === 'Active' || i.status === 'Pending' ||
        i.status === 'Acknowledged' || i.status === 'Dispatched'
      ).length;
      const pending = dataArray.filter(i => i.status === 'Pending').length;
      const resolved = dataArray.filter(i => i.status === 'Resolved').length;
      setStats({ total, active, pending, resolved });
    } catch (error) {
      console.error("Failed to load incidents:", error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply filters to incidents
   */
  const applyFilters = () => {
    let filtered = [...incidents];

    // Status filter
    if (statusFilter !== "All Statuses") {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.incidentId?.toLowerCase().includes(term) ||
        i.type?.toLowerCase().includes(term) ||
        (i.location?.address && i.location.address.toLowerCase().includes(term)) ||
        (i.location?.barangay && i.location.barangay.toLowerCase().includes(term))
      );
    }

    // Date range filter - start date
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(i => {
        const date = new Date(i.reportedAt || i.createdAt);
        return date >= start;
      });
    }

    // Date range filter - end date
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(i => {
        const date = new Date(i.reportedAt || i.createdAt);
        return date <= end;
      });
    }

    setFilteredIncidents(filtered);
  };

  /**
   * Clear date filter
   */
  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setShowDatePicker(false);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "N/A";
    }
  };

  /**
   * Handle view incident
   */
  const handleViewIncident = (incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  /**
   * Handle resolve incident
   */
  const handleResolveIncident = async (incident) => {
    if (incident.status !== 'Dispatched' && incident.status !== 'Active') {
      alert('⚠️ This incident must be dispatched before it can be resolved.');
      return;
    }

    if (window.confirm(`Mark incident ${incident.incidentId} as resolved?`)) {
      try {
        const response = await incidentService.resolveIncident(incident._id, "Resolved by team");
        if (response && response.success) {
          alert("Incident marked as resolved!");
          setIsModalOpen(false);
          loadIncidents();
        }
      } catch (error) {
        alert("Failed to resolve incident: " + error.message);
      }
    }
  };

  /**
   * Check if resolve is disabled
   */
  const isResolveDisabled = (incident) => {
    return incident.status !== 'Dispatched' && incident.status !== 'Active';
  };

  /**
   * Handle dispatch success
   */
  const handleDispatchSuccess = async (dispatchInfo) => {
    try {
      const response = await incidentService.assignResponders(
        selectedIncident._id,
        dispatchSelectedIds,
        dispatchNotes
      );

      if (response && response.success) {
        setIsDispatchModalOpen(false);

        // Save team info to incident
        const updatedIncident = {
          ...selectedIncident,
          assignedTeam: dispatchInfo?.teamName || dispatchInfo?.name || 'Rescue Team',
          teamName: dispatchInfo?.teamName || dispatchInfo?.name || 'Rescue Team',
          dispatchType: dispatchInfo?.type || (dispatchInfo?.isTeam ? 'team' : 'volunteer')
        };

        // Update incidents state
        setIncidents(prev => prev.map(i =>
          i._id === selectedIncident._id ? updatedIncident : i
        ));

        // Set success state
        setDispatchSuccess({
          incidentId: selectedIncident.incidentId,
          title: selectedIncident.type,
          address: selectedIncident.location?.address,
          count: dispatchInfo?.count || response.volunteersDispatched,
          isTeam: dispatchInfo?.type === 'team' || dispatchInfo?.isTeam,
          teamName: dispatchInfo?.teamName || '',
        });

        loadIncidents();
      }
    } catch (error) {
      alert("Failed to dispatch: " + error.message);
    }
  };

  /**
   * Open dispatch modal
   */
  const openDispatchModal = () => {
    setIsDispatchModalOpen(true);
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All Statuses");
    clearDateFilter();
  };

  /**
   * Toggle row selection
   */
  const toggleRowSelection = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  /**
   * Format assigned to display
   */
  const formatAssignedTo = (incident) => {
    if (!incident) return "Unassigned";

    // Check direct team properties
    if (incident.assignedTeam || incident.teamName || incident.team) {
      const teamName = incident.assignedTeam || incident.teamName || incident.team;
      return (
        <div className="flex items-center gap-1.5">
          <Icon icon="mdi:shield-account" className="w-4 h-4 text-blue-500" />
          <span className="text-blue-700 font-medium">{teamName}</span>
        </div>
      );
    }

    if (incident.dispatchType === 'team') {
      return (
        <div className="flex items-center gap-1.5">
          <Icon icon="mdi:shield-account" className="w-4 h-4 text-blue-500" />
          <span className="text-blue-700 font-medium">Rescue Team</span>
        </div>
      );
    }

    const assignees = incident.assignedTo || incident.assignedVolunteers || incident.responders;

    if (!assignees || !Array.isArray(assignees) || assignees.length === 0) {
      return "Unassigned";
    }

    const teamAssignee = assignees.find(a =>
      a.type === 'team' ||
      a.isTeam ||
      a.teamName ||
      a.role === 'team'
    );

    if (teamAssignee) {
      const teamName = teamAssignee.teamName || teamAssignee.name || 'Rescue Team';
      return (
        <div className="flex items-center gap-1.5">
          <Icon icon="mdi:shield-account" className="w-4 h-4 text-blue-500" />
          <span className="text-blue-700 font-medium">{teamName}</span>
        </div>
      );
    }

    // Multiple assignees - show as Rescue Team
    if (assignees.length > 1) {
      return (
        <div className="flex items-center gap-1.5">
          <Icon icon="mdi:shield-account" className="w-4 h-4 text-blue-500" />
          <span className="text-blue-700 font-medium">Rescue Team</span>
        </div>
      );
    }

    // Single volunteer
    const firstAssignee = assignees[0];
    const person = firstAssignee.responder || firstAssignee.volunteer || firstAssignee.userId || firstAssignee;

    let volunteerName = 'Volunteer';
    if (person.firstName && person.lastName) {
      volunteerName = `${person.firstName} ${person.lastName}`;
    } else if (person.name) {
      volunteerName = person.name;
    } else if (person.email) {
      volunteerName = person.email.split('@')[0];
    }

    return (
      <div className="flex items-center gap-1.5">
        <Icon icon="mdi:account" className="w-4 h-4 text-green-500" />
        <span className="text-green-700 font-medium">{volunteerName}</span>
      </div>
    );
  };

  /**
   * Get status badge component
   */
  const getStatusBadge = (status) => {
    const commonPill = "bg-gray-200/60 text-gray-700 px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'Resolved':
        return <div className={`${commonPill} bg-green-100/60 text-green-700`}>Resolved</div>;
      case 'Active':
        return <div className={`${commonPill} bg-red-100/60 text-red-700`}>Active</div>;
      case 'Pending':
        return <div className={`${commonPill} bg-yellow-100/60 text-yellow-700`}>Pending</div>;
      case 'Dispatched':
        return <div className={`${commonPill} bg-blue-100/60 text-blue-700`}>Dispatched</div>;
      default:
        return <div className={commonPill}>{status}</div>;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading incidents...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen font-sans text-slate-700">
      {/* Incident Detail Modal */}
      <IncidentDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIncident(null);
        }}
        incident={selectedIncident}
        onDispatch={openDispatchModal}
        onResolve={() => handleResolveIncident(selectedIncident)}
      />

      {/* Dispatch Modal */}
      {isDispatchModalOpen && selectedIncident && (
        <DispatchModal
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          onDispatch={handleDispatchSuccess}
          title={selectedIncident.type || 'Incident'}
          incidentId={selectedIncident.incidentId || selectedIncident._id}
          volunteers={dispatchVolunteers}
          loadingVolunteers={false}
          selectedIds={dispatchSelectedIds}
          setSelectedIds={setDispatchSelectedIds}
          isDispatching={false}
          isResolved={selectedIncident.status === 'Resolved'}
          searchTerm={""}
          setSearchTerm={() => { }}
          handleVolunteerToggle={(id) => {
            setDispatchSelectedIds(prev =>
              prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
            );
          }}
          handleRemoveSelected={(id) => {
            setDispatchSelectedIds(prev => prev.filter(v => v !== id));
          }}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={!!dispatchSuccess}
        data={dispatchSuccess}
        onClose={() => setDispatchSuccess(null)}
      />

      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-700">INCIDENT MANAGEMENT</h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Santa Rosa, Nueva Ecija
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <StatCard
            title="Total Incidents"
            value={stats.total}
            icon="mdi:chart-bar"
            color="text-gray-700"
            trend={{ value: 5, positive: false }}
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon="mdi:lightning-bolt"
            color="text-red-600"
            trend={{ value: 12, positive: true }}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon="mdi:hourglass-outline"
            color="text-amber-600"
            trend={{ value: 3, positive: false }}
          />
          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon="mdi:check-circle-outline"
            color="text-emerald-600"
            trend={{ value: 8, positive: true }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mt-6 mb-6">
        {/* Search Input */}
        <div className="relative w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search ID, type, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative w-40">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none block w-full border border-slate-200 rounded-md pl-4 pr-10 py-2.5 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Active</option>
            <option>Dispatched</option>
            <option>Resolved</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown />
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="relative w-48">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 w-full border border-slate-200 rounded-md px-4 py-2.5 bg-white text-sm hover:bg-slate-50 transition-colors text-slate-600"
          >
            <CalendarIcon />
            <span className="truncate">
              {startDate || endDate
                ? `${startDate ? formatDate(startDate) : 'Start'} - ${endDate ? formatDate(endDate) : 'End'}`
                : 'Select Date Range'
              }
            </span>
            {startDate || endDate ? (
              <button
                onClick={(e) => { e.stopPropagation(); clearDateFilter(); }}
                className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0"
              >
                <XIcon />
              </button>
            ) : null}
          </button>

          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const sevenDaysAgo = new Date(today);
                      sevenDaysAgo.setDate(today.getDate() - 7);
                      setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
                      setEndDate(today.toISOString().split('T')[0]);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const thirtyDaysAgo = new Date(today);
                      thirtyDaysAgo.setDate(today.getDate() - 30);
                      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
                      setEndDate(today.toISOString().split('T')[0]);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={clearDateFilter}
                    className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clear All Button */}
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 border border-slate-200 rounded-md px-4 py-2.5 bg-white text-sm hover:bg-slate-50 text-slate-600"
        >
          <XIcon />
          <span>Clear All</span>
        </button>
      </div>

      {/* Incidents Table */}
      <div className="border border-slate-200 rounded-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200 bg-white">
              <th className="p-4 w-10 text-center border-r border-slate-200">
                <CheckboxAll />
              </th>
              <th className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200 w-[12%]">ID</th>
              <th className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200 w-[12%]">Status</th>
              <th className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200 w-[20%]">Location</th>
              <th className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200 w-[12%]">Assigned</th>
              <th className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200 w-[18%]">Reported</th>
              <th className="p-4 text-sm font-medium text-slate-600 w-[16%]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((incident) => {
                const isSelected = selectedIds.includes(incident._id);
                const isResolved = incident.status === 'Resolved';
                const resolveDisabled = isResolveDisabled(incident);

                return (
                  <tr key={incident._id} className="hover:bg-slate-50/50 transition-colors h-16">
                    <td className="p-4 text-center border-r border-slate-200">
                      <div
                        onClick={() => toggleRowSelection(incident._id)}
                        className={`w-5 h-5 rounded-[4px] border mx-auto cursor-pointer flex items-center justify-center transition-colors ${isSelected ? 'bg-[#4081EE] border-[#4081EE]' : 'border-slate-300'
                          }`}
                      >
                        {isSelected && <CheckboxCheck />}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-700 border-r border-slate-200 truncate">
                      {incident.incidentId || "N/A"}
                    </td>
                    <td className="p-4 border-r border-slate-200">
                      {getStatusBadge(incident.status)}
                    </td>
                    <td className="p-4 text-sm text-slate-700 border-r border-slate-200">
                      <div className="truncate max-w-[200px]">
                        {incident.location?.address || "N/A"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {incident.location?.barangay}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-700 border-r border-slate-200">
                      {formatAssignedTo(incident)}
                    </td>
                    <td className="p-4 text-sm text-slate-700 border-r border-slate-200">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <Icon icon="mdi:clock-outline" className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{formatDate(incident.reportedAt || incident.createdAt)}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {incident.reportedAt ? new Date(incident.reportedAt).toLocaleTimeString() : ''}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewIncident(incident)}
                          className="px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded bg-white hover:bg-blue-50 transition-colors whitespace-nowrap"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleResolveIncident(incident)}
                          disabled={resolveDisabled || isResolved}
                          className={`px-3 py-1.5 text-sm rounded border whitespace-nowrap transition-colors ${resolveDisabled || isResolved
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'text-green-600 border-green-300 bg-white hover:bg-green-50'
                            }`}
                        >
                          {isResolved ? 'Resolved' : 'Resolve'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  {searchTerm || statusFilter !== "All Statuses" || startDate || endDate
                    ? "No incidents match your filters"
                    : "No incidents found in the system."
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Filter Summary */}
      {(searchTerm || statusFilter !== "All Statuses" || startDate || endDate) && (
        <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
          <span>Showing {filteredIncidents.length} of {incidents.length} incidents</span>
          <button onClick={clearFilters} className="text-blue-500 hover:text-blue-700 underline">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}