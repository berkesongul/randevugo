'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Tenant, Service, Staff, Profile } from '@/types/types';
import styles from './booking.module.css';

type StaffWithProfile = Pick<Staff, 'id' | 'bio'> & { profiles: Pick<Profile, 'full_name'> | null };

interface BookingClientProps {
  tenant: Tenant;
  services: Service[];
  staffList: StaffWithProfile[];
}

export default function BookingClient({ tenant, services, staffList }: BookingClientProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Booking State
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>('');
  
  // Contact State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        // Pre-fill email and name if available
        setClientEmail(data.user.email || '');
        if (data.user.user_metadata?.full_name) {
          setClientName(data.user.user_metadata.full_name);
        }
      }
    });
  }, [supabase]);

  const handleNextStep1 = () => {
    setError(null);
    if (!user) {
      // Not logged in -> Redirect to login with return URL
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${currentPath}`);
      return;
    }
    setStep(2);
  };

  const handleNext = () => {
    setError(null);
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(s => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) {
      setError('Lütfen adınızı ve soyadınızı girin.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const isoStartTime = new Date(dateTime).toISOString();

      const { data, error: submitError } = await supabase.rpc('book_appointment', {
        p_tenant_id: tenant.id,
        p_service_id: selectedServiceId,
        p_staff_id: selectedStaffId,
        p_client_name: clientName,
        p_client_phone: clientPhone || undefined,
        p_client_email: clientEmail || undefined,
        p_start_time: isoStartTime,
        p_notes: notes || undefined,
      });

      if (submitError) {
        // Handle double booking constraint explicitly if it has the keyword
        if (submitError.message.includes('Double booking conflict')) {
          throw new Error('Üzgünüz, seçtiğiniz personel bu saat diliminde dolu. Lütfen başka bir saat veya personel seçin.');
        }
        throw new Error(submitError.message || 'Randevu oluşturulamadı. Lütfen tekrar deneyin.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Step Renderers
  // ---------------------------------------------------------------------------
  
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <h3>Randevunuz Onaylandı!</h3>
            <p>
              Sayın <strong>{clientName}</strong>, randevunuz başarıyla oluşturuldu. <br/>
              Sizi <strong>{tenant.name}</strong> işletmesinde ağırlamaktan mutluluk duyacağız.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{tenant.name}</h1>
          <p className={styles.subtitle}>Randevu Oluşturun</p>
        </div>

        <div className={styles.body}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div>
              <h2 className={styles.stepTitle}>
                <span className={styles.stepNumber}>1</span> Hizmet Seçin
              </h2>
              
              {services.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>Bu işletme henüz hizmet eklememiş.</p>
              ) : (
                <div className={styles.selectionGrid}>
                  {services.map(service => (
                    <div 
                      key={service.id}
                      className={`${styles.selectionCard} ${selectedServiceId === service.id ? styles.selected : ''}`}
                      onClick={() => setSelectedServiceId(service.id)}
                    >
                      <div className={styles.selectionInfo}>
                        <h4>{service.name}</h4>
                        <p>{service.duration_minutes} dakika</p>
                      </div>
                      {service.price && (
                        <div className={styles.priceTag}>₺{service.price}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                <button 
                  className={styles.nextBtn} 
                  onClick={handleNextStep1}
                  disabled={!selectedServiceId}
                >
                  Devam Et
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Staff & Time */}
          {step === 2 && (
            <div>
              <h2 className={styles.stepTitle}>
                <span className={styles.stepNumber}>2</span> Personel ve Saat
              </h2>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Personel Seçin</h3>
                {staffList.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Aktif personel bulunamadı.</p>
                ) : (
                  <div className={styles.selectionGrid}>
                    {staffList.map(staff => (
                      <div 
                        key={staff.id}
                        className={`${styles.selectionCard} ${selectedStaffId === staff.id ? styles.selected : ''}`}
                        onClick={() => setSelectedStaffId(staff.id)}
                      >
                        <div className={styles.selectionInfo}>
                          <h4>{staff.profiles?.full_name || 'İsimsiz Personel'}</h4>
                          {staff.bio && <p>{staff.bio}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Tarih ve Saat Seçin</h3>
                <div className={styles.formGroup}>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    required
                    style={{ background: 'var(--bg-default)' }}
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button className={styles.backBtn} onClick={handleBack}>
                  Geri
                </button>
                <button 
                  className={styles.nextBtn} 
                  onClick={handleNext}
                  disabled={!selectedStaffId || !dateTime}
                >
                  Devam Et
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Contact Info & Submit */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 className={styles.stepTitle}>
                <span className={styles.stepNumber}>3</span> İletişim Bilgileri
              </h2>

              <div className={styles.formGroup}>
                <label htmlFor="clientName">Ad Soyad *</label>
                <input
                  id="clientName"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="clientPhone">Telefon</label>
                <input
                  id="clientPhone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="05..."
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="clientEmail">E-posta</label>
                <input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="ornek@email.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="notes">Notlar (Opsiyonel)</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Eklemek istediğiniz özel bir not var mı?"
                />
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.backBtn} onClick={handleBack} disabled={isSubmitting}>
                  Geri
                </button>
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={isSubmitting || !clientName}
                >
                  {isSubmitting ? 'Onaylanıyor...' : 'Randevuyu Onayla'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
