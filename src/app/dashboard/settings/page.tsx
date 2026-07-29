'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { createClient } from '@/lib/supabase/client';
import styles from './settings.module.css';
import type { BusinessCategory } from '@/types/types';

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

export default function SettingsPage() {
  const { tenant, refresh } = useTenant();
  const supabase = createClient();
  
  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('other');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('Europe/Istanbul');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load initial data
  useEffect(() => {
    if (!tenant) return;

    const timer = window.setTimeout(() => {
      setName(tenant.name || '');
      setSlug(tenant.slug || '');
      setCategory(tenant.category || 'other');
      setCity(tenant.city || '');
      setPhone(tenant.phone || '');
      setDescription(tenant.description || '');
      
      if (tenant.settings && typeof tenant.settings === 'object') {
        if (typeof tenant.settings.timezone === 'string') {
          setTimezone(tenant.settings.timezone);
        }
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [tenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name,
          slug,
          category,
          city: city || null,
          phone: phone || null,
          description: description || null,
          settings: {
            ...((tenant.settings as object) || {}),
            timezone
          }
        })
        .eq('id', tenant.id);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi.' });
      await refresh(); // Refresh tenant context
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Kaydedilirken bir hata oluştu.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!tenant) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>İşletme Ayarları</h2>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className={styles.card}>
        <h3 className={styles.cardTitle}>Genel Bilgiler</h3>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="name">İşletme Adı</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="slug">URL Uzantısı (Slug)</label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="^[a-z0-9-]+$"
              title="Sadece küçük harf, rakam ve tire (-) kullanılabilir"
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Örn: randevigo.com/<strong>{slug || 'isletme-adi'}</strong>
            </small>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="category">Kategori</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as BusinessCategory)}
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="city">Şehir</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Örn: İstanbul"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="phone">Telefon</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Örn: 0532 123 4567"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="timezone">Zaman Dilimi</label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Berlin">Europe/Berlin (GMT+1)</option>
              <option value="America/New_York">America/New_York (GMT-5)</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">İşletme Açıklaması</label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Müşterilerinize kısaca kendinizden bahsedin..."
          />
        </div>

        <div className={styles.actions}>
          <button 
            type="submit" 
            className={styles.saveBtn} 
            disabled={isSaving || !name || !slug}
          >
            {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
