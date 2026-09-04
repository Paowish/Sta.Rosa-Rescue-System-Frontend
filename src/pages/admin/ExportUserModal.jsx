import { Icon } from "@iconify/react";
import { useState } from "react";
import { createPortal } from "react-dom";

/**
 * Export User Modal Component
 * Provides options for exporting user data with role-based filtering
 */
export default function ExportUserModal({ isOpen, onClose, onExport }) {
    // State for export options
    const [selectedOption, setSelectedOption] = useState('all');
    const [selectedRole, setSelectedRole] = useState('all');

    // Don't render if modal is closed
    if (!isOpen) return null;

    /**
     * Handle export button click
     */
    const handleExport = () => {
        onExport(selectedOption, selectedRole);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
                    <div className="flex items-center gap-2">
                        <Icon icon="mdi:upload" className="w-6 h-6 text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-800">Export User Details</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <Icon icon="mdi:close" className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    {/* Export Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Option 1: All Users */}
                        <button
                            onClick={() => setSelectedOption('all')}
                            className={`p-4 border rounded-lg text-left transition-all ${selectedOption === 'all'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="pt-1">
                                    <Icon icon="mdi:account-multiple" className="w-6 h-6 text-gray-700" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">List of All Users</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Complete list of all registered users</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 2: Active Users */}
                        <button
                            onClick={() => setSelectedOption('active')}
                            className={`p-4 border rounded-lg text-left transition-all ${selectedOption === 'active'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="pt-1">
                                    <Icon icon="mdi:check-circle" className="w-6 h-6 text-gray-700" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">Active Users</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Users with active accounts</p>
                                </div>
                            </div>
                        </button>

                        {/* Option 3: Inactive Users */}
                        <button
                            onClick={() => setSelectedOption('inactive')}
                            className={`p-4 border rounded-lg text-left transition-all ${selectedOption === 'inactive'
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="pt-1">
                                    <Icon icon="mdi:pause-circle" className="w-6 h-6 text-gray-700" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm">Inactive Users</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Users with inactive accounts</p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Filter Options */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Options</h4>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-gray-500 font-medium">Role</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full max-w-xs border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                            >
                                <option value="all">- All Roles -</option>
                                <option value="volunteer">Volunteer</option>
                                <option value="civilian">Civilian</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-6 py-2 bg-[#198754] text-white rounded-lg text-sm font-medium hover:bg-[#157347] transition"
                    >
                        Export Users
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}