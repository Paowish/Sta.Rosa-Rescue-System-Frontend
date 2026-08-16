import React from "react";
import { Icon } from "@iconify/react";

const ArrivalModal = ({ isOpen, onClose, onSolve, incident }) => {
    if (!isOpen || !incident) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-[300] p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-xl shadow-2xl w-[450px] max-w-[95vw] p-6 flex flex-col relative z-[310] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                        <Icon icon="mdi:flag-checkered" className="w-10 h-10 text-green-600" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">📍 You've Arrived!</h3>
                <p className="text-gray-600 text-center text-sm mb-2">You have arrived at the incident location.</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <p className="font-semibold text-gray-800">{incident.title || 'Incident'}</p>
                    <p className="text-sm text-gray-600">{incident.location || 'Unknown location'}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {incident.id || incident._id}</p>
                </div>
                <p className="text-sm text-gray-500 text-center mb-4">Are you ready to resolve this incident?</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                        I'm Not Ready
                    </button>
                    <button onClick={onSolve} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-200">
                        ✅ Solve Incident
                    </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">Click "I'm Not Ready" to keep the Accept/Decline buttons visible.</p>
            </div>
        </div>
    );
};

export default ArrivalModal;