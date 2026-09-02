// src/pages/rescueTeam/DescriptionSection.jsx
import { Icon } from "@iconify/react";

/**
 * Description Section Component
 * Displays incident description and optional image
 */
export default function DescriptionSection({ description, imageSrc, hasImage, onImageError }) {
    return (
        <div className="border-t border-[#DFDFF0]">
            {/* Section Header */}
            <div className="bg-[#EBEDFA] px-3 py-2 font-medium text-[#656363] text-sm">Description</div>

            {/* Description Text */}
            <p className="p-3 text-gray-600 text-sm leading-relaxed">
                {description || "No description provided"}
            </p>

            {/* Image Display */}
            <div className="px-3 pb-3">
                {hasImage ? (
                    <img
                        src={imageSrc}
                        alt="Incident scene"
                        className="rounded w-full h-40 object-cover border border-[#DFDFF0]"
                        onError={onImageError}
                    />
                ) : (
                    <div className="rounded w-full h-40 bg-gray-100 border border-[#DFDFF0] flex flex-col items-center justify-center">
                        <Icon icon="mdi:image-off" width="32" className="text-gray-400" />
                        <p className="text-xs text-gray-400 mt-2">No photo available</p>
                    </div>
                )}
            </div>
        </div>
    );
}