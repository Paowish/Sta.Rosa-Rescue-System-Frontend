import { Icon } from "@iconify/react";

export default function Services() {
    const services = [
        {
            icon: "mdi:heart-pulse",
            title: "Medical Response",
            description: "Advanced life support dispatch, field triage coordination, and hospital liaison for critical cases."
        },
        {
            icon: "mdi:fire",
            title: "Fire Incident",
            description: "Structural fire, vehicular fire, and wildfire response coordinated with BFP units."
        },
        {
            icon: "mdi:car-emergency",
            title: "Vehicle Incident",
            description: "Emergency extrication, traffic collision response, and site stabilization coordinated with local traffic management."
        },
        {
            icon: "mdi:road-variant",
            title: "Road Obstruction",
            description: "Rapid removal of fallen trees, debris, landslides, and stalled heavy vehicles disrupting primary roads."
        },
        {
            icon: "mdi:weather-flood",
            title: "Flood & Disaster",
            description: "Rapid deployment water rescue teams, evacuation coordination, and shelter management during typhoon events."
        },
        {
            icon: "mdi:shield-account",
            title: "Crime Incident",
            description: "Immediate dispatch and site containment coordinated with PNP (Philippine National Police) units."
        }
    ];

    return (
        <div className="min-h-screen bg-[#F5F7FA] py-20 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-1 bg-[#E63946] rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Services</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-[#0F5C73] mb-4">
                    Built for <span className="text-gray-900">every emergency.</span>
                </h2>
                <p className="text-gray-600 text-lg mb-12 max-w-xl">
                    From sudden illnesses to structure fires, we dispatch fast when seconds count.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0F5C73] mb-4">
                                <Icon icon={service.icon} className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[#0F5C73] mb-2">{service.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}