import React from 'react';
import { Icon } from '@iconify/react';

/**
 * Incident Report Layout Component
 * Provides a two-step form layout with sidebar stepper for incident reporting
 */
export default function IncidentReportLayout({ children, title, currentStep, onBack }) {
    // Step configuration
    const steps = [
        { num: 1, label: "Set Location & Photo" },
        { num: 2, label: "Incident Details" }
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] flex justify-center px-4 py-6 md:px-10 md:py-10 font-sans">
            <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8">
                {/* Left Column - Side Stepper */}
                <div className="w-full md:w-80 shrink-0">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-1">
                            <Icon icon="mdi:file-document-outline" width="32" className="text-[#1f4e6f]" />
                            <h1 className="text-[#1f4e6f] text-2xl font-bold tracking-tight">Incident Report</h1>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Complete all steps to submit your incident report to the Operations Command Center.
                        </p>
                    </div>

                    {/* Stepper Steps */}
                    <div className="space-y-4">
                        {steps.map((step, idx) => {
                            const isActive = step.num === currentStep;
                            const isPast = step.num < currentStep;
                            return (
                                <div key={step.num} className="flex items-center gap-4">
                                    {/* Step Circle */}
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${isActive
                                                ? 'bg-[#0C7FDA] text-white shadow-md shadow-blue-200'
                                                : isPast
                                                    ? 'bg-[#15803d] text-white'
                                                    : 'bg-[#6b7280] text-white'
                                            }`}
                                    >
                                        {isPast ? <Icon icon="mdi:check" width="20" /> : step.num}
                                    </div>
                                    {/* Step Label */}
                                    <span className={`text-[15px] ${isActive ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column - Main Form Content */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1 text-[#1f4e6f] hover:text-[#0C7FDA] transition-colors text-sm font-medium"
                        >
                            <Icon icon="mdi:arrow-left" width="18" />
                            Back to home
                        </button>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{title}</h2>
                            <span className="text-xs text-gray-400 font-medium border border-gray-200 px-2 py-0.5 rounded-full">
                                Step {currentStep} of 2
                            </span>
                        </div>
                    </div>

                    {/* Page Content */}
                    <div className="mt-2">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}