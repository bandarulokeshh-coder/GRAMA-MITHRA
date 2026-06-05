const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://yilutowemkpqruaxrxmv.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbHV0b3dlbWtwcXJ1YXhyeG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTAxMjUsImV4cCI6MjA5NjA2NjEyNX0.feB3WKrEnZBegJZTbNMN_xyaZLAHV2JVYxyRxGzjZfs";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  console.log("Connecting to Supabase...");
  const { data, error } = await supabase.from("schemes").select("*").limit(5);
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
