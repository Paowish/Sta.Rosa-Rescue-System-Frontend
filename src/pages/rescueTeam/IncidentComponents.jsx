// src/pages/rescueTeam/IncidentComponents.jsx
import { Icon } from "@iconify/react";

export const SearchIcon = () => <Icon icon="mdi:search" className="w-5 h-5 text-slate-500" />;
export const ChevronDown = () => <Icon icon="mdi:chevron-down" className="w-4 h-4 text-slate-500" />;
export const CalendarIcon = () => <Icon icon="mdi:calendar" className="w-5 h-5 text-slate-500" />;
export const XIcon = () => <Icon icon="mdi:close" className="w-5 h-5 text-slate-500" />;
export const CheckboxCheck = () => <Icon icon="mdi:check" className="w-4 h-4 text-white" />;
export const CheckboxAll = () => (
    <div className="bg-[#4081EE] rounded-[4px] w-5 h-5 flex items-center justify-center cursor-pointer mx-auto">
        <Icon icon="mdi:minus" className="w-4 h-4 text-white" />
    </div>
);

export function StatCard({ title, value, icon, color, trend }) {
    const bgColorClass = color
        .replace('text-', 'bg-')
        .replace('-600', '-100')
        .replace('-700', '-100');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <p className={`text-3xl font-bold ${color}`}>{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${bgColorClass}`}>
                    <Icon icon={icon} className={`text-xl ${color}`} />
                </div>
            </div>
            {trend && (
                <div className="mt-3 flex items-center gap-1 text-xs">
                    <span className={trend.positive ? 'text-emerald-600' : 'text-red-600'}>
                        {trend.positive ? '↑' : '↓'} {trend.value}%
                    </span>
                    <span className="text-gray-400">vs last week</span>
                </div>
            )}
        </div>
    );
}