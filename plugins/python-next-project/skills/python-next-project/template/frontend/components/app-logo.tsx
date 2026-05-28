// Placeholder mark — swap for your own logo.
export function AppLogo({ className }: { className?: string }) {
  return (
    <span className={className}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
        <rect width="24" height="24" rx="6" className="fill-primary" />
        <path
          d="M7 12.5 10.5 16 17 8.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
