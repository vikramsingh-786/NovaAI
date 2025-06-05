interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--background-primary)]/50 backdrop-blur-sm ${className}`}>
      <div 
        className={`animate-spin rounded-full border-solid border-[var(--accent-purple)] border-t-transparent ${sizeClasses[size]}`}
      ></div>
    </div>
  );
}