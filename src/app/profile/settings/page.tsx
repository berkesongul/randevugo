'use client';

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

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setError(`Şifre güncellenirken bir hata oluştu: ${updateError.message}`);
    } else {
      setSuccess('Şifren başarıyla güncellendi.');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsSaving(false);
  }

  return (
    <>
      <header className={styles.panelHeader}>
        <span className={styles.panelEyebrow}>Hesap güvenliği</span>
        <h1 className={styles.panelTitle}>Şifre ve güvenlik</h1>
        <p className={styles.panelDescription}>
          Hesabını korumak için güçlü ve yalnızca Randevigo&apos;da kullandığın bir şifre belirle.
        </p>
      </header>

      {success && <div className={styles.successMsg}>{success}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}

      <form className={styles.securityCard} onSubmit={handlePasswordChange}>
        <div className={styles.securityIntro}>
          <span className={styles.securityIcon} aria-hidden="true">Ş</span>
          <div>
            <h2>Şifreni değiştir</h2>
            <p>Yeni şifren en az 6 karakterden oluşmalı.</p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="newPassword">Yeni şifre</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Yeni şifreni gir"
              autoComplete="new-password"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Yeni şifre tekrar</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Yeni şifreni tekrar gir"
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="submit" disabled={isSaving} className={styles.submitBtn}>
            {isSaving ? 'Şifre güncelleniyor...' : 'Şifreyi güncelle'}
          </button>
        </div>
      </form>
    </>
  );
}
