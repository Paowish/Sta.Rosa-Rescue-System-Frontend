import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';

export default function SystemSettings() {
    // State for General Configuration
    const [general, setGeneral] = useState({
        systemName: 'A CROSS-PLATFORM WEB SYSTEM SUPPORTING COMMUNITY INCIDENT REPORTING AND GEOLOCATION-DRIVEN EMERGENCY RESPONSE FOR MUNICIPAL RESCUE UNIT',
        region: 'Central Luzon — Region III',
        timezone: 'Asia/Manila (UTC+8)',
        dateFormat: 'MM / DD / YYYY'
    });

    const [generalBackup, setGeneralBackup] = useState(general);

    const [security, setSecurity] = useState({
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordMinLength: 14,
        twoFactorAuth: false
    });

    const [notifications, setNotifications] = useState({
        dailySummary: false,
        systemErrors: false,
        adminEmail: 'admin@rescue.gov.ph',
        adminNumber: '+63 912-345-6789'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [resetTarget, setResetTarget] = useState(null);
    const [dangerAction, setDangerAction] = useState(null);
    const [isGeneralEditable, setIsGeneralEditable] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await fetch('/api/admin/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // ✅ Handle 404 gracefully: Use defaults if route doesn't exist
            if (!response.ok) {
                console.warn("Settings route not found (404). Using defaults.");
                return;
            }

            const data = await response.json();
            if (data.success) {
                const loadedGeneral = data.data.general || general;
                setGeneral(loadedGeneral);
                setGeneralBackup(loadedGeneral);
                setSecurity(data.data.security || security);
                setNotifications(data.data.notifications || notifications);
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            // Silently fallback to defaults
        } finally {
            setLoading(false);
        }
    };

    const saveAllSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);

            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    general,
                    security,
                    notifications
                })
            });

            // ✅ Handle 404 during save
            if (!response.ok) {
                setError("Backend settings route not found (404). Please create the API route.");
                setTimeout(() => setError(null), 5000);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setSuccessMessage("All settings saved successfully!");
                setGeneralBackup(general);
                setIsGeneralEditable(false);
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                setError(data.message || "Failed to save settings");
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error("Failed to save settings:", error);
            setError("Network error. Please try again.");
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const confirmReset = () => {
        try {
            if (resetTarget === 'general') {
                const defaultGeneral = {
                    systemName: 'A CROSS-PLATFORM WEB SYSTEM SUPPORTING COMMUNITY INCIDENT REPORTING AND GEOLOCATION-DRIVEN EMERGENCY RESPONSE FOR MUNICIPAL RESCUE UNIT',
                    region: 'Central Luzon — Region III',
                    timezone: 'Asia/Manila (UTC+8)',
                    dateFormat: 'MM / DD / YYYY'
                };
                setGeneral(defaultGeneral);
                setGeneralBackup(defaultGeneral);
                setSuccessMessage("General settings reset to defaults");
            } else if (resetTarget === 'security') {
                setSecurity({
                    sessionTimeout: 30,
                    maxLoginAttempts: 5,
                    passwordMinLength: 14,
                    twoFactorAuth: false
                });
                setSuccessMessage("Security settings reset to defaults");
            } else if (resetTarget === 'notifications') {
                setNotifications({
                    dailySummary: false,
                    systemErrors: false,
                    adminEmail: 'admin143@gmail.com',
                    adminNumber: '+63 9XX XXX XXXX'
                });
                setSuccessMessage("Notification settings reset to defaults");
            }
            closeResetModal();
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error("Reset failed:", error);
            setError("Failed to reset settings");
            setTimeout(() => setError(null), 5000);
        }
    };

    const confirmDangerAction = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            let endpoint = '';
            let successMsg = '';

            switch (dangerAction) {
                case 'clear_records':
                    endpoint = '/api/admin/clear-incidents';
                    successMsg = 'All incident records cleared successfully!';
                    break;
                case 'clear_accounts':
                    endpoint = '/api/admin/clear-non-admin-accounts';
                    successMsg = 'All non-admin accounts deleted successfully!';
                    break;
                default:
                    throw new Error('Invalid action');
            }

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                setError("Danger action route not found (404).");
                setTimeout(() => setError(null), 5000);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setSuccessMessage(successMsg);
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                setError(data.message || "Action failed");
                setTimeout(() => setError(null), 5000);
            }
        } catch (error) {
            console.error("Danger action failed:", error);
            setError("Action failed. Please try again.");
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
            closeDangerModal();
        }
    };

    const openResetModal = (section) => setResetTarget(section);
    const closeResetModal = () => setResetTarget(null);
    const openDangerModal = (action) => setDangerAction(action);
    const closeDangerModal = () => setDangerAction(null);

    const exportSettings = () => {
        try {
            const settingsData = { general, security, notifications, exportedAt: new Date().toISOString(), version: '1.0' };
            const json = JSON.stringify(settingsData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `system_settings_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setSuccessMessage("Settings exported successfully!");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error("Export failed:", error);
            setError("Failed to export settings");
            setTimeout(() => setError(null), 5000);
        }
    };

    const importSettings = (event) => {
        try {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.general) {
                        setGeneral(data.general);
                        setGeneralBackup(data.general);
                    }
                    if (data.security) setSecurity(data.security);
                    if (data.notifications) setNotifications(data.notifications);
                    setSuccessMessage("Settings imported successfully!");
                    setTimeout(() => setSuccessMessage(null), 5000);
                } catch (error) {
                    console.error("Parse error:", error);
                    setError("Invalid settings file");
                    setTimeout(() => setError(null), 5000);
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        } catch (error) {
            console.error("Import failed:", error);
            setError("Failed to import settings");
            setTimeout(() => setError(null), 5000);
        }
    };

    const ToggleSwitch = ({ checked, onChange }) => (
        <button onClick={onChange} type="button" className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-[#15803d]' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${checked ? 'translate-x-[1.65rem]' : 'translate-x-[0.15rem]'}`} />
        </button>
    );

    const ResetConfirmationModal = () => {
        if (!resetTarget) return null;
        const titles = { general: 'Reset General to Default', security: 'Reset Security to Default', notifications: 'Reset Notifications to Default' };
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-2xl w-[480px] max-w-[95vw] overflow-hidden">
                    <div className="h-1.5 w-full bg-[#f97316]"></div>
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3"><Icon icon="mdi:refresh" className="w-6 h-6 text-[#f97316]" /><h3 className="text-[20px] font-bold text-gray-800">{titles[resetTarget]}</h3></div>
                        <button onClick={closeResetModal} className="text-gray-400 hover:text-gray-600"><Icon icon="mdi:close" className="w-6 h-6" /></button>
                    </div>
                    <div className="px-6 py-6">
                        <p className="text-gray-600 text-sm leading-relaxed">All system configurations will be restored to factory defaults. Your user accounts and incident data will not be affected.</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={closeResetModal} className="px-5 py-1.5 text-[14px] font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors">Cancel</button>
                            <button onClick={confirmReset} className="px-6 py-1.5 text-[14px] font-medium text-white bg-[#f97316] rounded hover:bg-[#ea580c] transition-colors shadow-sm">Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const DangerConfirmationModal = () => {
        if (!dangerAction) return null;
        const modalData = {
            clear_records: {
                title: 'Clear All Incident Records', subtitle: 'This will permanently delete all incident records. This action cannot be undone.',
                tableRows: [{ label: 'Records to delete', value: 'Incident records' }, { label: 'Affected data', value: 'Reports, timelines, assignments' }]
            },
            clear_accounts: {
                title: 'Delete All Non-Admin Accounts', subtitle: 'This will permanently delete all non-admin user accounts. Admin accounts are preserved.',
                tableRows: [{ label: 'Accounts to delete', value: 'All non-admin users' }, { label: 'Roles Affected', value: 'Responder, Volunteer, Civilian' }, { label: 'Admin accounts kept', value: 'Preserved' }]
            }
        };
        const data = modalData[dangerAction];
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-2xl w-[520px] max-w-[95vw] overflow-hidden">
                    <div className="h-1.5 w-full bg-[#dc2626]"></div>
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3"><Icon icon="mdi:alert-triangle" className="w-6 h-6 text-[#dc2626]" /><h3 className="text-[20px] font-bold text-gray-800">{data.title}</h3></div>
                        <button onClick={closeDangerModal} className="text-gray-400 hover:text-gray-600"><Icon icon="mdi:close" className="w-6 h-6" /></button>
                    </div>
                    <div className="px-6 py-5">
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">{data.subtitle}</p>
                        <div className="bg-[#f8fafc] border-y border-gray-200 rounded-sm overflow-hidden mb-6">
                            {data.tableRows.map((row, index) => (
                                <div key={index} className={`flex justify-between px-4 py-2.5 ${index !== data.tableRows.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                    <span className="text-[14px] text-gray-500">{row.label}</span>
                                    <span className="text-[14px] font-medium text-gray-800">{row.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={closeDangerModal} className="px-4 py-1.5 text-[14px] font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                            <button onClick={confirmDangerAction} className="px-6 py-1.5 text-[14px] font-medium text-white bg-[#dc2626] rounded hover:bg-[#b91c1c] shadow-sm">{dangerAction === 'clear_records' ? 'CLEAR RECORDS' : 'CLEAR ACCOUNTS'}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFF] relative">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Icon icon="mdi:cog" className="w-8 h-8 text-[#1f6b75]" />
                    <div><h1 className="text-2xl font-semibold text-[#262D31]">System Settings</h1><p className="text-gray-500 text-sm">Manage system configurations.</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={exportSettings} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded shadow-sm flex items-center gap-2 transition-colors"><Icon icon="mdi:export" className="w-4 h-4" /> Export</button>
                    <label className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded shadow-sm flex items-center gap-2 transition-colors cursor-pointer"><Icon icon="mdi:import" className="w-4 h-4" /> Import<input type="file" accept=".json" onChange={importSettings} className="hidden" /></label>
                    <button onClick={saveAllSettings} className="bg-[#0C7FDA] hover:bg-[#0b6eb5] text-white text-sm font-medium px-4 py-2 rounded shadow-sm flex items-center gap-2 transition-colors" disabled={loading}><Icon icon="mdi:content-save" className="w-4 h-4" /> {loading ? 'Saving...' : 'Save All Changes'}</button>
                </div>
            </div>

            {successMessage && (<div className="mb-4 p-3 bg-[#D5FFE5] border border-[#15803D] rounded-lg text-[#15803D] flex items-center gap-2"><Icon icon="mdi:check-circle" className="w-5 h-5" />{successMessage}<button onClick={() => setSuccessMessage(null)} className="ml-auto text-[#15803D] hover:text-[#0d5c2a]"><Icon icon="mdi:close" className="w-4 h-4" /></button></div>)}
            {error && (<div className="mb-4 p-3 bg-[#FDE6EA] border border-[#DC2626] rounded-lg text-[#DC2626] flex items-center gap-2"><Icon icon="mdi:alert-circle" className="w-5 h-5" />{error}<button onClick={() => setError(null)} className="ml-auto text-[#DC2626] hover:text-[#c11f1f]"><Icon icon="mdi:close" className="w-4 h-4" /></button></div>)}

            {/* General Configuration */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="p-4 border-b bg-[#EAE9F9] flex items-center justify-between">
                    <h2 className="font-semibold text-[#262D31]">General Configuration</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => openResetModal('general')} className="text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1 font-medium transition-colors"><Icon icon="mdi:refresh" className="w-4 h-4" /> Reset Section</button>
                        {!isGeneralEditable ? (
                            <button onClick={() => setIsGeneralEditable(true)} className="bg-[#0C7FDA] hover:bg-[#0b6eb5] text-white text-xs px-3 py-1 rounded font-medium flex items-center gap-1 transition-colors"><Icon icon="mdi:pencil" className="w-3 h-3" /> Edit</button>
                        ) : (
                            <button onClick={() => { setGeneral(generalBackup); setIsGeneralEditable(false); }} className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded font-medium flex items-center gap-1 transition-colors"><Icon icon="mdi:close" className="w-3 h-3" /> Cancel</button>
                        )}
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-[13px] font-medium text-gray-700 mb-1">System Name</label><input type="text" value={general.systemName} onChange={(e) => setGeneral({ ...general, systemName: e.target.value })} disabled={!isGeneralEditable} className={`w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white ${!isGeneralEditable ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`} /></div>
                        <div><label className="block text-[13px] font-medium text-gray-700 mb-1">Region</label><select value={general.region} onChange={(e) => setGeneral({ ...general, region: e.target.value })} disabled={!isGeneralEditable} className={`w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${!isGeneralEditable ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}><option>Central Luzon — Region III</option></select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-[13px] font-medium text-gray-700 mb-1">Timezone</label><select value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })} disabled={!isGeneralEditable} className={`w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${!isGeneralEditable ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}><option>Asia/Manila (UTC+8)</option></select></div>
                        <div><label className="block text-[13px] font-medium text-gray-700 mb-1">Date Format</label><select value={general.dateFormat} onChange={(e) => setGeneral({ ...general, dateFormat: e.target.value })} disabled={!isGeneralEditable} className={`w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${!isGeneralEditable ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}><option>MM / DD / YYYY</option><option>DD / MM / YYYY</option><option>YYYY / MM / DD</option></select></div>
                    </div>
                </div>
            </div>

            {/* Security Configuration */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="p-4 border-b bg-[#EAE9F9] flex items-center justify-between">
                    <h2 className="font-semibold text-[#262D31]">Security Configuration</h2>
                    <button onClick={() => openResetModal('security')} className="text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1 font-medium transition-colors"><Icon icon="mdi:refresh" className="w-4 h-4" /> Reset Section</button>
                </div>
                <div className="divide-y divide-gray-200">
                    <div className="p-4 flex justify-between items-start">
                        <div className="pr-4"><label className="block text-[13px] font-medium text-gray-700 mb-1">Session Timeout (minutes)</label><p className="text-[11px] text-gray-500 mb-1.5">How long before inactive users are automatically logged out</p></div>
                        <div className="shrink-0"><input type="number" value={security.sessionTimeout} disabled={true} className="w-20 border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 bg-gray-100 cursor-not-allowed opacity-70 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-right" min="1" max="1440" /></div>
                    </div>
                    <div className="p-4 flex justify-between items-start">
                        <div className="pr-4"><label className="block text-[13px] font-medium text-gray-700 mb-1">Max Login Attempts</label><p className="text-[11px] text-gray-500 mb-1.5">Number of failed logins before the account is locked</p></div>
                        <div className="shrink-0"><input type="number" value={security.maxLoginAttempts} disabled={true} className="w-20 border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 bg-gray-100 cursor-not-allowed opacity-70 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-right" min="1" max="20" /></div>
                    </div>
                    <div className="p-4 flex justify-between items-start">
                        <div className="pr-4"><label className="block text-[13px] font-medium text-gray-700 mb-1">Password Minimum Length</label><p className="text-[11px] text-gray-500 mb-1.5">Minimum number of characters required for user passwords</p></div>
                        <div className="shrink-0"><input type="number" value={security.passwordMinLength} disabled={true} className="w-20 border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 bg-gray-100 cursor-not-allowed opacity-70 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-right" min="6" max="50" /></div>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                        <div className="pr-4"><label className="block text-[13px] font-medium text-gray-700 mb-1">Require 2-Factor Authentication</label><p className="text-[11px] text-gray-500 mb-1.5">Enforce 2FA for all admin and dispatcher accounts</p></div>
                        <div className="shrink-0"><ToggleSwitch checked={security.twoFactorAuth} onChange={() => setSecurity({ ...security, twoFactorAuth: !security.twoFactorAuth })} /></div>
                    </div>
                </div>
            </div>

            {/* Notification Configuration */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="p-4 border-b bg-[#EAE9F9] flex items-center justify-between">
                    <h2 className="font-semibold text-[#262D31]">Notification Configuration</h2>
                    <button onClick={() => openResetModal('notifications')} className="text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1 font-medium transition-colors"><Icon icon="mdi:refresh" className="w-4 h-4" /> Reset Section</button>
                </div>
                <div className="divide-y divide-gray-200">
                    <div className="p-4 flex justify-between items-center">
                        <div className="pr-4"><label className="block text-[13px] font-medium text-gray-700 mb-1">Daily Summary Report</label><p className="text-[11px] text-gray-500 mb-1.5">Send a daily digest at 22:00 to admins and dispatchers</p></div>
                        <div className="shrink-0"><ToggleSwitch checked={notifications.dailySummary} onChange={() => setNotifications({ ...notifications, dailySummary: !notifications.dailySummary })} /></div>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                        <div className="pr-4"><label className="block text-[13px] font-medium text-gray-700 mb-1">System Error Alerts</label><p className="text-[11px] text-gray-500 mb-1.5">Notify admin when system errors or service degradations occur</p></div>
                        <div className="shrink-0"><ToggleSwitch checked={notifications.systemErrors} onChange={() => setNotifications({ ...notifications, systemErrors: !notifications.systemErrors })} /></div>
                    </div>
                    <div className="p-4 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">Admin Email</label>
                            <input
                                type="email"
                                value={notifications.adminEmail}
                                disabled={true} // ✅ Disabled
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 bg-gray-100 cursor-not-allowed opacity-70 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[13px] font-medium text-gray-700 mb-1">Admin Number</label>
                            <input
                                type="text"
                                value={notifications.adminNumber}
                                disabled={true} // ✅ Disabled
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 bg-gray-100 cursor-not-allowed opacity-70 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Danger Zone */}
            <div className="bg-white rounded-lg shadow border border-red-200 overflow-hidden">
                <div className="bg-[#fff5f5] px-6 py-4 border-b border-red-200 flex justify-between items-center">
                    <h2 className="text-[17px] font-bold text-[#2c2c2c]">Reset</h2>
                    <p className="text-xs text-gray-500 font-medium">These actions are irreversible. Proceed with extreme caution.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="pr-4"><p className="text-[14px] font-medium text-gray-800">Clear All Incident Records</p><p className="text-[12px] text-gray-500 mt-0.5">Permanently deletes all incident data including reports, timelines, and media. Cannot be undone.</p></div>
                        <button onClick={() => openDangerModal('clear_records')} className="px-4 py-1.5 bg-[#dc2626] text-white text-[11px] font-medium rounded hover:bg-[#b91c1c] transition whitespace-nowrap shadow-sm">CLEAR RECORDS</button>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="pr-4"><p className="text-[14px] font-medium text-gray-800">Reset All Settings to Defaults</p><p className="text-[12px] text-gray-500 mt-0.5">Resets all configurations on this page to factory defaults. Your user accounts will not be affected.</p></div>
                        <button onClick={() => { setResetTarget('general'); setDangerAction(null); }} className="px-4 py-1.5 bg-[#dc2626] text-white text-[11px] font-medium rounded hover:bg-[#b91c1c] transition whitespace-nowrap shadow-sm">RESET SETTINGS</button>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="pr-4"><p className="text-[14px] font-medium text-gray-800">Delete All Non-Admin Accounts</p><p className="text-[12px] text-gray-500 mt-0.5">Permanently removes all responder, volunteer, and civilian accounts. Admin accounts are preserved.</p></div>
                        <button onClick={() => openDangerModal('clear_accounts')} className="px-4 py-1.5 bg-[#dc2626] text-white text-[11px] font-medium rounded hover:bg-[#b91c1c] transition whitespace-nowrap shadow-sm">CLEAR ACCOUNTS</button>
                    </div>
                </div>
            </div>

            <ResetConfirmationModal />
            <DangerConfirmationModal />
        </div>
    );
}