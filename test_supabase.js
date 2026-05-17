const { createClient } = require('@supabase/supabase-js');

// Hardcoded for testing purposes based on your .env file
const supabaseUrl = "https://jwtjnrbwwjwtaukaoeda.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dGpucmJ3d2p3dGF1a2FvZWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMTE0ODEsImV4cCI6MjA5MjU4NzQ4MX0.diAAnRtaTCw9BvHMW3AFE2l4d_B9er2yRLN5sYLdawo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing connection to Supabase...");
  console.log("URL:", supabaseUrl);
  
  try {
    // Try to fetch one project to test connection
    const { data, error } = await supabase.from('projects').select('*').limit(1);
    
    if (error) {
      console.error("Supabase Error (projects):", error.message);
    } else {
      console.log("Connection to 'projects' table Successful!");
      console.log("Sample Data:", data);
    }

    // Also check profiles table
    console.log("\nChecking 'profiles' table...");
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').limit(1);
    if (profileError) {
      console.error("Profiles Error:", profileError.message);
    } else {
      console.log("Connection to 'profiles' table Successful!");
      console.log("Sample Data:", profileData);
    }

  } catch (err) {
    console.error("Unexpected Error:", err.message);
  }
}

testConnection();
