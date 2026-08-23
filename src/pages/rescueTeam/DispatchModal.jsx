import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

export default function DispatchModal({
    isOpen,
    onClose,
    onDispatch,
    title,
    incidentId,
    volunteers,
    loadingVolunteers,
    selectedIds,
    setSelectedIds,
    isDispatching,
    isResolved,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    handleVolunteerToggle,
    handleRemoveSelected
}) {
    if (!isOpen) return null;

    // ✅ Internal Local State for opening/closing Teams
    const [expandedTeamId, setExpandedTeamId] = useState(null);

    // ✅ State for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingTabChange, setPendingTabChange] = useState(null);

    // ✅ Default Rescue Teams (Alpha, Beta, Charlie, Delta)
    const MOCK_TEAMS = [
        {
            id: "team_alpha",
            name: "Team Alpha",
            role: "Search & Rescue",
            teamLeader: "Mark Chavez",
            volunteerId: "RES-001",
            members: [
                { _id: "alpha_1", firstName: "Mark", lastName: "Chavez" },
                { _id: "alpha_2", firstName: "Juan", lastName: "Dela Cruz" },
                { _id: "alpha_3", firstName: "Ramon", lastName: "Santos" },
                { _id: "alpha_4", firstName: "Miguel", lastName: "Reyes" },
                { _id: "alpha_5", firstName: "Andres", lastName: "Gomez" },
                { _id: "alpha_6", firstName: "Pedro", lastName: "Lopez" },
            ],
            specialties: ["First Aid", "BLS/CPR", "Water Rescue"],
            schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        },
        {
            id: "team_beta",
            name: "Team Beta",
            role: "Fire & Rescue",
            teamLeader: "James Reyes",
            volunteerId: "RES-002",
            members: [
                { _id: "beta_1", firstName: "James", lastName: "Reyes" },
                { _id: "beta_2", firstName: "Mark", lastName: "Cruz" },
                { _id: "beta_3", firstName: "Ramon", lastName: "Mendoza" },
                { _id: "beta_4", firstName: "Albert", lastName: "Santos" },
                { _id: "beta_5", firstName: "Philip", lastName: "Garcia" },
                { _id: "beta_6", firstName: "Luz", lastName: "Torres" },
            ],
            specialties: ["First Aid", "Fire Fighting", "Hazmat"],
            schedule: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        },
        {
            id: "team_charlie",
            name: "Team Charlie",
            role: "Mountain Rescue",
            teamLeader: "Albert Santos",
            volunteerId: "RES-003",
            members: [
                { _id: "charlie_1", firstName: "Albert", lastName: "Santos" },
                { _id: "charlie_2", firstName: "Jose", lastName: "Rizal" },
                { _id: "charlie_3", firstName: "Manuel", lastName: "Dela Cruz" },
                { _id: "charlie_4", firstName: "Ramon", lastName: "Cruz" },
                { _id: "charlie_5", firstName: "Elena", lastName: "Gomez" },
                { _id: "charlie_6", firstName: "Carlos", lastName: "Mendoza" },
            ],
            specialties: ["First Aid", "Mountain Rescue", "USAR LVL 2"],
            schedule: ['Mon', 'Tue', 'Thu', 'Fri', 'Sun']
        },
        {
            id: "team_delta",
            name: "Team Delta",
            role: "K9 & Emergency",
            teamLeader: "Ramon Cruz",
            volunteerId: "RES-004",
            members: [
                { _id: "delta_1", firstName: "Ramon", lastName: "Cruz" },
                { _id: "delta_2", firstName: "Maria", lastName: "Santos" },
                { _id: "delta_3", firstName: "Juan", lastName: "Dela Cruz" },
                { _id: "delta_4", firstName: "Ana", lastName: "Reyes" },
                { _id: "delta_5", firstName: "Pedro", lastName: "Lopez" },
                { _id: "delta_6", firstName: "Luz", lastName: "Gomez" },
            ],
            specialties: ["BLS/CPR", "K9 Rescue", "Emergency Driving"],
            schedule: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        }
    ];

    // ✅ Get all team member IDs for a team
    const getTeamMemberIds = (team) => {
        return team.members.map(m => m._id);
    };

    // ✅ Check if a team is fully selected
    const isTeamSelected = (team) => {
        const memberIds = getTeamMemberIds(team);
        return memberIds.every(id => selectedIds.includes(id));
    };

    // ✅ Get all team member IDs from all teams
    const getAllTeamMemberIds = () => {
        return MOCK_TEAMS.flatMap(t => getTeamMemberIds(t));
    };

    // ✅ Check if any team is selected
    const hasAnyTeamSelected = () => {
        return MOCK_TEAMS.some(team => isTeamSelected(team));
    };

    // ✅ Check if any individual volunteer is selected
    const hasAnyVolunteerSelected = () => {
        const allTeamMemberIds = getAllTeamMemberIds();
        const volunteerIds = volunteers.map(v => v._id);
        return selectedIds.some(id => volunteerIds.includes(id) && !allTeamMemberIds.includes(id));
    };

    // ✅ Handle tab change with validation
    const handleTabChange = (tab) => {
        if (tab === activeTab) return; // Already on this tab

        // If switching from rescue to volunteers
        if (activeTab === 'rescue' && tab === 'volunteers') {
            if (hasAnyTeamSelected()) {
                setPendingTabChange(tab);
                setShowConfirmModal(true);
                return;
            }
        }

        // If switching from volunteers to rescue
        if (activeTab === 'volunteers' && tab === 'rescue') {
            if (hasAnyVolunteerSelected()) {
                setPendingTabChange(tab);
                setShowConfirmModal(true);
                return;
            }
        }

        // No selections to clear, just switch
        setActiveTab(tab);
        setSearchTerm('');
    };

    // ✅ Confirm tab change - clear selections and switch
    const confirmTabChange = () => {
        if (pendingTabChange === 'volunteers') {
            // Clear all team selections
            const allTeamMemberIds = getAllTeamMemberIds();
            setSelectedIds(prev => prev.filter(id => !allTeamMemberIds.includes(id)));
        } else if (pendingTabChange === 'rescue') {
            // Clear all volunteer selections
            const allTeamMemberIds = getAllTeamMemberIds();
            const volunteerIds = volunteers.map(v => v._id);
            setSelectedIds(prev => prev.filter(id => !volunteerIds.includes(id) || allTeamMemberIds.includes(id)));
        }

        setActiveTab(pendingTabChange);
        setSearchTerm('');
        setShowConfirmModal(false);
        setPendingTabChange(null);
    };

    // ✅ Cancel tab change
    const cancelTabChange = () => {
        setShowConfirmModal(false);
        setPendingTabChange(null);
    };

    // ✅ Toggle entire team selection
    const handleTeamToggle = (team) => {
        const memberIds = getTeamMemberIds(team);
        const allSelected = isTeamSelected(team);

        if (allSelected) {
            // Deselect all members of this team
            setSelectedIds(prev => prev.filter(id => !memberIds.includes(id)));
        } else {
            // ✅ When selecting a team, CLEAR any individual volunteer selections
            const teamMemberIds = getAllTeamMemberIds();
            const volunteerIds = volunteers.map(v => v._id);

            setSelectedIds(prev => {
                // Remove all team members and volunteers, then add the new team members
                const filtered = prev.filter(id => !teamMemberIds.includes(id) && !volunteerIds.includes(id));
                return [...filtered, ...memberIds];
            });
        }
    };

    // ✅ Toggle individual volunteer (only works in Volunteers tab)
    const handleVolunteerToggleWrapper = (volunteerId) => {
        // ✅ When selecting an individual volunteer, CLEAR any team selections
        const allTeamMemberIds = getAllTeamMemberIds();

        // Check if any team members are currently selected
        const hasTeamSelected = selectedIds.some(id => allTeamMemberIds.includes(id));

        if (hasTeamSelected) {
            // If a team is selected, deselect all team members first
            setSelectedIds(prev => prev.filter(id => !allTeamMemberIds.includes(id)));
        }

        // Then toggle the volunteer
        handleVolunteerToggle(volunteerId);
    };

    // ✅ Check if there are any team members selected
    const hasTeamSelected = () => {
        const allTeamMemberIds = getAllTeamMemberIds();
        return selectedIds.some(id => allTeamMemberIds.includes(id));
    };

    // ✅ Check if there are any individual volunteers selected
    const hasIndividualVolunteersSelected = () => {
        const allTeamMemberIds = getAllTeamMemberIds();
        const volunteerIds = volunteers.map(v => v._id);
        return selectedIds.some(id => volunteerIds.includes(id) && !allTeamMemberIds.includes(id));
    };

    // ✅ Get selected teams for display
    const getSelectedTeams = () => {
        return MOCK_TEAMS.filter(team => isTeamSelected(team));
    };

    // ✅ Handle dispatch - prevent mixing
    const handleDispatchWrapper = () => {
        // Check if both teams and volunteers are selected
        const hasTeams = hasTeamSelected();
        const hasVolunteers = hasIndividualVolunteersSelected();

        if (hasTeams && hasVolunteers) {
            alert('You cannot dispatch both a Rescue Team and individual Volunteers at the same time. Please choose one or the other.');
            return;
        }

        onDispatch();
    };

    const filteredVolunteers = useMemo(() => {
        let filtered = volunteers;
        if (searchTerm) {
            filtered = filtered.filter(v =>
                `${v.firstName} ${v.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [volunteers, searchTerm]);

    const selectedVolunteersData = volunteers.filter(v => selectedIds.includes(v._id));
    const selectedTeams = getSelectedTeams();

    const getFullAddress = (volunteer) => {
        if (!volunteer) return 'N/A';
        if (volunteer.address && volunteer.address !== "") {
            return volunteer.address;
        }
        const parts = [
            volunteer.address1,
            volunteer.address2,
            volunteer.city,
            volunteer.province,
            volunteer.zipCode
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'N/A';
    };

    // ✅ Schedule Bar Component
    const ScheduleBar = ({ schedule }) => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const getColor = (day) => {
            if (schedule && schedule.includes(day)) {
                return 'bg-green-500';
            }
            return 'bg-gray-200';
        };

        return (
            <div className="flex flex-col gap-1 mt-2">
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

    // Determine if the current tab has selections
    const hasSelectionsInCurrentTab = () => {
        if (activeTab === 'rescue') {
            return hasAnyTeamSelected();
        } else {
            return hasAnyVolunteerSelected();
        }
    };

    return createPortal(
        <>
            {/* Main Dispatch Modal */}
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="bg-[#9fb2c2] p-5 flex justify-between items-start relative sticky top-0 z-10">
                        <div className="text-white">
                            <p className="text-xs font-medium opacity-90">Dispatch to</p>
                            <h2 className="text-2xl font-bold tracking-tight leading-tight truncate max-w-[250px]">
                                {title}
                            </h2>
                            <p className="text-[10px] font-medium opacity-80 mt-0.5">{incidentId}</p>
                        </div>
                        <button onClick={onClose} className="text-white hover:opacity-75 transition-opacity">
                            <Icon icon="material-symbols:close" width="28" />
                        </button>
                    </div>

                    {/* Tabs with lock indicator */}
                    <div className="flex border-b border-gray-200 bg-white">
                        <button
                            onClick={() => handleTabChange('rescue')}
                            className={`flex-1 py-4 text-center font-bold text-lg transition-colors relative ${activeTab === 'rescue' ? 'text-black' : 'text-gray-500'
                                } ${hasSelectionsInCurrentTab() && activeTab === 'rescue' ? 'border-r-2 border-blue-200' : ''}`}
                        >
                            Rescue Team
                            {activeTab === 'rescue' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d7aff]"></div>}
                            {hasAnyTeamSelected() && activeTab === 'rescue' && (
                                <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('volunteers')}
                            className={`flex-1 py-4 text-center font-bold text-lg transition-colors relative ${activeTab === 'volunteers' ? 'text-black' : 'text-gray-500'
                                } ${hasSelectionsInCurrentTab() && activeTab === 'volunteers' ? 'border-l-2 border-blue-200' : ''}`}
                        >
                            Volunteers
                            {activeTab === 'volunteers' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d7aff]"></div>}
                            {hasAnyVolunteerSelected() && activeTab === 'volunteers' && (
                                <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                    </div>

                    {/* Tab lock warning banner */}
                    {hasSelectionsInCurrentTab() && (
                        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-700 flex items-center gap-2">
                            <Icon icon="material-symbols:info" width={16} />
                            <span>
                                You have selections in this tab. Switch tabs to clear your selection.
                            </span>
                        </div>
                    )}

                    {/* Search */}
                    <div className="p-4 pt-5 pb-3 bg-white">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Search name, status, role..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-3 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50/50 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-4 pb-2 bg-white">
                        <p className="text-[11px] font-medium text-[#6b7280]">Within Incident Barangay Range</p>
                    </div>

                    {/* List Content */}
                    <div className="px-4 pb-4 h-[340px] overflow-y-auto custom-scrollbar">
                        {activeTab === 'rescue' ? (
                            /* ✅ RESCUE TEAM TAB - Teams selected as a group */
                            <div className="space-y-3">
                                {MOCK_TEAMS.map((team) => {
                                    const isExpanded = expandedTeamId === team.id;
                                    const teamSelected = isTeamSelected(team);

                                    return (
                                        <div key={team.id} className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                                            {/* Clickable Team Header */}
                                            <div
                                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Team Level Checkbox - Selects ENTIRE TEAM as a group */}
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTeamToggle(team);
                                                        }}
                                                        className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer shadow-sm transition-all ${teamSelected ? 'bg-[#25d366]' : 'border-2 border-gray-300 bg-white hover:border-blue-400'
                                                            }`}
                                                    >
                                                        {teamSelected && <Icon icon="material-symbols:check" width={14} className="text-white" strokeWidth={4} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-800">{team.name}</span>
                                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                                {team.members.length} members
                                                            </span>
                                                            {teamSelected && (
                                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                                    Selected
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[12px] text-gray-500">{team.role}</span>
                                                        <p className="text-xs text-blue-600 font-medium">Team Leader: {team.teamLeader}</p>
                                                    </div>
                                                </div>
                                                {/* Expand/Collapse Arrow */}
                                                <div className="text-gray-400">
                                                    <Icon icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} width="24" />
                                                </div>
                                            </div>

                                            {/* Expandable Members List - READ ONLY (no individual selection) */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 bg-gray-50/50 p-3 space-y-2">
                                                    {/* Specialties */}
                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                        {team.specialties.map((spec, idx) => (
                                                            <span key={idx} className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded text-[11px] font-medium shadow-sm">
                                                                {spec}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Schedule */}
                                                    <ScheduleBar schedule={team.schedule} />

                                                    {/* Members - READ ONLY, no checkboxes */}
                                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                                        <p className="text-[12px] font-medium text-gray-500 mb-1.5">Team Members</p>
                                                        {team.members.map((member) => (
                                                            <div key={member._id} className="flex items-center gap-3 py-2 px-3 rounded hover:bg-white transition-colors">
                                                                <div className="relative flex-shrink-0">
                                                                    <div className="w-8 h-8 rounded-full bg-[#cbd5e1] border-2 border-white shadow-sm flex items-center justify-center text-gray-500 text-xs font-bold">
                                                                        {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span className="text-sm font-medium text-gray-800">{member.firstName} {member.lastName}</span>
                                                                </div>
                                                                {/* Show checkmark if team is selected */}
                                                                {teamSelected && (
                                                                    <Icon icon="material-symbols:check-circle" width={16} className="text-green-500" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Team ID at bottom */}
                                                    <div className="mt-2 pt-2 border-t border-gray-100 text-[12px] text-gray-500">
                                                        Team ID: <span className="font-semibold text-[#3b82f6]">{team.volunteerId}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* ✅ VOLUNTEERS TAB - Individual volunteers */
                            loadingVolunteers ? (
                                <p className="text-center py-4 text-gray-500">Loading volunteers...</p>
                            ) : filteredVolunteers.length === 0 ? (
                                <p className="text-center py-4 text-gray-500">No available volunteers found</p>
                            ) : (
                                filteredVolunteers.map((volunteer) => {
                                    const isSelected = selectedIds.includes(volunteer._id);
                                    const fullAddress = getFullAddress(volunteer);

                                    return (
                                        <div key={volunteer._id} className="flex items-start gap-4 py-4 border-b border-gray-200 hover:bg-gray-50/50 -mx-4 px-4">
                                            <div className="pt-1.5">
                                                <div
                                                    onClick={() => handleVolunteerToggleWrapper(volunteer._id)}
                                                    className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer shadow-sm transition-all ${isSelected ? 'bg-[#25d366]' : 'border-2 border-gray-300 bg-white hover:border-blue-400'
                                                        }`}
                                                >
                                                    {isSelected && <Icon icon="material-symbols:check" width={14} className="text-white" strokeWidth={4} />}
                                                </div>
                                            </div>

                                            <div className="relative flex-shrink-0">
                                                <div className="w-14 h-14 rounded-full bg-[#cbd5e1] border-2 border-white shadow-sm flex items-center justify-center text-gray-500 text-lg font-bold">
                                                    {volunteer.firstName?.charAt(0)}{volunteer.lastName?.charAt(0)}
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2d7aff] rounded-full border border-white"></div>
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-bold text-gray-900">{volunteer.firstName} {volunteer.lastName}</h3>
                                                    <span className="text-[10px] font-semibold text-[#25d366] uppercase">Active</span>
                                                </div>
                                                <p className="text-sm text-gray-600 font-medium">Volunteer Responder</p>
                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                    <span className="px-2 py-0.5 bg-[#dbeafe] text-[#1d4ed8] text-[10px] font-bold rounded border border-[#bfdbfe]">BLS/CPR</span>
                                                    <span className="px-2 py-0.5 bg-[#dbeafe] text-[#1d4ed8] text-[10px] font-bold rounded border border-[#bfdbfe]">First Aid</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-[#6b7280]">
                                                    <Icon icon="material-symbols:location-on" width={12} className="text-gray-800 flex-shrink-0" />
                                                    <span className="truncate">{fullAddress}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
                        {selectedIds.length > 0 && (
                            <div className="mb-3">
                                <h4 className="text-base font-bold text-gray-800 mb-2">Selected</h4>
                                <div className="flex flex-wrap gap-2">
                                    {/* Show selected teams */}
                                    {selectedTeams.map(team => (
                                        <div key={team.id} className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium">
                                            <Icon icon="mdi:account-group" width={14} className="mr-1" />
                                            {team.name}
                                            <button
                                                onClick={() => handleTeamToggle(team)}
                                                className="ml-2 hover:bg-green-200 rounded-full p-0.5"
                                            >
                                                <Icon icon="material-symbols:close" width={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    ))}
                                    {/* Show selected volunteers */}
                                    {selectedVolunteersData.map(v => (
                                        <div key={v._id} className="flex items-center bg-[#dbeafe] text-[#1e40af] px-3 py-1 rounded text-sm font-medium hover:bg-[#bfdbfe]">
                                            {v.firstName} {v.lastName.charAt(0)}.
                                            <button onClick={() => handleRemoveSelected(v._id)} className="ml-2 hover:bg-blue-200 rounded-full p-0.5">
                                                <Icon icon="material-symbols:close" width={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {/* Warning when both are selected */}
                                {hasTeamSelected() && hasIndividualVolunteersSelected() && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-center gap-1">
                                        <Icon icon="material-symbols:warning" width={14} />
                                        Cannot dispatch both teams and individual volunteers together
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button onClick={onClose} className="px-6 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-md">
                                Cancel
                            </button>
                            <button
                                onClick={handleDispatchWrapper}
                                disabled={isDispatching || selectedIds.length === 0 || isResolved}
                                className="px-6 py-2 bg-[#1d7bf0] text-white font-bold rounded-md shadow-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDispatching ? 'Dispatching...' : 'Dispatch'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Icon icon="material-symbols:warning" width={24} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Clear Selection?</h3>
                                <p className="text-sm text-gray-600">
                                    You have {activeTab === 'rescue' ? 'a Rescue Team' : 'individual Volunteers'} selected.
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4">
                            <p className="text-sm text-gray-700">
                                Switching to the <span className="font-semibold">{pendingTabChange === 'rescue' ? 'Rescue Team' : 'Volunteers'}</span> tab will clear your current selection.
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Do you want to continue?</p>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={cancelTabChange}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmTabChange}
                                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                            >
                                Yes, Switch Tab
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}