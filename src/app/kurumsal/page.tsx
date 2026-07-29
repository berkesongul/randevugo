import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader/PublicHeader';
import styles from './kurumsal.module.css';

const FEATURES = [
  {
    number: '01',
    title: 'Tek merkezden yönetim',
    description: 'Hizmetlerini, personelini ve randevu taleplerini sade bir panelde bir araya getir.',
  },
  {
    number: '02',
    title: 'Her işletmeye özel sayfa',
    description: 'Müşterilerin paylaşılabilir işletme sayfandan hizmet ve uygun zaman seçebilsin.',
  },
  {
    number: '03',
    title: 'Daha düzenli bir takvim',
    description: 'Randevu durumlarını takip et, günlük planını daha görünür ve yönetilebilir kıl.',
  },
  {
    number: '04',
    title: 'Müşteri deneyimi',
    description: 'Keşiften randevu talebine kadar hızlı ve mobil uyumlu bir deneyim sun.',
  },
];

export default function KurumsalPage() {
  return (
    <div className={styles.page}>
      <PublicHeader />

      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>İşletmeler için Randevigo</span>
            <h1>
              Randevu trafiğini azalt, <em>işine daha çok odaklan.</em>
            </h1>
            <p>
              Randevigo; hizmet veren işletmelerin takvimini, ekibini ve müşteri taleplerini
              tek bir akışta yönetmesine yardımcı olur.
            </p>
            <div className={styles.heroActions}>
              <Link href="/signup?role=owner" className={styles.primaryAction}>
                İşletmeni ücretsiz ekle <span aria-hidden="true">→</span>
              </Link>
              <Link href="/fiyatlandirma" className={styles.secondaryAction}>
                Planları incele
              </Link>
            </div>
            <div className={styles.heroTrust}>
              <span><b>✓</b> Hızlı kurulum</span>
              <span><b>✓</b> Mobil uyumlu</span>
              <span><b>✓</b> Ortak veri altyapısı</span>
            </div>
          </div>

          <div className={styles.productVisual} aria-label="Randevigo işletme paneli ön izlemesi">
            <div className={styles.visualTop}>
              <div>
                <span className={styles.visualDot} />
                <strong>Bugünün akışı</strong>
              </div>
              <span>Canlı panel</span>
            </div>
            <div className={styles.visualStats}>
              <article>
                <span>Bugün</span>
                <strong>8</strong>
                <small>randevu</small>
              </article>
              <article>
                <span>Bekleyen</span>
                <strong>3</strong>
                <small>talep</small>
              </article>
              <article>
                <span>Doluluk</span>
                <strong>%74</strong>
                <small>bu hafta</small>
              </article>
            </div>
            <div className={styles.schedule}>
              <div className={styles.timeColumn}>
                <span>09:00</span>
                <span>10:30</span>
                <span>12:00</span>
                <span>13:30</span>
              </div>
              <div className={styles.scheduleRows}>
                <div className={styles.scheduleItem}>
                  <span className={styles.avatar}>AY</span>
                  <div><strong>Saç kesimi</strong><small>Ayşe Y. · 41 dk.</small></div>
                  <b>Onaylı</b>
                </div>
                <div className={styles.scheduleItem}>
                  <span className={styles.avatar}>MK</span>
                  <div><strong>Bakım paketi</strong><small>Mehmet K. · 60 dk.</small></div>
                  <b>Bekliyor</b>
                </div>
                <div className={styles.openSlot}>+ Uygun zaman aralığı</div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.valueStrip} aria-label="Ürün avantajları">
          <div>
            <strong>Web</strong>
            <span>Müşterilerin seni kolayca bulsun</span>
          </div>
          <div>
            <strong>Panel</strong>
            <span>Ekibini ve takvimini yönet</span>
          </div>
          <div>
            <strong>Mobil</strong>
            <span>Her yerden hızlıca eriş</span>
          </div>
          <div>
            <strong>Tek veri</strong>
            <span>Tüm kanallarda aynı bilgiler</span>
          </div>
        </section>

        <section className={styles.features} aria-labelledby="features-title">
          <div className={styles.sectionHeading}>
            <span>İşini kolaylaştıran yapı</span>
            <h2 id="features-title">Günlük operasyonun için gereken temel parçalar.</h2>
            <p>Dağınık mesajları ve notları, takip edilebilir bir randevu akışına dönüştür.</p>
          </div>
          <div className={styles.featureGrid}>
            {FEATURES.map((feature) => (
              <article key={feature.number}>
                <span>{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.audience}>
          <div className={styles.audienceCopy}>
            <span className={styles.eyebrow}>Farklı işlere, ortak çözüm</span>
            <h2>Randevuyla çalışan her işletmeye uyum sağlar.</h2>
            <p>
              Hizmet süreni, ekibini ve çalışma düzenini sen belirlersin. Randevigo müşteriye
              doğru seçenekleri gösterir, sana yönetilebilir bir talep akışı sunar.
            </p>
            <Link href="/explore">İşletme sayfalarını keşfet <span aria-hidden="true">→</span></Link>
          </div>
          <div className={styles.audienceList}>
            {['Berber ve kuaförler', 'Güzellik merkezleri', 'Klinikler', 'Spa ve bakım', 'Fitness stüdyoları', 'Danışmanlık hizmetleri'].map(
              (item, index) => (
                <div key={item}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item}</strong>
                </div>
              )
            )}
          </div>
        </section>

        <section className={styles.process} aria-labelledby="process-title">
          <div className={styles.sectionHeading}>
            <span>Kurulum süreci</span>
            <h2 id="process-title">Üç adımda randevu almaya başla.</h2>
          </div>
          <div className={styles.processGrid}>
            <article>
              <span>1</span>
              <h3>İşletmeni oluştur</h3>
              <p>Temel işletme ve iletişim bilgilerini gir.</p>
            </article>
            <article>
              <span>2</span>
              <h3>Hizmetlerini ekle</h3>
              <p>Süre, fiyat ve hizmet detaylarını belirle.</p>
            </article>
            <article>
              <span>3</span>
              <h3>Sayfanı paylaş</h3>
              <p>Müşterilerin randevu talebi göndermeye başlasın.</p>
            </article>
          </div>
        </section>

        <section className={styles.security}>
          <div className={styles.securityMark} aria-hidden="true">✓</div>
          <div>
            <span>Güvenli ve kontrollü</span>
            <h2>Veri erişimi rol ve işletme sınırlarıyla yönetilir.</h2>
          </div>
          <p>
            Müşteri, işletme ve personel verileri aynı altyapıda tutulurken her kullanıcı
            yalnızca yetkili olduğu kayıtlara erişir.
          </p>
        </section>

        <section className={styles.faq} aria-labelledby="corporate-faq">
          <div className={styles.sectionHeading}>
            <span>Sık sorulanlar</span>
            <h2 id="corporate-faq">Başlamadan önce</h2>
          </div>
          <div>
            <details>
              <summary>Teknik bilgiye ihtiyacım var mı?</summary>
              <p>Hayır. İşletme bilgilerini ve hizmetlerini paneldeki adımları izleyerek ekleyebilirsin.</p>
            </details>
            <details>
              <summary>Müşteriler uygulama indirmek zorunda mı?</summary>
              <p>Hayır. İşletme sayfan web tarayıcısından da kullanılabilir.</p>
            </details>
            <details>
              <summary>Personel ve hizmetleri ayrı yönetebilir miyim?</summary>
              <p>Evet. Hizmetleri, süreleri ve personel ilişkilerini işletme panelinden düzenleyebilirsin.</p>
            </details>
          </div>
        </section>

        <section className={styles.bottomCta}>
          <div>
            <span>Takvimini sadeleştirmeye hazır mısın?</span>
            <h2>İşletme sayfanı bugün oluştur.</h2>
          </div>
          <Link href="/signup?role=owner">
            Ücretsiz başla <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <strong>Randevigo</strong>
        <nav aria-label="Alt navigasyon">
          <Link href="/explore">İşletmeler</Link>
          <Link href="/fiyatlandirma">Fiyatlandırma</Link>
          <Link href="/login">Giriş yap</Link>
        </nav>
        <span>© 2026 Randevigo</span>
      </footer>
    </div>
  );
}
