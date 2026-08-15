// src/pages/rescueTeam/IncidentHeader.jsx
export default function IncidentHeader({ title, statusDisplay, statusColor, isResolved, incidentId }) {
    return (
        <div className="px-4 py-3 border-b bg-[#F5F4FF]">
            <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl font-bold text-[#262D31]">{title}</h1>
                <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>{statusDisplay}</span>
                {isResolved && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
                        Closed
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-500 mt-1">ID: {incidentId}</p>
        </div>
    );
}