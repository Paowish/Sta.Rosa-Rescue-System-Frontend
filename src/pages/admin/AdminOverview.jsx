import { Icon } from "@iconify/react";
import AdminLayout from "./AdminLayout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminOverview() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });
    const [recentRequests, setRecentRequests] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Modal visibility states
    const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
    const [isIncidentsModalOpen, setIsIncidentsModalOpen] = useState(false);
    const [allRequests, setAllRequests] = useState([]);
    const [allIncidents, setAllIncidents] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            // Load incidents
            const incidentResponse = await fetch('/api/incidents', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const incidentData = await incidentResponse.json();

            if (incidentData.success) {
                setIncidents(incidentData.data.slice(0, 3));
                setAllIncidents(incidentData.data); // ✅ Store all for modal
                const total = incidentData.data.length;
                const active = incidentData.data.filter(i => i.status === 'Active' || i.status === 'Dispatched').length;
                const pending = incidentData.data.filter(i => i.status === 'Pending').length;
                setStats({ total, active, pending });
            }

            // Load pending volunteer requests
            const requestsResponse = await fetch('/api/admin/pending-volunteers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const requestsData = await requestsResponse.json();
            if (requestsData.success) {
                setRecentRequests(requestsData.data.slice(0, 3));
                setAllRequests(requestsData.data); // ✅ Store all for modal
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            setError("Failed to load dashboard data. Please refresh.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING": return "bg-[#FCE3AE] border border-[#E1791E] text-[#E1791E]";
            case "SOLVED": return "bg-[#D5FFE5] border border-[#15803D] text-[#15803D]";
            case "UNSOLVED": return "bg-[#FDE6EA] border border-[#DC2626] text-[#DC2626]";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case "volunteer": return "bg-[#D5FFE5] border border-[#15803D] text-[#15803D]";
            case "responder": return "bg-[#CBE8FF] border border-[#4285F4] text-[#4285F4]";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusDisplay = (status) => {
        switch (status) {
            case "Active": return "UNSOLVED";
            case "Dispatched": return "PENDING";
            case "Resolved": return "SOLVED";
            default: return status?.toUpperCase() || "PENDING";
        }
    };

    // ✅ New: Handlers for Accept/Decline inside Modal
    const handleAcceptRequest = async (userId) => {
        if (!window.confirm("Are you sure you want to accept this volunteer?")) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/approve-volunteer/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                alert("Volunteer accepted successfully!");
                loadData(); // Reload data to refresh lists
            } else {
                alert("Failed to accept: " + data.message);
            }
        } catch (error) {
            console.error("Error accepting request:", error);
            alert("Error processing request.");
        }
    };

    const handleDeclineRequest = async (userId) => {
        if (!window.confirm("Are you sure you want to decline this volunteer?")) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/reject-volunteer/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                alert("Volunteer declined.");
                loadData();
            } else {
                alert("Failed to decline: " + data.message);
            }
        } catch (error) {
            console.error("Error declining request:", error);
            alert("Error processing request.");
        }
    };

    // ✅ View All Handlers (Open Modal instead of navigate)
    const handleViewAllRequests = () => setIsRequestsModalOpen(true);
    const handleViewAllIncidents = () => setIsIncidentsModalOpen(true);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f6b75]"></div>
                    <div className="text-gray-500 ml-4">Loading dashboard...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFF]">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-[#262D31]">Admin Overview</h1>
                    <p className="text-gray-500 text-sm">System health, user summary, and activity snapshot</p>
                </div>

                {/* Error Message */}
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-start gap-3">
                            <p className="text-5xl font-bold text-[#672778] leading-none">{stats.total}</p>
                            <div>
                                <p className="text-gray-500 text-sm">Total Incidents</p>
                                <span className="text-green-500 text-sm font-medium flex items-center">
                                    {stats.active} Active
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-start gap-3">
                            <p className="text-5xl font-bold text-[#15803D] leading-none">{stats.active}</p>
                            <div>
                                <p className="text-gray-500 text-sm">Active incidents</p>
                                <span className="text-blue-500 text-sm font-medium">{Math.round((stats.active / stats.total) * 100) || 0}% Total</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-start gap-3">
                            <p className="text-5xl font-bold text-[#E1791E] leading-none">{stats.pending}</p>
                            <div>
                                <p className="text-gray-500 text-sm">Pending Accounts</p>
                                <span className="text-yellow-500 text-sm font-medium">Needs Review</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Account Requests */}
                <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-[#EAE9F9]">
                        <h2 className="font-semibold text-[#262D31]">Recent Account Request</h2>
                        <button
                            onClick={handleViewAllRequests}
                            className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                            View All
                            <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Requested</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {recentRequests.length > 0 ? (
                                    recentRequests.map((request, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{request.firstName} {request.lastName}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(request.role)}`}>
                                                    {request.role?.toUpperCase() || 'VOLUNTEER'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#000000]">{request.email}</td>
                                            <td className="px-4 py-3 text-sm text-[#000000]">
                                                {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor('PENDING')}`}>
                                                    PENDING
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleAcceptRequest(request._id)}
                                                        className="bg-[#15803D] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#166534] transition"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeclineRequest(request._id)}
                                                        className="bg-[#DC2626] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#c11f1f] transition"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                            No pending requests
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Incident Summary */}
                <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-[#EAE9F9]">
                        <h2 className="font-semibold text-[#262D31]">Incident Summary</h2>
                        <button
                            onClick={handleViewAllIncidents}
                            className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                            View All
                            <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Location</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Reported</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {incidents.length > 0 ? (
                                    incidents.map((incident) => (
                                        <tr key={incident._id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{incident.incidentId || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-[#000000]">{incident.type}</td>
                                            <td className="px-4 py-3 text-sm text-[#000000]">{incident.location?.address || 'Unknown'}</td>
                                            <td className="px-4 py-3 text-sm text-[#000000]">
                                                {incident.reportedAt ? new Date(incident.reportedAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(getStatusDisplay(incident.status))}`}>
                                                    {getStatusDisplay(incident.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                            No incidents found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ================================================================ */}
            {/* ✅ REQUESTS MODAL (All Volunteers) */}
            {/* ================================================================ */}
            {isRequestsModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-[#EAE9F9] shrink-0">
                            <h2 className="text-xl font-bold text-[#262D31]">All Account Requests</h2>
                            <button
                                onClick={() => setIsRequestsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Role</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Requested</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider border-b border-[#EAE9F9]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {allRequests.length > 0 ? (
                                        allRequests.map((request, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{request.firstName} {request.lastName}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(request.role)}`}>
                                                        {request.role?.toUpperCase() || 'VOLUNTEER'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[#000000]">{request.email}</td>
                                                <td className="px-4 py-3 text-sm text-[#000000]">
                                                    {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor('PENDING')}`}>
                                                        PENDING
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleAcceptRequest(request._id)}
                                                            className="bg-[#15803D] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#166534] transition"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeclineRequest(request._id)}
                                                            className="bg-[#DC2626] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#c11f1f] transition"
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                                No pending requests
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 border-t bg-gray-50 flex justify-end shrink-0">
                            <button
                                onClick={() => setIsRequestsModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* ✅ INCIDENTS MODAL (All Incidents) */}
            {/* ================================================================ */}
            {isIncidentsModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-[#EAE9F9] shrink-0">
                            <h2 className="text-xl font-bold text-[#262D31]">All Incidents</h2>
                            <button
                                onClick={() => setIsIncidentsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Location</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Reported</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {allIncidents.length > 0 ? (
                                        allIncidents.map((incident) => (
                                            <tr key={incident._id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{incident.incidentId || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-[#000000]">{incident.type}</td>
                                                <td className="px-4 py-3 text-sm text-[#000000]">{incident.location?.address || 'Unknown'}</td>
                                                <td className="px-4 py-3 text-sm text-[#000000]">
                                                    {incident.reportedAt ? new Date(incident.reportedAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(getStatusDisplay(incident.status))}`}>
                                                        {getStatusDisplay(incident.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                No incidents found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 border-t bg-gray-50 flex justify-end shrink-0">
                            <button
                                onClick={() => setIsIncidentsModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
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