'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon';
import { createClient } from '@/lib/supabase/client';
import type { PublicTenant, Service } from '@/types/types';
import styles from './booking.module.css';

type PublicStaff = {
  staff_id: string;
  bio: string | null;
  full_name: string | null;
};

interface BookingClientProps {
  tenant: PublicTenant;
  services: Service[];
  staffList: PublicStaff[];
}

const STEP_LABELS = ['Hizmet', 'Personel ve saat', 'Bilgiler'];

export default function BookingClient({
  tenant,
  services,
  staffList,
}: BookingClientProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;

      setUser(data.user);
      setClientEmail(data.user.email || '');
      if (data.user.user_metadata?.full_name) {
        setClientName(data.user.user_metadata.full_name);
      }
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, [supabase]);

  const selectedService = services.find(
    (service) => service.id === selectedServiceId
  );
  const selectedStaff = staffList.find(
    (staff) => staff.staff_id === selectedStaffId
  );
  const formattedDateTime = dateTime
    ? new Intl.DateTimeFormat('tr-TR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateTime))
    : null;

  function handleNextStep1() {
    setError(null);
    if (!user) {
      router.push(`/login?redirect=${window.location.pathname}`);
      return;
    }
    setStep(2);
  }

  function handleNext() {
    setError(null);
    setStep((current) => current + 1);
  }

  function handleBack() {
    setError(null);
    setStep((current) => current - 1);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!clientName) {
      setError('Lütfen adınızı ve soyadınızı girin.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedDate = new Date(dateTime);
      if (selectedDate.getTime() <= Date.now()) {
        throw new Error('Lütfen gelecekte bir tarih ve saat seçin.');
      }

      const { error: submitError } = await supabase.rpc('book_appointment', {
        p_tenant_id: tenant.id,
        p_service_id: selectedServiceId,
        p_staff_id: selectedStaffId,
        p_client_name: clientName,
        p_client_phone: clientPhone || undefined,
        p_client_email: clientEmail || undefined,
        p_start_time: selectedDate.toISOString(),
        p_notes: notes || undefined,
      });

      if (submitError) {
        if (submitError.message.includes('Double booking conflict')) {
          throw new Error(
            'Seçtiğiniz personel bu saat diliminde dolu. Lütfen başka bir saat veya personel seçin.'
          );
        }
        throw new Error(
          submitError.message ||
            'Randevu oluşturulamadı. Lütfen tekrar deneyin.'
        );
      }

      setSuccess(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Bilinmeyen bir hata oluştu.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <span>Talebin başarıyla iletildi</span>
          <h1>Randevu talebin alındı, {clientName}.</h1>
          <p>
            <strong>{tenant.name}</strong> talebini inceleyecek. Güncel durumu
            hesabındaki randevular bölümünden takip edebilirsin.
          </p>
          <div className={styles.successActions}>
            <Link href="/customer">Randevularıma git</Link>
            <Link href="/explore">Keşfetmeye devam et</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href={`/${tenant.slug}`} className={styles.backLink}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          İşletme profiline dön
        </Link>

        <section className={styles.businessHeader}>
          <div className={styles.businessIcon}>
            <CategoryIcon category={tenant.category} />
          </div>
          <div>
            <span>Online randevu</span>
            <h1>{tenant.name}</h1>
            <p>
              {tenant.city && (
                <>
                  {tenant.city}
                  <i>•</i>
                </>
              )}
              Randevu talebini birkaç adımda tamamla
            </p>
          </div>
        </section>

        <section className={styles.bookingCard}>
          <ol className={styles.stepper} aria-label="Randevu adımları">
            {STEP_LABELS.map((label, index) => {
              const stepNumber = index + 1;
              const state =
                stepNumber < step
                  ? styles.stepComplete
                  : stepNumber === step
                    ? styles.stepCurrent
                    : '';

              return (
                <li key={label} className={state} aria-current={stepNumber === step ? 'step' : undefined}>
                  <span>{stepNumber < step ? '✓' : stepNumber}</span>
                  <strong>{label}</strong>
                </li>
              );
            })}
          </ol>

          {error && (
            <div className={styles.errorMsg} role="alert">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 17h.01" />
              </svg>
              {error}
            </div>
          )}

          <div className={styles.contentGrid}>
            <div className={styles.formPanel}>
              {step === 1 && (
                <section>
                  <div className={styles.sectionHeading}>
                    <span>1. adım</span>
                    <h2>Hangi hizmeti almak istiyorsun?</h2>
                    <p>Devam etmek için listeden bir hizmet seç.</p>
                  </div>

                  {services.length === 0 ? (
                    <div className={styles.noData}>
                      Bu işletme henüz hizmet eklememiş.
                    </div>
                  ) : (
                    <div className={styles.selectionGrid}>
                      {services.map((service) => (
                        <button
                          type="button"
                          key={service.id}
                          className={`${styles.selectionCard} ${
                            selectedServiceId === service.id
                              ? styles.selected
                              : ''
                          }`}
                          onClick={() => setSelectedServiceId(service.id)}
                        >
                          <span className={styles.serviceIcon}>
                            <CategoryIcon category={tenant.category} />
                          </span>
                          <span className={styles.selectionInfo}>
                            <strong>{service.name}</strong>
                            <small>{service.duration_minutes} dakika</small>
                          </span>
                          {service.price !== null && (
                            <b>₺{service.price}</b>
                          )}
                          <i className={styles.selectIndicator}>✓</i>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`${styles.actions} ${styles.actionsEnd}`}>
                    <button
                      type="button"
                      className={styles.nextButton}
                      onClick={handleNextStep1}
                      disabled={!selectedServiceId}
                    >
                      Devam et
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section>
                  <div className={styles.sectionHeading}>
                    <span>2. adım</span>
                    <h2>Personel ve zamanı belirle</h2>
                    <p>Sana uygun personeli, tarih ve saati seç.</p>
                  </div>

                  <h3 className={styles.fieldTitle}>Personel seçimi</h3>
                  {staffList.length === 0 ? (
                    <div className={styles.noData}>
                      Aktif personel bulunamadı.
                    </div>
                  ) : (
                    <div className={styles.staffGrid}>
                      {staffList.map((staff) => (
                        <button
                          type="button"
                          key={staff.staff_id}
                          className={`${styles.staffCard} ${
                            selectedStaffId === staff.staff_id
                              ? styles.selected
                              : ''
                          }`}
                          onClick={() => setSelectedStaffId(staff.staff_id)}
                        >
                          <span>
                            {(staff.full_name || 'P')
                              .charAt(0)
                              .toLocaleUpperCase('tr-TR')}
                          </span>
                          <strong>{staff.full_name || 'İsimsiz Personel'}</strong>
                          {staff.bio && <small>{staff.bio}</small>}
                          <i className={styles.selectIndicator}>✓</i>
                        </button>
                      ))}
                    </div>
                  )}

                  <label className={styles.dateField}>
                    <span>Tarih ve saat</span>
                    <input
                      type="datetime-local"
                      value={dateTime}
                      onChange={(event) => setDateTime(event.target.value)}
                      required
                    />
                    <small>
                      İşletmenin onayından sonra randevun kesinleşir.
                    </small>
                  </label>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.backButton}
                      onClick={handleBack}
                    >
                      Geri
                    </button>
                    <button
                      type="button"
                      className={styles.nextButton}
                      onClick={handleNext}
                      disabled={!selectedStaffId || !dateTime}
                    >
                      Devam et
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </section>
              )}

              {step === 3 && (
                <form onSubmit={handleSubmit}>
                  <div className={styles.sectionHeading}>
                    <span>3. adım</span>
                    <h2>İletişim bilgilerini kontrol et</h2>
                    <p>İşletmenin sana ulaşabilmesi için bilgilerini tamamla.</p>
                  </div>

                  <div className={styles.formGrid}>
                    <label className={styles.formField}>
                      <span>Ad soyad *</span>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(event) => setClientName(event.target.value)}
                        placeholder="Adınız Soyadınız"
                        autoComplete="name"
                        required
                      />
                    </label>
                    <label className={styles.formField}>
                      <span>Telefon</span>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(event) => setClientPhone(event.target.value)}
                        placeholder="05xx xxx xx xx"
                        autoComplete="tel"
                      />
                    </label>
                    <label className={`${styles.formField} ${styles.fullField}`}>
                      <span>E-posta</span>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(event) => setClientEmail(event.target.value)}
                        placeholder="ornek@email.com"
                        autoComplete="email"
                      />
                    </label>
                    <label className={`${styles.formField} ${styles.fullField}`}>
                      <span>Notlar (opsiyonel)</span>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="İşletmeyle paylaşmak istediğiniz bir not var mı?"
                      />
                    </label>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.backButton}
                      onClick={handleBack}
                      disabled={isSubmitting}
                    >
                      Geri
                    </button>
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={isSubmitting || !clientName}
                    >
                      {isSubmitting ? 'Gönderiliyor...' : 'Randevu talebini gönder'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <aside className={styles.summary}>
              <span className={styles.summaryLabel}>Randevu özeti</span>
              <h2>{tenant.name}</h2>

              <dl>
                <div>
                  <dt>Hizmet</dt>
                  <dd>{selectedService?.name || 'Henüz seçilmedi'}</dd>
                </div>
                <div>
                  <dt>Personel</dt>
                  <dd>
                    {selectedStaff?.full_name || 'Henüz seçilmedi'}
                  </dd>
                </div>
                <div>
                  <dt>Tarih ve saat</dt>
                  <dd>{formattedDateTime || 'Henüz seçilmedi'}</dd>
                </div>
                {selectedService?.price !== null &&
                  selectedService?.price !== undefined && (
                    <div className={styles.summaryPrice}>
                      <dt>Hizmet ücreti</dt>
                      <dd>₺{selectedService.price}</dd>
                    </div>
                  )}
              </dl>

              <div className={styles.summaryNotice}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <p>
                  <strong>Güvenli randevu talebi</strong>
                  Bilgilerin yalnızca ilgili işletmeyle paylaşılır.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
