import React from "react";

/**
 * Incident Filters Component
 * Provides filter buttons for incident list with counts
 */
const IncidentFilters = ({ filterType, setFilterType, incidents }) => {
    // Count for "Requests" (Active incoming incidents)
    const requestCount = incidents
        ? incidents.filter(i =>
            i.status === 'Pending' ||
            i.status === 'Active' ||
            i.status === 'Dispatched' ||
            i.badge === 'Dispatch'
        ).length
        : 0;

    // Count for "All" (Total incidents)
    const totalCount = incidents ? incidents.length : 0;

    return (
        <div className="flex items-center justify-center w-full gap-2 mb-4 px-2">
            {/* All Button */}
            <button
                onClick={() => setFilterType('all')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition text-center flex items-center justify-center gap-1.5 ${filterType === 'all'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
            >
                All
                {totalCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-white/20 rounded-full font-bold">
                        {totalCount}
                    </span>
                )}
            </button>

            {/* Requests Button */}
            <button
                onClick={() => setFilterType('requests')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center justify-center gap-1.5 ${filterType === 'requests'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
            >
                Requests
                {requestCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-white/20 rounded-full font-bold">
                        {requestCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default IncidentFilters;