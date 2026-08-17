import React from 'react';
import { Icon } from "@iconify/react";
import { RosterStatusBadge } from './VolunteerUI';

// --- ROSTER VIEW (WITH REAL LIVE STATUS) ---
export const RosterView = ({ volunteers, selectedId, onSelect, getStatus }) => {
    return (
        <div className="grid grid-cols-2 gap-5">
            {volunteers.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-gray-400">No volunteers found.</div>
            ) : (
                volunteers.map((v) => {
                    // ✅ Gets the real-time live status passed from the parent
                    const liveStatus = getStatus ? getStatus(v.id) : 'Available';
                    return (
                        <div
                            key={v.id}
                            onClick={() => onSelect(v.id)}
                            className={`bg-[#f5f7fc] rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative ${selectedId === v.id ? 'ring-2 ring-blue-400' : ''}`}
                        >
                            {/* ✅ Top colored bar based on real status */}
                            <div className={`h-1.5 w-full ${liveStatus === 'On Scene' ? 'bg-orange-500' : liveStatus === 'En Route' ? 'bg-blue-500' : liveStatus === 'Dispatched' ? 'bg-red-500' : 'bg-green-600'}`}></div>

                            <div className="p-5 pb-3">
                                {/* Avatar and Name Section */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-[#dbe0e8] flex items-center justify-center text-gray-400">
                                        <Icon icon="mdi:account" className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-[15px] text-gray-800">{v.name}</div>
                                        <div className="text-[12px] text-gray-500">{v.role}</div>
                                        {/* ✅ Real-time badge */}
                                        <div className="mt-1.5">
                                            <RosterStatusBadge status={liveStatus} />
                                        </div>
                                    </div>
                                </div>

                                {/* Speciality Section */}
                                <div className="border-t border-gray-200 pt-3 mt-2">
                                    <div className="text-[12px] font-medium text-gray-500 mb-1.5">Speciality</div>
                                    <div className="flex flex-wrap">
                                        {/* ✅ Shows real skills from database */}
                                        {v.details?.skills?.slice(0, 3).map((s, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-600 text-[11px] font-medium px-2.5 py-1 rounded border border-blue-100 mr-1.5 mb-1.5">
                                                {s}
                                            </span>
                                        ))}
                                        {/* ✅ Shows "+N more" if there are more skills */}
                                        {v.details?.skills?.length > 3 && (
                                            <span className="bg-white border border-gray-200 text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded">
                                                +{v.details.skills.length - 3}
                                            </span>
                                        )}
                                        {/* Fallback if no skills */}
                                        {(!v.details?.skills || v.details.skills.length === 0) && (
                                            <span className="text-xs text-gray-400 italic">No skills listed</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

// --- APPLICANT VIEW (Fully Functional & Accurate) ---
export const ApplicantView = ({ applicants, onView, onAccept, onReject, isProcessing }) => (
    <div className="flex flex-col gap-3">
        {applicants.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No pending applicants.</div>
        ) : (
            applicants.map((app) => (
                <div key={app.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">

                    {/* Header Section */}
                    <div className="p-4 pb-3 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 mt-1"></div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <div className="font-bold text-[17px] text-gray-800 leading-tight">{app.name}</div>
                            <div className="text-[13px] text-gray-500 leading-snug">{app.role} · {app.experience}</div>
                            <div className="text-[13px] text-gray-400 leading-snug">{app.location}</div>

                            {/* Availability & Description Section */}
                            <div className="-ml-[44px] flex flex-col gap-1.5 mt-2">
                                {/* Certification Tags */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {app.tags && app.tags.length > 0 ? (
                                        <>
                                            {app.tags.map((t, idx) => (
                                                <span key={idx} className="bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-medium px-2.5 py-1 rounded-full truncate max-w-[120px]">
                                                    {t}
                                                </span>
                                            ))}
                                            {app.hasMoreSkills && (
                                                <span className="bg-white border border-gray-200 text-gray-600 text-[10px] font-medium px-2.5 py-1 rounded-full">
                                                    + {app.details?.certs?.length - 3 || 0} Skills
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-xs text-gray-400 italic">No certifications listed</div>
                                    )}
                                </div>

                                {/* Availability Bars */}
                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[13px] text-gray-600 font-medium">
                                    <span>Availability:</span>
                                    <div className="flex items-center gap-[2px]">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                            <div key={day} className={`w-5 h-2.5 rounded-sm ${app.availability && app.availability.includes(day) ? 'bg-[#15803d]' : 'bg-gray-200'}`}></div>
                                        ))}
                                    </div>
                                    <span className="ml-1 font-normal text-gray-500">
                                        {app.availability && Array.isArray(app.availability) && app.availability.length > 0
                                            ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter(day => app.availability.includes(day)).join(' · ')
                                            : 'None selected'}
                                    </span>
                                </div>

                                {/* Description */}
                                <div className="text-[13px] text-gray-700 leading-relaxed">
                                    {app.description}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons Footer */}
                    <div className="flex border-t border-gray-200 bg-white divide-x divide-gray-200">
                        <button onClick={() => onView(app)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-gray-600 text-sm hover:bg-gray-50 transition-colors font-medium">
                            <Icon icon="mdi:magnify" className="w-4 h-4" /> View Full Application
                        </button>
                        <button onClick={() => onAccept(app)} disabled={isProcessing} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-green-600 text-sm hover:bg-green-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                            <Icon icon="mdi:check" className="w-4 h-4" /> Accept
                        </button>
                        <button onClick={() => onReject(app)} disabled={isProcessing} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-red-500 text-sm hover:bg-red-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                            <Icon icon="mdi:close" className="w-4 h-4" /> Reject
                        </button>
                    </div>

                </div>
            ))
        )}
    </div>
);