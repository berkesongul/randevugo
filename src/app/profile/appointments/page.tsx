'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { CustomerAppointment } from '@/types/types';
import styles from '../profile.module.css';

const STATUS_LABELS: Record<CustomerAppointment['status'], string> = {
  pending: 'Onay bekliyor',
  confirmed: 'Onaylandı',
  cancelled: 'İptal edildi',
  completed: 'Tamamlandı',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    const { data, error: fetchError } = await supabase.rpc('get_my_appointments');

    if (fetchError) {
      setError('Randevular yüklenirken hata oluştu.');
    } else {
      setAppointments(data || []);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    void Promise.resolve().then(fetchAppointments);
  }, [fetchAppointments]);

  async function handleCancelAppointment(id: string) {
    if (!window.confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) return;

    setSuccess(null);
    setError(null);
    const { error: cancelError } = await supabase.rpc('cancel_my_appointment', {
      p_appointment_id: id,
    });

    if (cancelError) {
      setError(`İptal işlemi başarısız oldu: ${cancelError.message}`);
    } else {
      setSuccess('Randevun başarıyla iptal edildi.');
      await fetchAppointments();
    }
  }

  return (
    <>
      <header className={styles.panelHeader}>
        <span className={styles.panelEyebrow}>Randevu geçmişi</span>
        <h1 className={styles.panelTitle}>Randevularım</h1>
        <p className={styles.panelDescription}>
          Aktif taleplerini takip et ve geçmiş randevularına yeniden göz at.
        </p>
      </header>

      {success && <div className={styles.successMsg}>{success}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}

      {isLoading ? (
        <p className={styles.loadingText}>Randevuların yükleniyor...</p>
      ) : appointments.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">R</span>
          <h2>Henüz randevun yok</h2>
          <p>İhtiyacına uygun işletmeyi keşfet ve ilk randevunu birkaç adımda oluştur.</p>
          <Link href="/explore">İşletmeleri keşfet</Link>
        </div>
      ) : (
        <div className={styles.appointmentsList}>
          {appointments.map((appointment) => {
            const startDate = new Date(appointment.start_time);
            const endDate = new Date(appointment.end_time);
            return (
              <article key={appointment.id} className={styles.aptCard}>
                <div className={styles.aptDate}>
                  <strong>{startDate.toLocaleDateString('tr-TR', { day: '2-digit' })}</strong>
                  <span>{startDate.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                </div>
                <div className={styles.aptMain}>
                  <div className={styles.aptTenant}>{appointment.tenant_name}</div>
                  <div className={styles.aptService}>
                    {appointment.service_name} · {appointment.staff_name || 'Personel seçilmedi'}
                  </div>
                  <div className={styles.aptTime}>
                    {startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {endDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className={styles.aptRight}>
                  <span className={`${styles.statusBadge} ${styles[`status_${appointment.status}`]}`}>
                    {STATUS_LABELS[appointment.status]}
                  </span>
                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className={styles.cancelBtn}
                    >
                      Randevuyu iptal et
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
