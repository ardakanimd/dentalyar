import React from 'react';

export const ToothIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M12 4.5C10.5 4.5 9.2 3.7 7.6 3.7C4.8 3.7 3 6 3 9.2C3 11.7 4.1 13.8 4.8 16.2C5.4 18.2 5.8 20.8 7.1 20.8C8.2 20.8 8.7 18.8 9.3 16.7C9.7 15.5 10.4 14.8 12 14.8C13.6 14.8 14.3 15.5 14.7 16.7C15.3 18.8 15.8 20.8 16.9 20.8C18.2 20.8 18.6 18.2 19.2 16.2C19.9 13.8 21 11.7 21 9.2C21 6 19.2 3.7 16.4 3.7C14.8 3.7 13.5 4.5 12 4.5Z" />
  </svg>
);
