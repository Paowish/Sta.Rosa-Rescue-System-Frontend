import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/api.js";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); // ✅ THIS STOPS THE PAGE FROM RELOADING AND REDIRECTING
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await authService.resetPassword(token, newPassword);
            if (response.success) {
                setMessage("Password reset successfully! Redirecting to login...");
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(response.message || "Failed to reset password.");
            }
        } catch (err) {
            setError(err.message || "Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center px-4 py-6">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Reset Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {message && <p className="text-green-600 text-sm mb-2 text-center">{message}</p>}
                    {error && <p className="text-red-600 text-sm mb-2 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link to="/login" className="text-sm text-blue-600 hover:underline">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}