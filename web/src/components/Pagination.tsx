interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const btnBase = 'min-w-[36px] h-9 rounded-lg border font-medium text-sm flex items-center justify-center transition-all cursor-pointer';

    return (
        <div className="flex items-center justify-center gap-1.5 mt-6">
            <button
                className={`${btnBase} px-3 border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed`}
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
            >
                ‹ Prev
            </button>

            {getPageNumbers().map((p, idx) =>
                typeof p === 'string' ? (
                    <span key={`dots-${idx}`} className="min-w-[36px] h-9 flex items-center justify-center text-sm text-slate-400">…</span>
                ) : (
                    <button
                        key={p}
                        className={`${btnBase} ${p === page
                                ? 'bg-primary border-primary text-white font-bold shadow-[0_2px_8px_rgba(99,102,241,0.2)]'
                                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                className={`${btnBase} px-3 border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed`}
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                Next ›
            </button>
        </div>
    );
}
