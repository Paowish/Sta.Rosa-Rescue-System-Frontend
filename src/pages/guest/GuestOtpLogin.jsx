// src/pages/guest/GuestOtpLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

export default function GuestOtpLogin() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1); // 1 = Email, 2 = OTP
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const getApiUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return '/api';
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const res = await fetch(`${getApiUrl()}/guest/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                setMessage("OTP sent to your email! Check your inbox.");
                setStep(2);
            } else {
                setError(data.message || "Failed to send OTP.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${getApiUrl()}/guest/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            if (data.success) {
                // ✅ Save the Guest Session ID
                localStorage.setItem('guestSessionId', data.guestSessionId);
                navigate('/Guest/Dashboard'); // Redirect to Guest Dashboard
            } else {
                setError(data.message || "Invalid OTP.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center px-4 py-6">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Icon icon="mdi:lock-outline" width={32} className="text-[#0C7FDA]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Guest Access</h2>
                    <p className="text-sm text-gray-500">Enter your email to receive a one-time access code.</p>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">{message}</div>}

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" required className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0C7FDA]" />
                        <button type="submit" disabled={loading} className="w-full bg-[#0C7FDA] hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50">
                            {loading ? "Sending..." : "Send Access Code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit code" maxLength="6" required className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:border-[#0C7FDA]" />
                        <button type="submit" disabled={loading} className="w-full bg-[#0C7FDA] hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50">
                            {loading ? "Verifying..." : "Unlock Guest Mode"}
                        </button>
                        <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-gray-500 hover:text-gray-700 transition">
                            Resend Code
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}