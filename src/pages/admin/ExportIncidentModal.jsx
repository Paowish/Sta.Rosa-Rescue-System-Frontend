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

    // Custom date range state
    const [showDateModal, setShowDateModal] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedOption('all');
            setSelectedDate('all');
            setSelectedStatus('all');
            setSelectedBarangay('all');
            setSelectedType('all');
            setCustomStartDate('');
            setCustomEndDate('');
            setShowDateModal(false);
        }
    }, [isOpen]);

    const filteredCount = useMemo(() => {
        if (!incidents || incidents.length === 0) return 0;

        let filtered = [...incidents];

        // Status filter applies across options
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(inc => inc.status === selectedStatus);
        }

        // Barangay filter
        if (selectedOption === 'barangay' && selectedBarangay !== 'all') {
            filtered = filtered.filter(inc =>
                inc.location?.barangay?.toLowerCase() === selectedBarangay.toLowerCase()
            );
        }

        // Incident Type filter
        if (selectedOption === 'type' && selectedType !== 'all') {
            filtered = filtered.filter(inc =>
                inc.type?.toLowerCase() === selectedType.toLowerCase()
            );
        }

        // Date filter
        if (selectedOption === 'date' && selectedDate !== 'all') {
            const now = new Date();
            filtered = filtered.filter(inc => {
                const dateVal = inc.reportedAt || inc.createdAt;
                if (!dateVal) return false;
                const d = new Date(dateVal);
                if (isNaN(d.getTime())) return false;

                if (selectedDate === 'today') {
                    return d.toDateString() === now.toDateString();
                }
                if (selectedDate === 'week') {
                    const w = new Date(now);
                    w.setDate(w.getDate() - 7);
                    return d >= w;
                }
                if (selectedDate === 'month') {
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }
                if (selectedDate === 'year') {
                    return d.getFullYear() === now.getFullYear();
                }
                if (selectedDate === 'custom') {
                    if (customStartDate) {
                        const start = new Date(customStartDate + 'T00:00:00');
                        if (d < start) return false;
                    }
                    if (customEndDate) {
                        const end = new Date(customEndDate + 'T23:59:59');
                        if (d > end) return false;
                    }
                    return true;
                }
                return true;
            });
        }

        return filtered.length;
    }, [incidents, selectedOption, selectedStatus, selectedBarangay, selectedType, selectedDate, customStartDate, customEndDate]);

    const totalCount = incidents?.length || 0;
    const isExportDisabled = totalCount === 0;
    const isTypeExportDisabled = selectedOption === 'type' && selectedType === 'all';

    if (!isOpen) return null;

    const handleExport = () => {
        if (isExportDisabled) return;
        if (isTypeExportDisabled) return;

        if (selectedOption === 'date') {
            const datePayload = selectedDate === 'custom'
                ? { type: 'custom', startDate: customStartDate, endDate: customEndDate }
                : selectedDate;
            onExport('date', datePayload, selectedStatus, 'all', 'all');
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
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Options</h4>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                    <label className="text-xs text-gray-500 font-medium">Date</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <select
                                                value={selectedDate}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSelectedDate(val);
                                                    if (val === 'custom') {
                                                        setTempStartDate(customStartDate);
                                                        setTempEndDate(customEndDate);
                                                        setShowDateModal(true);
                                                    }
                                                }}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white appearance-none"
                                            >
                                                <option value="all">All Time</option>
                                                <option value="today">Today</option>
                                                <option value="week">This Week</option>
                                                <option value="month">This Month</option>
                                                <option value="year">This Year</option>
                                                <option value="custom">Custom Date Range (Modal)...</option>
                                            </select>
                                            <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTempStartDate(customStartDate);
                                                setTempEndDate(customEndDate);
                                                setShowDateModal(true);
                                            }}
                                            title="Open Date Range Picker Modal"
                                            className={`px-3 py-2 border rounded-lg flex items-center gap-1 text-sm font-medium transition ${
                                                selectedDate === 'custom' && (customStartDate || customEndDate)
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <Icon icon="mdi:calendar-range" className="w-4 h-4 text-green-600" />
                                            <span className="text-xs font-semibold">Pick Dates</span>
                                        </button>
                                    </div>

                                    {selectedDate === 'custom' && (customStartDate || customEndDate) && (
                                        <div className="mt-2 flex items-center justify-between text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-green-800">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <Icon icon="mdi:calendar-check" className="w-4 h-4 text-green-600" />
                                                {customStartDate ? new Date(customStartDate + 'T00:00:00').toLocaleDateString() : 'Earliest'}
                                                {' → '}
                                                {customEndDate ? new Date(customEndDate + 'T00:00:00').toLocaleDateString() : 'Latest'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTempStartDate(customStartDate);
                                                        setTempEndDate(customEndDate);
                                                        setShowDateModal(true);
                                                    }}
                                                    className="text-xs text-green-700 hover:underline font-medium"
                                                >
                                                    Change
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedDate('all');
                                                        setCustomStartDate('');
                                                        setCustomEndDate('');
                                                    }}
                                                    className="text-gray-400 hover:text-red-500"
                                                    title="Clear custom dates"
                                                >
                                                    <Icon icon="mdi:close" className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
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

                            <p className="mt-4 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md py-2 px-3 flex items-center gap-2">
                                <Icon icon="mdi:information-outline" className="w-4 h-4 flex-shrink-0" />
                                <span>This will export all matching incidents sorted chronologically and grouped by date.</span>
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

            {/* Custom Date Range Modal */}
            {showDateModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="px-5 py-4 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-100 rounded-lg">
                                    <Icon icon="mdi:calendar-range" className="w-5 h-5 text-green-700" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">Select Date Range</h3>
                                    <p className="text-[11px] text-gray-500">Filter incidents by specific dates</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedDate !== 'custom') {
                                        setTempStartDate('');
                                        setTempEndDate('');
                                    }
                                    setShowDateModal(false);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <Icon icon="mdi:close" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-600">Start Date</label>
                                    <input
                                        type="date"
                                        value={tempStartDate}
                                        onChange={(e) => setTempStartDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-600">End Date</label>
                                    <input
                                        type="date"
                                        value={tempEndDate}
                                        min={tempStartDate || undefined}
                                        onChange={(e) => setTempEndDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                                    />
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div>
                                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">Quick Presets</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            setTempStartDate(today);
                                            setTempEndDate(today);
                                        }}
                                        className="px-2.5 py-1.5 text-xs font-medium bg-gray-100 hover:bg-green-50 hover:text-green-700 rounded-lg transition"
                                    >
                                        Today
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const today = new Date();
                                            const past = new Date(today);
                                            past.setDate(today.getDate() - 7);
                                            setTempStartDate(past.toISOString().split('T')[0]);
                                            setTempEndDate(today.toISOString().split('T')[0]);
                                        }}
                                        className="px-2.5 py-1.5 text-xs font-medium bg-gray-100 hover:bg-green-50 hover:text-green-700 rounded-lg transition"
                                    >
                                        Last 7 Days
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const today = new Date();
                                            const past = new Date(today);
                                            past.setDate(today.getDate() - 30);
                                            setTempStartDate(past.toISOString().split('T')[0]);
                                            setTempEndDate(today.toISOString().split('T')[0]);
                                        }}
                                        className="px-2.5 py-1.5 text-xs font-medium bg-gray-100 hover:bg-green-50 hover:text-green-700 rounded-lg transition"
                                    >
                                        Last 30 Days
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const now = new Date();
                                            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                                            const today = now.toISOString().split('T')[0];
                                            setTempStartDate(firstDay);
                                            setTempEndDate(today);
                                        }}
                                        className="px-2.5 py-1.5 text-xs font-medium bg-gray-100 hover:bg-green-50 hover:text-green-700 rounded-lg transition"
                                    >
                                        This Month
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const now = new Date();
                                            const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                                            const today = now.toISOString().split('T')[0];
                                            setTempStartDate(firstDay);
                                            setTempEndDate(today);
                                        }}
                                        className="px-2.5 py-1.5 text-xs font-medium bg-gray-100 hover:bg-green-50 hover:text-green-700 rounded-lg transition"
                                    >
                                        This Year
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTempStartDate('');
                                            setTempEndDate('');
                                        }}
                                        className="px-2.5 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                    >
                                        Clear Dates
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t bg-gray-50 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setCustomStartDate('');
                                    setCustomEndDate('');
                                    setSelectedDate('all');
                                    setShowDateModal(false);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Reset to All Time
                            </button>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedDate !== 'custom') {
                                            setTempStartDate('');
                                            setTempEndDate('');
                                        }
                                        setShowDateModal(false);
                                    }}
                                    className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (tempStartDate || tempEndDate) {
                                            setCustomStartDate(tempStartDate);
                                            setCustomEndDate(tempEndDate);
                                            setSelectedDate('custom');
                                        } else {
                                            setCustomStartDate('');
                                            setCustomEndDate('');
                                            setSelectedDate('all');
                                        }
                                        setShowDateModal(false);
                                    }}
                                    className="px-4 py-1.5 bg-[#198754] text-white rounded-lg text-xs font-medium hover:bg-[#157347] transition shadow-sm"
                                >
                                    Apply Range
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}