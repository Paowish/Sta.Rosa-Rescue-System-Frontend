// src/pages/rescueTeam/ReporterSection.jsx

/**
 * Reporter Section Component
 * Displays reporter name and contact information
 */
export default function ReporterSection({ name, contact }) {
    return (
        <div className="border-t border-[#DFDFF0]">
            {/* Section Header */}
            <div className="bg-[#EBEDFA] px-3 py-2 font-medium text-[#656363] text-sm">Reporter</div>

            {/* Reporter Details */}
            <div className="divide-y divide-[#DFDFF0]">
                {/* Name Row */}
                <div className="flex px-3 py-2">
                    <span className="text-gray-500 text-sm w-20 flex-shrink-0">Name</span>
                    <span className="font-semibold text-[#262D31] text-sm flex-1">{name}</span>
                </div>

                {/* Contact Row */}
                <div className="flex px-3 py-2">
                    <span className="text-gray-500 text-sm w-20 flex-shrink-0">Contact</span>
                    <span className="font-semibold text-[#262D31] text-sm flex-1">{contact}</span>
                </div>
            </div>
        </div>
    );
}