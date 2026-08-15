import React from "react";
import { Icon } from "@iconify/react";

const LogoutModal = ({ handleCancelLogout, handleConfirmLogout }) => (
    <div className="fixed inset-0 flex items-center justify-center z-[150] bg-black/40">
        <div className="bg-white rounded-lg shadow-2xl w-[400px] max-w-[90vw] p-6 flex flex-col">
            <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <Icon icon="material-symbols:logout" className="w-8 h-8 text-red-500" />
                </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">Logout</h3>
            <p className="text-gray-600 text-center text-sm mb-6">Are you sure you want to logout from your account?</p>
            <div className="flex gap-3">
                <button onClick={handleCancelLogout} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleConfirmLogout} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition">Logout</button>
            </div>
        </div>
    </div>
);

export default LogoutModal;