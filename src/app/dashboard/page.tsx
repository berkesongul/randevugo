'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/hooks/useTenant';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { tenant } = useTenant();
  const [baseUrl, setBaseUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Get the base URL for the current environment
    setBaseUrl(window.location.origin);
    // Format current date
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
  }, []);

  const handleCopyLink = () => {
    if (tenant?.slug) {
      navigator.clipboard.writeText(`${baseUrl}/${tenant.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.mainContent}>
      {/* Welcome Section */}
      <section className={styles.welcome}>
        <div className={styles.welcomeTop}>
          <div>
            <h2>Hoş geldiniz! 👋</h2>
            <p>
              <strong>{tenant?.name}</strong> işletmenizin kontrol paneline hoş geldiniz.
            </p>
          </div>
          <span className={styles.dateLabel}>{currentDate}</span>
        </div>
      </section>

      {/* Quick Stats */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>—</span>
              <span className={styles.statLabel}>Bugünkü Randevular</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💇</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>—</span>
              <span className={styles.statLabel}>Aktif Hizmetler</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>—</span>
              <span className={styles.statLabel}>Personel Sayısı</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>—</span>
              <span className={styles.statLabel}>Bekleyen Randevular</span>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Link Card */}
      {tenant?.slug && (
        <section className={styles.linkSection}>
          <div className={styles.linkCard}>
            <div className={styles.linkCardContent}>
              <div className={styles.linkCardIcon}>🔗</div>
              <div className={styles.linkCardText}>
                <h3>Müşteri Randevu Linkiniz</h3>
                <p>
                  Müşterilerinizin randevu alabilmesi için bu linki Instagram, WhatsApp veya web sitenizde paylaşın.
                </p>
              </div>
            </div>
            <div className={styles.linkCopyRow}>
              <span className={styles.linkUrl}>
                {baseUrl}/{tenant.slug}
              </span>
              <button 
                onClick={handleCopyLink}
                className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
              >
                {copied ? '✓ Kopyalandı!' : 'Kopyala'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions Grid */}
      <section className={styles.actionsSection}>
        <h3 className={styles.sectionTitle}>Hızlı İşlemler</h3>
        <div className={styles.grid}>
          <Link href="/dashboard/appointments" className={styles.card}>
            <div className={styles.cardIcon}>📅</div>
            <h3>Randevular</h3>
            <p>Randevularınızı görüntüleyin ve yönetin.</p>
            <span className={styles.cardArrow}>→</span>
          </Link>
          <Link href="/dashboard/services" className={styles.card}>
            <div className={styles.cardIcon}>💇</div>
            <h3>Hizmetler</h3>
            <p>Sunduğunuz hizmetleri düzenleyin.</p>
            <span className={styles.cardArrow}>→</span>
          </Link>
          <Link href="/dashboard/staff" className={styles.card}>
            <div className={styles.cardIcon}>👥</div>
            <h3>Personel</h3>
            <p>Ekip üyelerinizi yönetin.</p>
            <span className={styles.cardArrow}>→</span>
          </Link>
          <Link href="/dashboard/settings" className={styles.card}>
            <div className={styles.cardIcon}>⚙️</div>
            <h3>Ayarlar</h3>
            <p>İşletme ayarlarınızı yapılandırın.</p>
            <span className={styles.cardArrow}>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
