// src/pages/rescueTeam/TimelineSection.jsx

/**
 * Timeline Section Component
 * Displays a chronological list of activity events for an incident
 */
export default function TimelineSection({ timeline }) {
    // Don't render if no timeline data
    if (!timeline || timeline.length === 0) return null;

    return (
        <div className="border-t border-[#DFDFF0]">
            {/* Section Header */}
            <div className="bg-[#EBEDFA] px-3 py-2 font-medium text-[#656363] text-sm">Activity Timeline</div>

            {/* Timeline Items */}
            <div className="p-3">
                <div className="flex gap-2 flex-wrap">
                    {timeline.map((item, i) => (
                        <span
                            key={i}
                            className="text-xs bg-[#F5F4FF] px-2 py-1 rounded border border-[#DFDFF0]"
                        >
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}