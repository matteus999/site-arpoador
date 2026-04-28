/* ============================================
   EMPÓRIO ARPOADOR - Script Principal
   ============================================ */

let sbClient = null;

// === PRINCIPAL ===
document.addEventListener('DOMContentLoaded', function() {

    // 1. Supabase (Mantido conforme solicitado)
    try {
        var SUPABASE_URL = 'https://odrcpiaqdsfugrrcmigw.supabase.co';
        var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcmNwaWFxZHNmdWdycmNtaWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODA3NjQsImV4cCI6MjA5MjY1Njc2NH0.mWSFpy6uMMNgWmtK8IutKjjdxPYFaps6JWyv_LhiwF4';
        if (window.supabase && window.supabase.createClient) {
            sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    } catch(e) { console.warn('Supabase offline:', e); }

    // 2. Tracking de Visitas & Presence
    async function trackVisit() {
        if (!sbClient) return;
        try {
            var today = new Date().toISOString().split('T')[0];
            var key = 'visits_arpoador_' + today;
            
            var resp = await sbClient.from('sync_data').select('value').eq('key', key).single();
            var count = resp.data ? (parseInt(resp.data.value) || 0) : 0;
            
            await sbClient.from('sync_data').upsert({ key: key, value: (count + 1).toString() }, { onConflict: 'key' });

            const channel = sbClient.channel('online-users');
            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString(), user: 'client_arpoador' });
                }
            });
        } catch(e) { console.warn('Tracking error:', e); }
    }
    trackVisit();

    // 3. Navbar e Ano
    var year = document.getElementById('current-year');
    if (year) year.textContent = new Date().getFullYear();

    var navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu
    var menuToggle = document.querySelector('.mobile-menu-toggle');
    var navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

});
