import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

/**
 * Off Duty Card Component
 * Confirmation dialog for going off duty
 */
const OffDutyCard = ({ handleCancelOffDuty, handleConfirmOffDuty }) => {
    // State to manage visibility
    const [isVisible, setIsVisible] = useState(true);

    // Check localStorage on mount to see if off duty status is saved
    useEffect(() => {
        const offDutyStatus = localStorage.getItem('offDutyStatus');
        if (offDutyStatus === 'true') {
            // If off duty, still show the card (or auto-confirm)
            setIsVisible(true);
        }
    }, []);

    /**
     * Handle confirm off duty
     */
    const handleConfirm = () => {
        localStorage.setItem('offDutyStatus', 'true');
        if (handleConfirmOffDuty) {
            handleConfirmOffDuty();
        }
        setIsVisible(false);
    };

    const handleCancel = () => {
        localStorage.removeItem('offDutyStatus');
        if (handleCancelOffDuty) {
            handleCancelOffDuty();
        }
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[150] bg-black/30">
            <div className="bg-white rounded-lg shadow-2xl w-96 max-w-[90vw] p-0 flex flex-col relative z-[160]">
                {/* Header */}
                <div className="p-4 border-b border-[#DFDFF0] flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Go Off Duty?</h3>
                    <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Icon */}
                    <div className="flex items-center justify-center mb-4">
                        <Icon icon="material-symbols:bedtime" className="w-16 h-16 text-yellow-500" />
                    </div>

                    {/* Message */}
                    <p className="text-center text-gray-700 mb-2">You are about to go off duty.</p>
                    <p className="text-center text-sm text-gray-500">
                        You will stop receiving new dispatch requests and notifications until you return to duty.
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[#DFDFF0] flex gap-3">
                    <button
                        onClick={handleCancel}
                        className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-2.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition"
                    >
                        Go Off Duty
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OffDutyCard;