// src/pages/guest/GuestSubmitSuccess.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import GuestLayout from "../../components/layout/GuestLayout";

export default function GuestSubmitSuccess() {
    const navigate = useNavigate();
    const location = useLocation();

    const reportData = location.state || {
        reportId: "INC-011",
        incidentType: "Medical Emergency",
        location: "12 Rizal, Santa Rosa, Nueva Ecija",
        victims: 1,
        submittedDate: new Date().toLocaleDateString()
    };

    const handleTrackReport = () => {
        navigate("/Guest/Track");
    };

    const handleBackToHome = () => {
        navigate("/Guest");
    };

    return (
        <GuestLayout>
            <div className="bg-[#EFF8FF] rounded-xl shadow p-6 text-center max-w-md mx-auto mt-6">
                {/* Success Icon */}
                <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center">
                        <Icon icon="gg:check-o" width="48" style={{ color: "#0C7FDA" }} />
                    </div>
                </div>

                <h2 className="text-[#262D31] font-semibold text-2xl mb-2">Report Submitted</h2>
                <p className="text-[#4285F4] font-semibold text-xl break-all mb-2">{reportData.reportId}</p>
                <p className="text-[#5D7285] font-light text-sm mb-4">
                    Your incident report has been received.<br />
                    Responders have been notified.
                </p>

                {/* Details Card */}
                <div className="bg-[#F5F6F8] rounded-lg p-3 mb-4 text-left">
                    <div className="space-y-2">
                        <div className="flex justify-between border-b border-[#DFDFF0] pb-2">
                            <span className="text-[#656363] font-light text-xs">Incident</span>
                            <span className="text-[#262D31] font-normal text-sm">{reportData.incidentType}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#DFDFF0] pb-2">
                            <span className="text-[#656363] font-light text-xs">Location</span>
                            <span className="text-[#262D31] font-normal text-sm max-w-[60%] text-right break-words">{reportData.location}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#DFDFF0] pb-2">
                            <span className="text-[#656363] font-light text-xs">Victims</span>
                            <span className="text-[#262D31] font-normal text-sm">{reportData.victims}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#656363] font-light text-xs">Submitted</span>
                            <span className="text-[#262D31] font-normal text-sm">{reportData.submittedDate}</span>
                        </div>
                    </div>
                </div>

                <p className="text-[#5D7285] font-light text-xs mb-5">
                    Use reference number <span className="font-semibold text-[#4285F4]">{reportData.reportId}</span> to track your report.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button onClick={handleTrackReport} className="bg-[#0C7FDA] text-white font-normal text-base py-2.5 rounded-lg hover:bg-blue-700 transition">
                        Track Report
                    </button>
                    <button onClick={handleBackToHome} className="border border-[#D3D2DE] text-[#656363] font-normal text-base py-2.5 rounded-lg hover:bg-gray-50 transition">
                        Back to Home
                    </button>
                </div>
            </div>
        </GuestLayout>
    );
}