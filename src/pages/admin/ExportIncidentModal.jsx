import { Icon } from "@iconify/react";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

// Official barangays of Santa Rosa, Nueva Ecija
const OFFICIAL_BARANGAYS = [
    'Aguinaldo', 'Berang', 'Burgos', 'Cojuangco', 'Del Pilar',
    'Gomez', 'Inspector', 'Isla', 'La Fuente', 'Liwayway',
    'Lourdes', 'Luna', 'Mabini', 'Malacañang', 'Maliolio',
    'Mapalad', 'Rajal Centro', 'Rajal Norte', 'Rajal Sur', 'Rizal',
    'San Gregorio', 'San Isidro', 'San Josep', 'San Mariano', 'San Pedro',
    'Santa Teresita', 'Santo Rosario', 'Sapsap', 'Soledad', 'Tagpos',
    'Tramo', 'Valenzuela', 'Zamora'
];

// Incident types for "Incidents by Type" filter
const INCIDENT_TYPES = [
    'Medical Emergency',
    'Fire Incident',
    'Vehicle Accident',
    'Road Obstruction',
    'Flooding',
    'Crime Incident',
    'Other'
];

export default function ExportIncidentModal({ isOpen, onClose, onExport, incidents = [] }) {
    const [selectedOption, setSelectedOption] = useState('all');
    const [selectedDate, setSelectedDate] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedBarangay, setSelectedBarangay] = useState('all');
    const [selectedType, setSelectedType] = useState('all');

    useEffect(() => {
        if (isOpen) {
            setSelectedOption('all');
            setSelectedDate('all');
            setSelectedStatus('all');
            setSelectedBarangay('all');
            setSelectedType('all');
        }
    }, [isOpen]);

    const filteredCount = useMemo(() => {
        if (!incidents || incidents.length === 0) return 0;

        let filtered = [...incidents];

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(inc => inc.status === selectedStatus);
        }

        if (selectedBarangay !== 'all') {
            filtered = filtered.filter(inc =>
                inc.location?.barangay?.toLowerCase() === selectedBarangay.toLowerCase()
            );
        }

        if (selectedType !== 'all') {
            filtered = filtered.filter(inc =>
                inc.type?.toLowerCase() === selectedType.toLowerCase()
            );
        }

        return filtered.length;
    }, [incidents, selectedStatus, selectedBarangay, selectedType]);

    const totalCount = incidents?.length || 0;
    const isExportDisabled = totalCount === 0;
    const isTypeExportDisabled = selectedOption === 'type' && selectedType === 'all';

    if (!isOpen) return null;

    const handleExport = () => {
        if (isExportDisabled) return;
        if (isTypeExportDisabled) return;

        if (selectedOption === 'date') {
            onExport('date', 'all', 'all', 'all', 'all');
        } else if (selectedOption === 'type') {
            onExport('type', 'all', selectedStatus, 'all', selectedType);
        } else if (selectedOption === 'barangay') {
            onExport('barangay', 'all', selectedStatus, selectedBarangay, 'all');
        } else {
            onExport('all', 'all', selectedStatus, 'all', 'all');
        }

        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
                    <div className="flex items-center gap-2">
                        <Icon icon="mdi:upload" className="w-6 h-6 text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-800">Export Incident Report</h2>
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {filteredCount} / {totalCount}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <Icon icon="mdi:close" className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {totalCount === 0 && (
                        <p className="mb-4 text-xs text-red-600 text-center border border-red-200 bg-red-50 rounded-md py-2">
                            No incidents available to export.
                        </p>
                    )}

                    {filteredCount === 0 && totalCount > 0 && (
                        <p className="mb-4 text-xs text-amber-600 text-center border border-amber-200 bg-amber-50 rounded-md py-2">
                            No incidents match your selected filters. You can still export, or adjust the filters.
                        </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    <h3 className="font-semibold text-gray-800 text-sm">Incidents by Type</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Incidents grouped by type</p>
                                </div>
                            </div>
                        </button>

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
                                    <h3 className="font-semibold text-gray-800 text-sm">Incidents by Barangay</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Incidents grouped by barangay</p>
                                </div>
                            </div>
                        </button>

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
                                    <h3 className="font-semibold text-gray-800 text-sm">Incidents by Date</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Incidents grouped chronologically</p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {selectedOption === 'all' && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Options</h4>
                            <div className="flex flex-wrap gap-6">
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
                    )}

                    {selectedOption === 'type' && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Options</h4>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                    <label className="text-xs text-gray-500 font-medium">Incident Type</label>
                                    <div className="relative">
                                        <select
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white appearance-none"
                                        >
                                            <option value="all">- Select Incident Type -</option>
                                            {INCIDENT_TYPES.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                        <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                    {selectedType === 'all' && (
                                        <p className="text-[10px] text-amber-600 mt-1">
                                            Please select a specific incident type to export.
                                        </p>
                                    )}
                                </div>

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
                    )}

                    {selectedOption === 'barangay' && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Options</h4>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                    <label className="text-xs text-gray-500 font-medium">Barangay</label>
                                    <div className="relative">
                                        <select
                                            value={selectedBarangay}
                                            onChange={(e) => setSelectedBarangay(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white appearance-none"
                                        >
                                            <option value="all">- All Barangays -</option>
                                            {OFFICIAL_BARANGAYS.map((brgy) => (
                                                <option key={brgy} value={brgy}>{brgy}</option>
                                            ))}
                                        </select>
                                        <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

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
                    )}

                    {selectedOption === 'date' && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-xs text-gray-500 text-center py-2 bg-blue-50 border border-blue-200 rounded-md">
                                This will export all incidents sorted by date (oldest to newest) with each day grouped together.
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExportDisabled || isTypeExportDisabled}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${isExportDisabled || isTypeExportDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#198754] text-white hover:bg-[#157347] cursor-pointer'
                            }`}
                    >
                        <Icon icon="mdi:download" className="w-4 h-4" />
                        {`Export Records (${filteredCount})`}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}