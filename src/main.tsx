import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Aggressive Cache Clearing for Development
if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log('🧹 Starting aggressive cache clearing...');
  
  // 1. Unregister all service workers
  navigator.serviceWorker?.getRegistrations().then(regs => {
    regs.forEach(reg => {
      console.log('🗑️ Unregistering service worker:', reg);
      reg.unregister();
    });
  });
  
  // 2. Clear all caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        console.log('🗑️ Deleting cache:', cacheName);
        caches.delete(cacheName);
      });
    });
  }
  
  // 3. Clear all localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('auth') || key.includes('token')) {
      console.log('🗑️ Clearing localStorage key:', key);
      localStorage.removeItem(key);
    }
  });
  
  // 4. Clear sessionStorage
  sessionStorage.clear();
  console.log('🗑️ Cleared sessionStorage');
  
  // 5. Force reload if this is not the first load
  if (performance.navigation.type === 1) { // Navigation type 1 = reload
    console.log('🔄 This is a reload, clearing everything...');
    // Clear everything and reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
  
  console.log('✅ Cache clearing completed');
}


// Temporary debug function for login issues
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as any).testLogin = async (email: string, password: string) => {
    console.log('Testing login with:', email);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('Direct Supabase login result:', { data, error });
      return { data, error };
    } catch (err) {
      console.error('Direct login error:', err);
      return { error: err };
    }
  };

  (window as any).createAccount = async (email: string, password: string, role: string = 'patient') => {
    console.log('Creating account for:', email);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0],
            role,
          },
        },
      });
      console.log('Account creation result:', { data, error });
      return { data, error };
    } catch (err) {
      console.error('Account creation error:', err);
      return { error: err };
    }
  };

  (window as any).testYourLogin = async () => {
    console.log('Testing login with your credentials...');
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      console.log('Supabase client loaded, making auth request...');
      
      // Add timeout to prevent hanging
      const authPromise = supabase.auth.signInWithPassword({
        email: 'nvtarakanadh@gmail.com',
        password: 'qwerty12345',
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout after 10 seconds')), 10000)
      );
      
      const result = await Promise.race([authPromise, timeoutPromise]);
      console.log('Your login test result:', result);
      return result;
    } catch (err) {
      console.error('Your login test error:', err);
      return { error: err };
    }
  };

  (window as any).testSupabaseConnection = async () => {
    console.log('Testing Supabase connection...');
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      console.log('Supabase client loaded');
      console.log('Supabase URL:', 'https://wgcmusjsuziqjkzuaqkd.supabase.co');
      console.log('Supabase Key (first 20 chars):', 'eyJhbGciOiJIUzI1NiIs...');
      
      // Test basic connection with shorter timeout
      const connectionPromise = supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
      );
      
      const result = await Promise.race([connectionPromise, timeoutPromise]);
      console.log('Supabase connection test:', result);
      return result;
    } catch (err) {
      console.error('Supabase connection error:', err);
      return { error: err };
    }
  };

  (window as any).testDirectFetch = async () => {
    console.log('Testing direct fetch to Supabase...');
    try {
      const response = await fetch('https://wgcmusjsuziqjkzuaqkd.supabase.co/rest/v1/', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4'
        }
      });
      
      console.log('Direct fetch response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const text = await response.text();
      console.log('Response body:', text);
      
      return { status: response.status, ok: response.ok, text };
    } catch (err) {
      console.error('Direct fetch error:', err);
      return { error: err };
    }
  };

  (window as any).testAuthEndpoint = async () => {
    console.log('Testing auth endpoint directly...');
    try {
      const response = await fetch('https://wgcmusjsuziqjkzuaqkd.supabase.co/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4',
        },
        body: JSON.stringify({
          email: 'nvtarakanadh@gmail.com',
          password: 'qwerty12345'
        })
      });
      
      console.log('Auth endpoint response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const text = await response.text();
      console.log('Auth response body:', text);
      
      return { status: response.status, ok: response.ok, text };
    } catch (err) {
      console.error('Auth endpoint error:', err);
      return { error: err };
    }
  };

  // Test login immediately
  (window as any).testLoginNow = async () => {
    console.log('🧪 Testing login immediately...');
    try {
      const response = await fetch('https://wgcmusjsuziqjkzuaqkd.supabase.co/auth/v1/token?grant_type=password&_t=' + Date.now(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          email: 'nvtarakanadh@gmail.com',
          password: 'qwerty12345'
        })
      });
      
      const result = await response.json();
      console.log('🧪 Login test result:', { status: response.status, ok: response.ok, hasUser: !!result.user });
      return result;
    } catch (err) {
      console.error('🧪 Login test error:', err);
      return { error: err };
    }
  };

  // Test doctors API
  (window as any).testDoctorsAPI = async () => {
    console.log('🧪 Testing doctors API...');
    try {
      const response = await fetch(`https://wgcmusjsuziqjkzuaqkd.supabase.co/rest/v1/profiles?role=eq.doctor&select=user_id,full_name,specialization,hospital_affiliation`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('🧪 Doctors API response status:', response.status);
      const doctors = await response.json();
      console.log('🧪 Doctors API response data:', doctors);
      return doctors;
    } catch (err) {
      console.error('🧪 Doctors API error:', err);
      return { error: err };
    }
  };

  console.log('Debug functions available:');
  console.log('- window.testLogin(email, password)');
  console.log('- window.createAccount(email, password, role)');
  console.log('- window.testYourLogin() - tests your specific credentials');
  console.log('- window.testSupabaseConnection() - tests basic connection');
  console.log('- window.testDirectFetch() - tests direct HTTP request');
  console.log('- window.testAuthEndpoint() - tests auth endpoint directly');
  console.log('- window.testLoginNow() - tests login immediately');
  console.log('- window.testDoctorsAPI() - tests doctors API directly');
}

createRoot(document.getElementById("root")!).render(<App />);
