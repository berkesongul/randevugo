import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader/PublicHeader';
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon';
import { createClient } from '@/lib/supabase/server';
import styles from './profile.module.css';

export default async function BusinessProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: rows } = await supabase.rpc('get_public_tenant', { p_slug: slug });
  const tenant = rows?.[0];
  if (!tenant) notFound();
  const { data: services } = await supabase.rpc('get_public_services', { p_tenant_id: tenant.id });
  const gallery = (tenant.gallery_urls || []).filter(Boolean);
  return <><PublicHeader /><main className={styles.page}>
    <section className={styles.hero} style={tenant.cover_image_url ? { backgroundImage: `linear-gradient(90deg, rgba(10,35,42,.82), rgba(10,35,42,.35)), url(${tenant.cover_image_url})` } : undefined}>
      <div className={styles.heroContent}><Link href="/explore">‹ İşletmelere dön</Link><span>ONLINE RANDEVU</span><h1>{tenant.name}</h1><p>{tenant.description || 'Size iyi gelecek hizmetleri ve uygun randevu saatlerini keşfedin.'}</p><div className={styles.info}>{tenant.city && <b>📍 {tenant.city}</b>}{tenant.phone && <b>☎ {tenant.phone}</b>}</div><Link className={styles.bookButton} href={`/${tenant.slug}/randevu`}>Randevu al →</Link></div>
    </section>
    <section className={styles.content}><div className={styles.about}><h2>İşletme hakkında</h2><p>{tenant.description || 'İşletme açıklaması yakında eklenecek.'}</p>{tenant.address && <p><strong>Adres:</strong> {tenant.address}</p>}</div>
      {gallery.length > 0 && <div className={styles.gallery}>{gallery.map((url: string) => <img src={url} alt={`${tenant.name} görseli`} key={url} />)}</div>}
      <div className={styles.servicesHeading}><div><span>HİZMETLER</span><h2>Hizmetler ve fiyatlar</h2></div><Link href={`/${tenant.slug}/randevu`}>Randevu oluştur →</Link></div>
      <div className={styles.services}>{(services || []).map((service) => <article key={service.id} className={styles.service}><div className={styles.serviceImage}>{service.image_url ? <img src={service.image_url} alt="" /> : <CategoryIcon category={tenant.category} />}</div><div><h3>{service.name}</h3><p>{service.duration_minutes} dakika</p></div><strong>{service.price !== null ? `₺${service.price}` : 'Fiyat sorunuz'}</strong></article>)}</div>
    </section>
  </main></>;
}
