// src/layouts/PublicLayout.jsx
import { Outlet, Link } from 'react-router-dom';
import { Icon } from "@iconify/react";
import { useState, useEffect } from 'react';

export default function PublicLayout() {
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const sectionIds = ['how-it-works', 'mission', 'services', 'file-report'];

        const handleScroll = () => {
            // Get all sections and their positions
            const sections = sectionIds.map(id => ({
                id,
                element: document.getElementById(id),
                offset: document.getElementById(id)?.offsetTop || 0
            }));

            // Current scroll position + a larger buffer to account for navbar + section start
            const scrollY = window.scrollY + 400; // ✅ CHANGED FROM 150 TO 200

            // ✅ RESET LINE: If we are at the very top, remove ALL lines
            if (scrollY < 200) {
                setActiveSection('');
                return;
            }

            // ✅ FIND ACTIVE SECTION: Only activate when strictly inside a section
            let activeId = '';
            for (let i = 0; i < sections.length; i++) {
                const current = sections[i];
                const next = sections[i + 1];

                // If current section's top is <= scrollY, and next section is > scrollY (or doesn't exist)
                if (current.offset <= scrollY && (!next || next.offset > scrollY)) {
                    activeId = current.id;
                    break;
                }
            }

            setActiveSection(activeId);
        };

        // Run on scroll
        window.addEventListener('scroll', handleScroll);
        // Run once on mount to set initial state
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] flex flex-col font-sans">

            {/* FULLY STICKY NAVBAR */}
            <nav className="fixed top-0 left-0 right-0 z-[999] bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">

                {/* Logo */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
                    <img src="/logo.png" alt="iRespond Logo" className="w-8 h-8" />
                    <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                        <h1 className="text-xl font-bold text-black tracking-tight">
                            iRespond
                        </h1>
                    </h1>
                </div>

                {/* PRECISE NAVIGATION LINKS */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
                    <button
                        onClick={() => scrollToSection('how-it-works')}
                        className={`hover:text-blue-600 transition-colors pb-1 border-b-2 ${activeSection === 'how-it-works' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
                    >
                        HOW IT WORKS
                    </button>
                    <button
                        onClick={() => scrollToSection('mission')}
                        className={`hover:text-blue-600 transition-colors pb-1 border-b-2 ${activeSection === 'mission' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
                    >
                        MISSION
                    </button>
                    <button
                        onClick={() => scrollToSection('services')}
                        className={`hover:text-blue-600 transition-colors pb-1 border-b-2 ${activeSection === 'services' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
                    >
                        SERVICES
                    </button>
                    <button
                        onClick={() => scrollToSection('file-report')}
                        className={`hover:text-blue-600 transition-colors pb-1 border-b-2 ${activeSection === 'file-report' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
                    >
                        FILE A REPORT
                    </button>
                </div>

                {/* CIVILIAN PORTAL Button */}
                <Link to="/login">
                    <button className="bg-[#E63946] hover:bg-[#d62828] text-white font-bold text-sm px-5 py-2 rounded shadow-md transition-all">
                        CIVILIAN PORTAL
                    </button>
                </Link>
            </nav>

            {/* MAIN CONTENT AREA - Pushed down exactly under navbar */}
            <div className="flex-1 w-full relative pt-16">
                <Outlet />
            </div>

        </div>
    );
}