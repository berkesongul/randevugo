'use client';

import { useState } from 'react';
import { useServices } from '@/hooks/useServices';
import type { Service, ServiceInsert, ServiceUpdate } from '@/types/types';
import styles from './services.module.css';

export default function ServicesPage() {
  const { services, isLoading, error, addService, updateService, deleteService } = useServices();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setName(service.name);
      setDuration(service.duration_minutes);
      setPrice(service.price ? service.price.toString() : '');
      setIsActive(service.is_active);
    } else {
      setEditingService(null);
      setName('');
      setDuration(30);
      setPrice('');
      setIsActive(true);
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || duration <= 0) {
      setFormError('Lütfen geçerli bir isim ve süre girin.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const parsedPrice = price ? parseFloat(price) : null;
      
      if (editingService) {
        await updateService(editingService.id, {
          name,
          duration_minutes: duration,
          price: parsedPrice,
          is_active: isActive,
        });
      } else {
        await addService({
          name,
          duration_minutes: duration,
          price: parsedPrice,
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
    if (window.confirm(`"${name}" hizmetini silmek istediğinize emin misiniz?`)) {
      try {
        await deleteService(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Silme işlemi başarısız oldu.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--text-secondary)' }}>Hizmetler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Hizmetler</h2>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <span>+</span> Yeni Hizmet
        </button>
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', background: 'rgba(255, 107, 107, 0.1)', padding: '1rem', borderRadius: '8px' }}>
          Hata: {error}
        </div>
      )}

      {services.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Henüz hiç hizmet eklemediniz.</p>
          <button className={styles.addBtn} onClick={() => openModal()} style={{ margin: '0 auto' }}>
            İlk Hizmetinizi Ekleyin
          </button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hizmet Adı</th>
                <th>Süre</th>
                <th>Fiyat</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td className={styles.serviceName}>{service.name}</td>
                  <td className={styles.duration}>{service.duration_minutes} dk</td>
                  <td className={styles.price}>{service.price ? `₺${service.price}` : '-'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${service.is_active ? styles.active : styles.inactive}`}>
                      {service.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                      <button className={styles.iconBtn} onClick={() => openModal(service)} title="Düzenle">
                        ✏️
                      </button>
                      <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => handleDelete(service.id, service.name)} title="Sil">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingService ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Hizmet Adı</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Saç Kesimi"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="duration">Süre (Dakika)</label>
                  <input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    min="1"
                    step="5"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="price">Fiyat (₺)</label>
                  <input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Örn: 150"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <input
                  id="isActive"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActive" style={{ margin: 0, color: 'var(--text-primary)' }}>Aktif</label>
              </div>

              {formError && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', marginBottom: '1rem' }}>{formError}</p>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  İptal
                </button>
                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
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

