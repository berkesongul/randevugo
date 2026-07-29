'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from '../profile.module.css';

export default function ProfileEditPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || '');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, city')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        setCity(profile.city || '');
      }
      setIsLoading(false);
    }

    void loadProfile();
  }, [supabase]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSuccess(null);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('Oturum bulunamadı.');
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, city })
      .eq('id', user.id);

    if (updateError) {
      setError(`Güncelleme sırasında hata oluştu: ${updateError.message}`);
    } else {
      setSuccess('Profil bilgilerin başarıyla güncellendi.');
    }
    setIsSaving(false);
  }

  if (isLoading) {
    return <p className={styles.loadingText}>Profil bilgilerin yükleniyor...</p>;
  }

  return (
    <>
      <header className={styles.panelHeader}>
        <span className={styles.panelEyebrow}>Profil bilgileri</span>
        <h1 className={styles.panelTitle}>Kişisel bilgilerini düzenle</h1>
        <p className={styles.panelDescription}>
          Randevu taleplerinde kullanılacak iletişim bilgilerini güncel tut.
        </p>
      </header>

      {success && <div className={styles.successMsg}>{success}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}

      <form className={styles.formCard} onSubmit={handleSave}>
        <div className={styles.formGrid}>
          <div className={`${styles.formGroup} ${styles.formGroupWide}`}>
            <label htmlFor="email">E-posta adresi</label>
            <input id="email" type="email" value={email} disabled />
            <small>Hesabına bağlı e-posta adresi bu ekrandan değiştirilemez.</small>
          </div>
          <div className={`${styles.formGroup} ${styles.formGroupWide}`}>
            <label htmlFor="fullName">Ad soyad</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Adınızı ve soyadınızı girin"
              autoComplete="name"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phone">Telefon numarası</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="05xx xxx xx xx"
              autoComplete="tel"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="city">Şehir</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Örn. İstanbul"
              autoComplete="address-level2"
            />
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="submit" disabled={isSaving} className={styles.submitBtn}>
            {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
          </button>
        </div>
      </form>
    </>
  );
}
