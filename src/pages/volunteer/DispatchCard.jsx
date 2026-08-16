import React from "react";

const DispatchCard = React.memo(({
    dispatchAction,
    pendingIncident,
    selectedIncident,
    actionedIncidents,
    isLoading,
    handleCancelDispatch,
    handleConfirmAccept,
    handleConfirmDecline,
    setConfirmModalData,
    setShowConfirmModal
}) => {
    const isAccept = dispatchAction === 'accept';
    const isDecline = dispatchAction === 'decline';
    const title = isAccept ? 'Accept Dispatch Request' : 'Decline Dispatch Request';
    const confirmText = isAccept ? 'Yes, Accept' : 'Yes, Decline';
    const confirmColor = isAccept ? 'bg-[#2e7d32] hover:bg-[#1b5e20]' : 'bg-red-600 hover:bg-red-700';
    const questionText = isAccept ? 'Are you sure you want to accept this dispatch request?' : 'Are you sure you want to decline this dispatch request?';

    const incidentData = pendingIncident || selectedIncident || {};
    const incidentTitle = incidentData.title || incidentData.type || 'N/A';
    const incidentId = incidentData.id || incidentData._id || 'N/A';
    const incidentStatus = incidentData.status || 'N/A';
    const incidentPriority = incidentData.priority || 'N/A';
    const incidentLocation = incidentData.location || 'Unknown location';
    const incidentVictims = incidentData.victims || 0;
    const incidentDescription = incidentData.description || 'No description provided';
    const incidentCoordinates = incidentData.coordinates || null;

    const isAlreadyActioned = incidentId && actionedIncidents && actionedIncidents[incidentId];

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[150] p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleCancelDispatch}></div>
            <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[95vw] p-6 flex flex-col relative z-[160] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-7 h-7 transition-all duration-300 ${isAccept ? 'text-[#2e7d32]' : 'text-red-600'}`}>
                        {isAccept ? (
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                        ) : (
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                        )}
                    </svg>
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h2>
                    <button onClick={handleCancelDispatch} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors duration-200 text-2xl leading-none hover:scale-110 transform">×</button>
                </div>

                {isAccept && <p className="text-[14px] text-gray-600 leading-relaxed mb-5">Accepting this assignment means you will be officially dispatched as the responding volunteer. Your status will update to En Route immediately.</p>}
                {isDecline && <p className="text-[14px] text-gray-600 leading-relaxed mb-5">Declining this assignment means the dispatch request will be passed to the next available volunteer.</p>}

                <div className="border border-gray-200 rounded-md overflow-hidden mb-6">
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-200">
                            <tr className="bg-[#f4f5fa]">
                                <td className="px-4 py-3 text-gray-500 font-medium w-[30%] align-top">Incident</td>
                                <td className="px-4 py-3 text-gray-800 font-medium align-top">{incidentTitle}</td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-4 py-3 text-gray-500 font-medium align-top">Details</td>
                                <td className="px-4 py-3 text-gray-800 align-top space-y-1">
                                    <p className="font-medium">ID: <span className="font-normal text-gray-600">{incidentId}</span></p>
                                    <p className="font-medium">Status: <span className="font-normal text-gray-600 capitalize">{incidentStatus}</span></p>
                                    <p className="font-medium">Priority: <span className="font-normal text-gray-600">{incidentPriority}</span></p>
                                </td>
                            </tr>
                            <tr className="bg-[#f4f5fa]">
                                <td className="px-4 py-3 text-gray-500 font-medium align-top">Location</td>
                                <td className="px-4 py-3 text-gray-800 align-top">
                                    <div className="font-medium mb-1">{incidentLocation}</div>
                                    {incidentCoordinates && (
                                        <div className="text-xs text-gray-500 font-normal">
                                            Lat: {incidentCoordinates[0]?.toFixed(6)}, Lng: {incidentCoordinates[1]?.toFixed(6)}
                                        </div>
                                    )}
                                </td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-4 py-3 text-gray-500 font-medium align-top">Impact</td>
                                <td className="px-4 py-3 text-gray-800 font-medium align-top">
                                    <div>{incidentVictims} victim(s) reported</div>
                                    {incidentDescription && incidentDescription !== 'No description provided' && (
                                        <div className="text-xs font-normal text-gray-500 mt-2 pt-2 border-t border-gray-100">
                                            {incidentDescription}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col items-end gap-4 mt-auto">
                    <p className="text-[15px] text-gray-700">{questionText}</p>
                    <div className="flex gap-3">
                        <button onClick={handleCancelDispatch} className="px-6 py-2 bg-white border border-gray-300 rounded text-gray-600 font-medium text-sm hover:bg-gray-50 transition-all duration-200 shadow-sm">Cancel</button>
                        <button
                            onClick={() => {
                                if (isAlreadyActioned) {
                                    handleCancelDispatch();
                                    setConfirmModalData({
                                        title: '⚠️ Already Actioned',
                                        message: `This incident has already been ${actionedIncidents[incidentId].action}.`,
                                        confirmText: 'OK',
                                        confirmColor: 'bg-yellow-500 hover:bg-yellow-600',
                                        icon: 'warning',
                                        onConfirm: () => { }
                                    });
                                    setShowConfirmModal(true);
                                    return;
                                }

                                if (isAccept) {
                                    // 1. Call the parent's accept function
                                    handleConfirmAccept();

                                    // 🔥 2. INSTANTLY BROADCAST TO TRACK PAGE (BroadcastChannel)
                                    try {
                                        const channel = new BroadcastChannel('incident_updates');
                                        channel.postMessage({
                                            type: 'FORCE_STATUS_UPDATE',
                                            incidentId: incidentId,
                                            newStatus: 'Dispatched'
                                        });
                                        channel.close();
                                    } catch (error) {
                                        console.log('Broadcast not supported');
                                    }

                                    // 🔥 3. BACKUP: Force trigger via LocalStorage (Works even if BroadcastChannel fails)
                                    try {
                                        localStorage.setItem('force_track_refresh', Date.now().toString());
                                    } catch (error) {
                                        console.log('LocalStorage not available');
                                    }

                                } else if (isDecline) {
                                    handleConfirmDecline();
                                }
                            }}
                            disabled={isLoading || isAlreadyActioned}
                            className={`px-8 py-2 border rounded text-white font-medium text-sm transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${confirmColor}`}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.dispatchAction === nextProps.dispatchAction &&
        prevProps.pendingIncident?.id === nextProps.pendingIncident?.id &&
        prevProps.selectedIncident?.id === nextProps.selectedIncident?.id &&
        prevProps.isLoading === nextProps.isLoading &&
        JSON.stringify(prevProps.actionedIncidents) === JSON.stringify(nextProps.actionedIncidents)
    );
});

export default DispatchCard;