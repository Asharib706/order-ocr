import styles from './Pagination.module.css';

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

    return (
        <div className={styles.pagination}>
            <button
                className={styles.navBtn}
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
            >
                ‹ Prev
            </button>

            <div className={styles.pages}>
                {getPageNumbers().map((p, idx) =>
                    typeof p === 'string' ? (
                        <span key={`dots-${idx}`} className={styles.dots}>…</span>
                    ) : (
                        <button
                            key={p}
                            className={`${styles.pageBtn} ${p === page ? styles.active : ''}`}
                            onClick={() => onPageChange(p)}
                        >
                            {p}
                        </button>
                    )
                )}
            </div>

            <button
                className={styles.navBtn}
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                Next ›
            </button>
        </div>
    );
}
