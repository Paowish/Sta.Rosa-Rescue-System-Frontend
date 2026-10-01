// src/pages/admin/SystemMaintenance.jsx
import { API_URL } from "../../services/api";
import { Icon } from "@iconify/react";
import AdminLayout from "./AdminLayout";
import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import { createPortal } from "react-dom";

export default function SystemMaintenance() {
    const [periodFilter, setPeriodFilter] = useState("All Time");
    const [logs, setLogs] = useState([]);
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Expand/collapse states — both default to collapsed (show 3 preview)
    const [isLogsExpanded, setIsLogsExpanded] = useState(false);
    const [isBackupsExpanded, setIsBackupsExpanded] = useState(false);

    // Schedule modal state
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        frequency: 'Daily',
        time: '3:00 AM',
        retentionDays: 30,
        storagePath: '/var/backups/MDRRMO',
        emailNotification: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            const logsResponse = await fetch(`${API_URL}/admin/system-logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (logsResponse.ok) {
                const logsData = await logsResponse.json();
                if (logsData.success) setLogs(logsData.data);
            }

            const backupsResponse = await fetch(`${API_URL}/admin/backups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (backupsResponse.ok) {
                const backupsData = await backupsResponse.json();
                if (backupsData.success) setBackups(backupsData.data);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            setError("Failed to load system data. Please refresh.");
        } finally {
            setLoading(false);
        }
    };

    const getLogBadge = (type) => {
        switch (type) {
            case "INFO": return "bg-[#CBE8FF] border border-[#4285F4] text-[#4285F4] font-medium";
            case "OK": return "bg-[#D5FFE5] border border-[#15803D] text-[#15803D] font-medium";
            case "ERROR": return "bg-[#FDE6EA] border border-[#DC2626] text-[#DC2626] font-medium";
            case "WARNING": return "bg-[#FCE3AE] border border-[#E1791E] text-[#E1791E] font-medium";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "OK": return "bg-[#D5FFE5] border border-[#15803D] text-[#15803D] font-medium";
            case "FAILED": return "bg-[#FDE6EA] border border-[#DC2626] text-[#DC2626] font-medium";
            case "IN_PROGRESS": return "bg-[#FCE3AE] border border-[#E1791E] text-[#E1791E] font-medium";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getFilteredLogs = () => {
        if (periodFilter === "All Time") return logs;
        const now = new Date();
        return logs.filter(log => {
            const logDate = new Date(log.timestamp || log.time);
            switch (periodFilter) {
                case "Today":
                    return logDate.toDateString() === now.toDateString();
                case "This Week": {
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return logDate >= weekAgo;
                }
                case "This Month":
                    return logDate.getMonth() === now.getMonth() &&
                        logDate.getFullYear() === now.getFullYear();
                case "This Year":
                    return logDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    };

    const filteredLogs = getFilteredLogs();

    // Preview: first 3 logs / first 3 backups when collapsed
    const PREVIEW_COUNT = 3;
    const visibleLogs = isLogsExpanded ? filteredLogs : filteredLogs.slice(0, PREVIEW_COUNT);
    const visibleBackups = isBackupsExpanded ? backups : backups.slice(0, PREVIEW_COUNT);
    const hasMoreLogs = filteredLogs.length > PREVIEW_COUNT;
    const hasMoreBackups = backups.length > PREVIEW_COUNT;

    const handleExportLogs = () => {
        try {
            const dataToExport = filteredLogs.length > 0 ? filteredLogs : logs;
            const exportData = dataToExport.map(log => ({
                'Time': log.timestamp ? new Date(log.timestamp).toLocaleString() : log.time || 'N/A',
                'Action': log.action || log.type || 'N/A',
                'Status': log.message || log.description || 'N/A'
            }));
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 60 }];
            XLSX.utils.book_append_sheet(wb, ws, 'System Logs');
            XLSX.writeFile(wb, `System_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
            setSuccessMessage("Logs exported successfully!");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (e) {
            setError("Failed to export logs.");
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleExportBackups = () => {
        try {
            const exportData = backups.map(backup => ({
                'Backup Name': backup.name || 'N/A',
                'Date': backup.date || 'N/A',
                'Type': backup.type || 'Auto',
                'Status': backup.status || 'OK',
                'Size': backup.size || 'N/A'
            }));
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, 'Backups');
            XLSX.writeFile(wb, `Backups_${new Date().toISOString().split('T')[0]}.xlsx`);
            setSuccessMessage("Backups exported successfully!");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (e) {
            setError("Failed to export backups.");
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleBackupNow = async () => {
        try {
            setSuccessMessage("Starting backup...");
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/admin/backup-now`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSuccessMessage("Backup completed successfully!");
                loadData();
            } else {
                setError(data.message || "Backup failed");
            }
            setTimeout(() => { setSuccessMessage(null); setError(null); }, 5000);
        } catch (e) {
            setError("Failed to create backup.");
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleRestore = async (backupId) => {
        if (!window.confirm("Are you sure you want to restore this backup? This will replace current data.")) return;
        try {
            setSuccessMessage("Restoring backup...");
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/admin/restore-backup/${backupId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSuccessMessage("Backup restored successfully!");
            } else {
                setError(data.message || "Restore failed");
            }
            setTimeout(() => { setSuccessMessage(null); setError(null); }, 5000);
        } catch (e) {
            setError("Failed to restore backup.");
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleDeleteBackup = async (backupId) => {
        if (!window.confirm("Are you sure you want to delete this backup? This action cannot be undone.")) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/admin/delete-backup/${backupId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setBackups(backups.filter(b => b.id !== backupId));
                setSuccessMessage("Backup deleted successfully!");
            } else {
                setError(data.message || "Delete failed");
            }
            setTimeout(() => { setSuccessMessage(null); setError(null); }, 5000);
        } catch (e) {
            setError("Failed to delete backup.");
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleSaveSchedule = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/admin/backup-schedule`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(scheduleData)
            });
            const data = await response.json();
            if (data.success) {
                setSuccessMessage("Backup schedule saved successfully!");
                setIsScheduleModalOpen(false);
            } else {
                setError(data.message || "Failed to save schedule");
            }
            setTimeout(() => { setSuccessMessage(null); setError(null); }, 5000);
        } catch (e) {
            setError("Failed to save schedule.");
            setTimeout(() => setError(null), 5000);
        }
    };

    const ToggleSwitch = ({ checked, onChange }) => (
        <button
            onClick={onChange}
            type="button"
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-[#15803d]' : 'bg-gray-300'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${checked ? 'translate-x-[1.65rem]' : 'translate-x-[0.15rem]'}`} />
        </button>
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex flex-col justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f6b75]"></div>
                    <div className="text-gray-500 mt-4">Loading system data...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex-1 p-6 bg-[#FAFAFF]">
                {/* Page Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <Icon icon="mdi:wrench" className="w-8 h-8 text-[#1f6b75]" />
                        <div>
                            <h1 className="text-2xl font-semibold text-[#262D31]">System Maintenance</h1>
                            <p className="text-gray-500 text-sm">System Activity and backups.</p>
                        </div>
                    </div>
                </div>

                {/* Success / Error Messages */}
                {successMessage && (
                    <div className="mb-4 p-3 bg-[#D5FFE5] border border-[#15803D] rounded-lg text-[#15803D] flex items-center gap-2">
                        <Icon icon="mdi:check-circle" className="w-5 h-5" />
                        {successMessage}
                        <button onClick={() => setSuccessMessage(null)} className="ml-auto">
                            <Icon icon="mdi:close" className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 bg-[#FDE6EA] border border-[#DC2626] rounded-lg text-[#DC2626] flex items-center gap-2">
                        <Icon icon="mdi:alert-circle" className="w-5 h-5" />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto">
                            <Icon icon="mdi:close" className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    SYSTEM ACTIVITY LOGS — Collapsible (3 preview)
                    Filter/Export/Refresh ALWAYS visible
                ══════════════════════════════════════════════════ */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    {/* Header */}
                    <div className="p-4 border-b bg-[#EAE9F9] flex flex-wrap items-center justify-between gap-4">
                        <div
                            onClick={() => setIsLogsExpanded(!isLogsExpanded)}
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none group"
                        >
                            <Icon
                                icon="mdi:chevron-right"
                                className={`w-6 h-6 text-[#262D31] flex-shrink-0 transition-transform duration-200 ${isLogsExpanded ? 'rotate-90' : ''}`}
                            />
                            <h2 className="font-semibold text-[#262D31] group-hover:text-[#3b82f6] transition-colors">
                                System Activity Logs
                            </h2>
                            <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-300">
                                {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Controls — ALWAYS visible (both collapsed and expanded) */}
                        <div
                            className="flex flex-wrap items-center gap-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative">
                                <select
                                    value={periodFilter}
                                    onChange={(e) => setPeriodFilter(e.target.value)}
                                    className="appearance-none border border-[#D3D2DE] rounded-lg px-4 py-2 pr-8 text-sm font-light bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                                >
                                    <option>All Time</option>
                                    <option>Today</option>
                                    <option>This Week</option>
                                    <option>This Month</option>
                                    <option>This Year</option>
                                </select>
                                <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            <button
                                onClick={handleExportLogs}
                                className="flex items-center gap-2 px-4 py-2 bg-[#15803D] text-white rounded-lg text-sm font-medium hover:bg-[#166534] transition"
                            >
                                <Icon icon="uil:export" className="w-4 h-4" />
                                Export
                            </button>
                            <button
                                onClick={loadData}
                                className="flex items-center gap-2 px-4 py-2 border border-[#D3D2DE] rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                            >
                                <Icon icon="mdi:refresh" className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Table — shows 3 rows when collapsed, all when expanded */}
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Action</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {visibleLogs.length > 0 ? (
                                visibleLogs.map((log, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : log.time || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block min-w-[70px] text-center px-2 py-0.5 text-xs rounded-sm border ${getLogBadge(log.type)}`}>
                                                {log.action || log.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#000000]">{log.message || log.description}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                                        No logs found for the selected period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Footer — "View all" button when collapsed and there are more */}
                    {hasMoreLogs && (
                        <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                Showing {visibleLogs.length} of {filteredLogs.length} logs
                            </span>
                            <button
                                onClick={() => setIsLogsExpanded(!isLogsExpanded)}
                                className="flex items-center gap-1 text-sm font-medium text-[#0C7FDA] hover:text-[#0b6eb5] transition"
                            >
                                {isLogsExpanded ? (
                                    <>
                                        <Icon icon="mdi:chevron-up" className="w-4 h-4" />
                                        Show less
                                    </>
                                ) : (
                                    <>
                                        View all {filteredLogs.length} logs
                                        <Icon icon="mdi:chevron-down" className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════
                    BACKUP AND RESTORE — Collapsible (3 preview)
                    Export/Backup Now ALWAYS visible
                ══════════════════════════════════════════════════ */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    {/* Header (clickable to toggle) */}
                    <div className="p-4 border-b bg-[#EAE9F9] flex flex-wrap items-center justify-between gap-4">
                        <div
                            onClick={() => setIsBackupsExpanded(!isBackupsExpanded)}
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none group"
                        >
                            <Icon
                                icon="mdi:chevron-right"
                                className={`w-6 h-6 text-[#262D31] flex-shrink-0 transition-transform duration-200 ${isBackupsExpanded ? 'rotate-90' : ''}`}
                            />
                            <h2 className="font-semibold text-[#262D31] group-hover:text-[#3b82f6] transition-colors uppercase">
                                Backup and Restore
                            </h2>
                            <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-300">
                                {backups.length} backup{backups.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Action buttons — ALWAYS visible */}
                        <div
                            className="flex flex-wrap items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleExportBackups}
                                className="flex items-center gap-2 px-3 py-2 border border-[#15803D] text-[#15803D] rounded-lg text-sm font-medium hover:bg-[#15803D] hover:text-white transition"
                            >
                                <Icon icon="uil:export" className="w-4 h-4" />
                                Export
                            </button>
                            <button
                                onClick={handleBackupNow}
                                className="flex items-center gap-2 px-3 py-2 bg-[#0C7FDA] text-white rounded-lg text-sm font-medium hover:bg-[#0b6eb5] transition"
                            >
                                <Icon icon="material-symbols:save" className="w-4 h-4" />
                                Back up now
                            </button>
                        </div>
                    </div>

                    {/* Schedule info bar */}
                    <div className="px-4 py-3 bg-[#FFF8E5] border-b flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700">
                            <span className="flex items-center gap-1.5">
                                <Icon icon="mdi:clock-outline" className="w-4 h-4 text-[#E1791E]" />
                                Schedule: <span className="font-semibold">{scheduleData.frequency}</span> at <span className="font-semibold">{scheduleData.time}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Icon icon="mdi:calendar-clock" className="w-4 h-4 text-[#E1791E]" />
                                Retention: <span className="font-semibold">{scheduleData.retentionDays} days</span>
                            </span>
                        </div>
                        <button
                            onClick={() => setIsScheduleModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0C7FDA] text-[#0C7FDA] rounded-lg text-xs font-medium hover:bg-[#0C7FDA] hover:text-white transition"
                        >
                            <Icon icon="uil:setting" className="w-3.5 h-3.5" />
                            Configure Schedule
                        </button>
                    </div>

                    {/* Backups list — shows 3 when collapsed, all when expanded */}
                    <div className="divide-y divide-gray-200">
                        {visibleBackups.length > 0 ? (
                            visibleBackups.map((backup, index) => (
                                <div key={backup.id || index} className="p-4 hover:bg-gray-50 transition">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-400">●</span>
                                            <div>
                                                <p className="font-medium text-[#262D31]">{backup.name}</p>
                                                <p className="text-sm text-gray-500">{backup.date} · {backup.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className={`inline-block min-w-[40px] text-center px-3 py-0.5 text-xs rounded-sm border ${getStatusBadge(backup.status)}`}>
                                                {backup.status}
                                            </span>
                                            {backup.size && (
                                                <span className="text-xs text-gray-500">{backup.size}</span>
                                            )}
                                            <button
                                                onClick={() => handleRestore(backup.id)}
                                                className="text-[#656363] text-sm font-medium hover:text-[#4e4c4c] transition flex items-center gap-1 border border-[#D4D8E3] rounded-sm px-3 py-0.5"
                                            >
                                                <Icon icon="tabler:restore" className="w-4 h-4" />
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBackup(backup.id)}
                                                className="text-red-600 text-sm font-medium hover:text-red-700 transition flex items-center gap-1 border border-[#DC2626] rounded-sm px-3 py-0.5"
                                            >
                                                <Icon icon="mdi:delete" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <Icon icon="mdi:inbox" className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                <p>No backups found</p>
                            </div>
                        )}
                    </div>

                    {/* Footer — "View all" button when collapsed and there are more */}
                    {hasMoreBackups && (
                        <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                Showing {visibleBackups.length} of {backups.length} backups
                            </span>
                            <button
                                onClick={() => setIsBackupsExpanded(!isBackupsExpanded)}
                                className="flex items-center gap-1 text-sm font-medium text-[#0C7FDA] hover:text-[#0b6eb5] transition"
                            >
                                {isBackupsExpanded ? (
                                    <>
                                        <Icon icon="mdi:chevron-up" className="w-4 h-4" />
                                        Show less
                                    </>
                                ) : (
                                    <>
                                        View all {backups.length} backups
                                        <Icon icon="mdi:chevron-down" className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Configure Schedule Modal */}
            {isScheduleModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm overflow-y-auto">
                    <div className="min-h-full flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-[560px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
                            <div className="h-1.5 w-full bg-[#3b82f6]"></div>
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                                <h3 className="text-[20px] font-bold text-gray-800">Configure Backup Schedule</h3>
                                <button
                                    onClick={() => { setIsScheduleModalOpen(false); setError(null); setSuccessMessage(null); }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <Icon icon="mdi:close" className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Backup Frequency</label>
                                    <div className="relative">
                                        <select
                                            value={scheduleData.frequency}
                                            onChange={(e) => setScheduleData({ ...scheduleData, frequency: e.target.value })}
                                            className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option>Daily</option>
                                            <option>Weekly</option>
                                            <option>Monthly</option>
                                        </select>
                                        <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Backup Time</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={scheduleData.time}
                                            onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="e.g., 3:00 AM"
                                        />
                                        <Icon icon="mdi:clock-outline" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Retention Period (Days)</label>
                                    <input
                                        type="number"
                                        value={scheduleData.retentionDays}
                                        onChange={(e) => setScheduleData({ ...scheduleData, retentionDays: parseInt(e.target.value) || 0 })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        min="1"
                                        max="365"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Backup Storage Path</label>
                                    <input
                                        type="text"
                                        value={scheduleData.storagePath}
                                        onChange={(e) => setScheduleData({ ...scheduleData, storagePath: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex items-start justify-between pt-2">
                                    <div>
                                        <label className="block text-[14px] font-medium text-gray-700">Email Notification on Backup</label>
                                        <p className="text-[13px] text-gray-500 mt-0.5">Notify admin on completion</p>
                                    </div>
                                    <ToggleSwitch
                                        checked={scheduleData.emailNotification}
                                        onChange={() => setScheduleData({ ...scheduleData, emailNotification: !scheduleData.emailNotification })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <button
                                    onClick={() => { setIsScheduleModalOpen(false); setError(null); setSuccessMessage(null); }}
                                    className="px-5 py-1.5 text-[14px] font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSchedule}
                                    className="px-6 py-1.5 text-[14px] font-medium text-white bg-[#0C7FDA] rounded hover:bg-[#0b6eb5] transition-colors shadow-sm"
                                >
                                    Save Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </AdminLayout>
    );
}