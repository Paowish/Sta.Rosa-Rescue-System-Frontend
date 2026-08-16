// src/components/layout/GuestLayout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";

export default function GuestLayout({ children }) {
    const [open, setOpen] = useState(false);
    const [greeting, setGreeting] = useState("Good Morning");

    const navigate = useNavigate();

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
    }, []);

    const handleLogoClick = () => {
        navigate('/Guest');
        setOpen(false);
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">

            {/* NAVBAR */}
            <div className="h-16 bg-[#1f6b75] flex items-center justify-between px-4 text-white">

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setOpen(true)}
                        className="block md:hidden text-2xl"
                    >
                        ☰
                    </button>

                    <button
                        onClick={handleLogoClick}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                    >
                        <img src="/logo.png" className="w-10 h-10" alt="logo" />
                        <div className="hidden sm:block text-left">
                            <h1 className="font-semibold">Guest</h1>
                            <p className="text-xs opacity-70">Municipality of Santa Rosa</p>
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <NavLink
                        to="/login"
                        className="text-sm hover:underline hidden sm:block"
                    >
                        Login
                    </NavLink>
                    <NavLink
                        to="/signup"
                        className="text-sm bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition hidden sm:block"
                    >
                        Sign Up
                    </NavLink>
                </div>
            </div>

            {/* BODY */}
            <div className="flex flex-1 overflow-hidden relative">

                {open && (
                    <div
                        className="fixed inset-0 bg-black/40 z-40 md:hidden"
                        onClick={() => setOpen(false)}
                    />
                )}

                <div
                    className={`
                        fixed md:static z-50 top-0 left-0 h-full w-64 bg-[#F5F4FF] p-5 flex flex-col justify-between
                        transform transition-transform duration-300
                        ${open ? "translate-x-0" : "-translate-x-full"}
                        md:translate-x-0
                    `}
                >
                    <div>

                        <div className="flex justify-between items-center mb-6 md:hidden">
                            <span className="font-semibold">Menu</span>
                            <button onClick={() => setOpen(false)}>✕</button>
                        </div>

                        {/* GUEST INFO */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-blue-100 flex items-center justify-center">
                                <Icon icon="mdi:account-outline" className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Guest</p>
                                <p className="text-sm font-medium text-gray-700">
                                    {greeting}, Guest
                                </p>
                            </div>
                        </div>

                        {/* MENU */}
                        <div className="space-y-2 text-gray-600 text-sm">
                            <NavLink
                                to="/Guest"
                                end
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-3 ${isActive ? 'bg-blue-100 text-blue-600 font-medium' : ''}`
                                }
                            >
                                <Icon icon="material-symbols-light:home-rounded" className="w-5 h-5" />
                                Overview
                            </NavLink>

                            <NavLink
                                to="/Guest/Report"
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-3 ${isActive ? 'bg-blue-100 text-blue-600 font-medium' : ''}`
                                }
                            >
                                <Icon icon="mdi:report" className="w-5 h-5" />
                                Report Incident
                            </NavLink>

                            <NavLink
                                to="/Guest/Track"
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-3 ${isActive ? 'bg-blue-100 text-blue-600 font-medium' : ''}`
                                }
                            >
                                <Icon icon="material-symbols:track-changes" className="w-5 h-5" />
                                Track Reports
                            </NavLink>
                        </div>
                    </div>

                    {/* ✅ MOBILE ONLY: Login & Sign Up buttons - hidden on desktop */}
                    <div className="flex flex-col gap-2 md:hidden">
                        <NavLink
                            to="/login"
                            onClick={() => setOpen(false)}
                            className="block text-center bg-[#1f6b75] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#155a63] transition"
                        >
                            Login
                        </NavLink>
                        <NavLink
                            to="/signup"
                            onClick={() => setOpen(false)}
                            className="block text-center border border-[#1f6b75] text-[#1f6b75] py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                        >
                            Sign Up
                        </NavLink>
                    </div>
                </div>

                <div className="flex-1 bg-[#EEF2F6] overflow-y-auto p-4 md:p-6 z-0">
                    {children}
                </div>

            </div>
        </div>
    );
}