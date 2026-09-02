// src/pages/rescueTeam/DispatchSelectionModal.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

/**
 * Dispatch Selection Modal Component
 * Allows selecting and dispatching volunteers to an incident
 */
export default function DispatchSelectionModal({
    isOpen,
    onClose,
    incidentTitle,
    incidentId,
    onDispatch
}) {
    // State for volunteers
    const [volunteers, setVolunteers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isDispatching, setIsDispatching] = useState(false);
    const [loadingVolunteers, setLoadingVolunteers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState('volunteers');

    /**
     * Load available volunteers when modal opens
     */
    useEffect(() => {
        if (isOpen) {
            loadAvailableVolunteers();
            setSelectedIds([]);
            setSearchTerm("");
        }
    }, [isOpen]);

    /**
     * Fetch available volunteers from API
     */
    const loadAvailableVolunteers = async () => {
        setLoadingVolunteers(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/volunteers/available', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setVolunteers(result.data);
            }
        } catch (error) {
            console.error('Failed to load volunteers:', error);
        } finally {
            setLoadingVolunteers(false);
        }
    };

    /**
     * Toggle volunteer selection
     */
    const handleVolunteerToggle = (volunteerId) => {
        setSelectedIds(prev =>
            prev.includes(volunteerId)
                ? prev.filter(id => id !== volunteerId)
                : [...prev, volunteerId]
        );
    };

    /**
     * Remove volunteer from selection
     */
    const handleRemoveSelected = (volunteerId) => {
        setSelectedIds(prev => prev.filter(id => id !== volunteerId));
    };

    /**
     * Handle dispatch action
     */
    const handleDispatch = async () => {
        if (selectedIds.length === 0) {
            alert('Please select at least one volunteer to dispatch');
            return;
        }

        setIsDispatching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/incidents/${incidentId}/dispatch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    volunteerIds: selectedIds,
                    dispatchNotes: 'Dispatched from Incident Management'
                })
            });

            const result = await response.json();
            if (result.success) {
                alert(`Incident dispatched to ${result.data.volunteersDispatched} responder(s)!`);
                if (onDispatch) onDispatch();
                onClose();
            } else {
                alert('Failed to dispatch: ' + result.message);
            }
        } catch (error) {
            console.error('Dispatch error:', error);
            alert('Error dispatching incident.');
        } finally {
            setIsDispatching(false);
        }
    };

    /**
     * Filter volunteers based on search term
     */
    const filteredVolunteers = volunteers.filter(v =>
        `${v.firstName} ${v.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /**
     * Get selected volunteers data
     */
    const selectedVolunteersData = volunteers.filter(v => selectedIds.includes(v._id));

    // Don't render if modal is closed
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="bg-[#9fb2c2] p-5 flex justify-between items-start relative">
                    <div className="text-white">
                        <p className="text-xs font-medium opacity-90">Dispatch to</p>
                        <h2 className="text-2xl font-bold tracking-tight leading-tight truncate max-w-[250px]">
                            {incidentTitle}
                        </h2>
                        <p className="text-[10px] font-medium opacity-80 mt-0.5">{incidentId}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:opacity-75 transition-opacity">
                        <Icon icon="mdi:close" className="w-7 h-7" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-white">
                    <button
                        onClick={() => setActiveTab('rescue')}
                        className={`flex-1 py-4 text-center font-bold text-lg transition-colors relative ${activeTab === 'rescue' ? 'text-black' : 'text-gray-500'
                            }`}
                    >
                        Rescue Team
                        {activeTab === 'rescue' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d7aff]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('volunteers')}
                        className={`flex-1 py-4 text-center font-bold text-lg transition-colors relative ${activeTab === 'volunteers' ? 'text-black' : 'text-gray-500'
                            }`}
                    >
                        Volunteers
                        {activeTab === 'volunteers' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2d7aff]"></div>}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 pt-5 pb-3 bg-white">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search name, status, role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-3 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50/50 focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-4 pb-2 bg-white">
                    <p className="text-[11px] font-medium text-[#6b7280]">Within Incident Barangay Range (Publication)</p>
                </div>

                {/* Volunteer List */}
                <div className="px-4 pb-4 h-[340px] overflow-y-auto custom-scrollbar">
                    {loadingVolunteers ? (
                        <p className="text-center py-4 text-gray-500 text-sm">Loading volunteers...</p>
                    ) : filteredVolunteers.length === 0 ? (
                        <p className="text-center py-4 text-gray-500 text-sm">No available volunteers found</p>
                    ) : (
                        filteredVolunteers.map((volunteer) => {
                            const isSelected = selectedIds.includes(volunteer._id);
                            return (
                                <div key={volunteer._id} className="flex items-start gap-4 py-4 border-b border-gray-200">
                                    {/* Selection Checkbox */}
                                    <div className="pt-1.5">
                                        <div
                                            onClick={() => handleVolunteerToggle(volunteer._id)}
                                            className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer shadow-sm transition-colors ${isSelected ? 'bg-[#25d366]' : 'border-2 border-gray-300 bg-white hover:border-blue-400'
                                                }`}
                                        >
                                            {isSelected && <Icon icon="mdi:check" className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>

                                    {/* Volunteer Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-14 h-14 rounded-full bg-[#cbd5e1] border-2 border-white shadow-sm flex items-center justify-center text-gray-500 text-lg font-bold">
                                            {volunteer.firstName?.charAt(0)}{volunteer.lastName?.charAt(0)}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2d7aff] rounded-full border border-white"></div>
                                    </div>

                                    {/* Volunteer Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {volunteer.firstName} {volunteer.lastName}
                                            </h3>
                                            <span className="text-[10px] font-semibold text-[#25d366] uppercase tracking-wide">Active</span>
                                        </div>
                                        <p className="text-sm text-gray-600 font-medium">Volunteer Responder</p>

                                        {/* Certifications */}
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                            <span className="px-2 py-0.5 bg-[#dbeafe] text-[#1d4ed8] text-[10px] font-bold rounded border border-[#bfdbfe]">BLS/CPR</span>
                                            <span className="px-2 py-0.5 bg-[#dbeafe] text-[#1d4ed8] text-[10px] font-bold rounded border border-[#bfdbfe]">First Aid</span>
                                        </div>

                                        {/* Address */}
                                        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-[#6b7280]">
                                            <Icon icon="mdi:location-on" className="w-3 h-3 text-gray-800" />
                                            <span>{volunteer.address1 || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-gray-200 p-4">
                    {/* Selected Volunteers */}
                    {selectedIds.length > 0 && (
                        <div className="mb-3">
                            <h4 className="text-base font-bold text-gray-800 mb-2">Selected</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedVolunteersData.map(v => (
                                    <div key={v._id} className="flex items-center bg-[#dbeafe] text-[#1e40af] px-3 py-1 rounded text-sm font-medium">
                                        {v.firstName} {v.lastName.charAt(0)}.
                                        <button
                                            onClick={() => handleRemoveSelected(v._id)}
                                            className="ml-2 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                        >
                                            <Icon icon="mdi:close" className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDispatch}
                            disabled={isDispatching || selectedIds.length === 0}
                            className="px-6 py-2 bg-[#1d7bf0] text-white font-bold rounded-md shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDispatching ? 'Dispatching...' : 'Dispatch'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}