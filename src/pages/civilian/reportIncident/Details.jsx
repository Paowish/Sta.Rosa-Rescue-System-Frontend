import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { reportService } from "../../../services/reportService";

export default function IncidentDetails() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInjectionWarning, setShowInjectionWarning] = useState(false);

    // Get logged-in user data from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = localStorage.getItem('userRole');
    const fullName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "";

    // Role-Based Access Control Check
    if (!userRole || (userRole !== 'civilian' && userRole !== 'responder' && userRole !== 'volunteer')) {
        alert("You are not authorized to file incident reports.");
        navigate("/login");
    }

    // Detect injection patterns
    const hasInjectionPattern = (input) => {
        if (!input) return false;

        const injectionPatterns = [
            /['"]\s*OR\s*['"]/i,           // ' OR '
            /['"]\s*AND\s*['"]/i,          // ' AND '
            /--/,                           // SQL comment
            /;/,                            // Multiple statements
            /\bOR\b.*=/i,                   // OR 1=1
            /\bAND\b.*=/i,                  // AND 1=1
            /\$ne/i,                        // MongoDB not equal
            /\$gt/i,                        // MongoDB greater than
            /\$lt/i,                        // MongoDB less than
            /\$where/i,                     // MongoDB where clause
            /\$or/i,                        // MongoDB or operator
            /\$and/i,                       // MongoDB and operator
            /\/\*/,                         // SQL block comment
            /\bUNION\b/i,                   // UNION attack
            /\bSELECT\b/i,                  // SELECT statement
            /\bDROP\b/i,                    // DROP statement
            /\bDELETE\b/i,                  // DELETE statement
            /\bINSERT\b/i,                  // INSERT statement
            /\bUPDATE\b/i,                  // UPDATE statement
            /\bEXEC\b/i,                    // EXEC command
            /<script/i,                     // XSS script tag
            /javascript:/i,                 // JavaScript injection
            /onclick/i,                     // Event handler injection
            /onerror/i                      // Error event injection
        ];

        for (const pattern of injectionPatterns) {
            if (pattern.test(input)) {
                return true;
            }
        }
        return false;
    };

    // Sanitize input (remove dangerous characters)
    const sanitizeInput = (input) => {
        if (!input) return '';

        let sanitized = input
            .replace(/['"]/g, '')           // Remove quotes
            .replace(/--/g, '')             // Remove SQL comments
            .replace(/;/g, '')              // Remove semicolons
            .replace(/\$ne/gi, '')          // Remove MongoDB operators
            .replace(/\$gt/gi, '')
            .replace(/\$lt/gi, '')
            .replace(/\$where/gi, '')
            .replace(/\$or/gi, '')
            .replace(/\$and/gi, '')
            .replace(/<script/gi, '')       // Remove script tags
            .replace(/javascript:/gi, '')   // Remove javascript:
            .replace(/onclick/gi, '')       // Remove event handlers
            .replace(/onerror/gi, '')
            .replace(/\\/g, '');            // Remove backslashes

        // Limit length
        sanitized = sanitized.substring(0, 500);

        return sanitized;
    };

    // Format the phone number for display (convert 09xxxxxxxxx to +63 xxx xxx xxxx)
    const formatPhoneForDisplay = (phoneNumber) => {
        if (!phoneNumber) return "";
        // Remove any non-digit characters
        let digits = phoneNumber.toString().replace(/\D/g, '');

        // If it's 11 digits and starts with 09
        if (digits.length === 11 && digits.startsWith('09')) {
            // Remove the leading 0 and add +63
            const afterZero = digits.substring(1);
            const withCountryCode = '63' + afterZero;

            // Format as +63 XXX XXX XXXX
            if (withCountryCode.length === 12) {
                return `+63 ${withCountryCode.substring(2, 5)} ${withCountryCode.substring(5, 8)} ${withCountryCode.substring(8, 12)}`;
            }
        }

        // If it already has country code
        if (digits.length === 12 && digits.startsWith('63')) {
            return `+63 ${digits.substring(2, 5)} ${digits.substring(5, 8)} ${digits.substring(8, 12)}`;
        }

        return phoneNumber;
    };

    const [formData, setFormData] = useState({
        incidentType: "",
        victimsAffected: 0,
        description: "",
        name: fullName,
        contact: "",
        reporterNumber: user.phoneNumber ? formatPhoneForDisplay(user.phoneNumber) : ""
    });
    const [errors, setErrors] = useState({});

    const steps = [
        { number: 1, label: "Set Location", active: false },
        { number: 2, label: "Add Photo", active: false },
        { number: 3, label: "Incident Details", active: true },
        { number: 4, label: "Review & Submit", active: false }
    ];

    const incidentTypes = [
        "Select incident type",
        "Medical Emergency",
        "Fire Incident",
        "Vehicle Accident",
        "Road Obstruction",
        "Flooding",
        "Crime Incident",
        "Other"
    ];

    // Validate Philippine mobile number
    const validatePhilippineMobileNumber = (phoneNumber) => {
        let digits = phoneNumber.toString().replace(/\D/g, '');

        if (!digits) {
            return { valid: false, error: "Contact number is required" };
        }

        if (digits.length === 11 && digits.startsWith('0')) {
            const afterZero = digits.substring(1);
            if (afterZero.length === 10) {
                return { valid: true, cleaned: digits };
            }
        }

        if (digits.length === 12 && digits.startsWith('63')) {
            const afterCountryCode = digits.substring(2);
            if (afterCountryCode.length === 10) {
                return { valid: true, cleaned: '0' + afterCountryCode };
            }
        }

        if (digits.length === 13 && digits.startsWith('639')) {
            const afterCountryCode = digits.substring(3);
            if (afterCountryCode.length === 10) {
                return { valid: true, cleaned: '0' + afterCountryCode };
            }
        }

        if (digits.length === 10 && digits.startsWith('9')) {
            return { valid: false, error: "Missing leading '0'. Please enter 11 digits (e.g., 09123456789)" };
        }

        if (digits.length < 11) {
            return { valid: false, error: `Need ${11 - digits.length} more digit(s). Please enter 11 digits (e.g., 09123456789)` };
        }

        if (digits.length > 13) {
            return { valid: false, error: "Too many digits. Please enter 11 digits (e.g., 09123456789)" };
        }

        return { valid: false, error: "Please enter a valid Philippine mobile number (e.g., 09123456789)" };
    };

    const formatPhoneNumber = (value) => {
        let digits = value.toString().replace(/\D/g, '');
        if (!digits) return '';

        if (digits.startsWith('0') && digits.length <= 11) {
            if (digits.length <= 4) {
                return digits;
            } else if (digits.length <= 7) {
                return `${digits.slice(0, 4)} ${digits.slice(4)}`;
            } else {
                return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
            }
        }

        let formatted = digits;
        if (formatted.startsWith('63') && formatted.length >= 4) {
            formatted = '+' + formatted;
            if (formatted.length >= 8) {
                formatted = `+63 ${formatted.substring(3, 6)} ${formatted.substring(6, 9)} ${formatted.substring(9, 13)}`;
            }
        }

        return formatted.trim();
    };

    const handlePhoneChange = (e) => {
        const rawValue = e.target.value;
        const formattedValue = formatPhoneNumber(rawValue);
        setFormData(prev => ({ ...prev, reporterNumber: formattedValue }));
        if (errors.reporterNumber) {
            setErrors(prev => ({ ...prev, reporterNumber: "" }));
        }
    };

    // Updated validateForm with injection detection
    const validateForm = () => {
        const newErrors = {};

        if (!formData.incidentType || formData.incidentType === "Select incident type") {
            newErrors.incidentType = "Please select an incident type";
        }

        // Check description for injection patterns
        if (!formData.description.trim()) {
            newErrors.description = "Please provide a description";
        } else if (formData.description.length > 500) {
            newErrors.description = "Description must be less than 500 characters";
        } else if (hasInjectionPattern(formData.description)) {
            newErrors.description = "⚠️ Security: Description contains invalid patterns. Please remove special characters like ' , \" , -- , ;";
        }

        // Check name for injection patterns
        if (formData.name && formData.name.trim() && hasInjectionPattern(formData.name)) {
            newErrors.name = "Name contains invalid characters";
        }

        // Validate phone number
        if (!formData.reporterNumber || !formData.reporterNumber.trim()) {
            newErrors.reporterNumber = "Contact number is required";
        } else {
            const phoneValidation = validatePhilippineMobileNumber(formData.reporterNumber);
            if (!phoneValidation.valid) {
                newErrors.reporterNumber = phoneValidation.error;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Updated handleNextStep with sanitization
    const handleNextStep = async () => {
        if (isSubmitting) return;

        if (!validateForm()) {
            alert("⚠️ Please fill in all required fields correctly");
            return;
        }

        setIsSubmitting(true);

        try {
            // Sanitize description and name before saving
            const sanitizedDescription = sanitizeInput(formData.description.trim());
            const sanitizedName = formData.name && formData.name.trim() !== ""
                ? sanitizeInput(formData.name.trim())
                : "Anonymous";

            // Clean the phone number to 11-digit format (09xxxxxxxxx)
            let cleanNumber = formData.reporterNumber.toString().replace(/\s/g, '');
            let digits = cleanNumber.replace(/\D/g, '');

            // Convert to standard 11-digit format
            if (digits.length === 13 && digits.startsWith('639')) {
                cleanNumber = '0' + digits.substring(3);
            } else if (digits.length === 12 && digits.startsWith('63')) {
                if (digits.substring(2).length === 10) {
                    cleanNumber = '0' + digits.substring(2);
                }
            } else if (digits.length === 11 && digits.startsWith('09')) {
                cleanNumber = digits;
            } else if (digits.length === 10 && digits.startsWith('9')) {
                cleanNumber = '0' + digits;
            } else {
                cleanNumber = digits;
            }

            // Only log in development
            if (process.env.NODE_ENV === 'development') {
                console.log("Saving incident report...");
            }

            reportService.saveIncidentDetails({
                type: formData.incidentType,
                victimsAffected: formData.victimsAffected,
                description: sanitizedDescription,
                reporterName: sanitizedName,
                reporterContact: formData.contact,
                reporterNumber: cleanNumber
            });

            navigate("/review");
        } catch (error) {
            console.error("Error saving incident details:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle description change with real-time injection warning
    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, description: value }));

        // Show warning if injection pattern detected
        if (hasInjectionPattern(value)) {
            setShowInjectionWarning(true);
        } else {
            setShowInjectionWarning(false);
        }

        if (errors.description) {
            setErrors(prev => ({ ...prev, description: "" }));
        }
    };

    const handleBack = () => {
        navigate("/addphoto");
    };

    const handleCancel = () => {
        navigate("/civilian-dashboard");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const incrementVictims = () => {
        setFormData(prev => ({ ...prev, victimsAffected: prev.victimsAffected + 1 }));
    };

    const decrementVictims = () => {
        setFormData(prev => ({ ...prev, victimsAffected: Math.max(0, prev.victimsAffected - 1) }));
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full px-3 sm:px-4 pt-3 sm:pt-4 pb-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start">

                    {/* LEFT COLUMN - Steps Panel */}
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
                                            : step.number < 3
                                                ? 'bg-[#15803D] text-white'
                                                : 'bg-[#656363] text-[#FAFAFF]'
                                            }`}>
                                            {step.number}
                                        </div>
                                        <p className={`text-base ${step.active
                                            ? 'text-[#0C7FDA] font-semibold'
                                            : step.number < 3
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
                            <p className="text-[#5D7285] font-light text-sm">Step 3 of 4</p>
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
                                <p className="text-[#262D31] font-semibold text-[32px]">Incident Details</p>
                                <p className="text-[#5D7285] font-light text-base">Step 3 of 4</p>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="flex items-center gap-2 mb-2">
                            <Icon icon="mdi:clipboard-list" width="24" style={{ color: "#0C7FDA" }} />
                            <h2 className="text-[#262D31] font-semibold text-2xl">Incident Details</h2>
                        </div>

                        <p className="text-[#5D7285] font-light text-sm mb-4">
                            Provide accurate information. <span className="text-red-500">*Required fields</span>
                        </p>

                        <div className="bg-white rounded-xl shadow p-4">
                            {/* Incident Type */}
                            <div className="mb-4">
                                <label className="text-[#656363] font-regular text-base block mb-2">Incident type <span className="text-red-500">*</span></label>
                                <select
                                    name="incidentType"
                                    value={formData.incidentType}
                                    onChange={handleChange}
                                    className={`w-full p-3 rounded-lg border ${errors.incidentType ? 'border-red-500' : 'border-[#D3D2DE]'} focus:outline-none focus:border-[#0C7FDA] text-sm`}
                                >
                                    {incidentTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                {errors.incidentType && <p className="text-red-500 text-xs mt-1">{errors.incidentType}</p>}
                            </div>

                            {/* Victims Affected */}
                            <div className="mb-4">
                                <label className="text-[#656363] font-regular text-base block mb-2">Victims affected</label>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={decrementVictims} className="w-10 h-10 rounded-lg border border-[#D3D2DE] flex items-center justify-center text-[#656363] text-xl hover:bg-gray-50">-</button>
                                    <span className="w-16 text-center text-[#262D31] font-semibold text-xl">{formData.victimsAffected}</span>
                                    <button type="button" onClick={incrementVictims} className="w-10 h-10 rounded-lg border border-[#D3D2DE] flex items-center justify-center text-[#656363] text-xl hover:bg-gray-50">+</button>
                                </div>
                            </div>

                            {/* Description - Updated with injection warning */}
                            <div className="mb-4">
                                <label className="text-[#656363] font-regular text-base block mb-2">Description <span className="text-red-500">*</span></label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleDescriptionChange}
                                    rows="3"
                                    maxLength={500}
                                    placeholder="Describe what is happening. (Max 500 characters)"
                                    className={`w-full p-3 rounded-lg border ${errors.description ? 'border-red-500' : 'border-[#D3D2DE]'} focus:outline-none focus:border-[#0C7FDA] text-sm`}
                                />
                                {showInjectionWarning && (
                                    <p className="text-yellow-600 text-xs mt-1">
                                        ⚠️ Avoid using special characters like ' " ; -- in your description for security.
                                    </p>
                                )}
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                <p className="text-gray-400 text-xs mt-1">
                                    {500 - formData.description.length} characters remaining
                                </p>
                            </div>

                            {/* Your Name */}
                            <div className="mb-4">
                                <label className="text-[#656363] font-regular text-base block mb-2">Your Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Juan Dela Cruz"
                                    className="w-full p-3 rounded-lg border border-[#D3D2DE] focus:outline-none focus:border-[#0C7FDA] text-sm bg-gray-50"
                                    disabled={!!fullName}
                                />
                                {fullName && (
                                    <p className="text-green-600 text-xs mt-1">✓ Auto-filled from your account</p>
                                )}
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            {/* Contact Number */}
                            <div className="mb-4">
                                <label className="text-[#656363] font-regular text-base block mb-2">Your Contact Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    name="reporterNumber"
                                    value={formData.reporterNumber}
                                    onChange={handlePhoneChange}
                                    placeholder="09123456789"
                                    className={`w-full p-3 rounded-lg border ${errors.reporterNumber ? 'border-red-500' : 'border-[#D3D2DE]'} focus:outline-none focus:border-[#0C7FDA] text-sm bg-gray-50`}
                                    disabled={!!user.phoneNumber}
                                />
                                {errors.reporterNumber && <p className="text-red-500 text-xs mt-1">{errors.reporterNumber}</p>}
                                {user.phoneNumber && (
                                    <p className="text-green-600 text-xs mt-1">✓ Auto-filled from your account</p>
                                )}
                                <p className="text-gray-400 text-xs mt-1">Enter 11-digit mobile number (e.g., 09123456789)</p>
                            </div>

                            {/* Info Box */}
                            <div className="flex items-start gap-2 p-3 bg-[#EFF8FF] rounded-lg mb-6">
                                <Icon icon="material-symbols:info" width="18" style={{ color: "#0C7FDA" }} className="flex-shrink-0 mt-0.5" />
                                <p className="text-[#8A8888] font-normal text-xs">
                                    🔒 Your information is secure. All inputs are validated and sanitized to prevent injection attacks.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse gap-3">
                                <button onClick={handleCancel} className="text-[#656363] font-normal text-lg hover:text-gray-800 transition py-2">Cancel</button>
                                <button
                                    onClick={handleNextStep}
                                    disabled={isSubmitting}
                                    className={`w-full font-normal text-lg py-3 rounded-lg transition ${isSubmitting
                                        ? 'bg-gray-400 text-white cursor-not-allowed'
                                        : 'bg-[#C6E6FF] text-[#656363] hover:bg-blue-200'
                                        }`}
                                >
                                    {isSubmitting ? 'Saving...' : 'Next Step →'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}