'use client';

import { useState, useEffect } from 'react';
import { useStaff, type StaffWithProfile } from '@/hooks/useStaff';
import type { StaffUpdate } from '@/types/types';
import styles from './staff.module.css';

export default function StaffPage() {
  const { staffList, isLoading, error, addStaff, updateStaff, deleteStaff, getPotentialStaff } = useStaff();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffWithProfile | null>(null);
  const [potentialStaffList, setPotentialStaffList] = useState<any[]>([]);
  
  // Form state
  const [profileId, setProfileId] = useState('');
  const [bio, setBio] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPotentialStaff = async () => {
    try {
      const list = await getPotentialStaff();
      setPotentialStaffList(list);
      if (list.length > 0 && !editingStaff) {
        setProfileId(list[0].profile_id);
      }
    } catch (err) {
      console.error('Failed to load potential staff', err);
    }
  };

  const openModal = async (staff?: StaffWithProfile) => {
    if (staff) {
      setEditingStaff(staff);
      setProfileId(staff.profile_id);
      setBio(staff.bio || '');
      setIsActive(staff.is_active);
      setPotentialStaffList([]); // Not needed when editing
    } else {
      setEditingStaff(null);
      setBio('');
      setIsActive(true);
      await fetchPotentialStaff();
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff && !profileId) {
      setFormError('Lütfen eklenecek bir profil seçin.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, {
          bio: bio || null,
          is_active: isActive,
        });
      } else {
        await addStaff({
          profile_id: profileId,
          bio: bio || null,
          is_active: isActive,
        });
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`"${name}" adlı personeli silmek istediğinize emin misiniz?`)) {
      try {
        await deleteStaff(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Silme işlemi başarısız oldu.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--text-secondary)' }}>Personel yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Personel</h2>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <span>+</span> Personel Ekle
        </button>
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', background: 'rgba(255, 107, 107, 0.1)', padding: '1rem', borderRadius: '8px' }}>
          Hata: {error}
        </div>
      )}

      {staffList.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Henüz hiç personel eklemediniz.</p>
          <button className={styles.addBtn} onClick={() => openModal()} style={{ margin: '0 auto' }}>
            İlk Personelinizi Ekleyin
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {staffList.map((staff) => (
            <div key={staff.id} className={styles.staffCard}>
              <div className={styles.staffHeader}>
                <div className={styles.staffInfo}>
                  <h3>{staff.profiles?.full_name || 'İsimsiz Personel'}</h3>
                  <p>{staff.profiles?.email}</p>
                </div>
                <span className={`${styles.statusBadge} ${staff.is_active ? styles.active : styles.inactive}`}>
                  {staff.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              
              <div className={styles.bio}>
                {staff.bio ? (
                  <p style={{ margin: 0 }}>{staff.bio}</p>
                ) : (
                  <p style={{ margin: 0, fontStyle: 'italic', opacity: 0.5 }}>Biyografi eklenmemiş.</p>
                )}
              </div>

              <div className={styles.actions}>
                <button className={styles.iconBtn} onClick={() => openModal(staff)} title="Düzenle">
                  ✏️
                </button>
                <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => handleDelete(staff.id, staff.profiles?.full_name || 'Personel')} title="Sil">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingStaff ? 'Personeli Düzenle' : 'Yeni Personel Ekle'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSave}>
              {!editingStaff && (
                <div className={styles.formGroup}>
                  <label htmlFor="profileId">Kullanıcı Seçin</label>
                  {potentialStaffList.length > 0 ? (
                    <select
                      id="profileId"
                      value={profileId}
                      onChange={(e) => setProfileId(e.target.value)}
                      required
                    >
                      {potentialStaffList.map((member) => (
                        <option key={member.profile_id} value={member.profile_id}>
                          {member.profiles?.full_name || member.profiles?.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                      Eklenebilecek yeni bir kullanıcı bulunamadı. Önce işletmenize üye davet etmelisiniz.
                    </div>
                  )}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="bio">Biyografi / Uzmanlık</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Personelin uzmanlık alanları veya kısa biyografisi..."
                />
              </div>

              <div className={styles.checkboxGroup}>
                <input
                  id="isActive"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActive" style={{ margin: 0, color: 'var(--text-primary)' }}>Aktif (Randevu Alabilir)</label>
              </div>

              {formError && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', marginBottom: '1rem' }}>{formError}</p>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  İptal
                </button>
                <button 
                  type="submit" 
                  className={styles.saveBtn} 
                  disabled={isSaving || (!editingStaff && potentialStaffList.length === 0)}
                >
                  {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

