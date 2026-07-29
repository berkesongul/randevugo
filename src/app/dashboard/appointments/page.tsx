'use client';

import { useState } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useStaff } from '@/hooks/useStaff';
import type { AppointmentStatus } from '@/types/types';
import styles from './appointments.module.css';

export default function AppointmentsPage() {
  const { appointments, isLoading, error, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { services, isLoading: isLoadingServices } = useServices();
  const { staffList, isLoading: isLoadingStaff } = useStaff();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openModal = () => {
    // Reset form
    setServiceId(services.length > 0 ? services[0].id : '');
    setStaffId(staffList.length > 0 ? staffList[0].id : '');
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    
    // Set default time to next hour
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    // Format for datetime-local input (YYYY-MM-DDThh:mm)
    const formatted = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setStartTime(formatted);
    
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !staffId || !clientName || !startTime) {
      setFormError('Lütfen zorunlu alanları (Hizmet, Personel, Müşteri Adı, Tarih) doldurun.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      // startTime is from datetime-local input, we need to convert it to ISO UTC
      const isoStartTime = new Date(startTime).toISOString();
      
      await addAppointment({
        service_id: serviceId,
        staff_id: staffId,
        client_name: clientName,
        client_phone: clientPhone || undefined,
        client_email: clientEmail || undefined,
        start_time: isoStartTime,
        notes: notes || undefined,
      });
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Randevu oluşturulurken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await updateAppointment(id, { status });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Durum güncellenemedi.');
    }
  };

  const handleDelete = async (id: string, clientName: string) => {
    if (window.confirm(`"${clientName}" adlı müşterinin randevusunu silmek istediğinize emin misiniz?`)) {
      try {
        await deleteAppointment(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Silme işlemi başarısız oldu.');
      }
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'confirmed': return styles.statusConfirmed;
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      default: return styles.statusPending;
    }
  };

  if (isLoading || isLoadingServices || isLoadingStaff) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--text-secondary)' }}>Randevular yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Randevular</h2>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <span>+</span> Yeni Randevu
        </button>
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', background: 'rgba(255, 107, 107, 0.1)', padding: '1rem', borderRadius: '8px' }}>
          Hata: {error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Henüz hiç randevunuz bulunmuyor.</p>
          <button className={styles.addBtn} onClick={() => openModal()} style={{ margin: '0 auto' }}>
            İlk Randevunuzu Oluşturun
          </button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Müşteri</th>
                <th>Hizmet & Personel</th>
                <th>Tarih & Saat</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>
                    <div className={styles.clientName}>{appt.client_name}</div>
                    {(appt.client_phone || appt.client_email) && (
                      <div className={styles.contactInfo}>
                        {appt.client_phone} {appt.client_phone && appt.client_email ? '•' : ''} {appt.client_email}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className={styles.serviceInfo}>
                      {appt.services?.name || 'Bilinmeyen Hizmet'}
                      <span style={{ opacity: 0.5, fontSize: '0.85em', marginLeft: '0.5rem' }}>
                        ({appt.services?.duration_minutes}dk)
                      </span>
                    </div>
                    <div className={styles.staffName}>
                      {appt.staff?.profiles?.full_name || 'İsimsiz Personel'}
                    </div>
                  </td>
                  <td className={styles.dateTime}>
                    <div className={styles.date}>{formatDate(appt.start_time)}</div>
                    <div className={styles.time}>{formatTime(appt.start_time)} - {formatTime(appt.end_time)}</div>
                  </td>
                  <td>
                    <select
                      className={`${styles.statusSelect} ${getStatusClass(appt.status)}`}
                      value={appt.status}
                      onChange={(e) => handleStatusChange(appt.id, e.target.value as AppointmentStatus)}
                    >
                      <option value="pending">Bekliyor</option>
                      <option value="confirmed">Onaylandı</option>
                      <option value="completed">Tamamlandı</option>
                      <option value="cancelled">İptal</option>
                    </select>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => handleDelete(appt.id, appt.client_name)} title="Sil">
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

      {/* Modal for Add Appointment */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Yeni Randevu</h3>
              <button className={styles.closeBtn} onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.formGrid}>
                {/* Müşteri Bilgileri */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="clientName">Müşteri Adı Soyadı *</label>
                  <input
                    id="clientName"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz"
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

                {/* Randevu Detayları */}
                <div className={styles.formGroup}>
                  <label htmlFor="serviceId">Hizmet *</label>
                  <select
                    id="serviceId"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Seçiniz</option>
                    {services.filter(s => s.is_active).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}dk)</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="staffId">Personel *</label>
                  <select
                    id="staffId"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Seçiniz</option>
                    {staffList.filter(s => s.is_active).map(s => (
                      <option key={s.id} value={s.id}>{s.profiles?.full_name || 'İsimsiz Personel'}</option>
                    ))}
                  </select>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="startTime">Tarih ve Saat *</label>
                  <input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="notes">Notlar</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Varsa randevu notlarını buraya ekleyin..."
                  />
                </div>
              </div>

              {formError && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', marginBottom: '1rem' }}>{formError}</p>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  İptal
                </button>
                <button 
                  type="submit" 
                  className={styles.saveBtn} 
                  disabled={isSaving}
                >
                  {isSaving ? 'Kaydediliyor...' : 'Randevu Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
