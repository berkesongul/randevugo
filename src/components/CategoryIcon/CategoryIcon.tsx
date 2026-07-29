import type { BusinessCategory } from '@/types/types';

interface CategoryIconProps {
  category?: BusinessCategory | null;
  className?: string;
}

export default function CategoryIcon({
  category = 'other',
  className,
}: CategoryIconProps) {
  const commonProps = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (category) {
    case 'barber':
      return (
        <svg {...commonProps}>
          <circle cx="6" cy="7" r="2.5" />
          <circle cx="6" cy="17" r="2.5" />
          <path d="m8.2 8.2 10.3 7.3M8.2 15.8 18.5 8.5" />
        </svg>
      );
    case 'beauty_salon':
      return (
        <svg {...commonProps}>
          <path d="m12 2 1.4 5.1L18 9l-4.6 1.9L12 16l-1.4-5.1L6 9l4.6-1.9L12 2Z" />
          <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
        </svg>
      );
    case 'clinic':
      return (
        <svg {...commonProps}>
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M12 7v8M8 11h8M8 18h8" />
        </svg>
      );
    case 'spa':
      return (
        <svg {...commonProps}>
          <path d="M12 21c0-7 3.5-12 9-15 0 7-3 12-9 15Z" />
          <path d="M12 21C11 14 8 10 3 8c0 6 3 11 9 13ZM12 21V9" />
        </svg>
      );
    case 'fitness':
      return (
        <svg {...commonProps}>
          <path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" />
        </svg>
      );
    case 'dental':
      return (
        <svg {...commonProps}>
          <path d="M8.2 3.5c1.5 0 2.5.7 3.8.7s2.3-.7 3.8-.7c2.8 0 4.2 2.3 4.2 5 0 3.7-2 5.2-3 9.4-.4 1.7-1.1 3.1-2.3 3.1-1.4 0-1.3-4.4-2.7-4.4S10.7 21 9.3 21C8.1 21 7.4 19.6 7 17.9 6 13.7 4 12.2 4 8.5c0-2.7 1.4-5 4.2-5Z" />
        </svg>
      );
    case 'veterinary':
      return (
        <svg {...commonProps}>
          <circle cx="7" cy="7" r="2" />
          <circle cx="17" cy="7" r="2" />
          <circle cx="4.5" cy="12" r="1.7" />
          <circle cx="19.5" cy="12" r="1.7" />
          <path d="M8 19c-1.2-2.8.5-5.5 4-5.5s5.2 2.7 4 5.5c-.7 1.7-2.2 2-4 1-1.8 1-3.3.7-4-1Z" />
        </svg>
      );
    case 'consulting':
      return (
        <svg {...commonProps}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" />
        </svg>
      );
    case 'photography':
      return (
        <svg {...commonProps}>
          <path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case 'education':
      return (
        <svg {...commonProps}>
          <path d="M3 5.5A4.5 4.5 0 0 1 7.5 5H12v15H7.5A4.5 4.5 0 0 0 3 20.5v-15ZM21 5.5A4.5 4.5 0 0 0 16.5 5H12v15h4.5a4.5 4.5 0 0 1 4.5.5v-15Z" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3v4M16 3v4M3 10h18M8 14h3M8 17h6" />
        </svg>
      );
  }
}
