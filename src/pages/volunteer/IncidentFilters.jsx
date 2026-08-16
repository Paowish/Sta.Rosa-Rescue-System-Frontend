import React from "react";

const IncidentFilters = ({ filterType, setFilterType, incidents }) => (
    <div className="flex gap-1 mb-2">
        <button onClick={() => setFilterType('all')} className={`px-2 py-1 rounded-lg text-[10px] font-medium transition ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
        <button onClick={() => setFilterType('requests')} className={`px-2 py-1 rounded-lg text-[10px] font-medium transition ${filterType === 'requests' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            Requests
            <span className="ml-0.5 px-1 text-[8px] bg-white/20 rounded-full">
                {incidents.filter(i => i.status === 'dispatched' || i.badge === 'Dispatch').length}
            </span>
        </button>
    </div>
);

export default IncidentFilters;