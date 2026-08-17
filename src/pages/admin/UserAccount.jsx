import { Icon } from "@iconify/react";
import AdminLayout from "./AdminLayout";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function UserAccount() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    // ✅ New Error Modal State
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Edit form state
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: 'volunteer',
        isApproved: true,
        password: ''
    });

    // ✅ Get API URL dynamically
    const getApiUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return '/api';
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/admin/all-volunteers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const formattedUsers = data.data.map(user => {
                    let status = 'PENDING';
                    if (user.isApproved) {
                        status = 'ACTIVE';
                    } else if (user.applicationStatus === 'rejected') {
                        status = 'REJECTED';
                    } else if (user.applicationStatus === 'pending') {
                        status = 'PENDING';
                    }
                    return {
                        id: user._id,
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
                        role: user.role?.toUpperCase() || 'VOLUNTEER',
                        email: user.email || '',
                        phoneNumber: user.phoneNumber || 'N/A',
                        contact: user.phoneNumber || 'N/A',
                        isApproved: user.isApproved || false,
                        applicationStatus: user.applicationStatus || 'pending',
                        status: status,
                        lastLogin: user.lastLogin || user.lastActive || user.updatedAt || null,
                        checked: false
                    };
                });
                setUsers(formattedUsers);
            }
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Open Modals ---
    const handleEditClick = (user) => {
        setSelectedUser(user);
        setEditForm({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber === 'N/A' ? '' : user.phoneNumber,
            role: 'volunteer',
            isApproved: user.isApproved,
            password: ''
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const handleVerifyClick = (user) => {
        setSelectedUser(user);
        setShowVerifyModal(true);
    };

    // --- API Actions ---
    const handleVerifyUser = async () => {
        if (!selectedUser) return;
        try {
            const token = localStorage.getItem('token');
            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/admin/approve-volunteer/${selectedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                alert("✅ User verified successfully!");
                setShowVerifyModal(false);
                loadUsers();
            } else {
                setErrorMessage(data.message || "Failed to verify user.");
                setShowErrorModal(true);
            }
        } catch (error) {
            setErrorMessage("Error verifying user.");
            setShowErrorModal(true);
        }
    };

    // ✅ Fixed Save with Duplicate Error Handling
    const handleSaveEdit = async () => {
        if (!selectedUser) return;
        try {
            const token = localStorage.getItem('token');
            const apiUrl = getApiUrl();
            const updateData = {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                email: editForm.email,
                phoneNumber: editForm.phoneNumber,
                role: 'volunteer',
                isApproved: editForm.isApproved
            };
            if (editForm.password && editForm.password.trim() !== '') {
                updateData.password = editForm.password;
            }

            const response = await fetch(`${apiUrl}/admin/update-user/${selectedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updateData)
            });
            const data = await response.json();

            if (data.success) {
                alert("✅ User updated successfully!");
                setShowEditModal(false);
                loadUsers();
            } else {
                // ✅ Show the error in the Modal instead of alert()
                setErrorMessage(data.message || "Failed to update user.");
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error("Error updating user:", error);
            // ✅ Handle the specific MongoDB duplicate key error gracefully
            if (error.message && error.message.includes("E11000 duplicate key error")) {
                setErrorMessage("This email is already in use by another account. Please use a different email.");
            } else {
                setErrorMessage(error.message || "Error updating user.");
            }
            setShowErrorModal(true);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            const token = localStorage.getItem('token');
            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/admin/delete-user/${selectedUser.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                alert("✅ User deleted successfully!");
                setShowDeleteModal(false);
                loadUsers();
            } else {
                setErrorMessage(data.message || "Failed to delete user.");
                setShowErrorModal(true);
            }
        } catch (error) {
            setErrorMessage("Error deleting user.");
            setShowErrorModal(true);
        }
    };

    // --- UI Helpers ---
    const getRoleColor = (role) => {
        switch (role) {
            case 'VOLUNTEER': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'RESCUER': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'CIVILIAN': return 'bg-pink-100 text-pink-700 border-pink-200';
            case 'ADMIN': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusColor = (status, isApproved) => {
        if (status === 'REJECTED') return 'bg-red-100 text-red-700 border-red-200';
        if (status === 'PENDING' || !isApproved) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    const getStatusDisplay = (status, isApproved) => {
        if (status === 'REJECTED') return 'REJECTED';
        if (status === 'PENDING' || !isApproved) return 'PENDING';
        return 'ACTIVE';
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f6b75]"></div>
                    <div className="text-gray-500 ml-4">Loading users...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFF]">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-[#262D31] flex items-center gap-2">
                        <Icon icon="mdi:account-group" className="w-7 h-7 text-[#262D31]" />
                        User Account
                    </h1>
                    <p className="text-gray-500 text-sm">Manage all registered volunteers</p>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider w-12">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Contact</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Last Login</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getRoleColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{user.contact}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(user.status, user.isApproved)}`}>
                                                    {getStatusDisplay(user.status, user.isApproved)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEditClick(user)} className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600 transition" title="Edit User">
                                                        <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                                                    </button>
                                                    {!user.isApproved && user.status !== 'REJECTED' && (
                                                        <button onClick={() => handleVerifyClick(user)} className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600 transition" title="Verify User">
                                                            <Icon icon="mdi:check" className="w-4 h-4 text-green-600" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeleteClick(user)} className="p-1.5 bg-white border border-gray-300 rounded hover:bg-red-50 text-gray-600 transition" title="Delete User">
                                                        <Icon icon="mdi:trash-can-outline" className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* ✅ EDIT USER MODAL */}
            {showEditModal && selectedUser && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-[#EAE9F9]">
                            <h2 className="text-lg font-semibold text-[#262D31]">Edit User - {selectedUser.name}</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 transition">
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                    <input type="text" value={editForm.phoneNumber} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select value="volunteer" disabled={true} className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-100 cursor-not-allowed focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                        <option value="volunteer">Volunteer</option>
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-1">Roles are fixed to Volunteer.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select value={editForm.isApproved ? 'active' : 'inactive'} onChange={(e) => setEditForm({ ...editForm, isApproved: e.target.value === 'active' })} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input type="password" placeholder="Leave blank to keep current password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setShowEditModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleSaveEdit} className="px-6 py-2 bg-[#007bff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition">Save Account</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ============================================================ */}
            {/* ✅ ERROR MODAL (Replaces the ugly alerts!) */}
            {showErrorModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b-4 border-red-500 flex justify-between items-start bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
                                    <Icon icon="mdi:close-circle" className="w-5 h-5 text-red-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">Error</h2>
                            </div>
                            <button onClick={() => setShowErrorModal(false)} className="text-gray-500 hover:text-gray-700 transition mt-1">
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm">{errorMessage}</p>
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setShowErrorModal(false)} className="px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition">OK</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ============================================================ */}
            {/* ✅ DELETE USER MODAL */}
            {showDeleteModal && selectedUser && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b-4 border-red-500 flex justify-between items-start bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
                                    <Icon icon="mdi:close" className="w-5 h-5 text-red-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">Delete user {selectedUser.name}</h2>
                            </div>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-500 hover:text-gray-700 transition mt-1">
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm">Are you sure you want to delete user <strong>{selectedUser.name}</strong>? This action cannot be undone.</p>
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleDeleteUser} className="px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition">Delete</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ============================================================ */}
            {/* ✅ VERIFY USER MODAL */}
            {showVerifyModal && selectedUser && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b-4 border-blue-500 flex justify-between items-start bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                                    <Icon icon="mdi:check-circle" className="w-5 h-5 text-blue-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">Verify user {selectedUser.name}</h2>
                            </div>
                            <button onClick={() => setShowVerifyModal(false)} className="text-gray-500 hover:text-gray-700 transition mt-1">
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm">Are you sure you want to verify user <strong>{selectedUser.name}</strong>? This will activate their account and grant them full access.</p>
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setShowVerifyModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleVerifyUser} className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition">Verify</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </AdminLayout>
    );
}