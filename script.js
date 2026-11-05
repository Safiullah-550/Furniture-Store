// Furniture store — search, tabs, wishlist, cart, countdown, FAQ, newsletter

// >>> ONLINE PAYMENT FORM — ZAROORI NOTE <<<
// Ye form sirf front-end hai: customer apne card ki details is mein likhta hai,
// lekin is static website se card se koi asli payment NAHI kat-ti, aur card ki
// details kahin save ya send NAHI hoti (na server, na localStorage, na email).
// Asli payment ke liye payment gateway (Stripe / JazzCash / Easypaisa merchant)
// aur backend chahiye — wo alag kaam hai, is form se nahi hota.

const cart = [];
let wishCount = 0;

const cartBtn = document.getElementById('cartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('overlay');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartCountEl = document.getElementById('cartCount');
const shipNoteEl = document.getElementById('shipNote');
const shipBarEl = document.getElementById('shipBar');
const toastEl = document.getElementById('toast');

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  setTimeout(function () { toastEl.classList.add('hidden'); }, 2200);
}

function openCart() {
  cartDrawer.classList.remove('hidden');
  overlay.classList.remove('hidden');
}
function closeCart() {
  cartDrawer.classList.add('hidden');
  overlay.classList.add('hidden');
}
cartBtn.addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

function renderCart() {
  let total = 0;
  let count = 0;
  cartItemsEl.innerHTML = '';
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="muted">Your cart is empty. Add a chair, sofa or lamp to start.</p>';
  }
  cart.forEach(function (item, i) {
    total += item.price * item.qty;
    count += item.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = '<div><strong>' + item.name + '</strong><p>$' + item.price.toFixed(2) + ' × ' + item.qty + '</p></div>' +
      '<button data-i="' + i + '">Remove</button>';
    cartItemsEl.appendChild(div);
  });
  cartCountEl.textContent = count;
  cartTotalEl.textContent = '$' + total.toFixed(2);
  const freeLimit = 50;
  if (total >= freeLimit) {
    shipNoteEl.textContent = 'You have free shipping!';
    shipBarEl.style.width = '100%';
  } else {
    shipNoteEl.textContent = 'Add $' + (freeLimit - total).toFixed(2) + ' more for free shipping (orders above $50).';
    shipBarEl.style.width = Math.min(100, (total / freeLimit) * 100) + '%';
  }
  cartItemsEl.querySelectorAll('button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      cart.splice(Number(btn.dataset.i), 1);
      renderCart();
    });
  });
}

document.querySelectorAll('.add-cart').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const name = btn.dataset.name;
    const price = Number(btn.dataset.price);
    const found = cart.find(function (x) { return x.name === name; });
    if (found) { found.qty += 1; } else { cart.push({ name: name, price: price, qty: 1 }); }
    renderCart();
    showToast(name + ' added to cart');
  });
});

function cartTotal() {
  return cart.reduce(function (s, item) { return s + item.price * item.qty; }, 0);
}

// Online payment form — Place Order par dikhaya jata hai, Pay Now par check hota hai.
// Cart tab clear hota hai jab payment form submit ho jaye (ya COD select ho).
let pendingOrder = null;

function showPayForm(orderNo, total) {
  pendingOrder = { num: orderNo, total: total };
  document.getElementById('payOrderNo').textContent = orderNo;
  document.getElementById('payTotal').textContent = '$' + total.toFixed(2);
  document.getElementById('payNowBtn').textContent = 'Pay $' + total.toFixed(2);
  document.getElementById('payFormBox').classList.remove('hidden');
}

function hidePayForm() {
  document.getElementById('payFormBox').classList.add('hidden');
  document.getElementById('payForm').reset();
  pendingOrder = null;
}

document.getElementById('checkoutBtn').addEventListener('click', function () {
  if (cart.length === 0) { showToast('Your cart is empty'); return; }
  const total = cartTotal();
  const num = 'FRN-' + Math.floor(100000 + Math.random() * 900000);
  const method = document.querySelector('input[name="payMethod"]:checked').value;
  const msg = document.getElementById('orderMsg');
  msg.classList.add('hidden');
  if (method === 'online') {
    // Cart abhi clear nahi hota — pehle customer form bhare, phir Pay Now par order complete hoga.
    showPayForm(num, total);
  } else {
    hidePayForm();
    msg.textContent = 'Order placed! Your order number is ' + num + '. Cash on delivery selected.';
    msg.classList.remove('hidden');
    cart.length = 0;
    renderCart();
  }
});

// Card number: sirf digits, har 4 digits ke baad space (1234 5678 9012 3456)
document.getElementById('cardNumber').addEventListener('input', function () {
  const digits = this.value.replace(/\D/g, '').slice(0, 16);
  this.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
});

// Expiry: MM/YY, slash khud lag jata hai
document.getElementById('cardExpiry').addEventListener('input', function () {
  let d = this.value.replace(/\D/g, '').slice(0, 4);
  if (d.length > 2) { d = d.slice(0, 2) + '/' + d.slice(2); }
  this.value = d;
});

// CVV: sirf digits
document.getElementById('cardCvv').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 4);
});

document.getElementById('payForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!pendingOrder) { showToast('Please place your order first.'); return; }
  const name = document.getElementById('cardName').value.trim();
  const cardDigits = document.getElementById('cardNumber').value.replace(/\D/g, '');
  const expiry = document.getElementById('cardExpiry').value;
  const cvv = document.getElementById('cardCvv').value;
  if (name.length < 3) { showToast('Please enter the name on the card.'); return; }
  if (cardDigits.length !== 16) { showToast('Please enter a valid 16-digit card number.'); return; }
  const parts = expiry.split('/');
  const mm = Number(parts[0]);
  const yy = Number(parts[1]);
  if (parts.length !== 2 || mm < 1 || mm > 12 || !parts[1] || parts[1].length !== 2) {
    showToast('Please enter the expiry date as MM/YY.');
    return;
  }
  const now = new Date();
  const expYear = 2000 + yy;
  const expMonth = mm;
  if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
    showToast('This card has expired. Please check the expiry date.');
    return;
  }
  if (cvv.length < 3) { showToast('Please enter the 3-digit CVV from the back of the card.'); return; }
  // Card details yahan kahin save/send nahi hoti — form clear kar di jati hai.
  const msg = document.getElementById('orderMsg');
  msg.textContent = 'Order placed! Your order number is ' + pendingOrder.num + '. Thank you — your order has been received. We will contact you to confirm delivery.';
  msg.classList.remove('hidden');
  hidePayForm();
  cart.length = 0;
  renderCart();
});

// Wishlist
document.querySelectorAll('.wish').forEach(function (btn) {
  btn.addEventListener('click', function () {
    btn.classList.toggle('active');
    btn.textContent = btn.classList.contains('active') ? '♥' : '♡';
    wishCount += btn.classList.contains('active') ? 1 : -1;
    document.getElementById('wishCount').textContent = wishCount;
  });
});
document.getElementById('wishBtn').addEventListener('click', function () {
  showToast(wishCount === 0 ? 'Your wishlist is empty — tap ♡ on a product.' : wishCount + ' item(s) in your wishlist.');
});

// Product tabs + search + category shortcuts
let activeTab = 'all';
let activeCat = '';

function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  let visible = 0;
  document.querySelectorAll('#productGrid .product').forEach(function (card) {
    const name = card.dataset.name.toLowerCase();
    const tabOk = activeTab === 'all' || card.dataset.tab.split(' ').includes(activeTab);
    const catOk = !activeCat || card.dataset.cat === activeCat;
    const searchOk = !q || name.includes(q);
    const show = tabOk && catOk && searchOk;
    card.style.display = show ? '' : 'none';
    if (show) visible += 1;
  });
  document.getElementById('noResults').classList.toggle('hidden', visible !== 0);
}

document.querySelectorAll('#productTabs .tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('#productTabs .tab').forEach(function (t) { t.classList.remove('active'); });
    tab.classList.add('active');
    activeTab = tab.dataset.tab;
    applyFilters();
  });
});
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.querySelectorAll('[data-filter-cat]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    activeCat = btn.dataset.filterCat;
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    showToast('Showing ' + activeCat + ' products');
    applyFilters();
  });
});

// Flash sale countdown — starts at 4 days, 14 hours, 48 minutes, 18 seconds from first load
let target = Date.now() + ((4 * 24 + 14) * 3600 + 48 * 60 + 18) * 1000;
function pad(n) { return String(n).padStart(2, '0'); }
function tick() {
  let diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  document.getElementById('cdDays').textContent = pad(d);
  document.getElementById('cdHours').textContent = pad(h);
  document.getElementById('cdMins').textContent = pad(m);
  document.getElementById('cdSecs').textContent = pad(s);
}
setInterval(tick, 1000);
tick();

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(function (btn) {
  btn.addEventListener('click', function () {
    btn.parentElement.classList.toggle('open');
  });
});

// Newsletter
document.getElementById('newsForm').addEventListener('submit', function (e) {
  e.preventDefault();
  document.getElementById('newsMsg').classList.remove('hidden');
  document.getElementById('newsEmail').value = '';
});

renderCart();
applyFilters();
