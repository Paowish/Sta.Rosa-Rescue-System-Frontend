import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { reportService } from "../../../services/reportService";

export default function Step1() {
    const navigate = useNavigate();
    const [hasPermission, setHasPermission] = useState(false);
    const [specificDetails, setSpecificDetails] = useState("");
    const [specificDetailsError, setSpecificDetailsError] = useState("");
    const [locationData, setLocationData] = useState({
        address: "",
        coordinates: { lat: null, lng: null },
        barangay: ""
    });
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [showModal, setShowModal] = useState(true);

    const steps = [
        { number: 1, label: "Set Location", active: true },
        { number: 2, label: "Add Photo", active: false },
        { number: 3, label: "Incident Details", active: false },
        { number: 4, label: "Review & Submit", active: false }
    ];

    const getAddressFromCoordinates = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data && data.display_name) {
                const address = data.address;
                const barangay = address.suburb || address.village || address.neighbourhood || "";
                return {
                    fullAddress: data.display_name,
                    barangay: barangay,
                };
            }
            return null;
        } catch (error) {
            console.error("Geocoding error:", error);
            return null;
        }
    };

    const getCurrentLocation = () => {
        setIsLoadingLocation(true);
        setLocationError("");

        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            setIsLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                setLocationData(prev => ({
                    ...prev,
                    coordinates: { lat: latitude, lng: longitude }
                }));

                const addressInfo = await getAddressFromCoordinates(latitude, longitude);

                if (addressInfo) {
                    setLocationData(prev => ({
                        ...prev,
                        address: addressInfo.fullAddress,
                        barangay: addressInfo.barangay
                    }));
                } else {
                    setLocationData(prev => ({
                        ...prev,
                        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                        barangay: "Unknown"
                    }));
                }

                setHasPermission(true);
                setShowModal(false);
                setIsLoadingLocation(false);
            },
            (error) => {
                let errorMessage = "Unable to get your location. ";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage += "Please allow location access.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage += "Location information is unavailable.";
                } else {
                    errorMessage += "Location request timed out.";
                }
                setLocationError(errorMessage);
                setIsLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleAllowLocation = () => {
        getCurrentLocation();
    };

    const handleNextStep = () => {
        if (!hasPermission) {
            alert("⚠️ Please allow location access to continue");
            return;
        }
        if (!specificDetails.trim()) {
            setSpecificDetailsError("⚠️ Please confirm or add specific details about the location");
            return;
        }
        reportService.saveLocation({
            address: locationData.address,
            coordinates: locationData.coordinates,
            barangay: locationData.barangay,
            specificDetails: specificDetails
        });
        navigate("/addphoto");
    };

    const handleCancel = () => {
        navigate("/civilian-dashboard");
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full px-3 sm:px-4 pt-3 sm:pt-4 pb-4">
                {/* Desktop Layout: Row with sidebar */}
                <div className="flex flex-col lg:flex-row gap-4 items-start">

                    {/* LEFT COLUMN - Steps Panel (Visible on lg screens and above) */}
                    <div className="hidden lg:block w-80 flex-shrink-0 sticky top-4 self-start">
                        <div className="mb-4">
                            <div className="flex items-center gap-2">
                                <Icon icon="tabler:report" width="40" style={{ color: "#0E4B5E" }} />
                                <h1 className="text-[#474C53] font-semibold text-[40px]">File Report</h1>
                            </div>
                            <p className="text-[#5D7285] font-light text-base">
                                Complete all steps to submit your incident report to the Operations Command Center.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-xl shadow">
                            <div className="space-y-4">
                                {steps.map((step, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${step.active ? 'bg-[#DFF1FF]' : ''}`}
                                    >
                                        <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${step.active ? 'bg-[#0C7FDA] text-white' : 'bg-[#656363] text-[#FAFAFF]'}`}>
                                            {step.number}
                                        </div>
                                        <p className={`text-base ${step.active ? 'text-[#0C7FDA] font-semibold' : 'text-[#656363] font-normal'}`}>
                                            {step.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Main Content (Full width on mobile) */}
                    <div className="flex-1 min-w-0 w-full">
                        {/* Mobile Header with Back button and Step */}
                        <div className="flex justify-between items-center mb-4">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-1 text-[#474C53] text-lg hover:text-blue-600 transition"
                            >
                                <Icon icon="mdi:arrow-left" width="20" /> Cancel
                            </button>
                            <p className="text-[#5D7285] font-light text-sm">Step 1 of 4</p>
                        </div>

                        {/* Desktop Header (hidden on mobile) */}
                        <div className="hidden lg:flex justify-between items-center mb-3">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-1 text-[#474C53] text-2xl font-normal hover:text-blue-600 transition"
                            >
                                <Icon icon="mdi:arrow-left" width="24" /> Back to home
                            </button>
                            <div className="flex items-center gap-4">
                                <p className="text-[#262D31] font-semibold text-[32px]">Set Location</p>
                                <p className="text-[#5D7285] font-light text-base">Step 1 of 4</p>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="flex items-center gap-2 mb-2">
                            <Icon icon="mage:location-fill" width="24" style={{ color: "#0C7FDA" }} />
                            <h2 className="text-[#262D31] font-semibold text-2xl">Set Incident Location</h2>
                        </div>

                        <p className="text-[#5D7285] font-light text-sm mb-3">
                            We'll use your device location to pinpoint the incident.
                        </p>

                        <div className="bg-white rounded-xl shadow p-4">
                            {/* Map */}
                            <div className="relative">
                                <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
                                    {locationData.coordinates.lat && locationData.coordinates.lng ? (
                                        <iframe
                                            title="map"
                                            src={`https://maps.google.com/maps?q=${locationData.coordinates.lat},${locationData.coordinates.lng}&z=16&output=embed`}
                                            className="w-full h-full"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                            <p className="text-gray-500 text-sm px-4 text-center">Tap "Allow Location Access" to see map</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {hasPermission && (
                                <>
                                    <div className="mt-4 mb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon icon="mage:location-fill" width="14" style={{ color: "#0C7FDA" }} />
                                            <p className="text-[#5D7285] font-normal text-sm">Your current location</p>
                                        </div>
                                        <p className="text-[#262D31] font-semibold text-xs mb-1 break-words">
                                            {locationData.address || "Getting address..."}
                                        </p>
                                        <p className="text-[#5D7285] font-normal text-xs">
                                            Barangay: {locationData.barangay || "Detecting..."}
                                        </p>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-[#5D7285] font-normal text-base mb-2">
                                            Confirm or Add Specific Details <span className="text-red-500">*</span>
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="e.g. near Market Entrance, in front of Church"
                                            value={specificDetails}
                                            onChange={(e) => {
                                                setSpecificDetails(e.target.value);
                                                if (e.target.value.trim()) setSpecificDetailsError("");
                                            }}
                                            className={`w-full p-3 rounded-lg border ${specificDetailsError ? 'border-red-500' : 'border-gray-200'} text-[#5D7285] font-light text-sm focus:outline-none focus:border-[#0C7FDA]`}
                                        />
                                        {specificDetailsError && (
                                            <p className="text-red-500 text-xs mt-1">{specificDetailsError}</p>
                                        )}
                                        <p className="text-gray-400 text-xs mt-1">Please provide specific details to help responders locate the incident faster.</p>
                                    </div>
                                </>
                            )}

                            {!hasPermission && !isLoadingLocation && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-700 text-sm">⚠️ Location access is required to proceed. Please allow location access.</p>
                                </div>
                            )}

                            {isLoadingLocation && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-blue-700 text-sm">📍 Getting your location...</p>
                                </div>
                            )}

                            {locationError && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm">{locationError}</p>
                                </div>
                            )}

                            <div className="flex items-start gap-2 p-3 bg-[#EFF8FF] rounded-lg mt-4">
                                <Icon icon="material-symbols:info" width="18" style={{ color: "#0C7FDA" }} className="flex-shrink-0 mt-0.5" />
                                <p className="text-[#8A8888] font-normal text-xs">
                                    GPS coordinates are shared with emergency responders for faster dispatch.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse gap-3 mt-6">
                                <button onClick={handleCancel} className="text-[#656363] font-normal text-lg hover:text-gray-800 transition py-2">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleNextStep}
                                    className={`w-full py-3 rounded-lg transition text-lg font-normal ${hasPermission && specificDetails.trim() && locationData.coordinates.lat ? 'bg-[#C6E6FF] text-[#656363] hover:bg-blue-200' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                    disabled={!hasPermission || !specificDetails.trim() || !locationData.coordinates.lat}
                                >
                                    Next Step →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location Permission Modal */}
            {!hasPermission && !isLoadingLocation && showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-center mb-4">
                            <Icon icon="mage:location-fill" width="48" style={{ color: "#0C7FDA" }} />
                        </div>
                        <h2 className="text-2xl text-[#262D31] font-semibold text-center mb-3">Allow Location Access</h2>
                        <p className="text-[#5D7285] font-normal text-base text-center mb-4">
                            We need your location so the rescue team can reach you faster.
                        </p>
                        <button
                            onClick={handleAllowLocation}
                            className="w-full bg-[#0C7FDA] text-white py-3 rounded-lg font-semibold text-base mb-3 hover:bg-blue-700 transition"
                        >
                            Allow location access
                        </button>
                        <button
                            onClick={handleAllowLocation}
                            className="w-full bg-[#D4D8E3] text-[#8F8FB6] text-lg font-normal py-3 rounded-lg hover:bg-gray-400 transition"
                        >
                            Enter location manually
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}