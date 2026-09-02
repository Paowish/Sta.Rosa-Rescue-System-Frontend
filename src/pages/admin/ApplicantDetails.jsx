import { useParams, useNavigate } from 'react-router-dom';

/**
 * Section Component - Displays a labeled section with content
 */
function Section({ title, children }) {
  return (
    <div className="border-t border-[#DFDFF0]">
      <div className="bg-[#EBEDFA] px-3 py-2 font-medium text-[#656363] border-y border-[#DFDFF0]">
        {title}
      </div>
      {children}
    </div>
  );
}

/**
 * Info Row Component - Displays a label-value pair in a row
 */
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between px-3 py-2 border-t border-[#DFDFF0] text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-[#262D31]">
        {value || "-"}
      </span>
    </div>
  );
}

/**
 * Applicant Details Component
 * Displays detailed information about a volunteer applicant
 */
export default function ApplicantDetails({ data, onClose }) {
  const { id } = useParams();
  const navigate = useNavigate();

  /**
   * Handle close action - calls onClose prop or navigates back
   */
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="p-4 border-b relative">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 text-xl"
        >
          ✕
        </button>

        <div className="flex gap-3">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full border-2 border-blue-500 bg-gray-300 relative">
            <div className="w-3 h-3 bg-blue-500 rounded-full absolute bottom-0 right-0"></div>
          </div>

          {/* Applicant Info */}
          <div>
            <h2 className="text-lg font-semibold text-[#262D31]">
              {data.name}
            </h2>
            <p className="text-sm text-gray-500">
              {data.role} · {data.experience}
            </p>
            <p className="text-xs text-gray-400">
              Applied March 23, 2027
            </p>

            {/* Status Badge */}
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded border border-yellow-400 bg-[#FFF6DE] text-[#FBBC05] font-medium">
              Pending Application
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto text-sm">
        {/* Personal Information Section */}
        <Section title="Personal Information">
          <InfoRow label="Age" value={data.age} />
          <InfoRow label="Email" value={data.email} />
          <InfoRow label="Contact" value={data.contact} />
          <InfoRow label="Location" value={data.location} />
          <InfoRow label="Availability" value={data.availability} />
          <InfoRow label="Preferred Role" value={data.preferredRole} />
        </Section>

        {/* Certifications Section */}
        <Section title="Certifications">
          <div className="flex flex-wrap gap-2 p-3">
            {data.certifications?.map((cert, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded border border-[#4285F4] text-[#4285F4] bg-[#CBE8FF]"
              >
                {cert}
              </span>
            ))}
          </div>
        </Section>

        {/* Skills Section */}
        <Section title="Skills">
          <div className="flex flex-wrap gap-2 p-3">
            {data.skills?.map((skill, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600"
              >
                {skill}
              </span>
            ))}
          </div>
        </Section>

        {/* Uploaded Certifications Section */}
        <Section title="Uploaded Certifications">
          <div className="flex flex-wrap gap-2 p-3">
            {data.files?.map((file, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded border border-[#DC5656] text-[#DC5656] flex items-center gap-1"
              >
                📄 {file}
              </span>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}