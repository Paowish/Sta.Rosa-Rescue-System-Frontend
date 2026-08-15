// src/components/DispatchRequestModal.jsx
import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

export default function DispatchRequestModal({ isOpen, onClose, onAccept, onDecline, incident, isLoading }) {
    const [countdown, setCountdown] = useState(30);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);

    useEffect(() => {
        if (isOpen && incident) {
            setCountdown(30);
            setIsAccepting(false);
            setIsDeclining(false);

            // Auto-decline after 30 seconds
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        // Auto-decline
                        onDecline(incident);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isOpen, incident, onDecline]);

    if (!isOpen || !incident) return null;

    const handleAccept = () => {
        setIsAccepting(true);
        onAccept(incident);
    };

    const handleDecline = () => {
        setIsDeclining(true);
        onDecline(incident);
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'critical': return 'bg-red-600 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-yellow-500 text-white';
            default: return 'bg-blue-500 text-white';
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'critical': return 'mdi:alert-circle';
            case 'high': return 'mdi:alert';
            case 'medium': return 'mdi:information';
            default: return 'mdi:bell';
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-400">
                {/* Header with pulse animation */}
                <div className="relative bg-gradient-to-r from-red-600 to-red-700 p-6 text-center">
                    <div className="absolute top-4 right-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white/80 text-xs font-medium">LIVE</span>
                        </div>
                    </div>
                    <div className="flex justify-center mb-3">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                            <Icon icon="mdi:bell-ring" className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white">🚨 Incoming Dispatch!</h2>
                    <p className="text-red-100 text-sm mt-1">A new incident requires your immediate response</p>

                    {/* Countdown timer */}
                    <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
                        <Icon icon="mdi:clock-outline" className="w-4 h-4 text-white" />
                        <span className="text-white font-semibold text-sm">
                            Respond within {countdown}s
                        </span>
                    </div>
                </div>

                {/* Incident Details */}
                <div className="p-6">
                    {/* Incident Title & Priority */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{incident.title || incident.type || 'Untitled Incident'}</h3>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">ID: {incident.id || incident._id}</p>
                        </div>
                        <span className={`text-[10px] px-3 py-1 rounded-full font-semibold flex items-center gap-1 ${getPriorityColor(incident.priority)}`}>
                            <Icon icon={getPriorityIcon(incident.priority)} className="w-3 h-3" />
                            {incident.priority || 'Medium'}
                        </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2 mb-3 bg-gray-50 rounded-lg p-3">
                        <Icon icon="mdi:map-marker" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-700 font-medium">{incident.location || 'Unknown location'}</p>
                            <p className="text-xs text-gray-400">Click Accept to get directions</p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Type</p>
                            <p className="text-sm font-semibold text-gray-700">{incident.type || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Status</p>
                            <p className="text-sm font-semibold text-gray-700 capitalize">{incident.status || 'Pending'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Victims</p>
                            <p className="text-sm font-semibold text-gray-700">{incident.victims || 0} person(s)</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Reported By</p>
                            <p className="text-sm font-semibold text-gray-700 truncate">{incident.reporter || 'Anonymous'}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {incident.description && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <div className="flex items-start gap-2">
                                <Icon icon="mdi:message-text" className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-600">{incident.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleDecline}
                            disabled={isDeclining || isAccepting || isLoading}
                            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeclining ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Declining...
                                </>
                            ) : (
                                <>
                                    <Icon icon="mdi:close" className="w-5 h-5" />
                                    Decline
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={isAccepting || isDeclining || isLoading}
                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200"
                        >
                            {isAccepting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    <Icon icon="mdi:check" className="w-5 h-5" />
                                    Accept & Respond
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center mt-3">
                        ⚡ This request will auto-decline in {countdown} seconds
                    </p>
                </div>
            </div>
        </div>
    );
}