// scratch/check-tenants.js
// Supabase'deki tüm tenant (işletme) kayıtlarını kontrol eder ve eksik/hatalı slug veya temel alanları raporlar.

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL veya Key eksik. .env dosyanızı kontrol edin.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTenants() {
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('id, name, slug, city, address, phone, description, category');

  if (error) {
    console.error('Supabase sorgu hatası:', error);
    process.exit(1);
  }

  let hasProblem = false;
  tenants.forEach((tenant) => {
    const problems = [];
    if (!tenant.slug || typeof tenant.slug !== 'string' || tenant.slug.trim() === '') {
      problems.push('Eksik veya hatalı slug');
    }
    if (!tenant.name || typeof tenant.name !== 'string' || tenant.name.trim() === '') {
      problems.push('Eksik isim');
    }
    // Diğer temel alanlar için de kontrol eklenebilir
    if (problems.length > 0) {
      hasProblem = true;
      console.log(`ID: ${tenant.id} | Name: ${tenant.name || '-'} | Slug: ${tenant.slug || '-'}\n  Sorunlar: ${problems.join(', ')}`);
    }
  });

  if (!hasProblem) {
    console.log('Tüm tenant kayıtları geçerli. Eksik veya hatalı slug yok.');
  }
}

checkTenants();
