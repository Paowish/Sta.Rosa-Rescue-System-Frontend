import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { incidentService } from "../../services/api";

/**
 * Stat Card Component
 * Displays a statistics card with title and value
 */
function StatCard({ title, value, color }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-300 flex flex-col h-24">
            <span className={`text-3xl font-bold ${color}`}>{value}</span>
            <div className={`border-b-2 mt-auto pb-1 ${color.replace('text-', 'border-')}`}>
                <span className="text-[13px] font-medium text-gray-500">{title}</span>
            </div>
        </div>
    );
}

/**
 * Tag Component
 * Displays a small label/tag
 */
const Tag = ({ label }) => (
    <span className="inline-block bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded border border-blue-100 mr-1.5 mb-1.5">
        {label}
    </span>
);

/**
 * Schedule Bar Component
 * Displays a weekly schedule with colored indicators
 */
const ScheduleBar = ({ schedule }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const getColor = (day) => {
        if (schedule && schedule.includes(day)) {
            return 'bg-emerald-500';
        }
        return 'bg-gray-200';
    };

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-medium w-12">Schedule</span>
                <div className="flex gap-1">
                    {days.map((day) => (
                        <div key={day} className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full ${getColor(day)} flex items-center justify-center`}>
                                <span className={`text-[8px] font-bold ${getColor(day) === 'bg-gray-200' ? 'text-gray-400' : 'text-white'}`}>
                                    {day.charAt(0)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="text-[10px] text-gray-400 ml-14">
                {schedule && schedule.length > 0 ? schedule.join(' · ') : 'No schedule set'}
            </div>
        </div>
    );
};

/**
 * Units Component
 * Displays and manages responder teams with details sidebar
 */
export default function Units() {
    // State for selected responder
    const [selectedId, setSelectedId] = useState(null);

    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        available: 0,
        deployed: 0,
        standby: 0
    });

    // ✅ Fetch teams from database
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    /**
     * Fetch teams from API
     */
    const fetchTeams = async () => {
        setLoading(true);
        try {
            const response = await incidentService.getTeams();
            if (response && response.success) {
                setTeams(response.data || []);

                // Update stats based on team availability
                const total = response.data?.length || 0;
                const available = response.data?.filter(t => t.members?.some(m => m.isOnDuty !== false))?.length || 0;
                const deployed = response.data?.filter(t => t.isAvailable === false)?.length || 0;
                const standby = total - deployed - available;

                setStats({
                    total,
                    available,
                    deployed,
                    standby
                });
            }
        } catch (error) {
            console.error("Failed to load teams:", error);
        } finally {
            setLoading(false);
        }
    };

    // Load teams on mount
    useEffect(() => {
        fetchTeams();
    }, []);

    /**
     * Format team data from database
     */
    const formatTeam = (team) => {
        return {
            id: team._id,
            name: team.name,
            role: team.role,
            specialties: team.specialties || [],
            volunteerId: team.volunteerId,
            members: team.members?.length || 0,
            teamLeader: team.teamLeader ? `${team.teamLeader.firstName} ${team.teamLeader.lastName}` : 'N/A',
            certifications: team.specialties || [],
            isAvailable: team.members?.some(m => m.isOnDuty !== false) || false,
            schedule: team.schedule || [],
            teamMembers: team.members?.map(m => `${m.firstName} ${m.lastName}`) || []
        };
    };

    // Map teams to responders format
    const responders = teams.map(formatTeam);

    // Get selected responder
    const activeResponder = responders.find(r => r.id === selectedId);

    /**
     * Get member count display
     */
    const getMemberCount = (members) => {
        if (!members) return '0 Members';
        if (Array.isArray(members)) return `${members.length} Members`;
        return members;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fafbfc] font-sans text-gray-800 flex items-center justify-center">
                <div className="text-gray-500">Loading teams...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafbfc] font-sans text-gray-800 relative">
            <div className="flex gap-6">
                {/* Left Column */}
                <div className="flex-1 min-w-0 pb-6">
                    {/* Header */}
                    <header className="flex justify-between items-center pt-6 pb-4 pl-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Icon icon="mdi:account-group" className="w-8 h-8 text-[#1f4e6f]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#1f4e6f] tracking-tight">Responders</h1>
                                <p className="text-xs text-gray-400 font-medium">Santa Rosa Emergency Response</p>
                            </div>
                        </div>
                    </header>

                    {/* Responder Grid */}
                    <div className="pl-6 pt-6">
                        {responders.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">No teams found</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-5">
                                {responders.map((r) => (
                                    <div
                                        key={r.id}
                                        onClick={() => setSelectedId(r.id)}
                                        className={`bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 relative ${selectedId === r.id ? 'ring-2 ring-blue-500 shadow-blue-100' : 'shadow-sm'
                                            }`}
                                    >
                                        <div className="p-5 pb-3">
                                            {/* Team Info */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-full bg-[#f0f2f5] flex-shrink-0 flex items-center justify-center text-gray-500 border border-gray-200">
                                                    <Icon icon="mdi:account-group" className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[15px] text-gray-800">{r.name}</div>
                                                    <div className="text-[12px] text-gray-500">{r.role}</div>
                                                </div>
                                            </div>

                                            {/* Specialties */}
                                            <div className="border-t border-gray-100 pt-3 mt-2">
                                                <div className="text-[12px] font-medium text-gray-500 mb-1.5">Speciality</div>
                                                <div className="flex flex-wrap">
                                                    {r.specialties.length > 0 ? (
                                                        r.specialties.slice(0, 4).map(s => <Tag key={s} label={s} />)
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No specialties</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Schedule */}
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <ScheduleBar schedule={r.schedule} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Details Sidebar */}
                <div className="w-[400px] shrink-0 bg-white border-l border-gray-200 shadow-xl h-screen sticky top-0 overflow-y-auto flex flex-col">
                    {activeResponder ? (
                        <>
                            {/* Header */}
                            <div className="p-6 flex items-center gap-4 relative border-b border-gray-200 bg-white">
                                <div className="w-16 h-16 rounded-full bg-[#f0f2f5] flex-shrink-0 relative flex items-center justify-center border-2 border-gray-200">
                                    <Icon icon="mdi:account-group" className="w-8 h-8 text-gray-400" />
                                </div>
                                <div className="flex-1 pr-6">
                                    <h3 className="text-[20px] font-bold text-gray-800 truncate">{activeResponder.name}</h3>
                                    <p className="text-[13px] text-gray-500 font-medium">{activeResponder.role}</p>
                                    <p className="text-xs text-blue-600 font-medium truncate">
                                        Team Leader: {activeResponder.teamLeader}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <Icon icon="mdi:close" className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Details */}
                            <div className="flex-1 text-[13px] bg-white pb-4">
                                {/* Profile Section */}
                                <div className="bg-[#f8f9fa] py-2.5 px-6 font-semibold text-gray-600 border-y border-gray-200 text-[12px]">
                                    Profile
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between py-3 px-6 border-b border-gray-100 bg-white">
                                        <span className="text-gray-500 font-medium">Members</span>
                                        <span className="text-gray-800 font-bold">{getMemberCount(activeResponder.members)}</span>
                                    </div>
                                    <div className="flex justify-between py-3 px-6 border-b border-gray-100 bg-white">
                                        <span className="text-gray-500 font-medium">Team Leader</span>
                                        <span className="text-gray-800 font-bold">{activeResponder.teamLeader}</span>
                                    </div>
                                </div>

                                {/* Team Members */}
                                {activeResponder.teamMembers && activeResponder.teamMembers.length > 0 && (
                                    <div className="px-6 py-3 border-b border-gray-100 bg-white">
                                        <span className="text-gray-500 font-medium block mb-2">Team Members</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {activeResponder.teamMembers.map((member, idx) => (
                                                <span
                                                    key={idx}
                                                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-[12px] font-medium border border-gray-200"
                                                >
                                                    {member}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Schedule Section */}
                                <div className="bg-[#f8f9fa] py-2.5 px-6 font-semibold text-gray-600 border-y border-gray-200 text-[12px]">
                                    Schedule
                                </div>
                                <div className="p-6 bg-white">
                                    <ScheduleBar schedule={activeResponder.schedule} />
                                </div>

                                {/* Specialties Section */}
                                <div className="bg-[#f8f9fa] py-2.5 px-6 font-semibold text-gray-600 border-y border-gray-200 text-[12px]">
                                    Specialties
                                </div>
                                <div className="p-6 flex flex-wrap gap-1.5 bg-white">
                                    {activeResponder.specialties && activeResponder.specialties.length > 0 ? (
                                        activeResponder.specialties.map((cert, idx) => (
                                            <span
                                                key={idx}
                                                className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded text-[11px] font-medium shadow-sm hover:border-blue-300 transition-colors"
                                            >
                                                {cert}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-xs">No specialties listed</span>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        // Empty State
                        <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50/50">
                            <div className="bg-gray-100 p-4 rounded-full mb-4">
                                <Icon icon="mdi:account-search" className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">No Selection</h3>
                            <p className="text-sm text-gray-500 font-medium max-w-[250px] text-center mt-1">
                                Click a team card to view full details.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}