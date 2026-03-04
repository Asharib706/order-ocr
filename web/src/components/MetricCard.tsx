interface MetricCardProps {
    label: string;
    value: string | number;
    icon: string;
    color?: 'primary' | 'success' | 'warning' | 'info';
}

const iconBg: Record<string, string> = {
    primary: 'bg-primary/10',
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    info: 'bg-blue-500/10',
};

export default function MetricCard({ label, value, icon, color = 'primary' }: MetricCardProps) {
    return (
        <div className="flex items-center gap-4 px-5 py-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className={`w-11 h-11 flex items-center justify-center rounded-xl text-xl shrink-0 ${iconBg[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
            </div>
        </div>
    );
}
