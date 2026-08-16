import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";

export default function PoliceModal({ isOpen, onClose, onRefer, address, description, incidentId }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto mx-4 border border-gray-200 border-t-4 border-[#1A237E]">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">Refer to Police Department?</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon icon="material-symbols:close" width={24} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-700 mb-4">Please check the message before sending.</p>
                    <div className="bg-[#F5F6FA] rounded-md p-5 mb-6">
                        <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Incident Referral</h3>
                        <div className="text-sm text-gray-800 space-y-1.5">
                            <p>A <span className="font-bold">Vehicular Accident</span> has been reported at {address}.</p>
                            <p><span className="font-bold">Incident Type:</span> Vehicular Accident</p>
                            <p><span className="font-bold">Location:</span> {address}</p>
                            <p><span className="font-bold">Date & Time:</span> {new Date().toLocaleString()}</p>
                            <p><span className="font-bold">Details:</span> {description || "Police assistance is requested."}</p>
                            <p className="pt-2">This incident has been referred to your Police Station for immediate response.</p>
                            <p><span className="font-bold">Reference No.:</span> {incidentId}</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 shadow-sm">
                            Cancel
                        </button>
                        <button onClick={onRefer} className="px-8 py-2 bg-[#1A237E] rounded-md text-white font-medium hover:bg-[#151b63] shadow-sm">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}