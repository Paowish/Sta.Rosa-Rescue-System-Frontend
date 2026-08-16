import React from "react";
import { Icon } from "@iconify/react";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor = 'bg-green-500 hover:bg-green-600', icon }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-[250] p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] p-6 flex flex-col relative z-[260] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${icon === 'success' ? 'bg-green-100' :
                        icon === 'error' ? 'bg-red-100' :
                            'bg-blue-100'
                        }`}>
                        {icon === 'success' ? (
                            <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-500" />
                        ) : icon === 'error' ? (
                            <Icon icon="mdi:close-circle" className="w-8 h-8 text-red-500" />
                        ) : (
                            <Icon icon="mdi:information" className="w-8 h-8 text-blue-500" />
                        )}
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">{title}</h3>
                <p className="text-gray-600 text-center text-sm mb-6">{message}</p>
                <div className="flex gap-3">
                    {confirmText !== 'OK' && (
                        <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    )}
                    <button onClick={() => { if (onConfirm) onConfirm(); onClose(); }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition ${confirmColor}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;