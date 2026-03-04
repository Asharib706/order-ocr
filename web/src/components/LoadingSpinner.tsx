interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizes: Record<string, string> = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
};

const innerInset: Record<string, string> = {
    sm: 'inset-[4px]',
    md: 'inset-[5px]',
    lg: 'inset-[7px]',
};

export default function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center gap-4 py-10">
            <div className={`relative ${sizes[size]}`}>
                <div className="absolute inset-0 border-[3px] border-transparent border-t-primary rounded-full animate-spin" />
                <div className={`absolute ${innerInset[size]} border-[3px] border-transparent border-t-secondary rounded-full animate-spin-reverse`} />
            </div>
            {message && <p className="text-sm text-slate-400 dark:text-slate-500 animate-[fade-in_0.6s_ease]">{message}</p>}
        </div>
    );
}
