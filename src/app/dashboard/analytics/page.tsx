'use client';

import Link from 'next/link';
import { useAppointments } from '@/hooks/useAppointments';
import styles from './analytics.module.css';

const numberFormatter = new Intl.NumberFormat('tr-TR');
const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

export default function AnalyticsPage() {
  const { appointments, isLoading, error } = useAppointments();

  const total = appointments.length;
  const confirmed = appointments.filter((appointment) => appointment.status === 'confirmed').length;
  const completed = appointments.filter((appointment) => appointment.status === 'completed').length;
  const cancelled = appointments.filter((appointment) => appointment.status === 'cancelled').length;
  const conversionRate = total ? Math.round(((confirmed + completed) / total) * 100) : 0;
  const estimatedRevenue = appointments
    .filter((appointment) => appointment.status !== 'cancelled')
    .reduce((sum, appointment) => sum + Number(appointment.services?.price ?? 0), 0);

  const statusRows = [
    { label: 'Bekleyen', value: appointments.filter((appointment) => appointment.status === 'pending').length, tone: 'pending' },
    { label: 'Onaylanan', value: confirmed, tone: 'confirmed' },
    { label: 'Tamamlanan', value: completed, tone: 'completed' },
    { label: 'İptal edilen', value: cancelled, tone: 'cancelled' },
  ];

  if (isLoading) {
    return <div className={styles.state}>Analitik verileri yükleniyor...</div>;
  }

  if (error) {
    return <div className={`${styles.state} ${styles.error}`}>Analitik verileri alınamadı: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>İşletme performansı</span>
          <h1>Analitik</h1>
          <p>Randevu trafiğinizi ve tahmini gelirinizi tek ekrandan takip edin.</p>
        </div>
        <Link className={styles.action} href="/dashboard/appointments">Randevu tablosuna git <span>→</span></Link>
      </header>

      <section className={styles.statsGrid} aria-label="Randevu özeti">
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Toplam randevu</span>
          <strong>{numberFormatter.format(total)}</strong>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Dönüşüm oranı</span>
          <strong>%{conversionRate}</strong>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Tahmini gelir</span>
          <strong>{currencyFormatter.format(estimatedRevenue)}</strong>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Randevu durumu</h2>
            <p>Mevcut tüm randevuların dağılımı</p>
          </div>
          <span className={styles.total}>{total} kayıt</span>
        </div>

        {total === 0 ? (
          <div className={styles.empty}>
            <h3>Henüz ölçülecek randevu yok</h3>
            <p>İlk randevunuzu oluşturduğunuzda performans verileri burada görünür.</p>
            <Link href="/dashboard/appointments">Randevu oluştur</Link>
          </div>
        ) : (
          <div className={styles.breakdown}>
            {statusRows.map((row) => (
              <div className={styles.row} key={row.label}>
                <div className={styles.rowLabel}><i className={`${styles.dot} ${styles[row.tone]}`} />{row.label}</div>
                <div className={styles.rowValue}>
                  <div className={styles.track}><span className={styles[row.tone]} style={{ width: `${(row.value / total) * 100}%` }} /></div>
                  <b>{row.value}</b>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
