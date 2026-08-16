import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import notificationService from "../../services/notificationService";

// --- Components ---
const Tag = ({ label }) => (
    <span className="inline-block bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded border border-blue-100 mr-1.5 mb-1.5">
        {label}
    </span>
);

// Schedule Component
const ScheduleBar = ({ schedule }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const getColor = (day) => {
        if (schedule && schedule.includes(day)) {
            return 'bg-green-500';
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

// --- Main Component ---
export default function Units() {
    const [selectedId, setSelectedId] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [stats] = useState({
        total: 4,
        available: 1,
        deployed: 2,
        standby: 1
    });

    const [responders] = useState([
        {
            id: 1,
            name: 'Team Alpha',
            role: 'Search & Rescue',
            specialties: ['First Aid', 'BLS/CPR', 'Water Rescue', 'USAR LVL 1'],
            volunteerId: 'RES-001',
            members: '6 Members',
            teamLeader: 'Mark Chavez',
            certifications: ['BLS/CPR', 'First Aid', 'Water Rescue', 'USAR LVL 1', 'Patient Triage'],
            isAvailable: false,
            schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            teamMembers: ['Mark Chavez', 'Juan Dela Cruz', 'Ramon Santos', 'Miguel Reyes', 'Andres Gomez', 'Pedro Lopez']
        },
        {
            id: 2,
            name: 'Team Beta',
            role: 'Fire & Rescue',
            specialties: ['First Aid', 'BLS/CPR', 'Fire Fighting', 'Hazmat'],
            volunteerId: 'RES-002',
            members: '6 Members',
            teamLeader: 'James Reyes',
            certifications: ['BLS/CPR', 'First Aid', 'Fire Fighting', 'Hazmat', 'Patient Triage'],
            isAvailable: false,
            schedule: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            teamMembers: ['James Reyes', 'Mark Cruz', 'Ramon Mendoza', 'Albert Santos', 'Philip Garcia', 'Luz Torres']
        },
        {
            id: 3,
            name: 'Team Charlie',
            role: 'Mountain Rescue',
            specialties: ['First Aid', 'BLS/CPR', 'Mountain Rescue', 'USAR LVL 2'],
            volunteerId: 'RES-003',
            members: '6 Members',
            teamLeader: 'Albert Santos',
            certifications: ['BLS/CPR', 'First Aid', 'Mountain Rescue', 'USAR LVL 2', 'Patient Triage'],
            isAvailable: true,
            schedule: ['Mon', 'Tue', 'Thu', 'Fri', 'Sun'],
            teamMembers: ['Albert Santos', 'Jose Rizal', 'Manuel Dela Cruz', 'Ramon Cruz', 'Elena Gomez', 'Carlos Mendoza']
        },
        {
            id: 4,
            name: 'Team Delta',
            role: 'K9 & Emergency',
            specialties: ['BLS/CPR', 'K9 Rescue', 'Emergency Driving'],
            volunteerId: 'RES-004',
            members: '6 Members',
            teamLeader: 'Ramon Cruz',
            certifications: ['BLS/CPR', 'K9 Rescue', 'Emergency Driving', 'First Aid'],
            isAvailable: false,
            schedule: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            teamMembers: ['Ramon Cruz', 'Maria Santos', 'Juan Dela Cruz', 'Ana Reyes', 'Pedro Lopez', 'Luz Gomez']
        }
    ]);

    // ✅ FIXED: useEffect is now inside the component
    useEffect(() => {
        // ✅ Subscribe to notification service events
        const unsubscribe = notificationService.addListener((data) => {
            if (data.type === 'show') {
                console.log('📢 New incident in Units!', data.notification);
                // ✅ Refresh units when new notification arrives
                // Add your refresh logic here
            } else if (data.type === 'dismiss') {
                console.log('🔇 Notification dismissed globally');
            }
        });

        return unsubscribe;
    }, []);

    const activeResponder = responders.find(r => r.id === selectedId);

    return (
        <div className="min-h-screen bg-[#fafbfc] p-6 font-sans text-gray-800 relative">

            {/* --- Header --- */}
            <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <Icon icon="mdi:account-group" className="w-8 h-8 text-[#1f4e6f]" />
                    <div>
                        <h1 className="text-2xl font-bold text-[#1f4e6f] tracking-tight">Responders</h1>
                        <p className="text-xs text-gray-400 font-medium">Team roster & deployment status</p>
                        <p className="text-xs text-gray-400 font-medium">Santa Rosa Emergency Response</p>
                    </div>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    <Icon icon="mdi:refresh" className="w-4 h-4" /> Refresh
                </button>
            </header>

            <div className="flex gap-6">

                {/* --- Left Column --- */}
                <div className="flex-1">

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded border border-gray-200 p-4 flex flex-col justify-between shadow-sm h-24">
                            <span className="text-3xl font-bold text-gray-800">{stats.total}</span>
                            <div className="border-b-2 border-gray-200 pb-1">
                                <span className="text-[13px] font-medium text-gray-500 pb-0.5">Total Units</span>
                            </div>
                        </div>
                        <div className="bg-white rounded border border-gray-200 p-4 flex flex-col justify-between shadow-sm h-24">
                            <span className="text-3xl font-bold text-gray-800">{stats.available}</span>
                            <div className="border-b-2 border-green-600 pb-1">
                                <span className="text-[13px] font-medium text-gray-500 pb-0.5">Available</span>
                            </div>
                        </div>
                        <div className="bg-white rounded border border-gray-200 p-4 flex flex-col justify-between shadow-sm h-24">
                            <span className="text-3xl font-bold text-gray-800">{stats.deployed}</span>
                            <div className="border-b-2 border-orange-400 pb-1">
                                <span className="text-[13px] font-medium text-gray-500 pb-0.5">Deployed</span>
                            </div>
                        </div>
                        <div className="bg-white rounded border border-gray-200 p-4 flex flex-col justify-between shadow-sm h-24">
                            <span className="text-3xl font-bold text-gray-800">{stats.standby}</span>
                            <div className="border-b-2 border-yellow-400 pb-1">
                                <span className="text-[13px] font-medium text-gray-500 pb-0.5">Stand by</span>
                            </div>
                        </div>
                    </div>

                    {/* Grid Cards */}
                    <div className="grid grid-cols-2 gap-5">
                        {responders.map((r) => (
                            <div
                                key={r.id}
                                onClick={() => {
                                    setSelectedId(r.id);
                                    setSelectedMember(null);
                                }}
                                className={`bg-[#f5f7fc] rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative ${selectedId === r.id ? 'ring-2 ring-blue-400' : ''}`}
                            >
                                {/* Removed Color Top Bar */}
                                <div className="p-5 pb-3">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-full bg-[#dbe0e8] flex-shrink-0 flex items-center justify-center text-gray-400">
                                            <Icon icon="mdi:account-group" className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-[15px] text-gray-800">{r.name}</div>
                                            <div className="text-[12px] text-gray-500">{r.role}</div>
                                            {/* Removed StatusBadge */}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-3 mt-2">
                                        <div className="text-[12px] font-medium text-gray-500 mb-1.5">Speciality</div>
                                        <div className="flex flex-wrap">
                                            {r.specialties.length > 0 ? (
                                                r.specialties.slice(0, 4).map(s => <Tag key={s} label={s} />)
                                            ) : (
                                                <span className="text-xs text-gray-400">No specialties</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <ScheduleBar schedule={r.schedule} />
                                    </div>

                                    {/* Removed Team ID, Assignment, and ETA footer */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Right Column (Side Panel) --- */}
                <div className="w-[380px] bg-white rounded-xl border border-gray-200 shadow-lg h-[calc(100vh-140px)] sticky top-6 overflow-hidden shrink-0">
                    {activeResponder ? (
                        <div className="h-full flex flex-col">

                            {/* Top Section */}
                            <div className="p-6 flex items-center gap-4 relative border-b border-gray-200">
                                <div className="w-16 h-16 rounded-full bg-[#dbe0e8] flex-shrink-0 relative flex items-center justify-center">
                                    <Icon icon="mdi:account-group" className="w-8 h-8 text-gray-400" />
                                    {/* Removed Status Dot */}
                                </div>
                                <div>
                                    <h3 className="text-[20px] font-bold text-gray-800">{activeResponder.name}</h3>
                                    <p className="text-[13px] text-gray-500 font-medium">{activeResponder.role}</p>
                                    <p className="text-xs text-blue-600 font-medium">Team Leader: {activeResponder.teamLeader}</p>
                                    {/* Removed StatusBadge */}
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedId(null);
                                        setSelectedMember(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-1 absolute top-4 right-4"
                                >
                                    <Icon icon="mdi:close" className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Info Rows */}
                            <div className="flex-1 overflow-y-auto text-[13px] pb-4">

                                <div className="bg-[#e5e9ee] py-2.5 px-6 font-medium text-gray-600 border-y border-gray-200 text-[12px]">
                                    Profile
                                </div>
                                <div className="flex flex-col">
                                    {/* Removed Team ID Row */}

                                    {/* Members row with dropdown showing full names */}
                                    <div className="flex items-center justify-between py-2.5 px-6 border-b border-gray-100 bg-[#f7f8fa]">
                                        <span className="text-gray-500 font-medium">Members</span>
                                        <div className="flex items-center gap-0">
                                            <span className="text-gray-800 font-bold">{activeResponder.members}</span>
                                            <div className="relative inline-block ml-0">
                                                <select
                                                    value={selectedMember || ''}
                                                    onChange={(e) => setSelectedMember(e.target.value)}
                                                    className="appearance-none border-0 bg-transparent pr-6 py-1 text-sm text-gray-700 focus:outline-none focus:ring-0 cursor-pointer w-8"
                                                    aria-label="Select team member"
                                                >
                                                    <option value=""> </option>
                                                    {activeResponder.teamMembers && activeResponder.teamMembers.map((member, idx) => (
                                                        <option key={idx} value={member}>{member}</option>
                                                    ))}
                                                </select>
                                                <Icon icon="mdi:chevron-down" className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between py-2.5 px-6 border-b border-gray-100 bg-white">
                                        <span className="text-gray-500 font-medium">Team Leader</span>
                                        <span className="text-gray-800 font-bold">{activeResponder.teamLeader}</span>
                                    </div>
                                    {/* Removed Status Row */}
                                </div>

                                {/* Selected Member Display with Full Name */}
                                {selectedMember && (
                                    <div className="bg-blue-50 border-l-4 border-blue-500 px-4 py-3 mx-4 my-2 rounded">
                                        <p className="text-sm font-medium text-blue-800">Selected: {selectedMember}</p>
                                        <p className="text-xs text-blue-600">Member of {activeResponder.name}</p>
                                    </div>
                                )}

                                <div className="bg-[#e5e9ee] py-2.5 px-6 font-medium text-gray-600 border-y border-gray-200 text-[12px]">
                                    Schedule
                                </div>
                                <div className="p-6 bg-white">
                                    <ScheduleBar schedule={activeResponder.schedule} />
                                </div>

                                <div className="bg-[#e5e9ee] py-2.5 px-6 font-medium text-gray-600 border-y border-gray-200 text-[12px]">
                                    Specialties
                                </div>
                                <div className="p-6 flex flex-wrap gap-1.5 bg-white">
                                    {activeResponder.specialties && activeResponder.specialties.length > 0 ? (
                                        activeResponder.specialties.map((cert, idx) => (
                                            <span key={idx} className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded text-[11px] font-medium shadow-sm">
                                                {cert}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-xs">No specialties listed</span>
                                    )}
                                </div>

                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-6">
                            <Icon icon="mdi:account-search" className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-800">No Selection</h3>
                            <p className="text-sm text-gray-500 font-medium max-w-[250px] text-center">
                                Click a team card to view full details.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}