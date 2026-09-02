import { createPortal } from "react-dom";

/**
 * Loading Modal Component
 * Displays a loading spinner overlay with progress animation
 */
export default function LoadingModal({ isOpen }) {
    // Don't render if modal is closed
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-[380px] max-w-[90vw] p-8 text-center">
                <div className="flex flex-col items-center">
                    {/* Spinner */}
                    <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-800">Dispatching...</h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mt-1">Please wait while we dispatch volunteers</p>

                    {/* Progress Bar */}
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-1.5 rounded-full animate-progress"></div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}