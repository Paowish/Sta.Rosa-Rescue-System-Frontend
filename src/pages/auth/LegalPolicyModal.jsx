import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ DATA FOR TERMS & PRIVACY (Matched to your screenshots)
const termsSections = [
    {
        title: "Acceptance of Terms",
        content: "By accessing or using the iRescue, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not create an account or use any part of the Platform. These terms apply to all users including team members, coordinators, field responders, and administrative staff.",
    },
    {
        title: "Eligibility & Authorized Access",
        content: "Account creation is reserved exclusively for active, verified personnel authorized by the Santa Rosa Rescue Team administration. Unintended or unauthorized registration attempts will be revoked, and access will be terminated immediately. You agree to maintain the confidentiality of your login credentials and accept responsibility for all activities occurring under your account.",
    },
    {
        title: "Operational Conduct & Platform Use",
        content: "Users must utilize the Platform strictly for legitimate emergency response, dispatch, training, and administrative operations. You agree not to transmit false incident reports, tamper with real-time operational data, attempt unauthorized privilege escalation, or use the Platform for personal communication unrelated to official duties.",
    },
    {
        title: "Termination of Service",
        content: "Santa Rosa Rescue Team leadership reserves the right to suspend or permanently terminate access to the Platform at any time, without prior notice, upon a user's separation from the organization or for any breach of operational protocols, confidentiality, or these Terms.",
    },
];

const privacySections = [
    {
        title: "Information We Collect",
        content: "To coordinate rescue operations efficiently and ensure responder safety, the Platform collects the following data:",
        bullets: [
            "Personal & Professional Identifiers: Full name, operational role, contact details, and unit assignment.",
            "Location & Telemetry Data: Real-time GPS coordinates collected during active shifts or active emergency dispatches to facilitate field coordination and unit safety.",
            "Operational Logs: Incident response reports, status updates, activity timestamps, and dispatch communications.",
            "Device Information: Device model, operating system version, IP address, and platform log files for system stability and security auditing.",
        ],
    },
    {
        title: "How We Use Your Information",
        content: "All collected data is strictly utilized to:",
        bullets: [
            "Manage emergency dispatch operations, map responder locations, and route field personnel efficiently.",
            "Ensure responder accountability and field safety during active operations.",
            "Generate post-incident analytical reports and operational audits.",
            "Maintain system security, prevent unauthorized access, and troubleshoot platform performance.",
        ],
    },
    {
        title: "Information Sharing",
        content: "The Santa Rosa Rescue Team does not sell, rent, or trade user data. Information is shared only under the following emergency or legal circumstances:",
        bullets: [
            "Inter-Agency Coordination: Real-time operational data may be shared with partner emergency services (e.g., local fire departments, police, or medical emergency services) solely during joint operations.",
            "Legal Requirements: Data may be disclosed if required by law, subpoena, or official judicial order.",
        ],
    },
    {
        title: "Data Security & Retention",
        content: "We implement industry-standard administrative, physical, and technical safeguards—including end-to-end encryption for location streams and access control policies—to protect sensitive operational data against unauthorized access, loss, or alteration. Data is retained only for as long as necessary to fulfill operational, legal, and auditing mandates.",
    },
    {
        title: "Updates & Contact",
        content: "We reserve the right to modify these terms and policies at any time to reflect changing operational needs or legal requirements. Material updates will be communicated through the Platform interface. For inquiries regarding this agreement, contact the Santa Rosa Rescue Team Administration.",
    },
];

// ✅ MAIN MODAL COMPONENT
export default function LegalPolicyModal({ isOpen, onClose, type = "terms" }) {
    if (!isOpen) return null;

    const sections = type === "privacy" ? privacySections : termsSections;
    const title = type === "privacy" ? "Privacy Policy" : "Terms of Service";

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                            <p className="text-sm text-gray-500 mt-1">Last updated: August 2026</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500 hover:text-gray-800"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {sections.map((section, index) => (
                            <div key={index} className="space-y-3">
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                                        Section {index + 1}
                                    </p>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {section.title}
                                    </h3>
                                </div>

                                <div className="text-gray-700 leading-relaxed">
                                    <p>{section.content}</p>

                                    {section.bullets && (
                                        <ul className="mt-3 list-disc pl-6 space-y-2">
                                            {section.bullets.map((bullet, i) => (
                                                <li key={i}>{bullet}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                        >
                            Close
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                        >
                            I Understand
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}