import React, { useState } from "react";
import { Icon } from "@iconify/react";

const IncidentDetailModal = React.memo(({
    incident,
    isOpen,
    isClosing,
    onClose,
    onAccept,
    onDecline,
    isOnDuty,
    isLoading,
    getPriorityColor,
    actionedIncidents,
    isNotReadyMode,
    onResolve
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    if (!isOpen && !isClosing) return null;

    const incidentTitle = incident?.title || incident?.type || 'N/A';
    const incidentId = incident?.id || incident?._id || 'N/A';
    const incidentStatus = incident?.status || 'N/A';
    const incidentPriority = incident?.priority || 'N/A';
    const incidentLocation = incident?.location || 'Unknown location';
    const incidentVictims = incident?.victims || 0;
    const incidentDescription = incident?.description || 'No description provided';
    const incidentImage = incident?.image || null;

    const isActioned = actionedIncidents[incident?.id || incident?._id];
    const isDisabled = isLoading ||
        incidentStatus === 'accepted' ||
        incidentStatus === 'resolved' ||
        !isOnDuty ||
        isActioned;

    const handleAcceptClick = () => {
        if (isActioned) return;
        onAccept(incident);
        onClose();
    };

    const handleDeclineClick = () => {
        if (isActioned) return;
        onDecline(incident);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center lg:hidden">
            <div
                className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                style={{
                    position: 'fixed',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(2px)'
                }}
                onClick={onClose}
            ></div>

            <div className={`relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden ${isClosing ? 'modal-slide-down' : 'modal-slide-up'}`}>
                <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b flex items-center justify-between rounded-t-2xl">
                    <h2 className="font-semibold text-[#262D31] text-sm">Incident Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">✕</button>
                </div>

                <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(85vh - 180px)' }}>
                    <div className="bg-[#F5F4FF] p-3 rounded-lg modal-content-fade-in">
                        <h1 className="font-bold text-base text-[#262D31]">{incidentTitle}</h1>
                        <div className="flex flex-wrap gap-1 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded ${getPriorityColor(incidentPriority)}`}>{incidentPriority}</span>
                            {incident?.badge && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${incident.badgeColor}`}>{incident.badge}</span>}
                        </div>
                        <p className="text-[10px] text-gray-500">ID: {incidentId}</p>
                    </div>

                    {incidentImage && (
                        <>
                            <div className="border-t border-[#DFDFF0] pt-4 modal-content-fade-in">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 font-semibold text-[#0F5C73] text-xs rounded-t-xl border border-b-0 border-[#DFDFF0]">
                                    📸 Incident Photo
                                </div>
                                <div className="px-4 py-3 border border-t-0 border-[#DFDFF0] rounded-b-xl bg-white">
                                    <img
                                        src={incidentImage}
                                        alt={incidentTitle}
                                        className="w-full rounded-lg object-cover max-h-[200px] border border-[#DFDFF0] shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                                        onClick={() => setIsFullscreen(true)}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            </div>

                            {/* Fullscreen Modal */}
                            {isFullscreen && (
                                <div
                                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                                    onClick={() => setIsFullscreen(false)}
                                >
                                    <div className="relative max-w-[90vw] max-h-[90vh]">
                                        <button
                                            className="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white hover:text-gray-200 flex items-center justify-center transition-all duration-200 z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsFullscreen(false);
                                            }}
                                            aria-label="Close fullscreen"
                                        >
                                            <Icon icon="material-symbols:close" className="w-6 h-6" />
                                        </button>
                                        <img
                                            src={incidentImage}
                                            alt={incidentTitle}
                                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="border-t border-[#DFDFF0] pt-3 modal-content-fade-in" style={{ animationDelay: '0.05s' }}>
                        <div className="bg-[#EBEDFA] px-3 py-1 font-medium text-[#656363] text-xs rounded-t-lg">📍 Location</div>
                        <div className="px-3 py-2 border border-t-0 border-[#DFDFF0] rounded-b-lg">
                            <p className="text-sm text-gray-700">{incidentLocation}</p>
                        </div>
                    </div>

                    <div className="border-t border-[#DFDFF0] pt-3 modal-content-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="bg-[#EBEDFA] px-3 py-1 font-medium text-[#656363] text-xs rounded-t-lg">👤 Reporter</div>
                        <div className="px-3 py-2 border border-t-0 border-[#DFDFF0] rounded-b-lg">
                            <p className="text-sm text-gray-700">{incident?.reporter || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">{incident?.reporterPhone || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="border-t border-[#DFDFF0] pt-3 modal-content-fade-in" style={{ animationDelay: '0.15s' }}>
                        <div className="bg-[#EBEDFA] px-3 py-1 font-medium text-[#656363] text-xs rounded-t-lg">📝 Description</div>
                        <div className="px-3 py-2 border border-t-0 border-[#DFDFF0] rounded-b-lg">
                            <p className="text-sm text-gray-600">{incidentDescription}</p>
                        </div>
                    </div>

                    {incidentVictims > 0 && (
                        <div className="border-t border-[#DFDFF0] pt-3 modal-content-fade-in" style={{ animationDelay: '0.2s' }}>
                            <div className="bg-[#EBEDFA] px-3 py-1 font-medium text-[#656363] text-xs rounded-t-lg">👥 Victims</div>
                            <div className="px-3 py-2 border border-t-0 border-[#DFDFF0] rounded-b-lg">
                                <p className="text-sm text-gray-700">{incidentVictims} person(s) affected</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white border-t p-4 space-y-2 rounded-b-2xl modal-content-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex gap-2">
                        {/* ✅ Accept Button - Always visible */}
                        <button
                            onClick={handleAcceptClick}
                            disabled={isDisabled}
                            className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all duration-200 btn-hover btn-press ${isDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : <><Icon icon="material-symbols:check" className="w-3 h-3" /> Accept</>}
                        </button>

                        {/* ✅ "Resolve?" button - ONLY appears when isNotReadyMode is true */}
                        {isNotReadyMode && (
                            <button
                                onClick={onResolve}
                                disabled={isLoading}
                                className="flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all duration-200 btn-hover btn-press bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : <><Icon icon="material-symbols:flag" className="w-3 h-3" /> Resolve?</>}
                            </button>
                        )}

                        {/* ✅ Decline Button - Always visible */}
                        <button
                            onClick={handleDeclineClick}
                            disabled={isDisabled}
                            className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all duration-200 btn-hover btn-press ${isDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : <><Icon icon="material-symbols:close" className="w-3 h-3" /> Decline</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.incident?.id === nextProps.incident?.id &&
        prevProps.isOpen === nextProps.isOpen &&
        prevProps.isClosing === nextProps.isClosing &&
        prevProps.isOnDuty === nextProps.isOnDuty &&
        prevProps.isLoading === nextProps.isLoading &&
        prevProps.isNotReadyMode === nextProps.isNotReadyMode &&
        JSON.stringify(prevProps.actionedIncidents) === JSON.stringify(nextProps.actionedIncidents)
    );
});

export default IncidentDetailModal;