import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";

export default function SuccessModal({ isOpen, data, onClose }) {
    if (!isOpen || !data) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto mx-4 animate-in zoom-in-95 duration-200">
                <div className={`p-6 text-center sticky top-0 z-10 ${data.isError
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : 'bg-gradient-to-r from-green-500 to-green-600'
                    }`}>
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Icon
                            icon={data.isError ? 'mdi:alert-circle' : 'material-symbols:check-circle'}
                            className="w-12 h-12 text-white"
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                        {data.isError ? 'Dispatch Failed' : 'Dispatch Successful!'}
                    </h2>
                    <p className={`text-sm mt-1 ${data.isError ? 'text-red-100' : 'text-green-100'}`}>
                        {data.isError ? 'Unable to dispatch volunteers' : 'Volunteers have been notified'}
                    </p>
                </div>

                <div className="p-6">
                    {data.isError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-red-700">{data.message}</p>
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">INCIDENT</span>
                            <span className="text-xs font-medium text-gray-500">#{data.incidentId}</span>
                        </div>
                        <p className="font-semibold text-gray-800">{data.title}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Icon icon="material-symbols:location-on" className="w-4 h-4" />
                            {data.address}
                        </p>
                    </div>

                    {!data.isError && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    <Icon icon="material-symbols:groups" className="w-4 h-4 inline mr-1" />
                                    {data.volunteersDispatched} Volunteer(s) Dispatched
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {data.volunteers?.map((v, index) => (
                                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 flex items-center gap-1.5 hover:bg-blue-100">
                                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                                            {v.firstName?.charAt(0)}{v.lastName?.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{v.firstName} {v.lastName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!data.isError && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-700">Incident status updated to <strong>Dispatched</strong></span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className={`flex-1 w-full py-2.5 rounded-lg font-semibold transition-colors duration-200 ${data.isError
                            ? 'bg-gray-600 text-white hover:bg-gray-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        {data.isError ? 'Close' : 'Done'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}