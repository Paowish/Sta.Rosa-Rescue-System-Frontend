import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { reportService } from "../../../services/reportService";
import { incidentService } from "../../../services/api";

export default function Review() {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const steps = [
        { number: 1, label: "Set Location", active: false },
        { number: 2, label: "Add Photo", active: false },
        { number: 3, label: "Incident Details", active: false },
        { number: 4, label: "Review & Submit", active: true }
    ];

    // Function to format phone number for display
    const formatPhoneForDisplay = (phoneNumber) => {
        if (!phoneNumber) return "N/A";

        // Remove any non-digit characters
        let digits = phoneNumber.toString().replace(/\D/g, '');

        // If it's 11 digits and starts with 09 (local format from registration)
        if (digits.length === 11 && digits.startsWith('09')) {
            // Remove the leading 0 to get the 10-digit number
            const afterZero = digits.substring(1); // 10 digits (e.g., 9123456789)
            // Format as +63 XXX XXX XXXX
            if (afterZero.length === 10) {
                return `+63 ${afterZero.substring(0, 3)} ${afterZero.substring(3, 6)} ${afterZero.substring(6, 10)}`;
            }
        }

        // If it's 10 digits and starts with 9 (missing leading 0)
        if (digits.length === 10 && digits.startsWith('9')) {
            return `+63 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 10)}`;
        }

        // If it's already in international format (13 digits starting with 63)
        if (digits.length === 13 && digits.startsWith('63')) {
            const afterCountryCode = digits.substring(2); // Remove '63'
            if (afterCountryCode.length === 11) {
                const numberPart = afterCountryCode.substring(1); // Remove leading 9
                return `+63 ${numberPart.substring(0, 3)} ${numberPart.substring(3, 6)} ${numberPart.substring(6, 10)}`;
            }
        }

        // If it's 12 digits with 63 (missing one digit)
        if (digits.length === 12 && digits.startsWith('63')) {
            const afterCountryCode = digits.substring(2);
            if (afterCountryCode.length === 10) {
                return `+63 ${afterCountryCode.substring(0, 3)} ${afterCountryCode.substring(3, 6)} ${afterCountryCode.substring(6, 10)}`;
            }
        }

        // Return original if no formatting applied
        return phoneNumber;
    };

    useEffect(() => {
        const data = reportService.getReportData();
        console.log("Report Data:", data); // Debug log to see what data is available
        setReportData(data);
    }, []);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const response = await reportService.submitReport(incidentService);
            if (response.success) {
                navigate("/submit", {
                    state: {
                        reportId: response.data.incidentId,
                        incidentType: reportData?.incidentDetails?.type,
                        location: reportData?.location?.address,
                        victims: reportData?.incidentDetails?.victimsAffected,
                        submittedDate: new Date().toLocaleDateString()
                    }
                });
            }
        } catch (error) {
            alert("Failed to submit report: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate("/details");
    };

    const handleCancel = () => {
        navigate("/civilian-dashboard");
    };

    if (!reportData) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

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
                                            : 'bg-[#15803D] text-white'
                                            }`}>
                                            {step.number}
                                        </div>
                                        <p className={`text-base ${step.active
                                            ? 'text-[#0C7FDA] font-semibold'
                                            : 'text-[#262D31] font-regular'
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
                            <p className="text-[#5D7285] font-light text-sm">Step 4 of 4</p>
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
                                <p className="text-[#262D31] font-semibold text-[32px]">Review & Submit</p>
                                <p className="text-[#5D7285] font-light text-base">Step 4 of 4</p>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="flex items-center gap-2 mb-2">
                            <Icon icon="mdi:clipboard-check" width="24" style={{ color: "#0C7FDA" }} />
                            <h2 className="text-[#262D31] font-semibold text-2xl">Review & Submit</h2>
                        </div>

                        <p className="text-[#5D7285] font-light text-sm mb-4">
                            Review your report details before submitting.
                        </p>

                        <div className="bg-white rounded-xl shadow p-4">
                            {/* Location Section */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="mage:location-fill" width="18" style={{ color: "#0C7FDA" }} />
                                    <h3 className="text-[#262D31] font-semibold text-base">Location</h3>
                                </div>
                                <div className="space-y-1 pl-6">
                                    <p className="text-[#656363] text-xs">Address:</p>
                                    <p className="text-[#262D31] font-medium text-sm break-words">
                                        {reportData.location?.address && reportData.location.address !== "N/A"
                                            ? reportData.location.address
                                            : "Not provided"}
                                    </p>
                                    <p className="text-[#656363] text-xs mt-1">Specific Details:</p>
                                    <p className="text-[#262D31] font-medium text-sm">
                                        {reportData.location?.specificDetails && reportData.location.specificDetails !== "N/A"
                                            ? reportData.location.specificDetails
                                            : "Not provided"}
                                    </p>
                                </div>
                            </div>

                            {/* Photo Section */}
                            {reportData.photos && reportData.photos.length > 0 && (
                                <div className="mb-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon icon="tdesign:camera-filled" width="18" style={{ color: "#0C7FDA" }} />
                                        <h3 className="text-[#262D31] font-semibold text-base">Photo Evidence</h3>
                                    </div>
                                    <div className="pl-6">
                                        <div className="flex gap-2 flex-wrap">
                                            {reportData.photos.map((photo, index) => (
                                                <img key={index} src={photo} alt={`Incident ${index + 1}`} className="w-32 h-32 object-cover rounded-lg border" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Incident Details */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="mdi:clipboard-list" width="18" style={{ color: "#0C7FDA" }} />
                                    <h3 className="text-[#262D31] font-semibold text-base">Incident Details</h3>
                                </div>
                                <div className="space-y-1 pl-6">
                                    <p className="text-[#656363] text-xs">Type:</p>
                                    <p className="text-[#262D31] font-medium text-sm">
                                        {reportData.incidentDetails?.type || "Not provided"}
                                    </p>
                                    <p className="text-[#656363] text-xs mt-1">Victims:</p>
                                    <p className="text-[#262D31] font-medium text-sm">
                                        {reportData.incidentDetails?.victimsAffected !== undefined ? reportData.incidentDetails.victimsAffected : 0}
                                    </p>
                                    <p className="text-[#656363] text-xs mt-1">Description:</p>
                                    <p className="text-[#262D31] font-medium text-sm">
                                        {reportData.incidentDetails?.description || "Not provided"}
                                    </p>
                                </div>
                            </div>

                            {/* Reporter Information */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon icon="mdi:account" width="18" style={{ color: "#0C7FDA" }} />
                                    <h3 className="text-[#262D31] font-semibold text-base">Reporter Information</h3>
                                </div>
                                <div className="space-y-1 pl-6">
                                    <p className="text-[#656363] text-xs">Name:</p>
                                    <p className="text-[#262D31] font-medium text-sm">
                                        {reportData.incidentDetails?.reporterName || "Anonymous"}
                                    </p>
                                    <p className="text-[#656363] text-xs mt-1">Contact Number:</p>
                                    <p className="text-[#262D31] font-medium text-sm">
                                        {formatPhoneForDisplay(reportData.incidentDetails?.reporterNumber)}
                                    </p>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="flex items-start gap-2 p-3 bg-[#EFF8FF] rounded-lg mb-5">
                                <Icon icon="material-symbols:info" width="18" style={{ color: "#0C7FDA" }} className="flex-shrink-0 mt-0.5" />
                                <p className="text-[#8A8888] font-normal text-xs">
                                    By submitting, you confirm this report is accurate. False reports delay real emergency responses.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse gap-3">
                                <button onClick={handleCancel} className="text-[#656363] font-normal text-lg hover:text-gray-800 transition py-2">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full bg-[#0C7FDA] text-white font-normal text-lg py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {submitting ? "Submitting..." : "Submit Report →"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}