// src/pages/rescueTeam/LocationSection.jsx
import { Icon } from "@iconify/react";

export default function LocationSection({ address, coordinates }) {
    return (
        <div className="border-t border-[#DFDFF0]">
            <div className="bg-[#EBEDFA] px-3 py-2 font-medium text-[#656363] text-sm">Location</div>
            <div className="px-3 py-3 space-y-2">
                <div className="flex items-start gap-2">
                    <Icon icon="ic:outline-location-on" width="16" className="text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm flex-1">{address}</span>
                </div>
                <div className="flex items-start gap-2">
                    <Icon icon="material-symbols:my-location-outline" width="14" className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400 text-xs flex-1">{coordinates}</span>
                </div>
            </div>
        </div>
    );
}