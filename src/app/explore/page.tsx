'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard/BusinessCard';
import PublicHeader from '@/components/PublicHeader/PublicHeader';
import { createClient } from '@/lib/supabase/client';
import type { PublicTenant } from '@/types/types';
import styles from './explore.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  barber: 'Berber',
  beauty_salon: 'Güzellik Salonu',
  clinic: 'Klinik',
  spa: 'Spa & Masaj',
  fitness: 'Fitness & Spor',
  dental: 'Diş Kliniği',
  veterinary: 'Veteriner',
  consulting: 'Danışmanlık',
  photography: 'Fotoğrafçılık',
  education: 'Eğitim & Kurs',
  other: 'Diğer',
};

export default function ExplorePage() {
  const [tenants, setTenants] = useState<PublicTenant[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function fetchCatalog() {
      const [{ data, error: catalogError }, { data: authData }] =
        await Promise.all([
          supabase.rpc('get_public_tenants'),
          supabase.auth.getUser(),
        ]);

      if (!active) return;

      if (catalogError) {
        setError('İşletmeler yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } else {
        setTenants(data || []);
      }

      const authenticated = Boolean(authData.user);
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const { data: favorites } = await supabase.rpc('get_my_favorites');
        if (!active) return;
        setFavoriteIds(
          new Set((favorites || []).map((favorite) => favorite.id))
        );
      }

      setLoading(false);
    }

    void fetchCatalog();
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

  const categories = useMemo(() => {
    const categorySet = new Set(
      tenants.map((tenant) => tenant.category).filter(Boolean) as string[]
    );
    return Array.from(categorySet).sort();
  }, [tenants]);

  const filteredTenants = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('tr-TR');

    return tenants.filter((tenant) => {
      const categoryLabel = CATEGORY_LABELS[tenant.category || 'other'];
      const matchesSearch =
        !normalizedSearch ||
        tenant.name.toLocaleLowerCase('tr-TR').includes(normalizedSearch) ||
        categoryLabel.toLocaleLowerCase('tr-TR').includes(normalizedSearch);
      const matchesCity = !cityFilter || tenant.city === cityFilter;
      const matchesCategory =
        !categoryFilter || tenant.category === categoryFilter;

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [tenants, search, cityFilter, categoryFilter]);

  async function handleFavorite(tenantId: string) {
    if (!isAuthenticated) {
      router.push('/login?redirect=/explore');
      return;
    }

    const shouldFavorite = !favoriteIds.has(tenantId);
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (shouldFavorite) next.add(tenantId);
      else next.delete(tenantId);
      return next;
    });

    const { error: favoriteError } = await supabase.rpc('set_favorite', {
      p_tenant_id: tenantId,
      p_is_favorite: shouldFavorite,
    });

    if (favoriteError) {
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (shouldFavorite) next.delete(tenantId);
        else next.add(tenantId);
        return next;
      });
      setError('Favori tercihi kaydedilemedi.');
    } else {
      setError(null);
    }
  }

  const hasFilters = Boolean(search || cityFilter || categoryFilter);

  return (
    <div className={styles.page}>
      <PublicHeader />

      <section className={styles.hero}>
        <div>
          <span>Randevigo kataloğu</span>
          <h1>Aradığın hizmete uygun işletmeyi keşfet.</h1>
          <p>
            Kategori ve konuma göre filtrele; hizmet detaylarını inceleyip
            randevunu birkaç adımda oluştur.
          </p>
        </div>
        <div className={styles.heroMark} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </div>
      </section>

      <main className={styles.main}>
        <section className={styles.filterPanel} aria-label="İşletme filtreleri">
          <label className={styles.searchField}>
            <span>İşletme veya hizmet ara</span>
            <div>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                type="search"
                placeholder="Örn. berber, klinik..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>

          <label className={styles.selectField}>
            <span>Şehir</span>
            <select
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
            >
              <option value="">Tüm şehirler</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.selectField}>
            <span>Kategori</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">Tüm kategoriler</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category] || category}
                </option>
              ))}
            </select>
          </label>

          {hasFilters && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                setSearch('');
                setCityFilter('');
                setCategoryFilter('');
              }}
            >
              Temizle
            </button>
          )}
        </section>

        <div className={styles.resultsHeader}>
          <div>
            <span>{filteredTenants.length} sonuç</span>
            <h2>
              {cityFilter
                ? `${cityFilter} şehrindeki işletmeler`
                : 'Tüm işletmeler'}
            </h2>
          </div>
          {!isAuthenticated && (
            <p>
              Favorilerini kaydetmek için{' '}
              <Link href="/login?redirect=/explore">giriş yap</Link>.
            </p>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.grid} aria-label="İşletmeler yükleniyor">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className={styles.skeleton}>
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
          <div className={styles.empty}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4M8 11h6" />
            </svg>
            <h3>İşletme bulunamadı</h3>
            <p>Filtreleri değiştirerek tekrar deneyebilirsin.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCityFilter('');
                setCategoryFilter('');
              }}
            >
              Filtreleri temizle
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredTenants.map((tenant) => (
              <BusinessCard
                key={tenant.id}
                tenant={tenant}
                isFavorite={favoriteIds.has(tenant.id)}
                onFavorite={(tenantId) => void handleFavorite(tenantId)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
