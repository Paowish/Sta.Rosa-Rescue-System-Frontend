// src/pages/guest/GuestTrackReport.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { incidentService } from "../../services/api";

export default function GuestTrackReport() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIncident, setSelectedIncident] = useState(null);

    useEffect(() => {
        loadIncidents();
    }, []);

    const loadIncidents = async () => {
        try {
            setLoading(true);
            const response = await incidentService.getAllIncidents();
            if (response && response.success) {
                const sorted = response.data.sort((a, b) =>
                    new Date(b.createdAt || b.reportedAt) - new Date(a.createdAt || a.reportedAt)
                );
                setIncidents(sorted);
                setFilteredIncidents(sorted);
            }
        } catch (error) {
            console.error("Failed to load incidents:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase().trim();
        setSearchTerm(e.target.value);

        if (!term) {
            setFilteredIncidents(incidents);
            return;
        }

        const filtered = incidents.filter(inc =>
            inc.incidentId?.toLowerCase().includes(term) ||
            inc.type?.toLowerCase().includes(term) ||
            inc.location?.address?.toLowerCase().includes(term) ||
            inc.status?.toLowerCase().includes(term)
        );
        setFilteredIncidents(filtered);
    };

    const clearSearch = () => {
        setSearchTerm("");
        setFilteredIncidents(incidents);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-600';
            case 'Active': return 'bg-red-100 text-red-600';
            case 'En Route': return 'bg-blue-100 text-blue-600';
            case 'Dispatched': return 'bg-purple-100 text-purple-600';
            case 'Pending': return 'bg-yellow-100 text-yellow-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "Unknown date";
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading reports...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Icon icon="material-symbols:search" width="20" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Incident Name, ID, Location..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm shadow-sm transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <Icon icon="mdi:close" width="18" />
                        </button>
                    )}
                </div>
                {searchTerm && (
                    <p className="text-xs text-gray-400 mt-1">Found {filteredIncidents.length} result{filteredIncidents.length !== 1 ? 's' : ''}</p>
                )}
            </div>

            {/* Results */}
            {filteredIncidents.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
                    <div className="flex justify-center mb-4">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
                            <Icon icon="material-symbols:report-off" width="48" className="text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Reports Found</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        {searchTerm ? `No reports matching "${searchTerm}"` : "There are currently no incident reports available."}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => navigate("/Guest/Report")}
                            className="mt-4 bg-[#0C7FDA] text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                            Report an Incident
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredIncidents.map((incident) => (
                        <div
                            key={incident._id}
                            onClick={() => setSelectedIncident(selectedIncident === incident._id ? null : incident._id)}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                        >
                            <div className="p-4 relative">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${incident.status === 'Resolved' ? 'bg-green-500' :
                                        incident.status === 'Active' ? 'bg-red-500' :
                                            incident.status === 'En Route' || incident.status === 'Dispatched' ? 'bg-blue-500' :
                                                'bg-yellow-500'
                                    }`}></div>
                                <div className="pl-3">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                                        <h3 className="font-bold text-lg text-[#1f4e6f]">{incident.type}</h3>
                                        <p className="text-xs text-gray-400 font-medium">{incident.incidentId}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon icon="mdi:map-marker-outline" width="16" className="text-gray-500" />
                                        <p className="text-xs sm:text-sm text-gray-600">{incident.location?.address || "Location not specified"}</p>
                                    </div>
                                    <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1">
                                        <div className="flex items-center gap-2">
                                            <Icon icon="mdi:calendar-clock" width="16" className="text-gray-500" />
                                            <p className="text-xs text-gray-500">{formatDateTime(incident.reportedAt)}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border self-start xs:self-auto ${getStatusColor(incident.status)}`}>
                                            {incident.status || "Pending"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {selectedIncident === incident._id && (
                                <div className="border-t border-gray-200 bg-gray-50 p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500 text-xs">Type</p>
                                            <p className="font-medium">{incident.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Severity</p>
                                            <p className="font-medium">{incident.severity || "N/A"}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <p className="text-gray-500 text-xs">Description</p>
                                            <p className="text-gray-700">{incident.description || "No description provided."}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Reported by</p>
                                            <p className="font-medium">{incident.reporterName || "Anonymous"}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Status</p>
                                            <p className={`font-medium ${incident.status === 'Resolved' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {incident.status || "Pending"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}