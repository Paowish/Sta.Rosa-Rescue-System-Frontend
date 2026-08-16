// src/pages/guest/GuestReportIncident.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import GuestLayout from '../../components/layout/GuestLayout';
import { incidentService } from '../../services/api';

export default function GuestReportIncident() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isLocationReady, setIsLocationReady] = useState(false);
    const [slideDirection, setSlideDirection] = useState('right');

    // Step 1 State
    const [hasPermission, setHasPermission] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationData, setLocationData] = useState({ address: "", coordinates: { lat: null, lng: null }, barangay: "" });
    const [specificDetails, setSpecificDetails] = useState("");
    const [showModal, setShowModal] = useState(true);

    // Step 2 State
    const [selectedImage, setSelectedImage] = useState(null);
    const [incidentDetails, setIncidentDetails] = useState({
        incidentType: "",
        victimsAffected: 0,
        description: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('');
    const [submittedReportId, setSubmittedReportId] = useState('');

    // --- LOGIC FOR STEP 1: LOCATION ---
    const getAddressFromCoordinates = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await res.json();
            if (data?.display_name) {
                const address = data.address;
                const barangay = address.suburb || address.village || address.neighbourhood || "";
                return { fullAddress: data.display_name, barangay };
            }
            return null;
        } catch { return null; }
    };

    const handleAllowLocation = () => {
        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const info = await getAddressFromCoordinates(latitude, longitude);
                setLocationData({
                    coordinates: { lat: latitude, lng: longitude },
                    address: info?.fullAddress || `${latitude}, ${longitude}`,
                    barangay: info?.barangay || "Unknown"
                });
                setHasPermission(true);

                setSlideDirection('left');
                setIsTransitioning(true);

                setTimeout(() => {
                    setShowModal(false);
                    setIsLocationReady(true);
                    setIsLoadingLocation(false);

                    setTimeout(() => {
                        setIsTransitioning(false);
                    }, 150);
                }, 400);
            },
            () => {
                alert("Location access denied. Please allow location in your browser settings.");
                setIsLoadingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleCancel = () => {
        navigate('/Guest');
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleNextStep1 = () => {
        if (!hasPermission && !locationData.coordinates.lat && !specificDetails) {
            setShowModal(true);
            return;
        }

        if (!specificDetails.trim()) return alert("Please provide specific location details");
        if (!selectedImage) return alert("Please add a photo of the incident");

        setSlideDirection('left');
        setIsTransitioning(true);

        setTimeout(() => {
            setCurrentStep(2);
            setTimeout(() => {
                setIsTransitioning(false);
            }, 150);
        }, 400);
    };

    // --- LOGIC FOR STEP 2: DETAILS ---
    const handleChange = (e) => setIncidentDetails({ ...incidentDetails, [e.target.name]: e.target.value });

    const incrementVictims = () => setIncidentDetails(prev => ({ ...prev, victimsAffected: prev.victimsAffected + 1 }));
    const decrementVictims = () => setIncidentDetails(prev => ({ ...prev, victimsAffected: Math.max(0, prev.victimsAffected - 1) }));

    const handleSubmitFinal = async () => {
        if (!incidentDetails.incidentType || !incidentDetails.description.trim()) {
            return alert("Please fill in Incident Type and Description");
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        setSubmitStatus('Submitting report...');

        try {
            const getApiUrl = () => {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    return 'http://localhost:5000/api';
                }
                return '/api';
            };

            const apiUrl = getApiUrl();
            const token = localStorage.getItem('token') || '';

            // Submit the report
            const response = await fetch(`${apiUrl}/incidents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    type: incidentDetails.incidentType,
                    description: incidentDetails.description,
                    location: {
                        address: locationData.address,
                        coordinates: locationData.coordinates
                    },
                    severity: 'Medium',
                    reporterName: 'Guest User',
                    reporterNumber: '',
                    reporterEmail: '',
                    victimsAffected: incidentDetails.victimsAffected,
<<<<<<< HEAD
                    image: selectedImage,
                    isGuest: true
=======
                    image: selectedImage
>>>>>>> 3106177c4bdaea0e7d5d0545cf03ccc8a2c48969
                })
            });

            const data = await response.json();
            setSubmitStatus('Report submitted!');

            if (data.success) {
                setSubmittedReportId(data.data.incidentId);
                localStorage.setItem('guestTrackingId', data.data.incidentId);

                await new Promise(resolve => setTimeout(resolve, 1000));

<<<<<<< HEAD
                // ✅ Redirect to SubmitSuccess page FIRST
                navigate('/Guest/Submit', {
=======
                navigate('/Guest/Track', {
>>>>>>> 3106177c4bdaea0e7d5d0545cf03ccc8a2c48969
                    state: {
                        reportId: data.data.incidentId,
                        incidentType: incidentDetails.incidentType,
                        location: locationData.address,
                        victims: incidentDetails.victimsAffected,
<<<<<<< HEAD
                        submittedDate: new Date().toLocaleDateString()
=======
                        submittedDate: new Date().toLocaleDateString(),
                        success: true
>>>>>>> 3106177c4bdaea0e7d5d0545cf03ccc8a2c48969
                    }
                });
            } else {
                alert("Failed to submit report: " + (data.message || 'Unknown error'));
                setIsSubmitting(false);
            }
        } catch (error) {
            setSubmitStatus('❌ Submission failed');
            alert("Failed to submit report: " + error.message);
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        if (currentStep === 1) navigate('/Guest');
        else {
            setSlideDirection('right');
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStep(1);
                setTimeout(() => {
                    setIsTransitioning(false);
                }, 150);
            }, 400);
        }
    };

    const getSlideClasses = () => {
        if (!isTransitioning) return 'opacity-100 translate-x-0';
        return slideDirection === 'left'
            ? 'opacity-0 -translate-x-8'
            : 'opacity-0 translate-x-8';
    };

    return (
        <GuestLayout>
            {/* ✅ Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <Icon icon="mdi:file-document-outline" width="32" className="text-[#1f4e6f]" />
                    <h1 className="text-[#1f4e6f] text-2xl font-bold tracking-tight">Incident Report</h1>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                    Complete all steps to submit your incident report to the Operations Command Center.
                </p>
            </div>

            {/* ✅ Step Indicator */}
            <div className="flex items-center gap-4 mb-6">
                <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-[#1f6b75]' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? 'bg-[#1f6b75] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {currentStep > 1 ? <Icon icon="mdi:check" width="16" /> : 1}
                    </div>
                    <span className="text-sm font-medium">Location</span>
                </div>
                <div className={`flex-1 h-0.5 ${currentStep >= 2 ? 'bg-[#1f6b75]' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-[#1f6b75]' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 2 ? 'bg-[#1f6b75] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        2
                    </div>
                    <span className="text-sm font-medium">Details</span>
                </div>
            </div>

            {/* ✅ Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className={`transition-all duration-500 ease-in-out ${getSlideClasses()}`}>
                    {currentStep === 1 ? (
                        <div className="space-y-6">
                            {/* Location Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Icon icon="mdi:crosshairs-gps" width="22" className="text-[#0C7FDA]" />
                                    <h3 className="text-[15px] font-medium text-gray-800">Set Incident Location</h3>
                                </div>
                                <p className="text-sm text-gray-500 mb-3">We'll use your device location to pinpoint the incident.</p>

                                <div className="h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                                    {locationData.coordinates.lat ? (
                                        <iframe src={`https://maps.google.com/maps?q=${locationData.coordinates.lat},${locationData.coordinates.lng}&z=16&output=embed`} className="w-full h-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 flex-col gap-2">
                                            <Icon icon="mdi:map-marker-off" width="32" className="text-gray-400" />
                                            <span className="text-xs text-gray-400">Location not yet detected</span>
                                        </div>
                                    )}
                                </div>

                                {hasPermission && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-xs text-gray-400 font-medium">Detected location</p>
                                        <p className="text-sm font-medium text-gray-800 mt-0.5">{locationData.address}</p>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <label className="block text-sm text-gray-700 mb-1.5">Confirm or Add Specific Details <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={specificDetails}
                                        onChange={(e) => setSpecificDetails(e.target.value)}
                                        placeholder="e.g. near Market Entrance, in front of Church"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0C7FDA] focus:ring-1 focus:ring-[#0C7FDA]"
                                    />
                                </div>
                            </div>

                            {/* Photo Section */}
                            <div className="border-t pt-6 border-gray-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Icon icon="mdi:camera" width="22" className="text-[#0C7FDA]" />
                                    <h3 className="text-[15px] font-medium text-gray-800">Capture the incident</h3>
                                </div>
                                <p className="text-sm text-gray-500 mb-3">Attach a photo to help responders assess the situation.</p>

                                <div className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 transition-colors ${selectedImage ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                                    {selectedImage ? (
                                        <div className="relative w-full max-w-xs mx-auto">
                                            <img src={selectedImage} alt="Preview" className="w-full rounded-lg shadow-sm" />
                                            <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">✕</button>
                                        </div>
                                    ) : (
                                        <>
                                            <Icon icon="mdi:camera" width="32" className="text-[#0C7FDA]" />
                                            <button onClick={() => document.getElementById('cameraInput').click()} className="text-sm text-[#0C7FDA] font-medium hover:underline">
                                                Add Photo
                                            </button>
                                            <input id="cameraInput" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t pt-4 border-gray-100 flex justify-end">
                                <button
                                    onClick={handleNextStep1}
                                    disabled={isTransitioning}
                                    className="bg-[#0C7FDA] hover:bg-blue-700 text-white text-sm font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTransitioning ? (
                                        <>
                                            <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            Next Step <Icon icon="mdi:arrow-right" width="16" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Icon icon="mdi:clipboard-list" width="22" className="text-[#0C7FDA]" />
                                    <h3 className="text-[15px] font-medium text-gray-800">Incident Details</h3>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">Provide accurate information so the right resources can be deployed.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 font-medium mb-1.5">Incident type <span className="text-red-500">*</span></label>
                                        <select name="incidentType" value={incidentDetails.incidentType} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0C7FDA]">
                                            <option value="">Select incident type</option>
                                            <option>Medical Emergency</option>
                                            <option>Fire Incident</option>
                                            <option>Vehicle Accident</option>
                                            <option>Road Obstruction</option>
                                            <option>Flooding</option>
                                            <option>Crime Incident</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 font-medium mb-1.5">Victims affected</label>
                                        <div className="flex items-center gap-2">
                                            <button onClick={decrementVictims} className="w-8 h-8 rounded bg-[#0C7FDA] text-white flex items-center justify-center text-lg hover:bg-blue-700">-</button>
                                            <span className="w-8 text-center font-medium text-gray-800">{incidentDetails.victimsAffected}</span>
                                            <button onClick={incrementVictims} className="w-8 h-8 rounded bg-[#0C7FDA] text-white flex items-center justify-center text-lg hover:bg-blue-700">+</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm text-gray-600 font-medium mb-1.5">Description <span className="text-red-500">*</span></label>
                                    <textarea name="description" value={incidentDetails.description} onChange={handleChange} rows="4" placeholder="Describe what is happening. Include important details." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0C7FDA] resize-none" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1.5">Your Name</label>
                                        <input
                                            type="text"
                                            value="Guest User"
                                            disabled
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-200 cursor-not-allowed text-gray-500 focus:outline-none"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-0.5">Guest mode</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1.5">Tracking ID</label>
                                        <input
                                            type="text"
                                            value="Will be generated after submission"
                                            disabled
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-200 cursor-not-allowed text-gray-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t pt-4 border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmitFinal}
                                    disabled={isSubmitting}
                                    className={`bg-[#0C7FDA] hover:bg-blue-700 text-white text-sm font-medium py-2 px-6 rounded-lg shadow-sm transition-all duration-300 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Report"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SUBMISSION SPINNER */}
            {isSubmitting && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-[#0C7FDA] rounded-full animate-spin mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-900">Submitting Report</h3>
                        <p className="text-sm text-gray-500 mt-1">{submitStatus}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                            <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span>{navigator.onLine ? 'Connected' : 'No internet connection'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* LOCATION PERMISSION MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                            <Icon icon="mdi:crosshairs-gps" width="32" className="text-[#0C7FDA]" />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-2">Allow Location Access</h2>
                        <p className="text-gray-500 text-sm mb-6 px-2">
                            We need your location to pinpoint the incident on our emergency map so the rescue team can reach you faster.
                        </p>

                        <div className="bg-[#EFF8FF] rounded-lg p-4 flex items-center gap-3 mb-6 w-full text-left">
                            <div className="w-8 h-8 rounded-full bg-[#0C7FDA] flex items-center justify-center flex-shrink-0">
                                <Icon icon="mdi:shield-check" width="16" className="text-white" />
                            </div>
                            <p className="text-xs text-[#5D7285] leading-relaxed">
                                Your location is only shared with emergency responders and is never stored after your report is closed.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 w-full">
                            {isLoadingLocation ? (
                                <div className="w-full bg-blue-50 text-[#0C7FDA] py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
                                    <Icon icon="mdi:loading" className="animate-spin" width="20" />
                                    Getting location...
                                </div>
                            ) : (
                                <button
                                    onClick={handleAllowLocation}
                                    className="w-full bg-[#0C7FDA] hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
                                >
                                    Allow location access
                                </button>
                            )}

                            <button
                                onClick={handleCancel}
                                className="w-full border border-gray-300 text-gray-600 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </GuestLayout>
    );
}