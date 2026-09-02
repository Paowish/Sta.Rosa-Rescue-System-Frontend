import { Icon } from "@iconify/react";
import AdminLayout from "./AdminLayout";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

/**
 * Status Badge Component
 * Displays status with appropriate color coding and icon
 */
const StatusBadge = ({ status }) => {
    let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
    let icon = "mdi:circle-outline";

    switch (status) {
        case "Resolved":
            colorClass = "bg-[#D5FFE5] text-[#15803D] border-[#15803D]";
            icon = "mdi:check-circle";
            break;
        case "Active":
            colorClass = "bg-[#FDE6EA] text-[#DC2626] border-[#DC2626]";
            icon = "mdi:alert-circle";
            break;
        case "Dispatched":
            colorClass = "bg-[#FCE3AE] text-[#E1791E] border-[#E1791E]";
            icon = "mdi:truck-delivery";
            break;
        case "Pending":
            colorClass = "bg-[#FCE3AE] text-[#E1791E] border-[#E1791E]";
            icon = "mdi:clock-outline";
            break;
        default:
            colorClass = "bg-gray-100 text-gray-700 border-gray-200";
            icon = "mdi:circle-outline";
    }

    const displayText = status === "Active" ? "UNSOLVED" : status === "Resolved" ? "SOLVED" : status?.toUpperCase() || "PENDING";

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border ${colorClass}`}>
            <Icon icon={icon} className="w-3.5 h-3.5" />
            {displayText}
        </span>
    );
};

/**
 * Role Badge Component
 * Displays user role with appropriate color coding
 */
const RoleBadge = ({ role }) => {
    let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
    switch (role) {
        case "volunteer": colorClass = "bg-[#D5FFE5] text-[#15803D] border-[#15803D]"; break;
        case "responder": colorClass = "bg-[#CBE8FF] text-[#4285F4] border-[#4285F4]"; break;
        case "admin": colorClass = "bg-[#FCE3AE] text-[#E1791E] border-[#E1791E]"; break;
        default: break;
    }
    return (
        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${colorClass}`}>
            {role?.toUpperCase() || 'VOLUNTEER'}
        </span>
    );
};

/**
 * Admin Overview Dashboard Component
 * Displays system statistics, pending registrations, and recent incidents
 */
export default function AdminOverview() {
    // State for dashboard statistics
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });
    const [recentRequests, setRecentRequests] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal visibility states
    const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
    const [isIncidentsModalOpen, setIsIncidentsModalOpen] = useState(false);
    const [allRequests, setAllRequests] = useState([]);
    const [allIncidents, setAllIncidents] = useState([]);

    // Modal search and filter states
    const [requestSearch, setRequestSearch] = useState("");
    const [incidentSearch, setIncidentSearch] = useState("");

    // Alert modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState({
        title: '', message: '', onConfirm: () => { },
        confirmText: 'Confirm', confirmColor: 'bg-green-600 hover:bg-green-700'
    });
    const [modalMessage, setModalMessage] = useState('');

    /**
     * Load dashboard data on component mount
     */
    useEffect(() => {
        loadData();
    }, []);

    /**
     * Fetch all dashboard data from API endpoints
     */
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            // Fetch incidents
            const incidentResponse = await fetch('/api/incidents', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const incidentData = await incidentResponse.json();

            if (incidentData.success) {
                setIncidents(incidentData.data.slice(0, 5));
                setAllIncidents(incidentData.data);
                const total = incidentData.data.length;
                const active = incidentData.data.filter(i => i.status === 'Active' || i.status === 'Dispatched').length;
                const pending = incidentData.data.filter(i => i.status === 'Pending').length;
                setStats({ total, active, pending });
            }

            // Fetch pending volunteer requests
            const requestsResponse = await fetch('/api/admin/pending-volunteers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const requestsData = await requestsResponse.json();
            if (requestsData.success) {
                setRecentRequests(requestsData.data.slice(0, 5));
                setAllRequests(requestsData.data);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            setError("Failed to load dashboard data. Please refresh.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle accepting a volunteer request
     */
    const handleAcceptRequest = (userId, userName) => {
        setConfirmModalData({
            title: `Accept ${userName || 'Volunteer'}?`,
            message: `This will grant full system access to <strong>${userName || 'this volunteer'}</strong>. Are you sure?`,
            confirmText: 'Yes, Accept',
            confirmColor: 'bg-green-600 hover:bg-green-700',
            onConfirm: () => confirmAcceptRequest(userId)
        });
        setShowConfirmModal(true);
    };

    /**
     * Handle declining a volunteer request
     */
    const handleDeclineRequest = (userId, userName) => {
        setConfirmModalData({
            title: `Decline ${userName || 'Volunteer'}?`,
            message: `This will permanently reject <strong>${userName || 'this volunteer'}</strong>'s application. Continue?`,
            confirmText: 'Yes, Decline',
            confirmColor: 'bg-red-600 hover:bg-red-700',
            onConfirm: () => confirmDeclineRequest(userId)
        });
        setShowConfirmModal(true);
    };

    /**
     * Confirm and execute volunteer acceptance
     */
    const confirmAcceptRequest = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/approve-volunteer/${userId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setShowConfirmModal(false);
            if (data.success) {
                setModalMessage("Volunteer accepted successfully! They can now log in.");
                setShowSuccessModal(true);
                loadData();
            } else {
                setModalMessage(data.message || "Failed to accept volunteer.");
                setShowErrorModal(true);
            }
        } catch (error) {
            setShowConfirmModal(false);
            setModalMessage("Error processing request.");
            setShowErrorModal(true);
        }
    };

    /**
     * Confirm and execute volunteer decline
     */
    const confirmDeclineRequest = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/reject-volunteer/${userId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setShowConfirmModal(false);
            if (data.success) {
                setModalMessage("Volunteer declined.");
                setShowSuccessModal(true);
                loadData();
            } else {
                setModalMessage(data.message || "Failed to decline volunteer.");
                setShowErrorModal(true);
            }
        } catch (error) {
            setShowConfirmModal(false);
            setModalMessage("Error processing request.");
            setShowErrorModal(true);
        }
    };

    /**
     * Filter requests based on search input
     */
    const filteredRequests = useMemo(() => {
        if (!requestSearch) return allRequests;
        return allRequests.filter(r =>
            `${r.firstName} ${r.lastName}`.toLowerCase().includes(requestSearch.toLowerCase()) ||
            r.email.toLowerCase().includes(requestSearch.toLowerCase())
        );
    }, [allRequests, requestSearch]);

    /**
     * Filter incidents based on search input
     */
    const filteredIncidents = useMemo(() => {
        if (!incidentSearch) return allIncidents;
        return allIncidents.filter(i =>
            i.incidentId?.toLowerCase().includes(incidentSearch.toLowerCase()) ||
            i.type?.toLowerCase().includes(incidentSearch.toLowerCase()) ||
            i.location?.address?.toLowerCase().includes(incidentSearch.toLowerCase())
        );
    }, [allIncidents, incidentSearch]);

    // Render loading skeleton
    if (loading) {
        return (
            <AdminLayout>
                <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFF]">
                    <div className="mb-6 animate-pulse">
                        <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-64 bg-gray-200 rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-lg shadow p-5 animate-pulse">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-14 bg-gray-200 rounded"></div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-lg shadow h-64 animate-pulse">
                        <div className="p-4 border-b bg-gray-50 h-12"></div>
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-6 bg-gray-100 rounded w-full"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Render main dashboard
    return (
        <AdminLayout>
            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFF]">
                {/* Page Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#262D31]">Admin Overview</h1>
                        <p className="text-gray-500 text-sm mt-1">System health, user activity, and incident snapshot.</p>
                    </div>
                    <button
                        onClick={loadData}
                        className="mt-2 md:mt-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
                    >
                        <Icon icon="mdi:refresh" className="w-4 h-4" />
                        Refresh Data
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-[#FDE6EA] border border-[#DC2626] rounded-xl text-[#DC2626] flex items-center gap-3">
                        <Icon icon="mdi:alert-circle" className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto hover:text-[#c11f1f]">
                            <Icon icon="mdi:close" className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] p-6 border border-gray-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-4xl font-bold text-[#672778] leading-none">{stats.total}</p>
                                <p className="text-gray-500 text-sm mt-2 font-medium">Total Incidents</p>
                            </div>
                            <div className="bg-purple-50 p-2 rounded-lg">
                                <Icon icon="mdi:chart-bar" className="w-6 h-6 text-[#672778]" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full w-fit">
                            <Icon icon="mdi:arrow-up" className="w-3 h-3" />
                            {stats.active} Active
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] p-6 border border-gray-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-4xl font-bold text-[#15803D] leading-none">{stats.active}</p>
                                <p className="text-gray-500 text-sm mt-2 font-medium">Active Incidents</p>
                            </div>
                            <div className="bg-green-50 p-2 rounded-lg">
                                <Icon icon="mdi:lightning-bolt" className="w-6 h-6 text-[#15803D]" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full w-fit">
                            <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                            {Math.round((stats.active / (stats.total || 1)) * 100)}% of total
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] p-6 border border-gray-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-4xl font-bold text-[#E1791E] leading-none">{stats.pending}</p>
                                <p className="text-gray-500 text-sm mt-2 font-medium">Pending Approvals</p>
                            </div>
                            <div className="bg-orange-50 p-2 rounded-lg">
                                <Icon icon="mdi:hourglass-outline" className="w-6 h-6 text-[#E1791E]" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-yellow-600 font-semibold bg-yellow-50 px-2 py-1 rounded-full w-fit">
                            <Icon icon="mdi:alert" className="w-3 h-3" />
                            Needs Review
                        </div>
                    </div>
                </div>

                {/* Recent Account Requests */}
                <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-gray-100 mb-8 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white">
                        <div className="flex items-center gap-2">
                            <Icon icon="mdi:account-plus" className="w-5 h-5 text-[#262D31]" />
                            <h2 className="font-bold text-[#262D31] text-base">Pending Registrations</h2>
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {recentRequests.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsRequestsModalOpen(true)}
                            className="text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-1 transition cursor-pointer mt-2 sm:mt-0"
                        >
                            View All
                            <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Volunteer</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Requested</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentRequests.length > 0 ? (
                                    recentRequests.map((request) => (
                                        <tr key={request._id} className="hover:bg-[#FAFAFF] transition duration-150">
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                                {request.firstName} {request.lastName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <RoleBadge role={request.role} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{request.email}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status="Pending" />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => handleAcceptRequest(request._id, `${request.firstName} ${request.lastName}`)}
                                                        className="bg-[#15803D] text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#166534] transition shadow-sm flex items-center gap-1"
                                                    >
                                                        <Icon icon="mdi:check" className="w-3.5 h-3.5" />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeclineRequest(request._id, `${request.firstName} ${request.lastName}`)}
                                                        className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition flex items-center gap-1"
                                                    >
                                                        <Icon icon="mdi:close" className="w-3.5 h-3.5" />
                                                        Decline
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            <Icon icon="mdi:inbox" className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                            <p className="font-medium">All caught up!</p>
                                            <p className="text-xs text-gray-400">No pending volunteer registrations.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Incident Summary */}
                <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white">
                        <div className="flex items-center gap-2">
                            <Icon icon="mdi:file-document" className="w-5 h-5 text-[#262D31]" />
                            <h2 className="font-bold text-[#262D31] text-base">Recent Incidents</h2>
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {incidents.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsIncidentsModalOpen(true)}
                            className="text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-1 transition cursor-pointer mt-2 sm:mt-0"
                        >
                            View All
                            <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Barangay</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reported</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {incidents.length > 0 ? (
                                    incidents.map((incident) => (
                                        <tr key={incident._id} className="hover:bg-[#FAFAFF] transition duration-150">
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{incident.incidentId || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{incident.type}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{incident.location?.barangay || incident.location?.address || 'Unknown'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {incident.reportedAt ? new Date(incident.reportedAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={incident.status} />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            <Icon icon="mdi:check-circle" className="w-12 h-12 mx-auto text-green-300 mb-2" />
                                            <p className="font-medium">All clear!</p>
                                            <p className="text-xs text-gray-400">No incidents have been reported recently.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* View All Modals */}
            {/* Requests Modal */}
            {isRequestsModalOpen && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <Icon icon="mdi:account-group" className="w-6 h-6 text-[#262D31]" />
                                <div>
                                    <h2 className="text-xl font-bold text-[#262D31]">All Registrations</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Manage all pending volunteer accounts.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsRequestsModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition">
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-6 py-4 border-b bg-gray-50/50 flex gap-3">
                            <div className="relative flex-1">
                                <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={requestSearch}
                                    onChange={(e) => setRequestSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-0">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Volunteer</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Requested</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRequests.length > 0 ? (
                                        filteredRequests.map((request) => (
                                            <tr key={request._id} className="hover:bg-[#FAFAFF] transition duration-150">
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                                    {request.firstName} {request.lastName}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <RoleBadge role={request.role} />
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{request.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status="Pending" />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <button
                                                            onClick={() => handleAcceptRequest(request._id, `${request.firstName} ${request.lastName}`)}
                                                            className="bg-[#15803D] text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#166534] transition shadow-sm flex items-center gap-1"
                                                        >
                                                            <Icon icon="mdi:check" className="w-3.5 h-3.5" />
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeclineRequest(request._id, `${request.firstName} ${request.lastName}`)}
                                                            className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition flex items-center gap-1"
                                                        >
                                                            <Icon icon="mdi:close" className="w-3.5 h-3.5" />
                                                            Decline
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                <Icon icon="mdi:inbox" className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                                <p className="font-medium">No registrations found</p>
                                                <p className="text-xs text-gray-400">Try adjusting your search.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center shrink-0">
                            <span className="text-xs text-gray-500">{filteredRequests.length} record(s) found</span>
                            <button onClick={() => setIsRequestsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium">
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Incidents Modal */}
            {isIncidentsModalOpen && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <Icon icon="mdi:clipboard-list" className="w-6 h-6 text-[#262D31]" />
                                <div>
                                    <h2 className="text-xl font-bold text-[#262D31]">All Incidents</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Complete history of all reported emergencies.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsIncidentsModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition">
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-6 py-4 border-b bg-gray-50/50 flex gap-3">
                            <div className="relative flex-1">
                                <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, type, or location..."
                                    value={incidentSearch}
                                    onChange={(e) => setIncidentSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-0">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Barangay</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reported</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredIncidents.length > 0 ? (
                                        filteredIncidents.map((incident) => (
                                            <tr key={incident._id} className="hover:bg-[#FAFAFF] transition duration-150">
                                                <td className="px-6 py-4 text-sm font-mono text-gray-500">{incident.incidentId || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{incident.type}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{incident.location?.barangay || incident.location?.address || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {incident.reportedAt ? new Date(incident.reportedAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={incident.status} />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                <Icon icon="mdi:check-circle" className="w-12 h-12 mx-auto text-green-300 mb-2" />
                                                <p className="font-medium">No incidents found</p>
                                                <p className="text-xs text-gray-400">Try adjusting your search.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center shrink-0">
                            <span className="text-xs text-gray-500">{filteredIncidents.length} record(s) found</span>
                            <button onClick={() => setIsIncidentsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium">
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Alert Modals */}
            {/* Confirm Modal */}
            {showConfirmModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b-4 border-blue-500 flex justify-between items-start bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                                    <Icon icon="mdi:help-circle" className="w-5 h-5 text-blue-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">{confirmModalData.title}</h2>
                            </div>
                            <button onClick={() => setShowConfirmModal(false)} className="text-gray-500 hover:text-gray-700 transition mt-1">
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: confirmModalData.message }} />
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={confirmModalData.onConfirm} className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition ${confirmModalData.confirmColor}`}>
                                {confirmModalData.confirmText}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Success Modal */}
            {showSuccessModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b-4 border-green-500 flex justify-between items-start bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                                    <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">Success</h2>
                            </div>
                            <button onClick={() => setShowSuccessModal(false)} className="text-gray-500 hover:text-gray-700 transition mt-1">
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm">{modalMessage}</p>
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setShowSuccessModal(false)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition">
                                OK
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Error Modal */}
            {showErrorModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b-4 border-red-500 flex justify-between items-start bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
                                    <Icon icon="mdi:close-circle" className="w-5 h-5 text-red-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">Error</h2>
                            </div>
                            <button onClick={() => setShowErrorModal(false)} className="text-gray-500 hover:text-gray-700 transition mt-1">
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm">{modalMessage}</p>
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setShowErrorModal(false)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition">
                                OK
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </AdminLayout>
    );
}