// src/pages/rescueTeam/IncidentManagement.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { incidentService } from "../../services/api";
import { Icon } from "@iconify/react";

// ✅ Import separated components
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

export default function IncidentManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, resolved: 0 });

  useEffect(() => {
    loadIncidents();
  }, []);

  // ✅ Check for view parameter after incidents are loaded
  useEffect(() => {
    const viewId = searchParams.get('view');
    console.log('🔍 Checking for view parameter:', viewId);
    console.log('📋 Incidents loaded:', incidents.length);

    if (viewId && incidents.length > 0) {
      // Find the incident by ID - try multiple fields
      const incident = incidents.find(i =>
        i._id === viewId ||
        i.id === viewId ||
        i.incidentId === viewId ||
        String(i._id) === viewId ||
        String(i.id) === viewId ||
        String(i.incidentId) === viewId
      );

      console.log('🔍 Found incident:', incident);

      if (incident) {
        setSelectedIncident(incident);
        setIsModalOpen(true);
        // ✅ Clean up the URL by removing the view parameter
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('view');
        setSearchParams(newParams, { replace: true });
        console.log('✅ Modal opened for incident:', incident.incidentId);
      } else {
        console.warn('⚠️ No incident found with ID:', viewId);
        console.log('📋 Available incident IDs:', incidents.map(i => i._id || i.id || i.incidentId));
      }
    }
  }, [incidents, searchParams, setSearchParams]);

  useEffect(() => {
    applyFilters();
  }, [incidents, searchTerm, statusFilter]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      console.log('📡 Loading incidents...');
      const response = await incidentService.getAllIncidents();
      let dataArray = [];
      if (response && response.success && Array.isArray(response.data)) dataArray = response.data;
      else if (Array.isArray(response)) dataArray = response;
      else if (response && Array.isArray(response.data)) dataArray = response.data;
      console.log('📡 Incidents loaded:', dataArray.length);
      setIncidents(dataArray);
      setSelectedIds([]);
      const total = dataArray.length;
      const active = dataArray.filter(i =>
        i.status === 'Active' ||
        i.status === 'Pending' ||
        i.status === 'Acknowledged' ||
        i.status === 'Dispatched'
      ).length;
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

  const handleViewIncident = (incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  const handleResolveIncident = async (incident) => {
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

  const handleDispatchSuccess = () => {
    setIsModalOpen(false);
    loadIncidents();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All Statuses");
  };

  const toggleRowSelection = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading incidents...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen font-sans text-slate-700">
      {/* ✅ Incident Detail Modal - Imported from separate file */}
      <IncidentDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIncident(null);
        }}
        incident={selectedIncident}
        onDispatch={handleDispatchSuccess}
      />

      {/* Header with Stat Cards */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-700">INCIDENT MANAGEMENT</h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Santa Rosa, Nueva Ecija</span>
        </div>

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

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 mt-6 mb-6">
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
        <div className="relative w-40">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon />
          </div>
          <div className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-md text-sm bg-white text-slate-500">
            dd / mm / yy
          </div>
        </div>
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 border border-slate-200 rounded-md px-4 py-2.5 bg-white text-sm hover:bg-slate-50 text-slate-600"
        >
          <XIcon />
          <span>clear</span>
        </button>
      </div>

      {/* Table */}
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
                    <td className="p-4 text-sm text-slate-700 border-r border-slate-200 truncate">
                      <div className="truncate">{incident.location?.address || "N/A"}</div>
                      <div className="text-xs text-gray-400">{incident.location?.barangay}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-700 border-r border-slate-200 truncate">
                      {formatAssignedTo(incident.assignedTo)}
                    </td>
                    <td className="p-4 text-sm text-slate-700 border-r border-slate-200 truncate">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:clock-outline" className="w-4 h-4 text-slate-400" />
                        <span>{incident.reportedAt ? new Date(incident.reportedAt).toLocaleString() : "N/A"}</span>
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
                        {incident.status !== 'Resolved' && (
                          <button
                            onClick={() => handleResolveIncident(incident)}
                            className="px-3 py-1.5 text-sm text-green-600 border border-green-300 rounded bg-white hover:bg-green-50 transition-colors whitespace-nowrap"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  {searchTerm || statusFilter !== "All Statuses"
                    ? "No incidents match your filters"
                    : "No incidents found in the system."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}