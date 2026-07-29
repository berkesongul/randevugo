'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BusinessCard from '@/components/BusinessCard/BusinessCard';
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon';
import PublicHeader from '@/components/PublicHeader/PublicHeader';
import { createClient } from '@/lib/supabase/client';
import type { BusinessCategory, PublicTenant } from '@/types/types';
import styles from './homepage.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  barber: 'Berber',
  beauty_salon: 'Güzellik',
  clinic: 'Klinik',
  spa: 'Spa',
  fitness: 'Fitness',
  dental: 'Diş',
  veterinary: 'Veteriner',
  consulting: 'Danışmanlık',
  photography: 'Fotoğraf',
  education: 'Eğitim',
  other: 'Diğer',
};

const FEATURED_CATEGORIES: BusinessCategory[] = [
  'barber',
  'beauty_salon',
  'clinic',
  'spa',
  'fitness',
  'veterinary',
];

export default function Homepage() {
  const [tenants, setTenants] = useState<PublicTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedCity, setAppliedCity] = useState('');
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function loadTenants() {
      const { data, error } = await supabase.rpc('get_public_tenants');
      if (!active) return;

      if (error) {
        setLoadError('İşletmeler şu anda yüklenemiyor. Lütfen tekrar deneyin.');
      } else {
        setTenants(data || []);
      }
      setLoading(false);
    }

    void loadTenants();
    return () => {
      active = false;
    };
  }, [supabase]);

  const cities = useMemo(() => {
    const citySet = new Set(
      tenants.map((tenant) => tenant.city).filter(Boolean) as string[]
    );
    return Array.from(citySet).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [tenants]);

  const filteredTenants = useMemo(() => {
    const normalizedSearch = appliedSearch.trim().toLocaleLowerCase('tr-TR');

    return tenants.filter((tenant) => {
      const categoryLabel = CATEGORY_LABELS[tenant.category || 'other'];
      const matchesSearch =
        !normalizedSearch ||
        tenant.name.toLocaleLowerCase('tr-TR').includes(normalizedSearch) ||
        categoryLabel.toLocaleLowerCase('tr-TR').includes(normalizedSearch);
      const matchesCity =
        !appliedCity ||
        tenant.city?.toLocaleLowerCase('tr-TR') ===
          appliedCity.toLocaleLowerCase('tr-TR');

      return matchesSearch && matchesCity;
    });
  }, [tenants, appliedSearch, appliedCity]);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setAppliedSearch(searchQuery);
    setAppliedCity(selectedCity);
  }

  function handleCategory(category: BusinessCategory) {
    setSearchQuery(CATEGORY_LABELS[category]);
    setAppliedSearch(CATEGORY_LABELS[category]);
    document
      .getElementById('isletmeler')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className={styles.page}>
      <PublicHeader />

      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <span />
              Randevun, birkaç dokunuş uzağında
            </span>
            <h1>
              Kendine ayırdığın zamanı
              <em> kolayca planla.</em>
            </h1>
            <p>
              Yakınındaki güvenilir işletmeleri keşfet, hizmetini seç ve sana
              uygun saate randevu talebini gönder.
            </p>

            <div className={styles.heroActions}>
              <Link href="/explore" className={styles.primaryAction}>
                İşletmeleri keşfet
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
              <Link href="/signup?role=owner" className={styles.secondaryAction}>
                İşletmeni ekle
              </Link>
            </div>

            <div className={styles.trustRow}>
              <div className={styles.avatarStack} aria-hidden="true">
                <span>AY</span>
                <span>SK</span>
                <span>ME</span>
              </div>
              <p>
                <strong>Hızlı ve ücretsiz</strong>
                Hesabını oluştur, randevunu yönet.
              </p>
            </div>
          </div>

          <div className={styles.preview} aria-label="Randevu ekranı ön izlemesi">
            <div className={styles.previewTop}>
              <div>
                <span className={styles.previewDot} />
                <strong>Randevigo</strong>
              </div>
              <span>Güvenli randevu</span>
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewDate}>
                <span>Bugün</span>
                <strong>14:30</strong>
              </div>
              <div className={styles.previewService}>
                <div className={styles.previewIcon}>
                  <CategoryIcon category="barber" />
                </div>
                <div>
                  <span>Seçilen hizmet</span>
                  <strong>Saç kesimi</strong>
                    <small>41 dakika · Seçili işletme</small>
                </div>
                <span className={styles.previewCheck}>✓</span>
              </div>
              <div className={styles.previewTimeline}>
                <span className={styles.timelineActive}>14:30</span>
                <span>15:15</span>
                <span>16:00</span>
              </div>
              <div className={styles.previewConfirm}>
                <span>
                  <i>✓</i>
                  Talebin hazır
                </span>
                <strong>Devam et</strong>
              </div>
            </div>
            <span className={styles.previewBadge}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Kolay planlama
            </span>
          </div>
        </div>

        <form className={styles.searchPanel} onSubmit={handleSearch}>
          <label className={styles.searchField}>
            <span>Ne arıyorsun?</span>
            <div>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="İşletme veya hizmet"
              />
            </div>
          </label>

          <label className={styles.searchField}>
            <span>Nerede?</span>
            <div>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s7-5.1 7-12A7 7 0 1 0 5 9c0 6.9 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <select
                value={selectedCity}
                onChange={(event) => setSelectedCity(event.target.value)}
              >
                <option value="">Tüm şehirler</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <button type="submit">
            Randevu ara
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </form>
      </section>

      <main>
        <section className={styles.categorySection}>
          <div className={styles.sectionIntro}>
            <span>Popüler kategoriler</span>
            <h2>İhtiyacına göre keşfet</h2>
          </div>
          <div className={styles.categoryGrid}>
            {FEATURED_CATEGORIES.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => handleCategory(category)}
              >
                <CategoryIcon category={category} />
                <span>{CATEGORY_LABELS[category]}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.businessSection} id="isletmeler">
          <div className={styles.businessHeading}>
            <div className={styles.sectionIntro}>
              <span>Öne çıkan işletmeler</span>
              <h2>
                {appliedCity
                  ? `${appliedCity} için seçenekler`
                  : 'Sana uygun işletmeyi bul'}
              </h2>
              <p>
                Hizmetleri karşılaştır, detayları incele ve uygun zamanda
                randevunu oluştur.
              </p>
            </div>
            <Link href="/explore">
              Tümünü görüntüle
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>

          {loadError && <div className={styles.errorState}>{loadError}</div>}

          {loading ? (
            <div className={styles.businessGrid} aria-label="İşletmeler yükleniyor">
              {[0, 1, 2].map((item) => (
                <div key={item} className={styles.skeletonCard}>
                  <span />
                  <div>
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className={styles.emptyState}>
              <CategoryIcon category="other" />
              <h3>Aramana uygun işletme bulunamadı</h3>
              <p>Farklı bir kategori veya şehir seçerek tekrar deneyebilirsin.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('');
                  setAppliedSearch('');
                  setAppliedCity('');
                }}
              >
                Filtreleri temizle
              </button>
            </div>
          ) : (
            <div className={styles.businessGrid}>
              {filteredTenants.slice(0, 6).map((tenant) => (
                <BusinessCard key={tenant.id} tenant={tenant} />
              ))}
            </div>
          )}
        </section>

        <section className={styles.howSection}>
          <div className={styles.sectionIntro}>
            <span>Nasıl çalışır?</span>
            <h2>Üç adımda randevun hazır</h2>
          </div>
          <div className={styles.stepsGrid}>
            <article>
              <b>01</b>
              <div className={styles.stepIcon}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
              </div>
              <h3>İşletmeni bul</h3>
              <p>Kategori ve konuma göre sana uygun seçenekleri keşfet.</p>
            </article>
            <article>
              <b>02</b>
              <div className={styles.stepIcon}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="16" rx="3" />
                  <path d="M8 3v4M16 3v4M3 10h18" />
                </svg>
              </div>
              <h3>Zamanını seç</h3>
              <p>Hizmet, personel ve sana uygun tarih-saat bilgisini belirle.</p>
            </article>
            <article>
              <b>03</b>
              <div className={styles.stepIcon}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3>Talebini gönder</h3>
              <p>Bilgilerini kontrol et, talebini gönder ve hesabından takip et.</p>
            </article>
          </div>
        </section>

        <section className={styles.ownerCta}>
          <div>
            <span>İşletmeler için Randevigo</span>
            <h2>Takvimini sadeleştir, işine daha çok zaman ayır.</h2>
            <p>
              Hizmetlerini, personelini ve randevu taleplerini tek bir panelden
              yönetmeye başla.
            </p>
          </div>
          <Link href="/signup?role=owner">
            İşletmeni ücretsiz ekle
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <div>
          <Image
            src="/images/randevigo-logo.svg"
            alt="Randevigo"
            width={110}
            height={60}
          />
          <p>Randevunu kolayca planla, zamanını kendine ayır.</p>
        </div>
        <nav aria-label="Alt navigasyon">
          <Link href="/explore">İşletmeler</Link>
          <Link href="/kurumsal">Kurumsal</Link>
          <Link href="/fiyatlandirma">Fiyatlandırma</Link>
        </nav>
        <span>© 2026 Randevigo</span>
      </footer>
    </div>
  );
}
