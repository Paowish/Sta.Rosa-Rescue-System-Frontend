// src/pages/guest/GuestDashboard.jsx
import { useState, useEffect } from "react";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import GuestLayout from "../../components/layout/GuestLayout";

export default function GuestDashboard() {
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState("Good Morning");
    const [recentIncidents, setRecentIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ Helper to get API URL (No token for Guest)
    const getApiUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return '/api';
    };
=======
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import GuestLayout from "../../components/layout/GuestLayout";
import GuestTrackReport from "./GuestTrackReport";
import { incidentService } from "../../services/api";

export default function GuestDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [greeting, setGreeting] = useState("Good Morning");
    const [recentIncidents, setRecentIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, resolved: 0 });

    // Check if we're on the Track page
    const isTrackPage = location.pathname.includes('/Guest/Track');
>>>>>>> 3106177c4bdaea0e7d5d0545cf03ccc8a2c48969

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");

<<<<<<< HEAD
        // ✅ Load reports
        loadRecentIncidents();
    }, []);
=======
        if (!isTrackPage) {
            loadRecentIncidents();
        }
    }, [isTrackPage]);
>>>>>>> 3106177c4bdaea0e7d5d0545cf03ccc8a2c48969

    const loadRecentIncidents = async () => {
        try {
            setLoading(true);
<<<<<<< HEAD
            const apiUrl = getApiUrl();

            const response = await fetch(`${apiUrl}/incidents`);
            const data = await response.json();

            console.log("📡 Guest Dashboard fetch result:", data);

            if (data && data.success) {
                const incidents = data.data || [];
                setRecentIncidents(incidents.slice(0, 5));
=======
            const response = await incidentService.getAllIncidents();
            if (response && response.success) {
                const incidents = response.data || [];
                setRecentIncidents(incidents.slice(0, 5));
                setStats({
                    total: incidents.length,
                    active: incidents.filter(i => i.status === 'Active' || i.status === 'En Route' || i.status === 'Dispatched').length,
                    pending: incidents.filter(i => i.status === 'Pending').length,
                    resolved: incidents.filter(i => i.status === 'Resolved').length
                });
>>>>>>> 3106177c4bdaea0e7d5d0545cf03ccc8a2c48969
            }
        } catch (error) {
            console.error("Failed to load incidents:", error);
        } finally {
            setLoading(false);
        }
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

<<<<<<< HEAD
=======
    // ✅ If on Track page, show only the track report
    if (isTrackPage) {
        return (
            <GuestLayout>
                <GuestTrackReport />
            </GuestLayout>
        );
    }

>>>>>>> 3106177c4bdaea0e7d5d0545cf03ccc8a2c48969
    if (loading) {
        return (
            <GuestLayout>
                <div className="p-6 flex justify-center items-center h-64">
                    <div className="text-gray-500">Loading dashboard...</div>
                </div>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout>
<<<<<<< HEAD
            {/* ✅ Greeting Section */}
=======
            {/* ✅ Greeting Section - Fixed margin for mobile */}
>>>>>>> 3106177c4bdaea0e7d5d0545cf03ccc8a2c48969
            <div className="bg-[#DFF1FF] w-full px-4 sm:px-6 py-3 sm:py-4 rounded-lg mb-4 mt-2 sm:mt-0">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-semibold text-[#474C53]">
                    {greeting}, Guest
                </h1>
                <p className="text-sm sm:text-base text-[#5D7285] font-normal">
                    File incident reports, track status updates, and connect directly with the Rescue Team.
                </p>
            </div>

            {/* ✅ Report Incident Card */}
            <div
                onClick={() => navigate("/Guest/Report")}
                className="bg-gradient-to-r from-red-700 to-red-500 rounded-xl p-4 sm:p-6 py-3 sm:py-2 mb-6 flex items-center justify-between cursor-pointer hover:shadow-lg transition"
            >
                <div className="flex items-center gap-3 sm:gap-4">
                    <Icon icon="solar:siren-bold" width={40} className="sm:w-12 md:w-16 text-white flex-shrink-0" />
                    <div>
                        <h2 className="text-lg sm:text-xl md:text-4xl font-semibold text-[#FAFAFF]">Report an Incident</h2>
                        <p className="text-xs sm:text-sm md:text-base text-[#FAFAFF] font-light hidden sm:block">File a new emergency report with your location, photo evidence, and incident details. Responders are notified immediately.</p>
                        <p className="text-xs text-[#FAFAFF] font-light sm:hidden">File a new emergency report now.</p>
                    </div>
                </div>
                <Icon icon="mdi:chevron-right" width={24} className="sm:w-8 md:w-10 text-white flex-shrink-0" />
            </div>

            {/* ✅ Quick Actions */}
            <h2 className="text-lg sm:text-2xl text-[#474C53] font-semibold mb-3">Quick Actions</h2>

            <div
                onClick={() => navigate("/Guest/Track")}
                className="bg-white rounded-xl p-4 sm:p-6 py-3 sm:py-2 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 mb-6"
            >
                <div className="flex items-center gap-3 sm:gap-4">
                    <Icon icon="mdi:magnify" width={36} className="sm:w-12 md:w-16 text-[#DC2626] flex-shrink-0" />
                    <div>
                        <h3 className="text-base sm:text-xl md:text-[26px] font-semibold text-[#262D31]">Track Reports</h3>
                        <p className="text-xs sm:text-sm md:text-base text-[#5D7285] font-normal">Check the real-time status of your filed reports</p>
                    </div>
                </div>
            </div>

            {/* ✅ Recent Reports */}
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg sm:text-2xl text-[#474C53] font-semibold">Recent Reports</h2>
                <button
                    onClick={() => navigate("/Guest/Track")}
                    className="text-sm sm:text-[22px] text-[#474C53] font-semibold hover:text-blue-600 flex items-center gap-1"
                >
                    View All <Icon icon="mdi:chevron-right" width={16} />
                </button>
            </div>

            <div className="space-y-3">
                {recentIncidents.length > 0 ? (
                    recentIncidents.map((incident) => (
                        <div
                            key={incident._id}
                            onClick={() => navigate(`/Guest/Track`)}
                            className="flex items-center gap-3 sm:gap-4 bg-[#F7F7F7] border border-gray-200 rounded-md px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-100 transition cursor-pointer"
                        >
                            <div className="w-[3px] self-stretch bg-red-500 rounded-full"></div>
                            <div className="flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                                <div>
                                    <h3 className="text-base sm:text-xl font-semibold text-[#262D31] mb-0.5 sm:mb-1">{incident.type || "Unknown Incident"}</h3>
                                    <div className="flex flex-col gap-0.5 sm:gap-1 text-[#5D7285] text-xs sm:text-sm font-normal">
                                        <div className="flex items-center gap-1">
                                            <Icon icon="mdi:map-marker" width={14} />
                                            <span className="truncate max-w-[150px] sm:max-w-none">{incident.location?.address || "Unknown location"}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Icon icon="mdi:calendar" width={14} />
                                            <span>{formatDateTime(incident.reportedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                                    <span className="text-xs sm:text-sm text-[#8B8A8A] font-normal">{incident.incidentId || "N/A"}</span>
                                    <span className={`text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-[2px] rounded-lg ${getStatusColor(incident.status)}`}>
                                        {incident.status || "Pending"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-[#F7F7F7] border border-gray-200 rounded-md p-6 sm:p-8 text-center">
                        <p className="text-gray-500 text-sm sm:text-base">No incidents found</p>
                        <button
                            onClick={() => navigate("/Guest/Report")}
                            className="mt-2 sm:mt-3 text-blue-500 hover:text-blue-600 text-sm sm:text-base"
                        >
                            Report an Incident →
                        </button>
                    </div>
                )}
            </div>
        </GuestLayout>
    );
}