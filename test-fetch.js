const SUPABASE_URL = "https://yilutowemkpqruaxrxmv.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbHV0b3dlbWtwcXJ1YXhyeG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTAxMjUsImV4cCI6MjA5NjA2NjEyNX0.feB3WKrEnZBegJZTbNMN_xyaZLAHV2JVYxyRxGzjZfs";

async function test() {
  console.log("Fetching schemes...");
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/schemes?select=*&limit=5`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      },
    );
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
