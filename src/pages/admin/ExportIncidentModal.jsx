import { Icon } from "@iconify/react";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export default function ExportIncidentModal({ isOpen, onClose, onExport, incidents = [] }) {
    const [selectedOption, setSelectedOption] = useState('all');
    const [selectedDate, setSelectedDate] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // ✅ Reset states when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedOption('all');
            setSelectedDate('all');
            setSelectedStatus('all');
        }
    }, [isOpen]);

    // ✅ DYNAMIC BARANGAYS (For "Incidents by Barangay" option)
    const barangayList = useMemo(() => {
        if (!incidents || incidents.length === 0) return [];
        return [...new Set(
            incidents
                .map(inc => inc.location?.barangay)
                .filter(brgy => brgy && brgy !== 'N/A' && brgy !== 'Unknown' && brgy !== '')
        )];
    }, [incidents]);

    // ✅ DYNAMIC MUNICIPALITIES (For "Incidents by Municipality" option)
    const municipalityList = useMemo(() => {
        if (!incidents || incidents.length === 0) return [];
        return [...new Set(
            incidents
                .map(inc => inc.location?.city || inc.location?.municipality || inc.location?.address?.split(',')?.pop()?.trim())
                .filter(mun => mun && mun !== 'N/A' && mun !== 'Unknown' && mun !== '')
        )];
    }, [incidents]);

    // ✅ DYNAMIC INCIDENT TYPES (For "Incidents by Type" option)
    const typeList = useMemo(() => {
        if (!incidents || incidents.length === 0) return [];
        return [...new Set(
            incidents
                .map(inc => inc.type)
                .filter(type => type && type !== 'N/A' && type !== '')
        )];
    }, [incidents]);

    // ✅ SMART CHECK: Disable ONLY if the filtered selection is EMPTY
    const isExportDisabled = useMemo(() => {
        if (incidents.length === 0) return true;

        let checkList = [...incidents];

        // 1. Apply Option filter (All, Active, Inactive)
        if (selectedOption === 'active') {
            checkList = checkList.filter(inc => inc.status !== 'Resolved' && inc.status !== 'Closed');
        } else if (selectedOption === 'inactive') {
            checkList = checkList.filter(inc => inc.status === 'Resolved' || inc.status === 'Closed');
        }

        // 2. Apply Date filter
        if (selectedDate !== 'all') {
            const now = new Date();
            checkList = checkList.filter(inc => {
                const reportedDate = new Date(inc.reportedAt || inc.createdAt);
                switch (selectedDate) {
                    case 'today': return reportedDate.toDateString() === now.toDateString();
                    case 'week': {
                        const weekAgo = new Date(now);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return reportedDate >= weekAgo;
                    }
                    case 'month': return reportedDate.getMonth() === now.getMonth() && reportedDate.getFullYear() === now.getFullYear();
                    case 'year': return reportedDate.getFullYear() === now.getFullYear();
                    default: return true;
                }
            });
        }

        // 3. Apply Status filter
        if (selectedStatus !== 'all') {
            checkList = checkList.filter(inc => inc.status === selectedStatus);
        }

        // ✅ ONLY RULE: If there are 0 results, disable the button.
        return checkList.length === 0;
    }, [incidents, selectedOption, selectedDate, selectedStatus]);

    if (!isOpen) return null;

    const handleExport = () => {
        if (isExportDisabled) return;
        onExport(selectedOption, selectedDate, selectedStatus);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
                    <div className="flex items-center gap-2">
                        <Icon icon="mdi:upload" className="w-6 h-6 text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-800">Export Incident Report</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <Icon icon="mdi:close" className="w-6 h-6" />
                    </button>
                </div>

                {/* Body - Export Options */}
                <div className="p-6">
                    {/* 🔹 HINT TEXT: Only shows if button is disabled because of empty data */}
                    {isExportDisabled && (
                        <p className="mb-4 text-xs text-gray-400 text-center border border-gray-200 bg-gray-50 rounded-md py-2">
                            ⚠️ No incidents match your selected filters. Please try a different selection.
                        </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Option 1: All Incidents */}
                        <button
                            onClick={() => setSelectedOption('all')}
                            className={`p-4 border rounded-lg text-left transition-all ${selectedOption === 'all'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="pt-1">
                                    <Icon icon="mdi:emergency" className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">All Incident Reports</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Complete log of every incident</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 2: Incidents by Type */}
                        <button
                            onClick={() => setSelectedOption('type')}
                            className={`p-4 border rounded-lg text-left transition-all ${selectedOption === 'type'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="pt-1">
                                    <Icon icon="mdi:fire" className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">Incidents by type</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Incidents grouped by type of incident</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 3: Incidents by Barangay */}
                        <button
                            onClick={() => setSelectedOption('barangay')}
                            className={`p-4 border rounded-lg text-left transition-all ${selectedOption === 'barangay'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="pt-1">
                                    <Icon icon="mdi:map-marker" className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">Incidents by barangay</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Incidents grouped by type of barangay</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 4: Incidents by Municipality */}
                        <button
                            onClick={() => setSelectedOption('municipality')}
                            className={`p-4 border rounded-lg text-left transition-all ${selectedOption === 'municipality'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="pt-1">
                                    <Icon icon="mdi:city" className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">Incidents by Municipality</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Incidents grouped by type of municipality</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 5: Incidents by Date */}
                        <button
                            onClick={() => setSelectedOption('date')}
                            className={`p-4 border rounded-lg text-left transition-all ${selectedOption === 'date'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="pt-1">
                                    <Icon icon="mdi:calendar" className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">Incidents by date</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Filter incidents by date range</p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Filter Options */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Options</h4>
                        <div className="flex flex-wrap gap-6">

                            {/* ✅ DYNAMIC Date Filter (Always visible) */}
                            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                <label className="text-xs text-gray-500 font-medium">Date</label>
                                <div className="relative">
                                    <select
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white appearance-none"
                                    >
                                        <option value="all">- All Time -</option>
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                        <option value="year">This Year</option>
                                    </select>
                                    <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* ✅ DYNAMIC Status Filter */}
                            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                <label className="text-xs text-gray-500 font-medium">Status of Incident</label>
                                <div className="relative">
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white appearance-none"
                                    >
                                        <option value="all">- All -</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Active">Active</option>
                                        <option value="Dispatched">Dispatched</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                    <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer - Actions */}
                <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>

                    {/* ✅ SMART BUTTON: ONLY Disabled if NO DATA matches filters */}
                    <button
                        onClick={handleExport}
                        disabled={isExportDisabled}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition ${isExportDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#198754] text-white hover:bg-[#157347] cursor-pointer'
                            }`}
                    >
                        Export Records
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}