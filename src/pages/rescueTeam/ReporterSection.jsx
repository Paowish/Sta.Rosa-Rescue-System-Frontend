// src/pages/rescueTeam/ReporterSection.jsx
export default function ReporterSection({ name, contact }) {
    return (
        <div className="border-t border-[#DFDFF0]">
            <div className="bg-[#EBEDFA] px-3 py-2 font-medium text-[#656363] text-sm">Reporter</div>
            <div className="divide-y divide-[#DFDFF0]">
                <div className="flex px-3 py-2">
                    <span className="text-gray-500 text-sm w-20 flex-shrink-0">Name</span>
                    <span className="font-semibold text-[#262D31] text-sm flex-1">{name}</span>
                </div>
                <div className="flex px-3 py-2">
                    <span className="text-gray-500 text-sm w-20 flex-shrink-0">Contact</span>
                    <span className="font-semibold text-[#262D31] text-sm flex-1">{contact}</span>
                </div>
            </div>
        </div>
    );
}