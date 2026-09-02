import { Icon } from "@iconify/react";

/**
 * Mission Component
 * Displays the organization's mission statement with supporting points
 * and a grid of incident type icons
 */
export default function Mission() {
    // Incident type grid data
    const incidentTypes = [
        { icon: "mdi:fire", label: "FIRE", color: "bg-red-50 text-red-500 border-red-200" },
        { icon: "mdi:police-badge", label: "CRIME", color: "bg-blue-50 text-blue-500 border-blue-200" },
        { icon: "mdi:sign-caution", label: "BLOCKAGE", color: "bg-yellow-50 text-yellow-500 border-yellow-200" },
        { icon: "mdi:magnify", label: "SEARCH", color: "bg-gray-50 text-gray-500 border-gray-200" },
        { icon: "mdi:ambulance", label: "RESCUE", color: "bg-red-50 text-red-500 border-red-200" },
        { icon: "mdi:exit-run", label: "EVACUATE", color: "bg-orange-50 text-orange-500 border-orange-200" },
        { icon: "mdi:water", label: "FLOOD", color: "bg-blue-50 text-blue-500 border-blue-200" },
        { icon: "mdi:landslide", label: "LANDSLIDE", color: "bg-gray-50 text-gray-500 border-gray-200" },
        { icon: "mdi:medical-bag", label: "MEDICAL", color: "bg-green-50 text-green-500 border-green-200" },
    ];

    return (
        <div className="min-h-screen bg-[#F5F7FA] py-20 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Column: Mission Content */}
                <div>
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-1 bg-[#E63946] rounded-full"></div>
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Our Mission</span>
                    </div>

                    {/* Main Headline */}
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                        Seconds save lives. We <br />
                        <span className="text-[#0F5C73]">make every one count.</span>
                    </h2>

                    <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-lg">
                        Fast, accurate, community-driven emergency response at your fingertips.
                    </p>

                    {/* Mission Points */}
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <span className="text-xl font-bold text-[#E63946] mt-1">1</span>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">Rapid First Response</h4>
                                <p className="text-gray-600 text-sm">
                                    Report medical, environmental, or public safety emergencies in seconds. Capture photos, attach details, and notify dispatchers immediately.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <span className="text-xl font-bold text-[#E63946] mt-1">2</span>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">Pinpoint Geolocation</h4>
                                <p className="text-gray-600 text-sm">
                                    No need to describe your location during a crisis. Automated GPS tracking pinpoints your exact coordinates to ensure rescue teams reach you without delay.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <span className="text-xl font-bold text-[#E63946] mt-1">3</span>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">Mobilizing Community Volunteers</h4>
                                <p className="text-gray-600 text-sm">
                                    Trained community members can register, set their availability, and receive coordinated deployment alerts to support local response efforts when needed most.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Incident Type Grid */}
                <div className="grid grid-cols-3 gap-4">
                    {incidentTypes.map((item, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border ${item.color} aspect-square transition hover:shadow-md`}
                        >
                            <Icon icon={item.icon} className="w-8 h-8 mb-1" />
                            <span className="text-[10px] font-bold text-gray-700">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}