import { createPortal } from "react-dom";

export default function LoadingModal({ isOpen }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-[380px] max-w-[90vw] p-8 text-center">
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h3 className="text-lg font-bold text-gray-800">Dispatching...</h3>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we dispatch volunteers</p>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-1.5 rounded-full animate-progress"></div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}