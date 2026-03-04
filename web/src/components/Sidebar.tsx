'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const navItems = [
    { href: '/', label: 'Upload & Extract', icon: '📤' },
    { href: '/work-orders', label: 'Work Orders', icon: '📊' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.brand}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>⚡</span>
                </div>
                <h1 className={styles.brandName}>OrderOCR</h1>
                <p className={styles.brandSub}>AI-Powered Extraction</p>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navLink} ${pathname === item.href ? styles.active : ''
                            }`}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className={styles.footer}>
                <div className={styles.statusDot} />
                <span className={styles.statusText}>Connected to Supabase</span>
            </div>
        </aside>
    );
}
