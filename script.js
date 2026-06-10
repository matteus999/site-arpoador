/* ============================================
   EMPÓRIO ARPOADOR - Script Principal
   ============================================ */

let sbClient = null;

// === CART STATE ===
var cart = [];
var appliedCoupon = null;
var WHATSAPP_NUMBER = '5548991228857';

// === SAMPLE PRODUCTS (fallback if no produtos.js) ===
var CATALOG_PRODUCTS = typeof CATALOG_PRODUCTS !== 'undefined' ? CATALOG_PRODUCTS : [
    { id: 'p1', name: 'Porção de Camarão', price: 45.00, category: 'Frutos do Mar', image: 'assets/logo.png' },
    { id: 'p2', name: 'Chopp 600ml', price: 14.00, category: 'Bebidas', image: 'assets/logo.png' },
    { id: 'p3', name: 'Caipirinha de Limão', price: 18.00, category: 'Bebidas', image: 'assets/logo.png' },
    { id: 'p4', name: 'Iscas de Peixe', price: 38.00, category: 'Frutos do Mar', image: 'assets/logo.png' },
    { id: 'p5', name: 'Pastel de Camarão', price: 12.00, category: 'Porções', image: 'assets/logo.png' },
    { id: 'p6', name: 'Água Mineral 500ml', price: 5.00, category: 'Bebidas', image: 'assets/logo.png' },
    { id: 'p7', name: 'Refrigerante Lata', price: 7.00, category: 'Bebidas', image: 'assets/logo.png' },
    { id: 'p8', name: 'Porção de Lula', price: 42.00, category: 'Frutos do Mar', image: 'assets/logo.png' },
];

// === PRINCIPAL ===
document.addEventListener('DOMContentLoaded', function() {

    // 1. Supabase
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

    // 4. Initialize Catalog
    renderCatalog();

    // 5. Search functionality
    var searchInput = document.getElementById('catalog-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderCatalog(this.value);
        });
    }

});

// === CATALOG ===
function openCatalog() {
    var modal = document.getElementById('catalog-modal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeCatalog() {
    var modal = document.getElementById('catalog-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function renderCatalog(searchTerm) {
    var grid = document.getElementById('catalog-grid');
    var categoriesContainer = document.getElementById('catalog-categories');
    if (!grid) return;

    // Get unique categories
    var categories = ['Todos'];
    CATALOG_PRODUCTS.forEach(function(p) {
        if (categories.indexOf(p.category) === -1) {
            categories.push(p.category);
        }
    });

    // Render category buttons
    if (categoriesContainer && categoriesContainer.children.length === 0) {
        categoriesContainer.innerHTML = categories.map(function(cat, i) {
            return '<button class="cat-btn' + (i === 0 ? ' active' : '') + '" onclick="filterCategory(\'' + cat + '\', this)">' + cat + '</button>';
        }).join('');
    }

    // Filter products
    var filtered = CATALOG_PRODUCTS;
    if (searchTerm) {
        var term = searchTerm.toLowerCase();
        filtered = filtered.filter(function(p) {
            return p.name.toLowerCase().indexOf(term) !== -1 || 
                   p.category.toLowerCase().indexOf(term) !== -1;
        });
    }

    // Render products
    grid.innerHTML = filtered.map(function(p) {
        return '<div class="product-card">' +
            '<div class="product-image-container">' +
                '<img src="' + p.image + '" alt="' + p.name + '" class="product-image" onerror="this.src=\'assets/logo.png\'">' +
            '</div>' +
            '<div class="product-info">' +
                '<span class="product-tag">' + p.category + '</span>' +
                '<h3 class="product-title">' + p.name + '</h3>' +
                '<span class="product-price">R$ ' + p.price.toFixed(2).replace('.', ',') + '</span>' +
                '<button class="add-to-cart-btn" onclick="addToCart(\'' + p.id + '\')">' +
                    '<i class="ph ph-plus"></i> Adicionar' +
                '</button>' +
            '</div>' +
        '</div>';
    }).join('');
}

function filterCategory(cat, btn) {
    // Update button styles
    document.querySelectorAll('.cat-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');

    var grid = document.getElementById('catalog-grid');
    if (!grid) return;

    var filtered = cat === 'Todos' ? CATALOG_PRODUCTS : CATALOG_PRODUCTS.filter(function(p) {
        return p.category === cat;
    });

    grid.innerHTML = filtered.map(function(p) {
        return '<div class="product-card">' +
            '<div class="product-image-container">' +
                '<img src="' + p.image + '" alt="' + p.name + '" class="product-image" onerror="this.src=\'assets/logo.png\'">' +
            '</div>' +
            '<div class="product-info">' +
                '<span class="product-tag">' + p.category + '</span>' +
                '<h3 class="product-title">' + p.name + '</h3>' +
                '<span class="product-price">R$ ' + p.price.toFixed(2).replace('.', ',') + '</span>' +
                '<button class="add-to-cart-btn" onclick="addToCart(\'' + p.id + '\')">' +
                    '<i class="ph ph-plus"></i> Adicionar' +
                '</button>' +
            '</div>' +
        '</div>';
    }).join('');
}

// === CART ===
function addToCart(productId) {
    var product = CATALOG_PRODUCTS.find(function(p) { return p.id === productId; });
    if (!product) return;

    var existing = cart.find(function(item) { return item.id === productId; });
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
    }

    updateCartUI();
    showToast('✅ ' + product.name + ' adicionado!');
}

function removeFromCart(productId) {
    var idx = cart.findIndex(function(item) { return item.id === productId; });
    if (idx !== -1) {
        if (cart[idx].qty > 1) {
            cart[idx].qty--;
        } else {
            cart.splice(idx, 1);
        }
    }
    updateCartUI();
}

function increaseQty(productId) {
    var item = cart.find(function(item) { return item.id === productId; });
    if (item) {
        item.qty++;
        updateCartUI();
    }
}

function getCartTotal() {
    var total = cart.reduce(function(sum, item) { return sum + (item.price * item.qty); }, 0);
    if (appliedCoupon) {
        var discount = total * (appliedCoupon.pct / 100);
        total -= discount;
    }
    return total;
}

function getCartCount() {
    return cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
}

function updateCartUI() {
    var count = getCartCount();
    var total = getCartTotal();
    var totalFormatted = 'R$ ' + total.toFixed(2).replace('.', ',');

    // Update counters
    var fabCount = document.getElementById('fab-cart-count');
    var catalogCount = document.getElementById('catalog-cart-count');
    var fabTotal = document.getElementById('fab-cart-total');
    var cartTotal = document.getElementById('cart-total-value');
    var checkoutTotal = document.getElementById('checkout-total-value');
    var goBtn = document.getElementById('go-to-checkout-btn');
    var fab = document.getElementById('fab-cart');

    if (fabCount) fabCount.textContent = count;
    if (catalogCount) catalogCount.textContent = count;
    if (fabTotal) fabTotal.textContent = totalFormatted;
    if (cartTotal) cartTotal.textContent = totalFormatted;
    if (checkoutTotal) checkoutTotal.textContent = totalFormatted;

    // Show/hide FAB
    if (fab) {
        if (count > 0) {
            fab.classList.remove('hidden');
        } else {
            fab.classList.add('hidden');
        }
    }

    // Enable/disable checkout button
    if (goBtn) {
        goBtn.disabled = count === 0;
    }

    // Render cart items
    var listEl = document.getElementById('cart-items-list');
    var emptyMsg = document.getElementById('cart-empty-msg');
    if (!listEl) return;

    if (cart.length === 0) {
        listEl.innerHTML = '<div class="cart-empty-msg">Seu carrinho está vazio</div>';
        return;
    }

    listEl.innerHTML = cart.map(function(item) {
        return '<div class="cart-item">' +
            '<img src="' + item.image + '" alt="' + item.name + '" onerror="this.src=\'assets/logo.png\'">' +
            '<div class="cart-item-info">' +
                '<h4>' + item.name + '</h4>' +
                '<span class="cart-item-price">R$ ' + (item.price * item.qty).toFixed(2).replace('.', ',') + '</span>' +
            '</div>' +
            '<div class="cart-item-qty">' +
                '<button class="qty-btn" onclick="increaseQty(\'' + item.id + '\')">+</button>' +
                '<span class="qty-val">' + item.qty + '</span>' +
                '<button class="qty-btn remove" onclick="removeFromCart(\'' + item.id + '\')">−</button>' +
            '</div>' +
        '</div>';
    }).join('');

    // Animate badge
    if (fabCount) {
        fabCount.classList.add('wow');
        setTimeout(function() { fabCount.classList.remove('wow'); }, 300);
    }
}

function openCart() {
    var sidebar = document.getElementById('cart-sidebar');
    var overlay = document.getElementById('cart-overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    var sidebar = document.getElementById('cart-sidebar');
    var overlay = document.getElementById('cart-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
    // Reset to items view
    backToCart();
}

function goToCheckout() {
    if (cart.length === 0) return;
    var itemsView = document.getElementById('cart-view-items');
    var checkoutView = document.getElementById('cart-view-checkout');
    if (itemsView) itemsView.classList.remove('active');
    if (checkoutView) checkoutView.classList.add('active');
}

function backToCart() {
    var itemsView = document.getElementById('cart-view-items');
    var checkoutView = document.getElementById('cart-view-checkout');
    if (itemsView) itemsView.classList.add('active');
    if (checkoutView) checkoutView.classList.remove('active');
}

// === PIX PAYMENT NOTICE ===
function onPaymentChange() {
    var paymentSelect = document.getElementById('checkout-payment');
    var pixNotice = document.getElementById('pix-notice');
    if (!paymentSelect || !pixNotice) return;

    if (paymentSelect.value === 'PIX') {
        pixNotice.style.display = 'block';
        // Trigger re-animation
        pixNotice.style.animation = 'none';
        pixNotice.offsetHeight; // force reflow
        pixNotice.style.animation = '';
    } else {
        pixNotice.style.display = 'none';
    }
}

function copyPixKey() {
    var pixKey = '48991228857';
    var copiedMsg = document.getElementById('pix-copied-msg');
    
    // Try clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pixKey).then(function() {
            showCopiedFeedback(copiedMsg);
        }).catch(function() {
            fallbackCopy(pixKey, copiedMsg);
        });
    } else {
        fallbackCopy(pixKey, copiedMsg);
    }
}

function fallbackCopy(text, copiedMsg) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showCopiedFeedback(copiedMsg);
    } catch(e) {
        showToast('❌ Não foi possível copiar a chave');
    }
    document.body.removeChild(ta);
}

function showCopiedFeedback(el) {
    if (el) {
        el.classList.add('show');
        setTimeout(function() { el.classList.remove('show'); }, 2500);
    }
    showToast('✅ Chave PIX copiada!');
}

// === COUPON ===
function applyCoupon() {
    var input = document.getElementById('coupon-input');
    var msg = document.getElementById('coupon-message');
    if (!input || !msg) return;

    var code = input.value.toUpperCase().trim();
    if (!code) {
        msg.textContent = 'Digite um cupom';
        msg.className = 'coupon-message error';
        return;
    }

    // Try to load coupons from localStorage (synced from admin)
    var coupons = [];
    try {
        coupons = JSON.parse(localStorage.getItem('alambique_coupons') || '[]');
    } catch(e) {}

    var found = coupons.find(function(c) { return c.code === code && c.active; });
    if (found) {
        var pct = parseInt(found.discount);
        appliedCoupon = { code: code, pct: pct };
        msg.textContent = '✅ Cupom aplicado! ' + found.discount + ' de desconto';
        msg.className = 'coupon-message success';
        updateCartUI();
    } else {
        msg.textContent = '❌ Cupom inválido ou expirado';
        msg.className = 'coupon-message error';
        appliedCoupon = null;
        updateCartUI();
    }
}

// === SEND TO WHATSAPP ===
function sendToWhatsApp() {
    var name = document.getElementById('checkout-name').value.trim();
    var phone = document.getElementById('checkout-phone').value.trim();
    var address = document.getElementById('checkout-address').value.trim();
    var payment = document.getElementById('checkout-payment').value;
    var obs = document.getElementById('checkout-obs').value.trim();

    // Validation
    if (!name) { alert('Por favor, informe seu nome.'); return; }
    if (!phone) { alert('Por favor, informe seu telefone.'); return; }
    if (!address) { alert('Por favor, informe o endereço de entrega.'); return; }
    if (!payment) { alert('Por favor, selecione a forma de pagamento.'); return; }

    var total = getCartTotal();
    var orderId = 'ARQ' + Date.now().toString().slice(-6);

    // Build message
    var msg = '🛒 *NOVO PEDIDO - ' + orderId + '*\n\n';
    msg += '👤 *Cliente:* ' + name + '\n';
    msg += '📞 *Telefone:* ' + phone + '\n';
    msg += '📍 *Endereço:* ' + address + '\n\n';
    msg += '📦 *Itens do Pedido:*\n';
    
    cart.forEach(function(item) {
        msg += '  • ' + item.qty + 'x ' + item.name + ' - R$ ' + (item.price * item.qty).toFixed(2).replace('.', ',') + '\n';
    });

    msg += '\n💰 *Total: R$ ' + total.toFixed(2).replace('.', ',') + '*';
    
    if (appliedCoupon) {
        msg += '\n🏷️ *Cupom:* ' + appliedCoupon.code + ' (-' + appliedCoupon.pct + '%)';
    }

    msg += '\n💳 *Pagamento:* ' + payment;
    
    if (payment === 'PIX') {
        msg += '\n\n📱 *Pagamento via PIX selecionado*';
        msg += '\n⚠️ Enviarei o comprovante nesta conversa.';
    }

    if (obs) {
        msg += '\n\n📝 *Observações:* ' + obs;
    }

    // Save order locally
    try {
        var orders = JSON.parse(localStorage.getItem('alambique_orders') || '[]');
        orders.unshift({
            id: Date.now(),
            order_id: orderId,
            date: new Date().toLocaleString('pt-BR'),
            customer: name,
            phone: phone,
            address: address,
            payment: payment,
            total: total,
            items: cart.map(function(i) { return { name: i.name, qty: i.qty, price: i.price }; })
        });
        localStorage.setItem('alambique_orders', JSON.stringify(orders));
    } catch(e) { console.warn('Error saving order:', e); }

    // Open WhatsApp
    var whatsappUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
    window.open(whatsappUrl, '_blank');

    // Clear cart
    cart = [];
    appliedCoupon = null;
    updateCartUI();
    closeCart();
    showToast('✅ Pedido enviado! Verifique o WhatsApp.');
}

// === TOAST ===
function showToast(message) {
    var container = document.getElementById('toast-container');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    container.appendChild(toast);

    setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
}
