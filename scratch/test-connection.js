
async function testConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log(`Testing connection to: ${url}`);
  
  if (!url || !key) {
    console.error("Missing environment variables!");
    return;
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: {
        'apikey': key
      }
    });
    
    if (res.ok) {
      console.log(" Success! Supabase Auth is reachable.");
      const data = await res.json();
      console.log("Health Data:", data);
    } else {
      console.error(` Failed with status: ${res.status}`);
      const text = await res.text();
      console.error("Response:", text);
    }
  } catch (err) {
    console.error(" Connection error:", err.message);
    if (err.message.includes("getaddrinfo ENOTFOUND")) {
      console.error("Hint: The host could not be resolved. Check for typos in the URL.");
    }
  }
}

testConnection();
