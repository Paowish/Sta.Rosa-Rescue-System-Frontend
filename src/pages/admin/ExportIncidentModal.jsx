import { Icon } from "@iconify/react";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export default function ExportIncidentModal({ isOpen, onClose, onExport, incidents = [] }) {
    const [selectedOption, setSelectedOption] = useState('all');
    const [selectedBarangay, setSelectedBarangay] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // ✅ Reset states when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedOption('all');
            setSelectedBarangay('all');
            setSelectedStatus('all');
        }
    }, [isOpen]);

    // ✅ DYNAMIC BARANGAYS
    const barangayList = useMemo(() => {
        if (!incidents || incidents.length === 0) return [];
        return [...new Set(
            incidents
                .map(inc => inc.location?.barangay)
                .filter(brgy => brgy && brgy !== 'N/A' && brgy !== 'Unknown' && brgy !== '')
        )];
    }, [incidents]);

    // ✅ SMART CHECK: Disable ONLY if the filtered selection is EMPTY
    const isExportDisabled = useMemo(() => {
        if (incidents.length === 0) return true;

        let checkList = [...incidents];

        // Apply the exact filters the user selected
        if (selectedBarangay !== 'all') {
            checkList = checkList.filter(inc => inc.location?.barangay === selectedBarangay);
        }
        if (selectedStatus !== 'all') {
            checkList = checkList.filter(inc => inc.status === selectedStatus);
        }
        if (selectedOption === 'active') {
            checkList = checkList.filter(inc => inc.status !== 'Resolved' && inc.status !== 'Closed');
        } else if (selectedOption === 'inactive') {
            checkList = checkList.filter(inc => inc.status === 'Resolved' || inc.status === 'Closed');
        }

        // ✅ ONLY RULE: If there are 0 results, disable the button.
        return checkList.length === 0;
    }, [incidents, selectedOption, selectedBarangay, selectedStatus]);

    if (!isOpen) return null;

    const handleExport = () => {
        if (isExportDisabled) return;
        onExport(selectedOption, selectedBarangay, selectedStatus);
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
                                    <h3 className="font-semibold text-gray-800 text-sm">List of all users</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Complete log of every incident</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 2: Active Incidents */}
                        <button
                            onClick={() => setSelectedOption('active')}
                            className={`p-4 border rounded-lg text-left transition-all ${selectedOption === 'active'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="pt-1">
                                    <Icon icon="mdi:ambulance" className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">All users - Active</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Incidents grouped by type of incident</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 3: Inactive/Resolved Incidents */}
                        <button
                            onClick={() => setSelectedOption('inactive')}
                            className={`p-4 border rounded-lg text-left transition-all ${selectedOption === 'inactive'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="pt-1">
                                    <Icon icon="mdi:map-marker" className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">All users - Inactive</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Incidents grouped by type of barangay</p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Filter Options */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Options</h4>
                        <div className="flex flex-wrap gap-6">

                            {/* ✅ DYNAMIC Barangay Filter */}
                            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                <label className="text-xs text-gray-500 font-medium">Barangays</label>
                                <div className="relative">
                                    <select
                                        value={selectedBarangay}
                                        onChange={(e) => setSelectedBarangay(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white appearance-none"
                                    >
                                        <option value="all">- All Barangays -</option>
                                        {barangayList.length > 0 ? (
                                            barangayList.map((brgy, index) => (
                                                <option key={index} value={brgy}>{brgy}</option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No barangays available</option>
                                        )}
                                    </select>
                                    <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* ✅ ALWAYS SHOW ALL STATUSES */}
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