import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps) {
    return (
        <div className={styles.wrapper}>
            <div className={`${styles.spinner} ${styles[size]}`}>
                <div className={styles.ring}></div>
                <div className={styles.ring}></div>
                <div className={styles.ring}></div>
            </div>
            {message && <p className={styles.message}>{message}</p>}
        </div>
    );
}
