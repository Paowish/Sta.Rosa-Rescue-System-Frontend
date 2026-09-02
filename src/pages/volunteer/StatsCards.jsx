import React from "react";

/**
 * Stats Cards Component
 * Displays incident statistics in a grid of cards
 */
const StatsCards = ({ stats }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 flex-shrink-0">
        {/* All Incidents */}
        <div className="bg-white rounded-lg p-2 shadow-sm">
            <p className="text-lg font-bold text-gray-800">{stats.allIncidents}</p>
            <p className="text-[9px] text-gray-500">All</p>
        </div>

        {/* Active Incidents */}
        <div className="bg-white rounded-lg p-2 shadow-sm">
            <p className="text-lg font-bold text-red-600">{stats.active}</p>
            <p className="text-[9px] text-gray-500">Active</p>
        </div>

        {/* Pending Incidents */}
        <div className="bg-white rounded-lg p-2 shadow-sm">
            <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-[9px] text-gray-500">Pending</p>
        </div>

        {/* Solved Incidents */}
        <div className="bg-white rounded-lg p-2 shadow-sm">
            <p className="text-lg font-bold text-green-600">{stats.solved}</p>
            <p className="text-[9px] text-gray-500">Solved</p>
        </div>
    </div>
);

export default StatsCards;