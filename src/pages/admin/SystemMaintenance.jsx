import { Icon } from "@iconify/react";
import AdminLayout from "./AdminLayout";
import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';

export default function SystemMaintenance() {
    const [periodFilter, setPeriodFilter] = useState("All Time");
    const [logs, setLogs] = useState([]);
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // ------------------ SCHEDULE MODAL STATE ------------------
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        frequency: 'Daily',
        time: '3:00 AM',
        retentionDays: 30,
        storagePath: '/var/backups/whatatops',
        emailNotification: true
    });

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            // 1. Load system logs
            const logsResponse = await fetch('/api/admin/system-logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (logsResponse.ok) {
                const logsData = await logsResponse.json();
                if (logsData.success) {
                    setLogs(logsData.data);
                }
            }

            // 2. Load backups
            const backupsResponse = await fetch('/api/admin/backups', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (backupsResponse.ok) {
                const backupsData = await backupsResponse.json();
                if (backupsData.success) {
                    setBackups(backupsData.data);
                }
            }

            // 3. Load the CURRENT saved schedule
            const scheduleResponse = await fetch('/api/admin/backup-schedule', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (scheduleResponse.ok) {
                const scheduleDataJson = await scheduleResponse.json();
                if (scheduleDataJson.success && scheduleDataJson.data) {
                    const saved = scheduleDataJson.data;
                    setScheduleData({
                        frequency: saved.frequency || 'Daily',
                        time: saved.time || '3:00 AM',
                        retentionDays: saved.retentionDays || 30,
                        storagePath: saved.storagePath || '/var/backups/whatatops',
                        emailNotification: saved.emailNotification !== undefined ? saved.emailNotification : true
                    });
                }
            }

        } catch (error) {
            console.error("Failed to load data:", error);
            setError("Failed to load system data. Please refresh.");
        } finally {
            setLoading(false);
        }
    };

    // Load schedule specifically when the modal OPENS
    const handleOpenScheduleModal = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/backup-schedule', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setScheduleData({
                        frequency: data.data.frequency || 'Daily',
                        time: data.data.time || '3:00 AM',
                        retentionDays: data.data.retentionDays || 30,
                        storagePath: data.data.storagePath || '/var/backups/whatatops',
                        emailNotification: data.data.emailNotification !== undefined ? data.data.emailNotification : true
                    });
                }
            }
            setIsScheduleModalOpen(true);
        } catch (error) {
            console.error("Failed to load schedule:", error);
            setError("Failed to load current schedule.");
            setTimeout(() => setError(null), 5000);
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

    // Filter logs by period
    const getFilteredLogs = () => {
        if (periodFilter === "All Time") return logs;

        const now = new Date();
        return logs.filter(log => {
            const logDate = new Date(log.timestamp || log.time);
            switch (periodFilter) {
                case "Today":
                    return logDate.toDateString() === now.toDateString();
                case "This Week":
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return logDate >= weekAgo;
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

    // Export logs to Excel
    const handleExportLogs = () => {
        try {
            const dataToExport = filteredLogs.length > 0 ? filteredLogs : logs;

            const exportData = dataToExport.map(log => ({
                'Time': log.timestamp ? new Date(log.timestamp).toLocaleString() : log.time || 'N/A',
                'Action': log.type || 'N/A',
                'Status': log.message || log.description || 'N/A'
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            ws['!cols'] = [
                { wch: 20 }, // Time
                { wch: 15 }, // Action
                { wch: 60 }  // Status
            ];
            XLSX.utils.book_append_sheet(wb, ws, 'System Logs');

            const filename = `System_Logs_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);

            setSuccessMessage(`Logs exported successfully as ${filename}`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error("Export failed:", error);
            setError("Failed to export logs. Please try again.");
            setTimeout(() => setError(null), 5000);
        }
    };

    // Export backups to Excel
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
            ws['!cols'] = [
                { wch: 25 }, // Backup Name
                { wch: 20 }, // Date
                { wch: 15 }, // Type
                { wch: 15 }, // Status
                { wch: 15 }  // Size
            ];
            XLSX.utils.book_append_sheet(wb, ws, 'Backups');

            const filename = `Backups_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);

            setSuccessMessage(`Backups exported successfully as ${filename}`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error("Export failed:", error);
            setError("Failed to export backups. Please try again.");
            setTimeout(() => setError(null), 5000);
        }
    };

    // Handle backup now
    const handleBackupNow = async () => {
        try {
            setSuccessMessage("Starting backup...");
            const token = localStorage.getItem('token');

            const response = await fetch('/api/admin/backup-now', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setSuccessMessage("Backup completed successfully!");
                loadData(); // Refresh backup list
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                setError(data.message || "Backup failed");
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error("Backup failed:", error);
            setError("Failed to create backup. Please try again.");
            setTimeout(() => setError(null), 5000);
        }
    };

    // Handle restore backup
    const handleRestore = async (backupId) => {
        if (!window.confirm("Are you sure you want to restore this backup? This will replace current data.")) {
            return;
        }

        try {
            setSuccessMessage("Restoring backup...");
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/admin/restore-backup/${backupId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setSuccessMessage("Backup restored successfully!");
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                setError(data.message || "Restore failed");
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error("Restore failed:", error);
            setError("Failed to restore backup. Please try again.");
            setTimeout(() => setError(null), 5000);
        }
    };

    // Handle delete backup
    const handleDeleteBackup = async (backupId) => {
        if (!window.confirm("Are you sure you want to delete this backup? This action cannot be undone.")) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/admin/delete-backup/${backupId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setBackups(backups.filter(b => b.id !== backupId));
                setSuccessMessage("Backup deleted successfully!");
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                setError(data.message || "Delete failed");
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error("Delete failed:", error);
            setError("Failed to delete backup. Please try again.");
            setTimeout(() => setError(null), 5000);
        }
    };

    // Save schedule configuration
    const handleSaveSchedule = async () => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch('/api/admin/backup-schedule', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(scheduleData)
            });

            const data = await response.json();
            if (data.success) {
                setSuccessMessage("Backup schedule saved successfully!");
                setIsScheduleModalOpen(false);
                loadData(); // Reload the data to update summary text
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                setError(data.message || "Failed to save schedule");
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error("Save schedule failed:", error);
            setError("Failed to save schedule. Please try again.");
            setTimeout(() => setError(null), 5000);
        }
    };

    // Toggle component for the modal
    const ToggleSwitch = ({ checked, onChange }) => (
        <button
            onClick={onChange}
            type="button"
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-[#15803d]' : 'bg-gray-300'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${checked ? 'translate-x-[1.65rem]' : 'translate-x-[0.15rem]'}`}
            />
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
            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFF]">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <Icon icon="mdi:wrench" className="w-8 h-8 text-[#1f6b75]" />
                        <div>
                            <h1 className="text-2xl font-semibold text-[#262D31]">System Maintenance</h1>
                            <p className="text-gray-500 text-sm">System Activity and backups.</p>
                        </div>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="mb-4 p-3 bg-[#D5FFE5] border border-[#15803D] rounded-lg text-[#15803D] flex items-center gap-2">
                        <Icon icon="mdi:check-circle" className="w-5 h-5" />
                        {successMessage}
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="ml-auto text-[#15803D] hover:text-[#0d5c2a]"
                        >
                            <Icon icon="mdi:close" className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 bg-[#FDE6EA] border border-[#DC2626] rounded-lg text-[#DC2626] flex items-center gap-2">
                        <Icon icon="mdi:alert-circle" className="w-5 h-5" />
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-[#DC2626] hover:text-[#c11f1f]"
                        >
                            <Icon icon="mdi:close" className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* System Activity Logs */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    <div className="p-4 border-b bg-[#EAE9F9] flex flex-wrap items-center justify-between gap-4">
                        <h2 className="font-semibold text-[#262D31]">System Activity Logs</h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <select
                                        value={periodFilter}
                                        onChange={(e) => {
                                            setPeriodFilter(e.target.value);
                                        }}
                                        className="appearance-none border border-[#D3D2DE] rounded-lg px-4 py-2 pr-8 text-sm font-light bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                                    >
                                        <option>All Time</option>
                                        <option>Today</option>
                                        <option>This Week</option>
                                        <option>This Month</option>
                                        <option>This Year</option>
                                    </select>
                                    <Icon
                                        icon="mdi:chevron-down"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleExportLogs}
                                className="flex items-center gap-2 px-4 py-2 bg-[#15803D] text-white rounded-lg text-sm font-medium hover:bg-[#166534] transition"
                            >
                                <Icon icon="uil:export" className="w-4 h-4" />
                                Export to Excel
                            </button>
                            <button
                                onClick={loadData}
                                className="flex items-center gap-2 px-4 py-2 border border-[#D3D2DE] rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                            >
                                <Icon icon="mdi:refresh" className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : log.time || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block min-w-[70px] text-center px-2 py-0.5 text-xs rounded-sm border ${getLogBadge(log.type)}`}>
                                                    {log.type}
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
                    </div>
                    {filteredLogs.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500">
                            Showing {filteredLogs.length} of {logs.length} logs
                        </div>
                    )}
                </div>

                {/* Backup and Restore */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    <div className="p-4 border-b bg-[#EAE9F9] flex flex-wrap items-center justify-between gap-4">
                        <h2 className="font-semibold text-[#262D31] uppercase">BACKUP AND RESTORE</h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleExportBackups}
                                className="flex items-center gap-2 px-4 py-2 border border-[#15803D] text-[#15803D] rounded-lg text-sm font-medium hover:bg-[#15803D] hover:text-white transition"
                            >
                                <Icon icon="uil:export" className="w-4 h-4" />
                                Export Backups
                            </button>
                            <button
                                onClick={handleBackupNow}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0C7FDA] text-white rounded-lg text-sm font-medium hover:bg-[#165a63] transition"
                            >
                                <Icon icon="material-symbols:save" className="w-6 h-6" />
                                Back up now
                            </button>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {backups.length > 0 ? (
                            backups.map((backup, index) => (
                                <div key={backup.id || index} className="p-4 hover:bg-gray-50 transition">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-6">
                                            <span className="text-gray-400">●</span>
                                            <div>
                                                <p className="font-medium text-[#262D31]">{backup.name} — {backup.date}</p>
                                                <p className="text-sm text-gray-500">{backup.date} · {backup.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className={`inline-block min-w-[40px] text-center px-4 py-0.5 text-xs rounded-sm border ${getStatusBadge(backup.status)}`}>
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
                        <div className="p-4 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
                            <p className="text-sm text-gray-600">
                                Schedule: <span className="font-medium text-[#262D31]">{scheduleData.frequency} at {scheduleData.time}</span> ·
                                Retention: <span className="font-medium text-[#262D31]">{scheduleData.retentionDays} days</span>
                            </p>
                            <button
                                onClick={handleOpenScheduleModal}
                                className="flex items-center gap-2 px-4 py-2 border border-[#0C7FDA] text-[#0C7FDA] rounded-lg text-sm font-medium hover:bg-[#0C7FDA] hover:text-white transition"
                            >
                                <Icon icon="uil:setting" className="w-4 h-4" />
                                Configure Schedule
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* ========================================== */}
            {/* CONFIGURE SCHEDULE MODAL */}
            {/* ========================================== */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl w-[560px] max-w-[95vw] max-h-[90vh] overflow-y-auto">

                        {/* Top Blue Border */}
                        <div className="h-1.5 w-full bg-[#3b82f6]"></div>

                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                            <h3 className="text-[20px] font-bold text-gray-800">Configure Backup Schedule</h3>
                            <button
                                onClick={() => {
                                    setIsScheduleModalOpen(false);
                                    setError(null);
                                    setSuccessMessage(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">

                            {/* Backup Frequency */}
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

                            {/* Backup Time */}
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

                            {/* Retention Period (Days) */}
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

                            {/* Backup Storage Path */}
                            <div>
                                <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Backup Storage Path</label>
                                <input
                                    type="text"
                                    value={scheduleData.storagePath}
                                    onChange={(e) => setScheduleData({ ...scheduleData, storagePath: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Email Notification */}
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

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setIsScheduleModalOpen(false);
                                    setError(null);
                                    setSuccessMessage(null);
                                }}
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
            )}

        </AdminLayout>
    );
}