# Randevigo

Randevigo; işletmelerin hizmet, personel ve randevularını yönettiği, müşterilerin
işletme keşfedip randevu talebi oluşturabildiği çok kiracılı bir randevu
platformudur.

## Teknoloji

- Next.js 16 App Router ve React 19
- TypeScript
- Supabase Auth ve PostgreSQL
- Supabase Row Level Security (RLS)

Web, gelecekteki Android ve iOS istemcileriyle aynı Supabase projesini ve aynı
güvenli RPC sözleşmelerini kullanacak şekilde tasarlanmıştır.

## Yerel kurulum

Gereksinimler: güncel Node.js LTS ve bir Supabase projesi.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000)
adresinde açılır. Port doluysa Next.js bir sonraki uygun portu kullanır.

`.env.local` içine Supabase Project Settings → API bölümündeki değerleri girin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

`NEXT_PUBLIC_` değişkenlerine yalnızca public/publishable anahtar yazılmalıdır.
Secret veya `service_role` anahtarını hiçbir zaman tarayıcı ortamına koymayın.

## Veritabanı

Kaynak şema `supabase/migrations/` klasöründedir. Migration dosyalarını dosya
numarası sırasıyla Supabase SQL Editor veya Supabase CLI üzerinden uygulayın.

Son migration olan `00009_complete_customer_booking.sql` şunları sağlar:

- müşteri profilindeki telefon/şehir alanları,
- müşteriye bağlı randevular ve güvenli iptal akışı,
- favori işletmeler,
- public katalog için dar kapsamlı RPC’ler,
- randevu oluşturma doğrulamaları ve eşzamanlı rezervasyon koruması,
- özel tablo ve fonksiyonlar için sıkı RLS/izin sınırları.

`supabase_init.sql` eski birleşik şema kopyasıdır; yeni kurulumlarda kaynak
olarak migration klasörünü kullanın.

## Komutlar

```bash
npm run dev
npm run lint
npm run build
npm run start
```

Değişiklik tesliminden önce en az aşağıdaki kontroller çalıştırılmalıdır:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Temel akışlar

- `/` — public işletme kataloğu
- `/explore` — filtreleme ve favoriler
- `/[slug]` — işletmenin public randevu sayfası
- `/customer` ve `/profile/*` — müşteri hesabı/randevuları
- `/dashboard/*` — işletme yönetimi
- `/setup` — yeni işletme kurulumu

Kimlik doğrulama ve rol yönlendirmeleri Next.js 16 `proxy.ts` üzerinden
yürütülür. Yetkilendirme yalnızca arayüze bırakılmaz; asıl veri sınırı Supabase
RLS politikaları ve RPC fonksiyonları tarafından uygulanır.
