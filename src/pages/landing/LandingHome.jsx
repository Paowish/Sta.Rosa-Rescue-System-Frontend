// src/pages/landing/LandingHome.jsx
import { Link } from 'react-router-dom';
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';



export default function LandingHome() {
    const [fakeIncidents, setFakeIncidents] = useState([
        { id: '02:72:96', type: 'Medical Emergency', loc: 'Brgy. San Mariano', time: 'Just Now', status: 'PENDING', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        { id: '02:72:96', type: 'Crime Incident', loc: 'Brgy. Gomez', time: '1 Minute Ago', status: 'On Scene', color: 'bg-green-100 text-green-700 border-green-200' },
        { id: '02:72:96', type: 'Landslide', loc: 'Brgy. San Pedro', time: '2 Minutes Ago', status: 'On Scene', color: 'bg-green-100 text-green-700 border-green-200' },
    ]);

    useEffect(() => {
        const types = ['Medical Emergency', 'Fire Incident', 'Traffic Accident', 'Crime Incident', 'Landslide', 'Flood Warning'];
        const barangays = ['Brgy. San Mariano', 'Brgy. Gomez', 'Brgy. San Pedro', 'Brgy. Rizal', 'Brgy. Del Pilar', 'Brgy. Maligaya'];
        const statuses = [
            { status: 'PENDING', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            { status: 'On Scene', color: 'bg-green-100 text-green-700 border-green-200' },
            { status: 'Dispatched', color: 'bg-blue-100 text-blue-700 border-blue-200' }
        ];

        const interval = setInterval(() => {
            // Generate random data
            const randomType = types[Math.floor(Math.random() * types.length)];
            const randomBrgy = barangays[Math.floor(Math.random() * barangays.length)];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            const randomId = `02:${Math.floor(Math.random() * 59) + 10}:${Math.floor(Math.random() * 59) + 10}`;

            const newIncident = {
                id: randomId,
                type: randomType,
                loc: randomBrgy,
                time: 'Just Now',
                status: randomStatus.status,
                color: randomStatus.color,
            };

            // ✅ CRITICAL FIX: Keep max 4 items, always!
            setFakeIncidents(prev => {
                // Add new to front, remove from back if over 4
                const updated = [newIncident, ...prev];
                return updated.slice(0, 4);
            });
        }, 2000); // New alert every 4 seconds

        // ✅ Cleanup: Stop interval when component is removed from screen
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="flex flex-col bg-[#F5F7FA] overflow-x-hidden">

            {/* ===================== SECTION 1: HERO ===================== */}
            <section className="container mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-1 bg-[#E63946] rounded-full"></div>
                        <span className="text-sm font-semibold text-gray-700">Santa Rosa Municipal Rescue Team</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                        Mabilis pa sa <br />
                        <span className="text-[#E63946]">Alas Kwatro</span>
                    </h1>
                    <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-lg">
                        iRespond is Santa Rosa, Nueva Ecija's Emergency Command Center, connecting citizen alerts directly to rapid dispatch and real-time incident response.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link to="/login">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-[#E63946] hover:bg-[#d62828] text-white font-bold px-8 py-3 rounded shadow-md flex items-center gap-2 transition-all duration-300"
                            >
                                <Icon icon="mdi:alert" className="w-5 h-5" /> REPORT AN INCIDENT
                            </motion.button>
                        </Link>
                        <a href="#mission">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-white border-2 border-black text-black font-bold px-8 py-3 rounded hover:bg-gray-50 transition-all duration-300"
                            >
                                OUR MISSION
                            </motion.button>
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-300">
                        <div>
                            <p className="text-4xl font-bold text-gray-900">50<span className="text-lg font-normal text-gray-500">+</span></p>
                            <p className="text-xs text-gray-500 font-medium">Incidents Resolved</p>
                        </div>
                        <div className="w-px h-10 bg-gray-300"></div>
                        <div>
                            <p className="text-4xl font-bold text-gray-900">15</p>
                            <p className="text-xs text-gray-500 font-medium">Active Volunteers</p>
                        </div>
                        <div className="w-px h-10 bg-gray-300"></div>
                        <div>
                            <p className="text-4xl font-bold text-gray-900">9</p>
                            <p className="text-xs text-gray-500 font-medium">Active Units</p>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side - Live Incident Feed */}
                {/* Right Side - Live Incident Feed (Animated) */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 relative h-fit self-start"
                >
                    {/* Feed Header */}
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="font-bold text-sm text-gray-700">LIVE INCIDENT FEED</h3>
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    </div>

                    {/* Feed List */}
                    <div className="space-y-3 max-h-[400px] overflow-hidden">
                        {fakeIncidents.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="flex items-start justify-between text-xs bg-gray-50 p-2 rounded hover:bg-gray-100 transition-colors duration-200"
                            >
                                <div className="flex gap-2">
                                    <span className="font-mono text-gray-400 w-14">{item.id}</span>
                                    <div>
                                        <p className="font-bold text-gray-800">{item.type}</p>
                                        <p className="text-gray-500">{item.loc}</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <span className="text-[10px] text-gray-400">{item.time}</span>
                                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${item.color}`}>{item.status}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ===================== SECTION 2: HOW IT WORKS ===================== */}
            <section id="how-it-works" className="bg-[#F5F7FA] py-20 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.7 }}
                    className="max-w-6xl mx-auto"
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-1 bg-[#E63946] rounded-full"></div>
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">How it works</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Report an incident in <span className="text-[#E63946]">two easy steps</span>
                    </h2>
                    <p className="text-gray-600 text-lg mb-12 max-w-2xl">
                        Your device's GPS pinpoints the scene and your camera captures it — and the rescue team sees it in real time.
                    </p>

                    {/* Steps Container */}
                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
                        {/* Arrow */}
                        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 z-10 text-3xl text-[#4A5568]">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>

                        {/* Step 1 Card */}
                        <div className="flex flex-col gap-3">
                            <img
                                src="/step1.png"
                                alt="Step 1 - Location and Photo"
                                className="w-full h-auto -mt-6 rounded-xl border-2 border-[#4A5568] shadow-sm" // ✅ Added -mt-4
                            />
                        </div>

                        {/* Step 2 Card */}
                        <div className="flex flex-col gap-3">
                            <img
                                src="/step2.png"
                                alt="Step 2 - Incident Details"
                                className="w-full h-auto -mt-6 rounded-xl border-2 border-[#4A5568] shadow-sm" // ✅ Added -mt-4
                            />
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ===================== SECTION 3: MISSION ===================== */}
            <section id="mission" className="bg-[#F5F7FA] py-20 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left Column: Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-1 bg-[#E63946] rounded-full"></div>
                            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Our Mission</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">Seconds save lives. We <span className="text-[#0F5C73]">make every one count.</span></h2>
                        <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-lg">Fast, accurate, community-driven emergency response at your fingertips.</p>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <span className="text-xl font-bold text-[#E63946] mt-1">1</span>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">Rapid First Response</h4>
                                    <p className="text-gray-600 text-sm">Report medical, environmental, or public safety emergencies in seconds. Capture photos, attach details, and notify dispatchers immediately.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-xl font-bold text-[#E63946] mt-1">2</span>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">Pinpoint Geolocation</h4>
                                    <p className="text-gray-600 text-sm">No need to describe your location during a crisis. Automated GPS tracking pinpoints your exact coordinates to ensure rescue teams reach you without delay.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-xl font-bold text-[#E63946] mt-1">3</span>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">Mobilizing Community Volunteers</h4>
                                    <p className="text-gray-600 text-sm">Trained community members can register, set their availability, and receive coordinated deployment alerts to support local response efforts when needed most.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ✅ 3x3 GRID - PAGDIKITIN (NO GAP) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: false, amount: 0.2 }}
                        transition={{ duration: 0.6 }}
                        className="grid grid-cols-3 border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                    >
                        {/* 1. FIRE - Red */}
                        <div className="bg-[#FFF5F5] p-6 flex flex-col items-center justify-center aspect-square border-b border-r border-gray-200 hover:bg-[#FFE8E8] transition">
                            <svg className="w-12 h-12 text-[#E53E3E] mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 2C9 6 6 10 6 14c0 3.31 2.69 6 6 6s6-2.69 6-6c0-4-3-8-6-12z" />
                                <path d="M12 17c1.66 0 3-1.34 3-3 0-2-3-5-3-5s-3 3-3 5c0 1.66 1.34 3 3 3z" />
                            </svg>
                            <span className="text-[10px] md:text-xs font-bold text-gray-700 tracking-wide">FIRE</span>
                        </div>

                        {/* 2. CRIME - Gray */}
                        <div className="bg-[#F9FAFB] p-6 flex flex-col items-center justify-center aspect-square border-b border-r border-gray-200 hover:bg-gray-100 transition">
                            <svg className="w-12 h-12 text-[#4A5568] mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span className="text-[10px] md:text-xs font-bold text-gray-700 tracking-wide">CRIME</span>
                        </div>

                        {/* 3. BLOCKAGE - Blue */}
                        <div className="bg-[#EFF6FF] p-6 flex flex-col items-center justify-center aspect-square border-b border-gray-200 hover:bg-[#DBEAFE] transition">
                            <div className="relative w-12 h-12 mb-2 flex items-center justify-center">
                                <div className="absolute w-10 h-10 rounded-full bg-[#3B82F6]"></div>
                                <div className="absolute w-11 h-1 bg-white rotate-45"></div>
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-gray-700 tracking-wide">BLOCKAGE</span>
                        </div>

                        {/* 4. SEARCH - Gray */}
                        <div className="bg-[#F9FAFB] p-6 flex flex-col items-center justify-center aspect-square border-b border-r border-gray-200 hover:bg-gray-100 transition">
                            <svg className="w-12 h-12 text-[#4A5568] mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21,21l-4.35-4.35" />
                            </svg>
                            <span className="text-[10px] md:text-xs font-bold text-gray-700 tracking-wide">SEARCH</span>
                        </div>

                        {/* 5. RESCUE - Red (Selected) */}
                        <div className="bg-[#FFF5F5] p-6 flex flex-col items-center justify-center aspect-square border-b border-r border-gray-200 ring-2 ring-[#FEB2B2] ring-inset hover:bg-[#FFE8E8] transition">
                            <svg className="w-12 h-12 text-[#E53E3E] mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                <path d="M10 14h4v2h-4zM11 8h2v4h-2z" />
                                <path d="M9 11h6v2H9z" />
                            </svg>
                            <span className="text-[10px] md:text-xs font-bold text-gray-700 tracking-wide">RESCUE</span>
                        </div>

                        {/* 6. EVACUATE - Gray */}
                        <div className="bg-[#F9FAFB] p-6 flex flex-col items-center justify-center aspect-square border-b border-gray-200 hover:bg-gray-100 transition">
                            <svg className="w-12 h-12 text-[#4A5568] mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M4 6h16v2H4zM4 10h10v2H4z" />
                                <path d="M20 14h-6v8h6v-8z" />
                            </svg>
                            <span className="text-[10px] md:text-xs font-bold text-gray-700 tracking-wide">EVACUATE</span>
                        </div>

                        {/* 7. FLOOD - Blue */}
                        <div className="bg-[#EFF6FF] p-6 flex flex-col items-center justify-center aspect-square border-r border-gray-200 hover:bg-[#DBEAFE] transition">
                            <svg className="w-12 h-12 text-[#3B82F6] mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 2C7 8 4 12 4 16c0 4.42 3.58 8 8 8s8-3.58 8-8c0-4-3-8-8-10z" />
                                <path d="M12 18c2.21 0 4-1.79 4-4 0-2-4-6-4-6s-4 4-4 6c0 2.21 1.79 4 4 4z" />
                            </svg>
                            <span className="text-[10px] md:text-xs font-bold text-gray-700 tracking-wide">FLOOD</span>
                        </div>

                        {/* 8. LANDSLIDE - Gray */}
                        <div className="bg-[#F9FAFB] p-6 flex flex-col items-center justify-center aspect-square border-r border-gray-200 hover:bg-gray-100 transition">
                            <svg className="w-12 h-12 text-[#4A5568] mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M17 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                <path d="M20 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                <path d="M5 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                            <span className="text-[10px] md:text-xs font-bold text-gray-700 tracking-wide">LANDSLIDE</span>
                        </div>

                        {/* 9. MEDICAL - Red */}
                        <div className="bg-[#FFF5F5] p-6 flex flex-col items-center justify-center aspect-square hover:bg-[#FFE8E8] transition">
                            <svg className="w-12 h-12 text-[#E53E3E] mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                                <path d="M12 8v8" />
                                <path d="M8 12h8" />
                            </svg>
                            <span className="text-[10px] md:text-xs font-bold text-gray-700 tracking-wide">MEDICAL</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ===================== SECTION 4: SERVICES ===================== */}
            <section id="services" className="bg-[#F5F7FA] py-20 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.7 }}
                    className="max-w-7xl mx-auto"
                >
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
                        {[
                            {
                                img: "/medical.jpeg",
                                title: "Medical Response",
                                desc: "Advanced life support dispatch, field triage coordination, and hospital liaison for critical cases."
                            },
                            {
                                img: "/fire.jpeg",
                                title: "Fire Incident",
                                desc: "Structural fire, vehicular fire, and wildfire response coordinated with BFP units."
                            },
                            {
                                img: "/vehicle.jpeg",
                                title: "Vehicle Incident",
                                desc: "Emergency extrication, traffic collision response, and site stabilization coordinated with local traffic management."
                            },
                            {
                                img: "/road.jpeg",
                                title: "Road Obstruction",
                                desc: "Rapid removal of fallen trees, debris, landslides, and stalled heavy vehicles disrupting primary roads."
                            },
                            {
                                img: "/flood.jpeg",
                                title: "Flood & Disaster",
                                desc: "Rapid deployment water rescue teams, evacuation coordination, and shelter management during typhoon events."
                            },
                            {
                                img: "/crime.jpeg",
                                title: "Crime Incident",
                                desc: "Immediate dispatch and site containment coordinated with PNP (Philippine National Police) units."
                            },
                        ].map((service, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false, amount: 0.1 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="bg-white p-8 rounded-lg border border-blue-100 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300"
                            >
                                <div className="w-16 h-16 mb-4 flex items-center justify-center">
                                    <img
                                        src={service.img}
                                        alt={service.title}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-[#0F5C73] mb-2">{service.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{service.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ===================== SECTION 5: FOOTER CTA ===================== */}
            <section id="file-report" className="bg-[#E63946] py-24 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 text-white"
                >
                    {/* Left Text Section */}
                    <div className="max-w-xl">
                        {/* Small white line + Subtitle */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-[2px] bg-white"></div>
                            <span className="text-sm font-medium tracking-widest uppercase opacity-90">
                                Civilian Incident Reporting
                            </span>
                        </div>

                        {/* Headline */}
                        <h2 className="text-[40px] leading-[1.1] font-bold mb-6">
                            Witnessed an emergency?<br />
                            Report it now.
                        </h2>

                        {/* Body Text */}
                        <p className="text-white/80 text-[15px] leading-relaxed font-light max-w-md">
                            Our civilian portal lets anyone file an incident report directly from their phone or computer, with GPS location, photo upload, and instant reference tracking.
                        </p>
                    </div>

                    {/* Right Button Section */}
                    <div className="mt-6 lg:mt-0 shrink-0">
                        <Link to="/login">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="group flex items-center gap-4 bg-white px-8 py-4 rounded shadow-lg transition-all duration-300 hover:shadow-xl"
                            >
                                {/* Red Alert Icon inside button */}
                                <div className="text-[#E63946]">
                                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2L1 21h22L12 2zm0 3.8l8 14.2H4l8-14.2z" />
                                        <rect x="11" y="10" width="2" height="5" />
                                        <circle cx="12" cy="18" r="1" />
                                    </svg>
                                </div>
                                <span className="text-[#E63946] font-bold text-[18px] tracking-wide uppercase">
                                    File A Report
                                </span>
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>
            </section>

        </div>
    );
}