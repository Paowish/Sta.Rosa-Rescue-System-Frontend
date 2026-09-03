import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function VerifyEmail() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await fetch(`/api/auth/verify-email/${token}`);
                const result = await response.json();

                if (response.ok && result.success) {
                    setStatus('success');
                    setMessage(result.message);
                } else {
                    setStatus('error');
                    setMessage(result.message || 'Invalid verification link');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Network error. Please try again.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
                {status === 'verifying' && (
                    <>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Verifying Email...</h2>
                        <p className="text-gray-500 mt-2">Please wait while we verify your email address.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Email Verified!</h2>
                        <p className="text-gray-500 mt-2">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                        >
                            Go to Login
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Verification Failed</h2>
                        <p className="text-gray-500 mt-2">{message}</p>
                        <Link
                            to="/signup"
                            className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition block"
                        >
                            Try Again
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}