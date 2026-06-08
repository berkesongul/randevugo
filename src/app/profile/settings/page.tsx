'use client';

// =============================================================================
// Profile Settings Page — /profile/settings
// =============================================================================

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from '../profile.module.css';

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Şifreler uyuşmuyor.');
      return;
    }

    setIsSaving(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError('Şifre güncellenirken bir hata oluştu: ' + updateError.message);
    } else {
      setSuccess('Şifreniz başarıyla güncellendi.');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsSaving(false);
  }

  return (
    <div>
      <h1 className={styles.panelTitle}>Hesap Ayarları</h1>

      {success && <div className={styles.successMsg}>{success}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Şifre Değiştir
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Hesabınızın güvenliği için güçlü ve benzersiz bir şifre kullanmanızı öneririz.
        </p>

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles.formGroup}>
            <label htmlFor="newPassword">Yeni Şifre</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni şifrenizi girin"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Yeni şifrenizi tekrar girin"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={styles.submitBtn}
          >
            {isSaving ? 'Şifre Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}
