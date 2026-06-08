'use client';

// =============================================================================
// Setup Page — Create Business (Tenant)
// =============================================================================
// Shown to authenticated users who don't belong to any tenant yet.
// Creates a new tenant and auto-adds the user as owner via DB triggers.
// =============================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import Image from 'next/image';
import styles from './setup.module.css';

const CATEGORY_OPTIONS = [
  { value: 'barber', label: 'Berber' },
  { value: 'beauty_salon', label: 'Güzellik Salonu' },
  { value: 'clinic', label: 'Klinik' },
  { value: 'spa', label: 'Spa & Masaj' },
  { value: 'fitness', label: 'Fitness & Spor' },
  { value: 'dental', label: 'Diş Kliniği' },
  { value: 'veterinary', label: 'Veteriner' },
  { value: 'consulting', label: 'Danışmanlık' },
  { value: 'photography', label: 'Fotoğrafçılık' },
  { value: 'education', label: 'Eğitim & Kurs' },
  { value: 'other', label: 'Diğer' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function SetupPage() {
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [category, setCategory] = useState('other');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { refresh } = useTenant();

  function handleNameChange(value: string) {
    setBusinessName(value);
    if (!isManualSlug) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setIsManualSlug(true);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      setIsLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('tenants').insert({
      name: businessName,
      slug,
      owner_id: user.id,
      category,
      city: city || null,
      phone: phone || null,
      description: description || null,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Bu URL adresi zaten kullanımda. Lütfen farklı bir adres deneyin.');
      } else {
        setError(insertError.message);
      }
      setIsLoading(false);
      return;
    }

    // Refresh tenant context so the provider picks up the new tenant
    await refresh();
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon} style={{ display: 'flex', justifyContent: 'center' }}>
            <Image
              src="/images/randevigo-logo.png"
              alt="Randevigo Logo"
              width={220}
              height={80}
              priority
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1>İşletmenizi Kurun</h1>
          <p>
            Randevigo&apos;ya hoş geldiniz! Başlamak için işletme bilgilerinizi girin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="businessName">İşletme Adı</label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Örn: Güzellik Salonu Ayşe"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="slug">URL Adresi</label>
            <div className={styles.slugInput}>
              <span className={styles.slugPrefix}>randevigo.com/</span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="isletme-adi"
                required
                pattern="[a-z0-9\-]+"
                title="Sadece küçük harf, rakam ve tire kullanılabilir"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="category">Kategori</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                width: '100%',
              }}
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="city">Şehir</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Örn: İstanbul"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="phone">Telefon</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Örn: 0532 123 4567"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">İşletme Açıklaması</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Müşterilerinize kısaca kendinizden bahsedin..."
              rows={3}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                width: '100%',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading || !businessName || !slug}
          >
            {isLoading ? 'Oluşturuluyor...' : 'İşletmemi Oluştur'}
          </button>
        </form>

        <div className={styles.footer} style={{ marginTop: '2rem' }}>
          <div style={{ opacity: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
             <Image src="/images/randevigo-logo.png" alt="Randevigo Logo" width={80} height={30} style={{ objectFit: 'contain' }} />
             <span style={{ fontSize: '0.85rem' }}>© 2026</span>
          </div>
        </div>
      </div>
    </main>
  );
}

