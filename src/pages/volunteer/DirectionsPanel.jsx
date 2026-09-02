import React from "react";
import { Icon } from "@iconify/react";

/**
 * Directions Panel Component
 * Displays real-time navigation information when en route to an incident
 */
const DirectionsPanel = ({
    isEnRoute,
    selectedIncident,
    distanceToIncident,
    timeToIncident,
    stopLocationTracking
}) => {
    // Don't render if not en route or no incident selected
    if (!isEnRoute || !selectedIncident) return null;

    // Format distance and time
    const distanceStr = distanceToIncident > 0 ? `${(distanceToIncident * 1000).toFixed(0)}m` : '--';
    const timeStr = timeToIncident > 0 ? `${timeToIncident} min` : '--';

    return (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 border border-gray-200 min-w-[280px]">
            <div className="flex items-center justify-between">
                {/* Left Section - Incident Info */}
                <div className="flex items-center gap-3">
                    {/* Incident Indicator */}
                    <div className="flex items-center gap-1.5">
                        <Icon icon="mdi:map-marker" className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-medium text-gray-700">Incident</span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-200"></div>

                    {/* Distance and ETA */}
                    <div className="flex items-center gap-3">
                        {/* Distance */}
                        <div className="text-xs">
                            <span className="text-gray-500">Distance</span>
                            <span className="ml-1 font-bold text-gray-800">{distanceStr}</span>
                        </div>

                        {/* ETA */}
                        <div className="text-xs">
                            <span className="text-gray-500">ETA</span>
                            <span className="ml-1 font-bold text-blue-600">{timeStr}</span>
                        </div>
                    </div>
                </div>

                {/* Stop Button */}
                <button
                    onClick={stopLocationTracking}
                    className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                    Stop
                </button>
            </div>
        </div>
    );
};

export default DirectionsPanel;