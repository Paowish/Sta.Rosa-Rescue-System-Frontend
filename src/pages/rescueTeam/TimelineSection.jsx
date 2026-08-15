// src/pages/rescueTeam/TimelineSection.jsx
export default function TimelineSection({ timeline }) {
    if (!timeline || timeline.length === 0) return null;

    return (
        <div className="border-t border-[#DFDFF0]">
            <div className="bg-[#EBEDFA] px-3 py-2 font-medium text-[#656363] text-sm">Activity Timeline</div>
            <div className="p-3">
                <div className="flex gap-2 flex-wrap">
                    {timeline.map((item, i) => (
                        <span key={i} className="text-xs bg-[#F5F4FF] px-2 py-1 rounded border border-[#DFDFF0]">
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}