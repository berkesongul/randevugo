'use client';

// =============================================================================
// Client Appointments Page — /profile/appointments
// =============================================================================

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import styles from '../profile.module.css';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  async function fetchAppointments() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        services (name),
        staff (name),
        tenants (name, slug)
      `)
      .eq('client_id', user.id)
      .order('start_time', { ascending: false });

    if (fetchError) {
      setError('Randevular yüklenirken hata oluştu.');
    } else {
      setAppointments(data || []);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchAppointments();
  }, [supabase]);

  async function handleCancelAppointment(id: string) {
    if (!confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) {
      return;
    }

    setSuccess(null);
    setError(null);

    const { error: cancelError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (cancelError) {
      setError('İptal işlemi başarısız oldu: ' + cancelError.message);
    } else {
      setSuccess('Randevunuz başarıyla iptal edildi.');
      fetchAppointments(); // Refresh list
    }
  }

  if (isLoading) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div>
      <h1 className={styles.panelTitle}>Randevularım & Bilgilerim</h1>

      {success && <div className={styles.successMsg}>{success}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}

      {appointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Henüz aktif veya geçmiş bir randevunuz bulunmamaktadır.</p>
          <Link href="/" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
            Hemen Bir Randevu Alın ➔
          </Link>
        </div>
      ) : (
        <div className={styles.appointmentsList}>
          {appointments.map((apt) => (
            <div key={apt.id} className={styles.aptCard}>
              <div className={styles.aptMain}>
                <div className={styles.aptTenant}>{apt.tenants?.name}</div>
                <div className={styles.aptService}>
                  <strong>Hizmet:</strong> {apt.services?.name} | <strong>Personel:</strong> {apt.staff?.name}
                </div>
                <div className={styles.aptTime}>
                  📅 {new Date(apt.start_time).toLocaleString('tr-TR')} - {new Date(apt.end_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className={styles.aptRight}>
                <span className={`${styles.statusBadge} ${styles['status_' + apt.status]}`}>
                  {apt.status === 'pending' ? 'Bekliyor' : 
                   apt.status === 'confirmed' ? 'Onaylandı' : 
                   apt.status === 'cancelled' ? 'İptal Edildi' : 'Tamamlandı'}
                </span>
                {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                  <button 
                    onClick={() => handleCancelAppointment(apt.id)}
                    className={styles.cancelBtn}
                  >
                    İptal Et
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
