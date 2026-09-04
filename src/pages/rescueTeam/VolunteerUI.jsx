import React from 'react';
import { Icon } from "@iconify/react";

/**
 * Roster Status Badge Component
 * Displays volunteer status with color coding
 */
export const RosterStatusBadge = ({ status }) => {
    let textColor = 'text-green-700';
    let bgColor = 'bg-green-100';
    let borderColor = 'border-green-300';
    let dotColor = 'bg-green-500';

    if (status === 'On Scene') {
        textColor = 'text-orange-700';
        bgColor = 'bg-orange-100';
        borderColor = 'border-orange-300';
        dotColor = 'bg-orange-500';
    } else if (status === 'En Route') {
        textColor = 'text-blue-700';
        bgColor = 'bg-blue-100';
        borderColor = 'border-blue-300';
        dotColor = 'bg-blue-500';
    } else if (status === 'Stand By') {
        textColor = 'text-yellow-700';
        bgColor = 'bg-yellow-100';
        borderColor = 'border-yellow-300';
        dotColor = 'bg-yellow-500';
    } else if (status === 'Off Duty') {
        // ✅ OFF DUTY - Gray/Red color
        textColor = 'text-gray-700';
        bgColor = 'bg-gray-200';
        borderColor = 'border-gray-300';
        dotColor = 'bg-gray-500';
    } else if (status === 'Dispatched') {
        textColor = 'text-purple-700';
        bgColor = 'bg-purple-100';
        borderColor = 'border-purple-300';
        dotColor = 'bg-purple-500';
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${bgColor} ${borderColor} ${textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
            • {status}
        </span>
    );
};

/**
 * Panel Status Badge Component
 * Displays status in panel view
 */
export const PanelStatusBadge = ({ label }) => {
    // ✅ OFF DUTY - Gray/Red color
    const isOffDuty = label === 'Off Duty';

    return (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${isOffDuty
            ? 'bg-gray-200 text-gray-700 border-gray-300'
            : 'bg-[#e6f2ff] text-[#0066cc] border-[#b3d9ff]'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${isOffDuty ? 'bg-gray-500' : 'bg-[#0066cc]'
                }`}></span>
            • {label}
        </span>
    );
};

/**
 * Stat Box Component
 * Displays a statistics card with number and label
 */
export const StatBox = ({ number, label, barColor }) => (
    <div className="bg-white rounded border border-gray-200 p-2 flex flex-col justify-between shadow-sm h-20">
        <span className="text-2xl font-bold text-gray-800">{number}</span>
        <div>
            <div className={`border-b-2 ${barColor} pb-0.5`}>
                <span className="text-[11px] font-medium text-gray-500">{label}</span>
            </div>
        </div>
    </div>
);

/**
 * Applicant Stat Box Component
 * Displays applicant statistics
 */
export const ApplicantStatBox = ({ number, label, color }) => (
    <div className="bg-white rounded border border-gray-200 p-2 flex flex-col justify-between shadow-sm h-20">
        <span className="text-2xl font-bold text-gray-800">{number}</span>
        <div>
            <div className={`border-b-2 ${color} pb-0.5`}>
                <span className="text-[11px] font-medium text-gray-500">{label}</span>
            </div>
        </div>
    </div>
);

/**
 * Detail Row Component
 * Displays a label-value pair in a row
 */
export const DetailRow = ({ label, value }) => (
    <div className="flex justify-between py-2.5 px-6 border-b border-gray-100 text-[13px]">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="text-gray-800 font-bold">{value}</span>
    </div>
);

/**
 * Section Header Component
 * Displays a section header with consistent styling
 */
export const SectionHeader = ({ title }) => (
    <div className="bg-[#e5e9ee] py-2 px-6 font-medium text-gray-600 border-y border-gray-200 text-[12px]">
        {title}
    </div>
);

/**
 * Incident Tag Component
 * Displays incident information in a compact format
 */
export const IncidentTag = ({ type, title, date, location }) => (
    <div className="flex flex-col mb-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
        <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border ${type === 'Critical'
                ? 'text-red-600 bg-red-50 border-red-200'
                : 'text-green-600 bg-green-50 border-green-200'
                }`}>
                {type}
            </span>
        </div>
        <div className="text-xs font-bold text-gray-800">{title}</div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
            <span>• {date}</span>
            <span>• {location}</span>
        </div>
    </div>
);