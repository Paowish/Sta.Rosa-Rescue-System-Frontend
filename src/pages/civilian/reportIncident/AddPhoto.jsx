import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { reportService } from "../../../services/reportService";

export default function AddPhoto() {
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [photoError, setPhotoError] = useState("");

    const steps = [
        { number: 1, label: "Set Location", active: false },
        { number: 2, label: "Add Photo", active: true },
        { number: 3, label: "Incident Details", active: false },
        { number: 4, label: "Review & Submit", active: false }
    ];

    const handleNextStep = () => {
        if (!selectedImage) {
            setPhotoError("⚠️ Please take or upload a photo of the incident");
            return;
        }
        navigate("/details");
    };

    const handleCancel = () => {
        navigate("/civilian-dashboard");
    };

    const handleBack = () => {
        navigate("/report");
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
                setImagePreview(reader.result);
                setPhotoError("");
                reportService.savePhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUseCamera = () => {
        document.getElementById("cameraInput").click();
    };

    const removePhoto = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setPhotoError("⚠️ Photo is required. Please take or upload a photo.");
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
                                        <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${step.active
                                            ? 'bg-[#0C7FDA] text-white'
                                            : step.number < 2
                                                ? 'bg-[#15803D] text-white'
                                                : 'bg-[#656363] text-[#FAFAFF]'
                                            }`}>
                                            {step.number}
                                        </div>
                                        <p className={`text-base ${step.active
                                            ? 'text-[#0C7FDA] font-semibold'
                                            : step.number < 2
                                                ? 'text-[#262D31] font-regular'
                                                : 'text-[#656363] font-normal'
                                            }`}>
                                            {step.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Main Content */}
                    <div className="flex-1 min-w-0 w-full">
                        {/* Mobile Header */}
                        <div className="lg:hidden flex justify-between items-center mb-4">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-1 text-[#474C53] text-lg hover:text-blue-600 transition"
                            >
                                <Icon icon="mdi:arrow-left" width="20" /> Back
                            </button>
                            <p className="text-[#5D7285] font-light text-sm">Step 2 of 4</p>
                        </div>

                        {/* Desktop Header */}
                        <div className="hidden lg:flex justify-between items-center mb-3">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-1 text-[#474C53] text-2xl font-normal hover:text-blue-600 transition"
                            >
                                <Icon icon="mdi:arrow-left" width="24" /> Back
                            </button>
                            <div className="flex items-center gap-4">
                                <p className="text-[#262D31] font-semibold text-[32px]">Add Photo</p>
                                <p className="text-[#5D7285] font-light text-base">Step 2 of 4</p>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="flex items-center gap-2 mb-2">
                            <Icon icon="tdesign:camera-filled" width="24" style={{ color: "#0C7FDA" }} />
                            <h2 className="text-[#262D31] font-semibold text-2xl">Add Photo</h2>
                        </div>

                        <p className="text-[#5D7285] font-light text-sm mb-4">
                            Attach a photo to help responders assess the situation. <span className="text-red-500">*Required</span>
                        </p>

                        <div className="bg-white rounded-xl shadow p-4">
                            {/* Photo Preview */}
                            {imagePreview ? (
                                <div className="mb-4 relative">
                                    <img
                                        src={imagePreview}
                                        alt="Incident preview"
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={removePhoto}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center mb-4 border-2 border-dashed border-gray-300">
                                    <Icon icon="tdesign:camera-filled" width="40" style={{ color: "#0C7FDA" }} />
                                    <p className="text-[#5D7285] text-sm mt-2">No photo selected</p>
                                </div>
                            )}

                            {photoError && (
                                <p className="text-red-500 text-xs mb-3">{photoError}</p>
                            )}

                            <input
                                type="file"
                                id="photoInput"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <input
                                type="file"
                                id="cameraInput"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            {/* Buttons */}
                            <div className="flex flex-col gap-3 mb-4">
                                {/* <button
                                    onClick={() => document.getElementById("photoInput").click()}
                                    className="w-full bg-[#F4F6FB] border border-[#D4D8E3] text-[#656363] font-normal text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition"
                                >
                                    <Icon icon="material-symbols:upload" width="20" />
                                    Upload from Gallery
                                </button> */}
                                <button
                                    onClick={handleUseCamera}
                                    className="w-full bg-[#F4F6FB] border border-[#D4D8E3] text-[#656363] font-normal text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition"
                                >
                                    <Icon icon="material-symbols:camera-alt" width="20" />
                                    Use Camera
                                </button>
                            </div>

                            {/* Info Box */}
                            <div className="flex items-start gap-2 p-3 bg-[#EFF8FF] rounded-lg mb-6">
                                <Icon icon="material-symbols:info" width="18" style={{ color: "#0C7FDA" }} className="flex-shrink-0 mt-0.5" />
                                <p className="text-[#8A8888] font-normal text-xs">
                                    Clear photos help dispatch the correct response team. Photo is required to proceed.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="text-[#656363] font-normal text-lg hover:text-gray-800 transition py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleNextStep}
                                    className={`w-full py-3 rounded-lg transition text-lg font-normal ${selectedImage ? 'bg-[#C6E6FF] text-[#656363] hover:bg-blue-200' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                    disabled={!selectedImage}
                                >
                                    Next Step →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}