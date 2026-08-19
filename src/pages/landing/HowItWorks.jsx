import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

export default function HowItWorks() {
    return (
        <div className="min-h-screen bg-[#F5F7FA] py-20 px-6">
            <div className="max-w-6xl mx-auto">
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

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative">

                    {/* Central Arrow (Visible on Desktop) */}
                    <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-4xl text-gray-300">
                        <Icon icon="mdi:arrow-right" className="w-12 h-12" />
                    </div>

                    {/* Step 1 Card */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        {/* Mockup Header */}
                        <div className="bg-[#0F5C73] p-4 text-white flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-sm font-medium ml-2">iRespond.live</span>
                        </div>

                        <div className="p-6">
                            <h3 className="font-bold text-xl text-[#0F5C73] mb-2">Step 1 - Location and Photo</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Set your exact location using automatic GPS detection. Attach a clear photo of the scene to help dispatchers assess the situation immediately.
                            </p>
                            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                                <Icon icon="mdi:map-marker" className="w-4 h-4 text-red-500" />
                                Detected location: <span className="font-medium text-gray-700">Rizal, Santa Rosa, Nueva Ecija</span>
                            </div>
                            <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400 text-xs">
                                <Icon icon="mdi:image-plus" className="w-8 h-8 mx-auto mb-1" />
                                Add Photo
                            </div>
                        </div>
                    </div>

                    {/* Step 2 Card */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        {/* Mockup Header */}
                        <div className="bg-[#0F5C73] p-4 text-white flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-sm font-medium ml-2">iRespond.live</span>
                        </div>

                        <div className="p-6">
                            <h3 className="font-bold text-xl text-[#0F5C73] mb-2">Step 2 - Incident Details</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Reporters pick the incident type, add a quick description, and submit. The dispatch team receives it instantly and begins coordination.
                            </p>

                            <div className="mt-4 space-y-3">
                                <div className="border border-gray-200 rounded p-2 bg-white">
                                    <p className="text-[10px] text-gray-400 mb-1">Incident type</p>
                                    <select className="w-full text-sm border-none bg-transparent focus:ring-0 p-0 text-gray-700">
                                        <option>Medical Emergency</option>
                                        <option>Fire Incident</option>
                                        <option>Traffic Accident</option>
                                    </select>
                                </div>
                                <textarea
                                    className="w-full border border-gray-200 rounded p-2 text-sm focus:ring-1 focus:ring-[#0F5C73] h-20 resize-none"
                                    placeholder="Describe what is happening. Include important details."
                                ></textarea>
                                <button className="w-full bg-[#0F5C73] text-white py-2 rounded font-medium hover:bg-[#0d4a5e] transition">
                                    Submit Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}