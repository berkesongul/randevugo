'use client';

import Link from 'next/link';
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon';
import type { PublicTenant } from '@/types/types';
import styles from './BusinessCard.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  barber: 'Berber',
  beauty_salon: 'Güzellik Salonu',
  clinic: 'Klinik',
  spa: 'Spa & Masaj',
  fitness: 'Fitness & Spor',
  dental: 'Diş Kliniği',
  veterinary: 'Veteriner',
  consulting: 'Danışmanlık',
  photography: 'Fotoğrafçılık',
  education: 'Eğitim & Kurs',
  other: 'Diğer',
};

interface BusinessCardProps {
  tenant: PublicTenant;
  isFavorite?: boolean;
  onFavorite?: (tenantId: string) => void;
}

export default function BusinessCard({
  tenant,
  isFavorite = false,
  onFavorite,
}: BusinessCardProps) {
  const category = tenant.category || 'other';
  const categoryLabel = CATEGORY_LABELS[category] || 'Diğer';

  return (
    <article className={`${styles.card} ${styles[category]}`}>
      {onFavorite && (
        <button
          type="button"
          className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''}`}
          onClick={() => onFavorite(tenant.id)}
          aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
        </button>
      )}

      <Link href={`/${tenant.slug}`} className={styles.link}>
        <div className={styles.visual}>
          <span className={styles.visualOrb} />
          <CategoryIcon category={tenant.category} className={styles.categoryIcon} />
          <span className={styles.categoryPill}>{categoryLabel}</span>
        </div>

        <div className={styles.content}>
          <div>
            <p className={styles.kicker}>Online randevu</p>
            <h3>{tenant.name}</h3>
          </div>

          <p className={styles.description}>
            {tenant.description || `${categoryLabel} hizmetlerini inceleyin ve size uygun zamanı seçin.`}
          </p>

          <div className={styles.meta}>
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s7-5.1 7-12A7 7 0 1 0 5 9c0 6.9 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {tenant.city || 'Konum bilgisi yakında'}
            </span>
            <strong>
              Randevu al
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </strong>
          </div>
        </div>
      </Link>
    </article>
  );
}
