import { useState, useRef, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { authService, volunteerService } from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import LegalPolicyModal from "./LegalPolicyModal";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

/**
 * Certifications Component
 * Allows users to select certifications with "Others" option
 */
function Certifications({ selected, setSelected, others, setOthers }) {
  const [othersChecked, setOthersChecked] = useState(false);

  const handleCheck = (value) => {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      {["CPR(Cardiopulmonary Resuscitation)", "ACLS (Advanced Cardiac Life Support)", "BLS (Basic Life Support)", "First Aid Support"].map((cert) => (
        <label key={cert} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected.includes(cert)}
            onChange={() => handleCheck(cert)}
          />
          {cert}
        </label>
      ))}

      <label className="col-span-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={othersChecked}
          onChange={(e) => {
            setOthersChecked(e.target.checked);
            if (!e.target.checked) setOthers("");
          }}
        />
        Others
      </label>

      {othersChecked && (
        <input
          type="text"
          placeholder="Enter certification"
          value={others}
          onChange={(e) => setOthers(e.target.value)}
          className="col-span-2 border p-2 rounded-md mt-2"
        />
      )}
    </div>
  );
}

/**
 * Password Strength Component
 * Displays password strength indicator and requirements checklist
 */
function PasswordStrength({ password }) {
  const [strength, setStrength] = useState({ score: 0, label: "", color: "" });

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, label: "No password", color: "bg-gray-300" });
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let label = "";
    let color = "";
    let bgColor = "";

    if (score <= 2) {
      label = "Weak";
      color = "text-red-500";
      bgColor = "bg-red-500";
    } else if (score <= 4) {
      label = "Fair";
      color = "text-yellow-500";
      bgColor = "bg-yellow-500";
    } else if (score <= 5) {
      label = "Good";
      color = "text-blue-500";
      bgColor = "bg-blue-500";
    } else {
      label = "Strong";
      color = "text-green-500";
      bgColor = "bg-green-500";
    }

    setStrength({ score: Math.min(score, 6), label, color, bgColor });
  }, [password]);

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${index <= strength.score ? strength.bgColor : 'bg-gray-200'
              }`}
          />
        ))}
      </div>
      {password && (
        <p className={`text-xs mt-1 font-medium ${strength.color}`}>
          {strength.label}
          {strength.score > 0 && ` (${strength.score}/6)`}
        </p>
      )}
      <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mt-2">
        <div className={`flex items-center gap-1 ${password && password.length >= 8 ? 'text-green-500' : ''}`}>
          <span>{password && password.length >= 8 ? '✅' : '⬜'}</span> Min 8 characters
        </div>
        <div className={`flex items-center gap-1 ${password && /[A-Z]/.test(password) ? 'text-green-500' : ''}`}>
          <span>{password && /[A-Z]/.test(password) ? '✅' : '⬜'}</span> Uppercase letter
        </div>
        <div className={`flex items-center gap-1 ${password && /[a-z]/.test(password) ? 'text-green-500' : ''}`}>
          <span>{password && /[a-z]/.test(password) ? '✅' : '⬜'}</span> Lowercase letter
        </div>
        <div className={`flex items-center gap-1 ${password && /[0-9]/.test(password) ? 'text-green-500' : ''}`}>
          <span>{password && /[0-9]/.test(password) ? '✅' : '⬜'}</span> Number
        </div>
        <div className={`flex items-center gap-1 col-span-2 ${password && /[^A-Za-z0-9]/.test(password) ? 'text-green-500' : ''}`}>
          <span>{password && /[^A-Za-z0-9]/.test(password) ? '✅' : '⬜'}</span> Special character (!@#$%^&*)
        </div>
      </div>
    </div>
  );
}

/**
 * Terms Modal Component
 * Displays terms acceptance requirement
 */
function TermsModal({ isOpen, onClose, onAccept }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Terms & Privacy Required</h3>
          <p className="text-sm text-gray-600 mt-2">
            Please accept the Terms of Service and Privacy Policy to continue with your registration.
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Accept Terms
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Success Modal Component
 * Displays successful registration message
 */
function SuccessModal({ isOpen, onClose, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Registration Successful!</h3>
          <p className="text-sm text-gray-600 mt-2">{message}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Error Modal Component
 * Displays registration error messages
 */
function ErrorModal({ isOpen, onClose, errorMessage }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Registration Failed</h3>
          <p className="text-sm text-gray-600 mt-2">{errorMessage}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/**
 * Info Modal Component
 * Displays informational messages and validation errors
 */
function InfoModal({ isOpen, onClose, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600 mt-2">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          OK
        </button>
      </div>
    </div>
  );
}

/**
 * Full Screen Spinner Component
 * Displays loading overlay during registration
 */
function FullScreenSpinner() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-700 font-medium text-lg">Creating your account...</p>
        <p className="text-gray-400 text-sm">Please wait while we set everything up</p>
      </div>
    </div>
  );
}

/**
 * Signup Component
 * User registration page with role-based forms and Google OAuth
 */
export default function Signup() {
  // UI state
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [ageError, setAgeError] = useState("");

  // Modal states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [infoModalData, setInfoModalData] = useState({ title: '', message: '' });
  const [successMessage, setSuccessMessage] = useState("");
  const [legalType, setLegalType] = useState("terms");

  // Account fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+63");
  const [selectedRole, setSelectedRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Volunteer specific fields
  const [birthday, setBirthday] = useState("");
  const [experience, setExperience] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [othersCert, setOthersCert] = useState("");
  const [availability, setAvailability] = useState([]);
  const [description, setDescription] = useState("");

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const phoneInputRef = useRef(null);

  /**
   * Auto-redirect after successful signup
   */
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        handleSuccessNavigate();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  /**
   * Handle Google OAuth signup success
   */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await authService.googleLogin(credentialResponse.credential);

      if (res.success) {
        const userToStore = {
          id: res.user._id,
          firstName: res.user.firstName,
          lastName: res.user.lastName,
          email: res.user.email,
          role: res.user.role,
          profileImage: res.user.profileImage
        };

        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(userToStore));
        localStorage.setItem('userRole', userToStore.role);

        if (res.isNewUser) {
          setSuccessMessage("Successfully signed up with Google!");
          setShowSuccessModal(true);
        } else {
          handleSuccessNavigate();
        }
      }
    } catch (err) {
      console.error("Google signup error:", err);
      setError("Google signup failed on the server.");
      setShowErrorModal(true);
    }
  };

  /**
   * Validate email address format
   */
  const validateEmail = (email) => {
    if (!email || !email.trim()) {
      return { valid: false, error: "Email is required" };
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(trimmedEmail)) {
      return { valid: false, error: "Please enter a valid email address (e.g., name@domain.com)" };
    }

    const domain = trimmedEmail.split('@')[1];
    const validTLDs = ['com', 'org', 'net', 'edu', 'gov', 'ph', 'io', 'co', 'uk', 'au', 'ca', 'de', 'fr', 'jp', 'cn', 'in', 'br', 'mx', 'it', 'es'];
    const tld = domain.split('.').pop().toLowerCase();

    if (!validTLDs.includes(tld)) {
      const commonTypos = {
        'cmo': 'com',
        'con': 'com',
        'ocm': 'com',
        'ogm': 'com',
        'coom': 'com',
        'om': 'com',
        'c0m': 'com',
        'xom': 'com',
        'vom': 'com',
        'gom': 'com'
      };

      if (commonTypos[tld]) {
        return { valid: false, error: `Invalid email domain. Did you mean .${commonTypos[tld]}?` };
      }

      return { valid: false, error: `Please enter a valid email address with a proper domain (e.g., .com, .org, .net, .ph)` };
    }

    return { valid: true, error: null };
  };

  /**
   * Handle phone number change with formatting and validation
   */
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    let digits = value.replace(/\D/g, '');

    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    if (digits.startsWith('63')) {
      digits = digits.substring(2);
    }
    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }

    let formattedValue = '+63';
    if (digits.length > 0) {
      if (digits.length <= 3) {
        formattedValue += ' ' + digits;
      } else if (digits.length <= 6) {
        formattedValue += ' ' + digits.slice(0, 3) + ' ' + digits.slice(3);
      } else {
        formattedValue += ' ' + digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6, 10);
      }
    }

    setPhone(formattedValue);

    // Validate phone number
    if (digits.length === 0) {
      setValidationErrors(prev => ({ ...prev, phone: "Phone number is required" }));
    } else if (!digits.startsWith('9')) {
      setValidationErrors(prev => ({ ...prev, phone: "❌ Phone number must start with 9 (e.g., +63 912 345 6789)" }));
    } else if (digits.length < 10) {
      setValidationErrors(prev => ({ ...prev, phone: `Need ${10 - digits.length} more digit(s) (${digits.length}/10 digits)` }));
    } else if (digits.length === 10 && digits.startsWith('9')) {
      setValidationErrors(prev => ({ ...prev, phone: null }));
    }
  };

  /**
   * Set cursor position on phone input focus
   */
  useEffect(() => {
    if (phoneInputRef.current) {
      phoneInputRef.current.setSelectionRange(3, 3);
    }
  }, []);

  const handlePhoneFocus = (e) => {
    if (e.target.value === '+63') {
      setTimeout(() => {
        e.target.setSelectionRange(3, 3);
      }, 0);
    }
  };

  /**
   * Validate signup form
   */
  const validateSignupForm = () => {
    const errors = {};

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error;
    }

    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (firstName.length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (lastName.length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    const digitsAfter63 = phone.replace('+63', '').replace(/\D/g, '');
    if (!phone.trim() || phone === '+63') {
      errors.phone = "Phone number is required";
    } else if (!digitsAfter63.startsWith('9')) {
      errors.phone = "Phone number must start with 9 (e.g., +63 912 345 6789)";
    } else if (digitsAfter63.length !== 10) {
      errors.phone = `Phone number must have exactly 10 digits after +63 (you have ${digitsAfter63.length} digits)`;
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Password must contain an uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      errors.password = "Password must contain a lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      errors.password = "Password must contain a number";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      errors.password = "Password must contain a special character (!@#$%^&*)";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!selectedRole) {
      errors.role = "Please select a role";
    }

    // Volunteer-specific validations
    if (selectedRole === "volunteer") {
      if (!birthday) {
        errors.birthday = "Birthday is required";
      }
      if (!experience) {
        errors.experience = "Years of experience is required";
      }
      if (!address1.trim()) {
        errors.address1 = "Address is required";
      }
      if (availability.length === 0) {
        errors.availability = "Please select at least one availability day";
      }
      if (!description.trim()) {
        errors.description = "Please provide a brief description about yourself";
      }
      const allCerts = [...selectedCerts, ...(othersCert ? [othersCert] : [])];
      if (allCerts.length === 0) {
        errors.certifications = "At least one certification is required";
      }
      if (selectedFiles.length === 0) {
        errors.files = "Please upload at least one document";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Calculate age from birthday
   */
  const calculateAge = (birthdayDate) => {
    if (!birthdayDate) return 0;
    const today = new Date();
    const birthDate = new Date(birthdayDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  /**
   * Validate age requirement
   */
  const validateAge = (birthdayDate) => {
    if (!birthdayDate) {
      setAgeError("");
      return true;
    }
    const age = calculateAge(birthdayDate);
    if (age < 18) {
      setAgeError("❌ You must be at least 18 years old to apply as a volunteer");
      return false;
    }
    if (age > 50) {
      setAgeError("❌ Maximum age for volunteers is 50 years old");
      return false;
    }
    setAgeError("");
    return true;
  };

  const handleBirthdayChange = (e) => {
    const value = e.target.value;
    setBirthday(value);
    validateAge(value);
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    setShowVolunteerForm(role === "volunteer");
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setInfoModalData({
        title: 'Invalid File Type',
        message: 'Please upload only images (JPG, PNG), PDF, or Word documents.'
      });
      setShowInfoModal(true);
      e.target.value = '';
      return;
    }

    setSelectedFiles(files);

    const previews = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      size: file.size
    }));
    setFilePreviews(previews);

    if (validationErrors.files) {
      setValidationErrors({ ...validationErrors, files: null });
    }
  };

  const removeFile = (index) => {
    if (filePreviews[index]?.url) {
      URL.revokeObjectURL(filePreviews[index].url);
    }
    const newFiles = [...selectedFiles];
    const newPreviews = [...filePreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const toggleAvailability = (day) => {
    setAvailability(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
  };

  const showValidationErrors = () => {
    const errorMessages = Object.values(validationErrors).filter(Boolean);
    if (errorMessages.length > 0) {
      setInfoModalData({
        title: 'Please Fix the Following Issues',
        message: errorMessages.join('\n')
      });
      setShowInfoModal(true);
    }
  };

  const openTerms = () => {
    setLegalType("terms");
    setShowLegalModal(true);
  };

  const openPrivacy = () => {
    setLegalType("privacy");
    setShowLegalModal(true);
  };

  /**
   * Handle signup submission
   */
  const handleSignup = async () => {
    if (!validateSignupForm()) {
      showValidationErrors();
      return;
    }

    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }

    if (selectedRole === "volunteer" && !validateAge(birthday)) {
      setInfoModalData({
        title: 'Age Requirement',
        message: ageError
      });
      setShowInfoModal(true);
      return;
    }

    setLoading(true);
    setError("");

    // Simulate delay for spinner
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      let response;

      if (selectedRole === "volunteer") {
        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('email', email);
        formData.append('phoneNumber', phone.replace(/\D/g, ''));
        formData.append('password', password);
        formData.append('role', selectedRole);
        formData.append('birthday', birthday);
        formData.append('yearsOfExperience', experience);
        formData.append('address1', address1);
        formData.append('address2', address2 || '');
        formData.append('certifications', JSON.stringify([...selectedCerts, ...(othersCert ? [othersCert] : [])]));
        formData.append('availability', JSON.stringify(availability));
        formData.append('description', description);

        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });

        console.log("📤 Sending FormData with files:", selectedFiles.length);
        response = await authService.registerWithFormData(formData);
      } else {
        const jsonData = {
          firstName,
          lastName,
          email,
          phoneNumber: phone.replace(/\D/g, ''),
          password,
          role: selectedRole
        };
        response = await authService.register(jsonData);
      }

      if (response.success) {
        const userToStore = {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          role: response.user.role,
          phoneNumber: response.user.phoneNumber || "",
          profileImage: response.user.profileImage || ""
        };
        localStorage.setItem('user', JSON.stringify(userToStore));
        localStorage.setItem('userRole', response.user.role);

        setSuccessMessage(
          selectedRole === "volunteer"
            ? "Your volunteer application has been submitted for review. You will receive an email once approved."
            : "Your account has been created successfully!"
        );
        setShowSuccessModal(true);
        setLoading(false);
      }
    } catch (err) {
      console.error("Signup error:", err);
      let errorMsg = "Signup failed. Please try again.";
      if (err.response && err.response.errors) {
        errorMsg = err.response.errors.map(e => `${e.field}: ${e.message}`).join(", ");
      } else if (err.response && err.response.message) {
        errorMsg = err.response.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      setShowErrorModal(true);
      setLoading(false);
    }
  };

  /**
   * Navigate to appropriate dashboard based on user role
   */
  const handleSuccessNavigate = () => {
    const role = localStorage.getItem('userRole');
    const roleRoutes = {
      civilian: "/overview",
      volunteer: "/volunteer-dashboard",
      responder: "/dashboard",
      dispatcher: "/dashboard",
      admin: "/admin/overview"
    };
    navigate(roleRoutes[role] || "/login");
  };

  // Show full screen spinner when loading
  if (loading) {
    return <FullScreenSpinner />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="signup-page"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="min-h-screen bg-[#f4f5f7] flex items-center justify-center px-4 sm:px-6 md:px-10 py-6 font-Roboto"
      >
        {/* Modals */}
        <TermsModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          onAccept={handleAcceptTerms}
        />
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message={successMessage}
        />
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          errorMessage={error}
        />
        <InfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          title={infoModalData.title}
          message={infoModalData.message}
        />

        <div className="p-6 sm:p-8 md:p-10 max-w-4xl w-full">
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link to="/login" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="logo" className="h-10 w-10 object-cover" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E252B]">
                Rescue Team
              </h1>
            </Link>
          </div>

          <h2 className="text-4xl font-bold text-[#1E252B] font-serif mb-2">Sign up</h2>
          <p className="text-gray-500 text-sm mb-6">
            Register your credentials to join the Santa Rosa Rescue Team operations network.
          </p>

          {/* Google Signup Note */}
          <div className="w-full mb-2">
            <p className="text-[11px] text-center text-gray-500">
              *Using Google Sign-Up will automatically create a <span className="font-bold text-blue-600">Civilian</span> account.
            </p>
          </div>

          {/* Google Signup Button */}
          <div className="w-full mb-6 flex justify-center">
            <GoogleLogin
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
              width="250"
              onSuccess={handleGoogleSuccess}
              onError={() => console.log('Login Failed')}
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <hr className="w-full border-gray-300" />
            <span className="text-sm text-gray-500 font-medium shrink-0">OR</span>
            <hr className="w-full border-gray-300" />
          </div>

          {/* Registration Form */}
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
            {/* Row 1: First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${validationErrors.firstName ? 'border-red-500' : 'border-gray-400'
                  }`}>
                  <legend className="text-sm px-2 text-gray-700">First Name</legend>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (validationErrors.firstName) {
                        setValidationErrors({ ...validationErrors, firstName: null });
                      }
                    }}
                    placeholder="John"
                    className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                    required
                  />
                </fieldset>
                {validationErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
                )}
              </div>

              <div className="w-full">
                <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${validationErrors.lastName ? 'border-red-500' : 'border-gray-400'
                  }`}>
                  <legend className="text-sm px-2 text-gray-700">Last Name</legend>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (validationErrors.lastName) {
                        setValidationErrors({ ...validationErrors, lastName: null });
                      }
                    }}
                    placeholder="Doe"
                    className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                    required
                  />
                </fieldset>
                {validationErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${validationErrors.email ? 'border-red-500' : 'border-gray-400'
                  }`}>
                  <legend className="text-sm px-2 text-gray-700">Email</legend>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationErrors.email) {
                        setValidationErrors({ ...validationErrors, email: null });
                      }
                    }}
                    placeholder="john.doe@gmail.com"
                    className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                    required
                  />
                </fieldset>
                {validationErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                )}
              </div>

              <div className="w-full">
                <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${validationErrors.phone ? 'border-red-500' : 'border-gray-400'
                  }`}>
                  <legend className="text-sm px-2 text-gray-700">Phone Number</legend>
                  <div className="flex items-center">
                    <span className="text-gray-500 font-medium mr-1">+63</span>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      value={phone.replace('+63', '').trim()}
                      onChange={handlePhoneChange}
                      onFocus={handlePhoneFocus}
                      placeholder="912 345 6789"
                      className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                      required
                      maxLength={13}
                    />
                  </div>
                </fieldset>
                <p className="text-gray-400 text-xs mt-1">
                  Must start with <strong>9</strong> and have exactly 10 digits (e.g., 912 345 6789)
                </p>
                {validationErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div className="w-full">
              <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${validationErrors.role ? 'border-red-500' : 'border-gray-400'
                }`}>
                <legend className="text-sm px-2 text-gray-700">Role / Position</legend>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    handleRoleChange(e);
                    if (validationErrors.role) {
                      setValidationErrors({ ...validationErrors, role: null });
                    }
                  }}
                  className="w-full bg-transparent outline-none text-gray-600"
                  required
                >
                  <option value="">- Select Role / Position -</option>
                  <option value="civilian">Civilian</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </fieldset>
              {validationErrors.role && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.role}</p>
              )}
            </div>

            {/* Volunteer Additional Fields */}
            {showVolunteerForm && (
              <div className="space-y-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
                <p className="text-sm font-semibold text-blue-700 mb-2">Volunteer Information (Required)</p>
                <p className="text-xs text-gray-500 -mt-2">Age requirement: 18 - 50 years old</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-white ${ageError ? 'border-red-500' : validationErrors.birthday ? 'border-red-500' : 'border-gray-400'
                      }`}>
                      <legend className="text-sm px-2 text-gray-700">Birthday</legend>
                      <input
                        type="date"
                        value={birthday}
                        onChange={handleBirthdayChange}
                        className="w-full bg-transparent outline-none"
                        required
                      />
                    </fieldset>
                    {ageError && <p className="text-red-500 text-xs mt-1">{ageError}</p>}
                    {validationErrors.birthday && <p className="text-red-500 text-xs mt-1">{validationErrors.birthday}</p>}
                  </div>

                  <div>
                    <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-white ${validationErrors.experience ? 'border-red-500' : 'border-gray-400'
                      }`}>
                      <legend className="text-sm px-2 text-gray-700">Years of Experience</legend>
                      <select
                        value={experience}
                        onChange={(e) => {
                          setExperience(e.target.value);
                          if (validationErrors.experience) {
                            setValidationErrors({ ...validationErrors, experience: null });
                          }
                        }}
                        className="w-full bg-transparent outline-none text-gray-700"
                        required
                      >
                        <option value="">Select experience</option>
                        <option value="0">Less than 1 year</option>
                        <option value="1">1 year</option>
                        <option value="2">2 years</option>
                        <option value="3">3 years</option>
                        <option value="4">4 years</option>
                        <option value="5">5 years</option>
                        <option value="6">6 years</option>
                        <option value="7">7 years</option>
                        <option value="8">8 years</option>
                        <option value="9">9 years</option>
                        <option value="10">10+ years</option>
                      </select>
                    </fieldset>
                    {validationErrors.experience && <p className="text-red-500 text-xs mt-1">{validationErrors.experience}</p>}
                  </div>

                  <div>
                    <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-white ${validationErrors.address1 ? 'border-red-500' : 'border-gray-400'
                      }`}>
                      <legend className="text-sm px-2 text-gray-700">Address 1</legend>
                      <input
                        type="text"
                        value={address1}
                        onChange={(e) => {
                          setAddress1(e.target.value);
                          if (validationErrors.address1) {
                            setValidationErrors({ ...validationErrors, address1: null });
                          }
                        }}
                        placeholder="Street, Barangay"
                        className="w-full bg-transparent outline-none"
                        required
                      />
                    </fieldset>
                    {validationErrors.address1 && <p className="text-red-500 text-xs mt-1">{validationErrors.address1}</p>}
                  </div>

                  <div>
                    <fieldset className="border-2 border-gray-400 rounded-lg px-4 pt-2 pb-2 bg-white">
                      <legend className="text-sm px-2 text-gray-700">Address 2</legend>
                      <input
                        type="text"
                        value={address2}
                        onChange={(e) => setAddress2(e.target.value)}
                        placeholder="Street, Barangay (optional)"
                        className="w-full bg-transparent outline-none"
                      />
                    </fieldset>
                  </div>
                </div>

                {/* Availability Selection */}
                <div>
                  <fieldset className={`border-2 rounded-lg px-4 pt-3 pb-4 bg-white ${validationErrors.availability ? 'border-red-500' : 'border-gray-400'
                    }`}>
                    <legend className="text-sm px-2 text-gray-700">Availability <span className="text-red-500">*</span></legend>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <label key={day} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={availability.includes(day)}
                            onChange={() => toggleAvailability(day)}
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {validationErrors.availability && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.availability}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <fieldset className={`border-2 rounded-lg px-4 pt-3 pb-4 bg-white ${validationErrors.description ? 'border-red-500' : 'border-gray-400'
                    }`}>
                    <legend className="text-sm px-2 text-gray-700">Description <span className="text-red-500">*</span></legend>
                    <textarea
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (validationErrors.description) {
                          setValidationErrors({ ...validationErrors, description: null });
                        }
                      }}
                      rows="4"
                      placeholder="Tell us a little about yourself, your experience, and why you want to volunteer..."
                      className="w-full bg-transparent outline-none resize-none"
                      required
                    />
                  </fieldset>
                  {validationErrors.description && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
                  )}
                </div>

                {/* Certifications */}
                <div>
                  <fieldset className={`border-2 rounded-lg px-4 pt-3 pb-4 bg-white ${validationErrors.certifications ? 'border-red-500' : 'border-gray-400'
                    }`}>
                    <legend className="text-sm px-2 text-gray-700">Certifications <span className="text-red-500">*</span></legend>
                    <Certifications
                      selected={selectedCerts}
                      setSelected={setSelectedCerts}
                      others={othersCert}
                      setOthers={setOthersCert}
                    />
                  </fieldset>
                  {validationErrors.certifications && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.certifications}</p>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <div className={`border-2 border-dashed rounded-lg p-4 bg-white ${validationErrors.files ? 'border-red-500' : 'border-gray-400'
                    }`}>
                    <p className="text-sm text-gray-700 mb-2">Upload Documents <span className="text-red-500">*</span></p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      onChange={handleFileChange}
                      className="w-full text-sm"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    />
                    <p className="text-gray-400 text-xs mt-2">
                      Upload your resume, certificates, or any supporting documents (Required)
                    </p>
                    <p className="text-gray-400 text-xs">
                      Accepted: JPG, PNG, PDF, DOC, DOCX (Max 5MB per file)
                    </p>
                  </div>
                  {validationErrors.files && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.files}</p>
                  )}
                </div>

                {/* File Previews */}
                {filePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filePreviews.map((preview, idx) => (
                      <div key={idx} className="relative border rounded-lg p-2 bg-white">
                        {preview.type.startsWith('image/') ? (
                          <img src={preview.url} alt="Preview" className="w-full h-20 object-cover rounded" />
                        ) : preview.type === 'application/pdf' ? (
                          <div className="w-full h-20 bg-red-50 flex flex-col items-center justify-center rounded">
                            <span className="text-3xl">📄</span>
                            <span className="text-xs text-gray-500 text-center truncate w-full px-1">
                              {preview.name.length > 15 ? preview.name.substring(0, 15) + '...' : preview.name}
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-20 bg-blue-50 flex flex-col items-center justify-center rounded">
                            <span className="text-3xl">📝</span>
                            <span className="text-xs text-gray-500 text-center truncate w-full px-1">
                              {preview.name.length > 15 ? preview.name.substring(0, 15) + '...' : preview.name}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Password Section */}
            <div className="w-full">
              <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${validationErrors.password ? 'border-red-500' : 'border-gray-400'
                }`}>
                <legend className="text-sm px-2 text-gray-700">Password</legend>
                <div className="flex items-center">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationErrors.password) {
                        setValidationErrors({ ...validationErrors, password: null });
                      }
                    }}
                    placeholder="••••••••"
                    className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                    required
                  />
                  <span onClick={() => setShowPass(!showPass)} className="cursor-pointer text-gray-500 ml-2">
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </fieldset>
              {validationErrors.password && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
              )}
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div className="w-full">
              <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-400'
                }`}>
                <legend className="text-sm px-2 text-gray-700">Confirm Password</legend>
                <div className="flex items-center">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (validationErrors.confirmPassword) {
                        setValidationErrors({ ...validationErrors, confirmPassword: null });
                      }
                    }}
                    placeholder="••••••••"
                    className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                    required
                  />
                  <span onClick={() => setShowConfirm(!showConfirm)} className="cursor-pointer text-gray-500 ml-2">
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </fieldset>
              {validationErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span>
                I agree to all the{" "}
                <span onClick={(e) => { e.preventDefault(); openTerms(); }} className="text-red-500 cursor-pointer hover:underline">
                  Terms
                </span>{" "}
                and{" "}
                <span onClick={(e) => { e.preventDefault(); openPrivacy(); }} className="text-red-500 cursor-pointer hover:underline">
                  Privacy Policies
                </span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?
              <Link to="/login" className="text-red-500 ml-1 cursor-pointer hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>

        {/* Legal Policy Modal */}
        <LegalPolicyModal
          isOpen={showLegalModal}
          onClose={() => setShowLegalModal(false)}
          type={legalType}
        />
      </motion.div>
    </AnimatePresence>
  );
}