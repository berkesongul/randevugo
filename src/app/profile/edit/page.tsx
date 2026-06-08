'use client';

// =============================================================================
// Profile Edit Page — /profile/edit
// =============================================================================

import { useState, useEffect } from 'react';
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
      const { data: { user } } = await supabase.auth.getUser();
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
    loadProfile();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(null);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Oturum bulunamadı.');
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        city: city
      })
      .eq('id', user.id);

    if (updateError) {
      setError('Güncelleme sırasında hata oluştu: ' + updateError.message);
    } else {
      setSuccess('Profil bilgileriniz başarıyla güncellendi.');
    }
    setIsSaving(false);
  }

  if (isLoading) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div>
      <h1 className={styles.panelTitle}>Profilimi Düzenle</h1>
      
      {success && <div className={styles.successMsg}>{success}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className={styles.formGroup}>
          <label htmlFor="email">E-posta Adresi (Değiştirilemez)</label>
          <input
            id="email"
            type="email"
            value={email}
            disabled
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="fullName">Ad Soyad</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Adınızı ve soyadınızı girin"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phone">Telefon Numarası</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05xxxxxxxxx"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="city">Bulunduğunuz Şehir</label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Örn: İstanbul"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={styles.submitBtn}
        >
          {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </form>
    </div>
  );
}
