import styles from './MetricCard.module.css';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: string;
    color?: 'primary' | 'success' | 'warning' | 'info';
}

export default function MetricCard({ label, value, icon, color = 'primary' }: MetricCardProps) {
    return (
        <div className={`${styles.card} ${styles[color]}`}>
            <div className={styles.iconWrap}>
                <span className={styles.icon}>{icon}</span>
            </div>
            <div className={styles.content}>
                <p className={styles.label}>{label}</p>
                <p className={styles.value}>{value}</p>
            </div>
        </div>
    );
}
