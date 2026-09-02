import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

/**
 * File Report Component
 * Call-to-action section encouraging users to file incident reports
 */
export default function FileReport() {
    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-20">
            {/* Top White Section (Placeholder) */}
            <div className="flex-1 flex items-center justify-center text-gray-300">
                {/* This empty section matches the Figma layout before the red CTA */}
            </div>

            {/* Bottom Red CTA Section */}
            <div className="bg-[#E63946] py-24 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-white">
                    {/* Left Content */}
                    <div className="mb-8 md:mb-0 max-w-xl">
                        {/* Section Label */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-1 bg-white rounded-full"></div>
                            <span className="text-sm font-semibold uppercase tracking-wide">Civilian Incident Reporting</span>
                        </div>

                        {/* Headline */}
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                            Witnessed an emergency?<br />
                            Report it now.
                        </h2>

                        {/* Description */}
                        <p className="text-white/80 text-sm leading-relaxed max-w-md">
                            Our civilian portal lets anyone file an incident report directly from their phone or computer, with GPS location, photo upload, and instant reference tracking.
                        </p>
                    </div>

                    {/* CTA Button */}
                    <Link to="/login">
                        <button className="bg-white text-[#E63946] px-8 py-4 rounded shadow-lg font-bold text-lg flex items-center gap-3 hover:bg-gray-100 transition min-w-[200px] justify-center">
                            <Icon icon="mdi:alert" className="w-6 h-6" /> FILE A REPORT
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}