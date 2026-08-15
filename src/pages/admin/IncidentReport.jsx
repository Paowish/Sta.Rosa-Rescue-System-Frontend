import { Icon } from "@iconify/react";
import AdminLayout from "./AdminLayout";
import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';

export default function IncidentReports() {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [periodFilter, setPeriodFilter] = useState("All Time");
    const [statusFilter, setStatusFilter] = useState("All Time");
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        loadIncidents();
    }, []);

    const loadIncidents = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            const response = await fetch('/api/incidents', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setIncidents(data.data);
            } else {
                setError(data.message || "Failed to load incidents");
            }
        } catch (error) {
            console.error("Failed to load incidents:", error);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Resolved": return "bg-[#D5FFE5] border border-[#15803D] text-[#15803D]";
            case "Active": return "bg-[#FDE6EA] border border-[#DC2626] text-[#DC2626]";
            case "Dispatched": return "bg-[#FCE3AE] border border-[#E1791E] text-[#E1791E]";
            case "Pending": return "bg-[#FCE3AE] border border-[#E1791E] text-[#E1791E]";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusDisplay = (status) => {
        switch (status) {
            case "Resolved": return "SOLVED";
            case "Active": return "UNSOLVED";
            case "Dispatched": return "PENDING";
            default: return status?.toUpperCase() || "PENDING";
        }
    };

    const handleCloseModal = () => {
        setShowDetailsModal(false);
        setSelectedIncident(null);
    };

    const handleExportExcel = () => {
        try {
            setSuccessMessage("Preparing export...");

            // Get filtered data for export
            const dataToExport = filteredIncidents.length > 0 ? filteredIncidents : incidents;

            // Format data for Excel
            const exportData = dataToExport.map(incident => ({
                'Incident ID': incident.incidentId || 'N/A',
                'Type': incident.type || 'N/A',
                'Barangay': incident.location?.barangay || 'N/A',
                'Location': incident.location?.address || 'Unknown',
                'Reported Date': incident.reportedAt ? new Date(incident.reportedAt).toLocaleDateString() : 'N/A',
                'Reported Time': incident.reportedAt ? new Date(incident.reportedAt).toLocaleTimeString() : 'N/A',
                'Resolved Date': incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleDateString() : '-',
                'Resolved Time': incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleTimeString() : '-',
                'Status': getStatusDisplay(incident.status),
                'Assigned Team': incident.assignedTeam || 'Unassigned',
                'Victims Affected': incident.victimsAffected || incident.victims || 0,
                'Description': incident.description || 'N/A'
            }));

            // Create workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Auto-size columns
            const colWidths = [
                { wch: 15 }, // Incident ID
                { wch: 20 }, // Type
                { wch: 20 }, // Barangay
                { wch: 30 }, // Location
                { wch: 15 }, // Reported Date
                { wch: 15 }, // Reported Time
                { wch: 15 }, // Resolved Date
                { wch: 15 }, // Resolved Time
                { wch: 12 }, // Status
                { wch: 20 }, // Assigned Team
                { wch: 15 }, // Victims Affected
                { wch: 40 }  // Description
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Incidents');

            // Generate filename with current date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
            const filename = `Incident_Report_${dateStr}_${timeStr}.xlsx`;

            // Save file
            XLSX.writeFile(wb, filename);

            setSuccessMessage(`Export completed successfully! File saved as ${filename}`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error("Export failed:", error);
            setError("Failed to export data. Please try again.");
            setTimeout(() => setError(null), 5000);
        }
    };

    const filterIncidents = () => {
        let filtered = [...incidents];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(incident =>
                (incident.incidentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (incident.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (incident.location?.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (incident.location?.barangay || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== "All Time") {
            filtered = filtered.filter(incident => {
                const displayStatus = getStatusDisplay(incident.status);
                return displayStatus === statusFilter;
            });
        }

        // Period filter
        if (periodFilter !== "All Time") {
            const now = new Date();
            filtered = filtered.filter(incident => {
                const reportedDate = new Date(incident.reportedAt);
                switch (periodFilter) {
                    case "Today":
                        return reportedDate.toDateString() === now.toDateString();
                    case "This Week":
                        const weekAgo = new Date(now);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return reportedDate >= weekAgo;
                    case "This Month":
                        return reportedDate.getMonth() === now.getMonth() &&
                            reportedDate.getFullYear() === now.getFullYear();
                    case "This Year":
                        return reportedDate.getFullYear() === now.getFullYear();
                    default:
                        return true;
                }
            });
        }

        return filtered;
    };

    const filteredIncidents = filterIncidents();

    // ✅ REMOVED: handleClearFilters function is no longer needed

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex flex-col justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f6b75]"></div>
                    <div className="text-gray-500 mt-4">Loading incidents...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFF]">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <Icon icon="ic:outline-emergency" className="w-8 h-8 text-[#1f6b75]" />
                        <div>
                            <h1 className="text-2xl font-semibold text-[#262D31]">Incident Report</h1>
                            <p className="text-gray-500 text-sm">Incident logs and management</p>
                        </div>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="mb-4 p-3 bg-[#D5FFE5] border border-[#15803D] rounded-lg text-[#15803D] flex items-center gap-2">
                        <Icon icon="mdi:check-circle" className="w-5 h-5" />
                        {successMessage}
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="ml-auto text-[#15803D] hover:text-[#0d5c2a]"
                        >
                            <Icon icon="mdi:close" className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 bg-[#FDE6EA] border border-[#DC2626] rounded-lg text-[#DC2626] flex items-center gap-2">
                        <Icon icon="mdi:alert-circle" className="w-5 h-5" />
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-[#DC2626] hover:text-[#c11f1f]"
                        >
                            <Icon icon="mdi:close" className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="relative w-[250px]">
                        <input
                            type="text"
                            placeholder="Search ID, type, location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-[#D3D2DE] rounded-lg px-4 py-2 pl-10 text-sm font-light focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        <Icon
                            icon="material-symbols:search"
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Period</span>
                        <div className="relative">
                            <select
                                value={periodFilter}
                                onChange={(e) => setPeriodFilter(e.target.value)}
                                className="appearance-none border border-[#D3D2DE] rounded-lg px-4 py-2 pr-8 text-sm font-light bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
                            >
                                <option>All Time</option>
                                <option>Today</option>
                                <option>This Week</option>
                                <option>This Month</option>
                                <option>This Year</option>
                            </select>
                            <Icon
                                icon="mdi:chevron-down"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Status</span>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none border border-[#D3D2DE] rounded-lg px-4 py-2 pr-8 text-sm font-light bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
                            >
                                <option>All Time</option>
                                <option>SOLVED</option>
                                <option>UNSOLVED</option>
                                <option>PENDING</option>
                            </select>
                            <Icon
                                icon="mdi:chevron-down"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                            />
                        </div>
                    </div>

                    {/* ✅ REMOVED: Clear Button */}

                    <button
                        onClick={loadIncidents}
                        className="flex items-center gap-2 px-4 py-2 border border-[#D3D2DE] rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                    >
                        <Icon icon="mdi:refresh" className="w-4 h-4" />
                        Refresh
                    </button>

                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1f6b75] text-white rounded-lg text-sm font-medium hover:bg-[#165a63] transition ml-auto"
                        title="Export filtered data to Excel"
                    >
                        <Icon icon="uil:export" className="w-4 h-4" />
                        Export to Excel
                    </button>
                </div>

                {/* ✅ REMOVED: Summary Stats Cards */}

                {/* Incidents Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Barangay</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Location</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Reported</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Resolved at</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Assigned to</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Victims</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredIncidents.length > 0 ? (
                                    filteredIncidents.map((incident) => (
                                        <tr key={incident._id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{incident.incidentId || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-[#000000] whitespace-nowrap">{incident.type}</td>
                                            <td className="px-4 py-3 text-sm text-[#000000] whitespace-nowrap">{incident.location?.barangay || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-[#000000] whitespace-nowrap">{incident.location?.address || 'Unknown'}</td>
                                            <td className="px-4 py-3 text-sm text-[#000000] whitespace-nowrap">
                                                {incident.reportedAt ? new Date(incident.reportedAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#000000] whitespace-nowrap">
                                                {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#000000] whitespace-nowrap max-w-[150px] truncate">
                                                {incident.assignedTeam || 'Unassigned'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#000000] whitespace-nowrap">{incident.victimsAffected || incident.victims || 0}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-block w-[85px] text-center px-2 py-1 text-xs rounded-sm font-medium ${getStatusColor(incident.status)}`}>
                                                    {getStatusDisplay(incident.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                                            <Icon icon="mdi:inbox" className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                            <p>No incidents found</p>
                                            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer with count */}
                    {incidents.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500 flex justify-between items-center">
                            <span>
                                Showing {filteredIncidents.length} of {incidents.length} incidents
                                {filteredIncidents.length !== incidents.length &&
                                    ` (${periodFilter !== "All Time" ? `Period: ${periodFilter}, ` : ''}${statusFilter !== "All Time" ? `Status: ${statusFilter}` : ''})`
                                }
                            </span>
                            {/* ✅ REMOVED: "Export filtered data" link */}
                            <span></span>
                        </div>
                    )}
                </div>
            </div>

            {/* Incident Details Modal */}
            {showDetailsModal && selectedIncident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-[#1f6b75] border-t-8 flex justify-between items-center rounded-t-lg">
                            <h2 className="text-lg font-semibold text-[#262D31] flex items-center gap-2">
                                <Icon icon="ic:outline-emergency" className="w-6 h-6 text-[#1f6b75]" />
                                Incident Details - {selectedIncident.incidentId || 'N/A'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition">
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">Incident ID</label>
                                    <p className="text-sm font-medium">{selectedIncident.incidentId || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">Type</label>
                                    <p className="text-sm font-medium">{selectedIncident.type}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                                    <span className={`inline-block px-3 py-1 text-xs rounded-sm font-medium mt-1 ${getStatusColor(selectedIncident.status)}`}>
                                        {getStatusDisplay(selectedIncident.status)}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">Victims Affected</label>
                                    <p className="text-sm font-medium">{selectedIncident.victimsAffected || selectedIncident.victims || 0}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">Barangay</label>
                                    <p className="text-sm font-medium">{selectedIncident.location?.barangay || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">Location</label>
                                    <p className="text-sm font-medium">{selectedIncident.location?.address || 'Unknown'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">Reported At</label>
                                    <p className="text-sm font-medium">
                                        {selectedIncident.reportedAt ? new Date(selectedIncident.reportedAt).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">Resolved At</label>
                                    <p className="text-sm font-medium">
                                        {selectedIncident.resolvedAt ? new Date(selectedIncident.resolvedAt).toLocaleString() : 'Not resolved yet'}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Assigned Team</label>
                                    <p className="text-sm font-medium">{selectedIncident.assignedTeam || 'Unassigned'}</p>
                                </div>
                                {selectedIncident.description && (
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-gray-500 uppercase">Description</label>
                                        <p className="text-sm text-gray-700 mt-1">{selectedIncident.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => {
                                    handleCloseModal();
                                    // Export single incident
                                    const singleIncident = [selectedIncident];
                                    const exportData = singleIncident.map(incident => ({
                                        'Incident ID': incident.incidentId || 'N/A',
                                        'Type': incident.type || 'N/A',
                                        'Barangay': incident.location?.barangay || 'N/A',
                                        'Location': incident.location?.address || 'Unknown',
                                        'Reported Date': incident.reportedAt ? new Date(incident.reportedAt).toLocaleDateString() : 'N/A',
                                        'Reported Time': incident.reportedAt ? new Date(incident.reportedAt).toLocaleTimeString() : 'N/A',
                                        'Resolved Date': incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleDateString() : '-',
                                        'Resolved Time': incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleTimeString() : '-',
                                        'Status': getStatusDisplay(incident.status),
                                        'Assigned Team': incident.assignedTeam || 'Unassigned',
                                        'Victims Affected': incident.victimsAffected || incident.victims || 0,
                                        'Description': incident.description || 'N/A'
                                    }));
                                    const wb = XLSX.utils.book_new();
                                    const ws = XLSX.utils.json_to_sheet(exportData);
                                    ws['!cols'] = [
                                        { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 30 },
                                        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                                        { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 40 }
                                    ];
                                    XLSX.utils.book_append_sheet(wb, ws, 'Incident');
                                    const filename = `Incident_${selectedIncident.incidentId || 'details'}_${new Date().toISOString().split('T')[0]}.xlsx`;
                                    XLSX.writeFile(wb, filename);
                                    setSuccessMessage(`Incident ${selectedIncident.incidentId} exported successfully!`);
                                    setTimeout(() => setSuccessMessage(null), 3000);
                                }}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                            >
                                <Icon icon="uil:export" className="w-4 h-4" />
                                Export This Incident
                            </button>
                            <button
                                onClick={handleCloseModal}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}