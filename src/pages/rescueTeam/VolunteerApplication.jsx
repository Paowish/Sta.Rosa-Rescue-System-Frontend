import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { volunteerService, authService } from "../../services/api";

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
      {/* Predefined Certifications */}
      {[
        "CPR(Cardiopulmonary Resuscitation)",
        "ACLS (Advanced Cardiac Life Support)",
        "BLS (Basic Life Support)",
        "First Aid Support"
      ].map((cert) => (
        <label key={cert} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected.includes(cert)}
            onChange={() => handleCheck(cert)}
          />
          {cert}
        </label>
      ))}

      {/* Others Option */}
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

      {/* Custom Certification Input */}
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
 * Volunteer Application Component
 * Allows users to submit volunteer applications with certifications and documents
 */
export default function VolunteerApplication() {
  const navigate = useNavigate();

  // State for certifications
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [othersCert, setOthersCert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for file uploads
  const [filePreviews, setFilePreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // State for birthday and validation
  const [birthday, setBirthday] = useState("");
  const [ageError, setAgeError] = useState("");

  // State for user data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // State for additional volunteer info
  const [experience, setExperience] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  /**
   * Calculate age from birthday
   */
  const calculateAge = (birthdayDate) => {
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
   * Validate age (18-50)
   */
  const validateAge = (birthdayDate) => {
    if (!birthdayDate) return false;
    const age = calculateAge(birthdayDate);
    if (age < 18) {
      setAgeError("❌ You must be at least 18 years old to volunteer");
      return false;
    }
    if (age > 50) {
      setAgeError("❌ Maximum age for volunteers is 50 years old");
      return false;
    }
    setAgeError("");
    return true;
  };

  /**
   * Handle birthday change
   */
  const handleBirthdayChange = (e) => {
    const value = e.target.value;
    setBirthday(value);
    validateAge(value);
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    const previews = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type
    }));
    setFilePreviews(previews);
  };

  /**
   * Remove file from selection
   */
  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...filePreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  /**
   * Load user data from localStorage and pre-fill from signup
   */
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check for pre-filled data from signup
        const savedVolunteerData = localStorage.getItem('volunteerApplicationData');
        if (savedVolunteerData) {
          const volunteerData = JSON.parse(savedVolunteerData);
          console.log("Pre-filled volunteer data:", volunteerData);

          setFirstName(volunteerData.firstName || "");
          setLastName(volunteerData.lastName || "");
          setEmail(volunteerData.email || "");
          setPhone(volunteerData.phoneNumber || "");
          setBirthday(volunteerData.birthday || "");
          setExperience(volunteerData.yearsOfExperience || "");
          setAddress1(volunteerData.address1 || "");
          setAddress2(volunteerData.address2 || "");
          setSelectedCerts(volunteerData.certifications || []);

          // Clear the saved data after loading
          localStorage.removeItem('volunteerApplicationData');
          setLoading(false);
          return;
        }

        // If no pre-filled data, load from user account
        let user = localStorage.getItem('user');
        let userData = null;

        if (user) {
          userData = JSON.parse(user);
          console.log("User from localStorage:", userData);
        }

        if (!userData || !userData.firstName) {
          try {
            const response = await authService.getCurrentUser();
            if (response && response.success) {
              userData = response.data;
              console.log("User from API:", userData);
            }
          } catch (err) {
            console.log("Not logged in or token expired");
          }
        }

        if (userData) {
          setFirstName(userData.firstName || "");
          setLastName(userData.lastName || "");
          setEmail(userData.email || "");
          setPhone(userData.phoneNumber || "");
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate age before submitting
    if (!validateAge(birthday)) {
      alert(ageError);
      return;
    }

    setSubmitting(true);

    try {
      const finalCertifications = [
        ...selectedCerts,
        ...(othersCert ? [othersCert] : []),
      ];

      let userData = null;
      const user = localStorage.getItem('user');
      if (user) {
        userData = JSON.parse(user);
      }

      const applicationData = {
        firstName: userData?.firstName || firstName,
        lastName: userData?.lastName || lastName,
        email: userData?.email || email,
        phoneNumber: userData?.phoneNumber || phone,
        age: calculateAge(birthday),
        birthday: birthday,
        yearsOfExperience: experience,
        address1: address1,
        address2: address2,
        certifications: finalCertifications,
        status: "pending"
      };

      console.log("Submitting application:", applicationData);

      const response = await volunteerService.submitApplication(applicationData);

      if (response && response.success) {
        alert("Application submitted successfully! The admin will review your application.");
        navigate("/login");
      } else {
        alert("Failed to submit application");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle logo click navigation
   */
  const handleLogoClick = () => {
    navigate("/");
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#eef2f6] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef2f6] px-4 sm:px-6 md:px-10 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Logo */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 mb-8 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img src="src/assets/logo.png" alt="logo" className="h-10 w-10 object-cover" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E252B]">
            Rescue Team
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Column - Application Form */}
          <div className="w-full max-w-xl mx-auto md:mx-0">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1E252B] mb-2 -mt-[34px]">
              Complete Your Application
            </h2>
            <p className="text-gray-500 text-sm md:text-base mb-6">
              Please review and complete your volunteer application.
            </p>

            <form className="space-y-2" onSubmit={handleSubmit}>
              {/* Read-only User Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Your Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Volunteer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Birthday */}
                <div className="w-full">
                  <fieldset className={`border-2 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500 ${ageError ? 'border-red-500' : 'border-gray-400'
                    }`}>
                    <legend className="text-sm px-2 text-gray-700">Birthday</legend>
                    <input
                      type="date"
                      value={birthday}
                      onChange={handleBirthdayChange}
                      className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                      required
                    />
                  </fieldset>
                  {ageError && <p className="text-red-500 text-xs mt-1">{ageError}</p>}
                  <p className="text-gray-400 text-xs mt-1">Age must be between 18 and 50 years old</p>
                </div>

                {/* Years of Experience */}
                <div className="w-full">
                  <fieldset className="border-2 border-gray-400 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500">
                    <legend className="text-sm px-2 text-gray-700">Years of Experience</legend>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 2 years"
                      className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                      required
                    />
                  </fieldset>
                </div>

                {/* Address 1 */}
                <div className="w-full">
                  <fieldset className="border-2 border-gray-400 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500">
                    <legend className="text-sm px-2 text-gray-700">Address 1</legend>
                    <input
                      type="text"
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      placeholder="Street, Barangay"
                      className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                      required
                    />
                  </fieldset>
                </div>

                {/* Address 2 */}
                <div className="w-full">
                  <fieldset className="border-2 border-gray-400 rounded-lg px-4 pt-2 pb-2 bg-[#F3F6FA] focus-within:border-blue-500">
                    <legend className="text-sm px-2 text-gray-700">Address 2</legend>
                    <input
                      type="text"
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      placeholder="Street, Barangay (optional)"
                      className="w-full bg-transparent outline-none placeholder-gray-400 text-sm sm:text-base"
                    />
                  </fieldset>
                </div>
              </div>

              {/* Certifications */}
              <div className="w-full">
                <fieldset className="border-2 border-gray-400 rounded-lg px-4 pt-3 pb-4 bg-[#F3F6FA] focus-within:border-blue-500">
                  <legend className="text-sm px-2 text-gray-700">
                    Certifications (Select all that apply)
                  </legend>
                  <Certifications
                    selected={selectedCerts}
                    setSelected={setSelectedCerts}
                    others={othersCert}
                    setOthers={setOthersCert}
                  />
                </fieldset>
              </div>

              {/* File Upload */}
              <div className="border-dashed border-2 rounded-md p-6 text-center text-sm border-gray-400">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <p className="text-gray-500 mt-2">Click to upload or drag and drop additional files here.</p>
              </div>

              {/* File Previews */}
              {filePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {filePreviews.map((preview, idx) => (
                    <div key={idx} className="relative border rounded-lg p-2 bg-white">
                      {preview.type.startsWith('image/') ? (
                        <img src={preview.url} alt="Preview" className="w-full h-24 object-cover rounded" />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 flex items-center justify-center rounded">
                          <span className="text-xs text-gray-500">
                            📄 {preview.name.length > 15 ? preview.name.substring(0, 15) + '...' : preview.name}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </div>

          {/* Right Column - Image */}
          <div className="hidden md:block">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img src="src/assets/aso.jpg" alt="building" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}