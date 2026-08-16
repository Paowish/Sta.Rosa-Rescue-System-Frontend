// src/pages/guest/GuestReportIncident.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import GuestLayout from '../../components/layout/GuestLayout';

export default function GuestReportIncident() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Guest State
    const [locationData, setLocationData] = useState({ address: "", coordinates: { lat: null, lng: null } });
    const [specificDetails, setSpecificDetails] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [incidentType, setIncidentType] = useState("");
    const [description, setDescription] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    const getApiUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return '/api';
    };

    const getAddressFromCoordinates = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await res.json();
            if (data?.display_name) return data.display_name;
            return `${lat}, ${lng}`;
        } catch { return `${lat}, ${lng}`; }
    };

    const handleGetLocation = () => {
        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const address = await getAddressFromCoordinates(latitude, longitude);
                setLocationData({ coordinates: { lat: latitude, lng: longitude }, address });
                setIsLoadingLocation(false);
            },
            () => {
                alert("Location access denied. Please allow location in your browser settings.");
                setIsLoadingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!locationData.coordinates.lat) return alert("Please allow location access");
        if (!specificDetails.trim()) return alert("Please provide specific location details");
        if (!selectedImage) return alert("Please add a photo of the incident");
        if (!incidentType) return alert("Please select an incident type");
        if (!description.trim()) return alert("Please provide a description");
        if (!contactNumber.trim()) return alert("Please provide a contact number");

        setIsSubmitting(true);

        try {
            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/incidents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: incidentType,
                    description: description,
                    location: {
                        address: locationData.address,
                        coordinates: locationData.coordinates
                    },
                    severity: 'Medium',
                    reporterName: 'Guest User',
                    reporterNumber: contactNumber,
                    victimsAffected: 0,
                    image: selectedImage,
                    isGuest: true
                })
            });

            const data = await response.json();
            setIsSubmitting(false);

            if (data.success) {
                navigate('/Guest/Submit', { state: { success: true } });
            } else {
                alert("Failed to submit report: " + (data.message || 'Unknown error'));
            }
        } catch (error) {
            setIsSubmitting(false);
            alert("Failed to submit report: " + error.message);
        }
    };

    return (
        <GuestLayout>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-[#1f4e6f] mb-4">Report an Incident</h2>
                <p className="text-sm text-gray-500 mb-6">Fill out the details below to report an emergency to the Rescue Team.</p>

                <div className="space-y-5">
                    {/* Location */}
                    <div>
                        <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2"><Icon icon="mdi:crosshairs-gps" className="text-[#0C7FDA]" /> Location</h3>
                        <div className="h-40 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center relative">
                            {locationData.coordinates.lat ? (
                                <iframe src={`https://maps.google.com/maps?q=${locationData.coordinates.lat},${locationData.coordinates.lng}&z=16&output=embed`} className="w-full h-full" />
                            ) : (
                                <div className="text-center">
                                    <Icon icon="mdi:map-marker-off" width={32} className="text-gray-400 mx-auto mb-2" />
                                    <button onClick={handleGetLocation} disabled={isLoadingLocation} className="bg-[#0C7FDA] text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                                        {isLoadingLocation ? "Getting location..." : "Allow Location Access"}
                                    </button>
                                </div>
                            )}
                        </div>
                        {locationData.address && <p className="text-xs text-gray-500 mt-2">{locationData.address}</p>}
                    </div>

                    {/* Specific Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specific Details <span className="text-red-500">*</span></label>
                        <input type="text" value={specificDetails} onChange={(e) => setSpecificDetails(e.target.value)} placeholder="e.g. near Market Entrance, in front of Church" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0C7FDA]" />
                    </div>

                    {/* Photo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Photo <span className="text-red-500">*</span></label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center gap-2 bg-gray-50">
                            {selectedImage ? (
                                <div className="relative w-full max-w-xs">
                                    <img src={selectedImage} alt="Preview" className="w-full rounded shadow-sm" />
                                    <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                                </div>
                            ) : (
                                <>
                                    <Icon icon="mdi:camera" width={32} className="text-[#0C7FDA]" />
                                    <button onClick={() => document.getElementById('fileInput').click()} className="text-sm text-[#0C7FDA] font-medium hover:underline">Upload Photo</button>
                                    <input id="fileInput" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type <span className="text-red-500">*</span></label>
                        <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0C7FDA]">
                            <option value="">Select incident type</option>
                            <option>Medical Emergency</option><option>Fire Incident</option><option>Vehicle Accident</option>
                            <option>Road Obstruction</option><option>Flooding</option><option>Crime Incident</option><option>Other</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" placeholder="Describe what is happening..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0C7FDA] resize-none" />
                    </div>

                    {/* Contact */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                        <input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="09123456789" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0C7FDA]" />
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                        <button onClick={() => navigate('/Guest')} className="text-gray-500 text-sm hover:text-gray-700">Cancel</button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-[#0C7FDA] hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
                            {isSubmitting ? "Submitting..." : "Submit Report"}
                        </button>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}