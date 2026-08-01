'use client';

import { useState, useSyncExternalStore } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { useAppointments } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useStaff } from '@/hooks/useStaff';
import Link from 'next/link';
import styles from './dashboard.module.css';

const subscribeToClient = () => () => {};

export default function DashboardPage() {
  const { tenant } = useTenant();
  const { appointments } = useAppointments();
  const { services } = useServices();
  const { staffList } = useStaff();
  const [copied, setCopied] = useState(false);
  const isClient = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false
  );
  const baseUrl = isClient ? window.location.origin : '';
  const currentDate = isClient
    ? new Date().toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : '';

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const todayAppointmentCount = appointments.filter((appointment) => {
    const start = new Date(appointment.start_time);
    return start >= todayStart && start < tomorrowStart;
  }).length;
  const activeServiceCount = services.filter((service) => service.is_active).length;
  const activeStaffCount = staffList.filter((staff) => staff.is_active).length;
  const pendingAppointmentCount = appointments.filter(
    (appointment) => appointment.status === 'pending'
  ).length;

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
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{todayAppointmentCount}</span>
              <span className={styles.statLabel}>Bugünkü Randevular</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{activeServiceCount}</span>
              <span className={styles.statLabel}>Aktif Hizmetler</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{activeStaffCount}</span>
              <span className={styles.statLabel}>Personel Sayısı</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{pendingAppointmentCount}</span>
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
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions Grid */}
      <section className={styles.actionsSection}>
        <h3 className={styles.sectionTitle}>Hızlı İşlemler</h3>
        <div className={styles.grid}>
          <Link href="/dashboard/calendar" className={styles.card}>
            <h3>Randevu Takvimi</h3>
            <p>Haftalık programınızı saat saat görüntüleyin.</p>
            <span className={styles.cardArrow}>→</span>
          </Link>
          <Link href="/dashboard/appointments" className={styles.card}>
            <h3>Randevular</h3>
            <p>Randevularınızı görüntüleyin ve yönetin.</p>
            <span className={styles.cardArrow}>→</span>
          </Link>
          <Link href="/dashboard/services" className={styles.card}>
            <h3>Hizmetler</h3>
            <p>Sunduğunuz hizmetleri düzenleyin.</p>
            <span className={styles.cardArrow}>→</span>
          </Link>
          <Link href="/dashboard/staff" className={styles.card}>
            <h3>Personel</h3>
            <p>Ekip üyelerinizi yönetin.</p>
            <span className={styles.cardArrow}>→</span>
          </Link>
          <Link href="/dashboard/settings" className={styles.card}>
            <h3>Ayarlar</h3>
            <p>İşletme ayarlarınızı yapılandırın.</p>
            <span className={styles.cardArrow}>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
