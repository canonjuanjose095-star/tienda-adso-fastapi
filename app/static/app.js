const $ = (selector) => document.querySelector(selector);
const state = { products: [], cart: new Map(), customers: [], orders: [], search: "" };

const money = (value) => new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 0,
}).format(Number(value));

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const message = typeof data?.detail === "string"
      ? data.detail
      : `No se pudo completar la solicitud (${response.status}).`;
    throw new Error(message);
  }
  return data;
}

function showToast(message, tone = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${tone}`;
  toast.textContent = message;
  $("#toast-region").append(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

function productIllustration(product, index) {
  const name = product.nombre.toLowerCase();
  if (name.includes("monitor")) return `
    <svg viewBox="0 0 240 190" fill="none" aria-hidden="true">
      <rect x="29" y="21" width="182" height="119" rx="9" fill="#334238"/>
      <rect x="37" y="29" width="166" height="103" rx="4" fill="#BCD88F"/>
      <path d="M37 99c31-29 46-37 75-26 23 9 37 8 91-24v83H37V99Z" fill="#79966A"/>
      <path d="M37 111c42-24 70-17 103-7 23 7 39 2 63-12v40H37v-21Z" fill="#415A4A"/>
      <path d="M110 140h20v25h-20z" fill="#697968"/><path d="M86 165h68l13 8v4H73v-4l13-8Z" fill="#53624F"/>
      <circle cx="120" cy="136" r="1.8" fill="#A7BB89"/>
    </svg>`;
  if (name.includes("mouse") || name.includes("ratón")) return `
    <svg viewBox="0 0 240 190" fill="none" aria-hidden="true">
      <path d="M120 28c-35 0-59 26-59 65v19c0 35 23 57 59 57s59-22 59-57V93c0-39-24-65-59-65Z" fill="#39463D"/>
      <path d="M120 31v55" stroke="#AFC88A" stroke-width="3"/><path d="M120 35c-8 0-12 6-12 15v14h24V50c0-9-4-15-12-15Z" fill="#8DA475"/>
      <path d="M68 109c34 11 70 11 104 0" stroke="#61715C" stroke-width="2" opacity=".55"/>
      <path d="M78 149c25 15 59 18 84 0" stroke="#51624F" stroke-width="2" opacity=".5"/>
    </svg>`;
  if (name.includes("teclado") || name.includes("keyboard")) return `
    <svg viewBox="0 0 240 190" fill="none" aria-hidden="true">
      <path d="m30 70 171-25 20 76-170 25L30 70Z" fill="#39443B"/>
      <path d="m39 74 154-22 13 54-153 23-14-55Z" fill="#D9DED0"/>
      <g fill="#899382"><path d="m49 79 12-2 2 8-12 2zm20-3 12-2 2 8-12 2zm20-3 12-2 2 8-12 2zm20-3 12-2 2 8-12 2zm20-3 12-2 2 8-12 2zm20-3 12-2 2 8-12 2zm20-3 12-2 2 8-12 2Z"/>
      <path d="m54 93 12-2 2 8-12 2zm20-3 12-2 2 8-12 2zm20-3 12-2 2 8-12 2zm20-3 12-2 2 8-12 2zm20-3 12-2 2 8-12 2zm20-3 12-2 2 8-12 2zm20-3 12-2 2 8-12 2Z"/>
      <path d="m59 107 14-2 2 8-14 2zm23-4 14-2 2 8-14 2zm23-4 43-6 2 8-43 6zm52-8 14-2 2 8-14 2z"/></g>
      <path d="m75 131 130-19" stroke="#91A183" stroke-width="2"/>
    </svg>`;
  return `<svg viewBox="0 0 240 190" fill="none" aria-hidden="true"><rect x="52" y="37" width="136" height="118" rx="17" fill="#39443B"/><circle cx="120" cy="96" r="34" fill="#BFD89A"/><path d="M120 77v38m-19-19h38" stroke="#52684F" stroke-width="5" stroke-linecap="round"/></svg>`;
}

function renderProducts() {
  const grid = $("#product-grid");
  const filtered = [...state.products];
  const sort = $("#sort-select").value;
  if (sort === "price-up") filtered.sort((a, b) => Number(a.precio) - Number(b.precio));
  if (sort === "price-down") filtered.sort((a, b) => Number(b.precio) - Number(a.precio));
  if (sort === "name") filtered.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  $("#products-count").textContent = String(filtered.length).padStart(2, "0");
  grid.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No encontramos productos con esa búsqueda. Intenta con otro nombre.";
    grid.append(empty);
    return;
  }
  filtered.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    const visual = document.createElement("div");
    visual.className = `product-visual visual-${index % 3}`;
    visual.innerHTML = productIllustration(product, index);
    const badge = document.createElement("span");
    badge.className = "product-badge";
    badge.textContent = product.stock > 0 ? "Selección NOVA" : "Agotado";
    visual.append(badge);
    const info = document.createElement("div");
    info.className = "product-info";
    const meta = document.createElement("div");
    meta.className = "product-meta";
    const name = document.createElement("h3");
    name.className = "product-name";
    name.textContent = product.nombre;
    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = "Tecnología";
    meta.append(name, category);
    const bottom = document.createElement("div");
    bottom.className = "product-bottom";
    const price = document.createElement("strong");
    price.className = "product-price";
    price.textContent = money(product.precio);
    const stock = document.createElement("span");
    stock.className = `stock-label${product.stock > 0 && product.stock < 5 ? " low" : ""}`;
    stock.textContent = product.stock > 0 ? `${product.stock} disponibles` : "Sin existencias";
    const add = document.createElement("button");
    add.className = "add-to-cart";
    add.type = "button";
    add.textContent = "+";
    add.setAttribute("aria-label", `Agregar ${product.nombre} al carrito`);
    add.disabled = product.stock < 1;
    add.addEventListener("click", () => addToCart(product.id));
    bottom.append(price, stock, add);
    info.append(meta, bottom);
    card.append(visual, info);
    grid.append(card);
  });
}

function cartQuantity() {
  return [...state.cart.values()].reduce((sum, line) => sum + line.quantity, 0);
}

function updateCartBadge() {
  $("#cart-count").textContent = String(cartQuantity());
  $("#cart-trigger").setAttribute("aria-label", `Abrir carrito, ${cartQuantity()} productos`);
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  const current = state.cart.get(productId);
  if ((current?.quantity || 0) >= product.stock) {
    showToast("No hay más unidades disponibles de este producto.", "error");
    return;
  }
  state.cart.set(productId, { product, quantity: (current?.quantity || 0) + 1 });
  updateCartBadge();
  renderCart();
  showToast(`${product.nombre} se agregó a tu carrito.`);
}

function changeCartQuantity(productId, delta) {
  const line = state.cart.get(productId);
  if (!line) return;
  const next = line.quantity + delta;
  if (next < 1) state.cart.delete(productId);
  else if (next <= line.product.stock) state.cart.set(productId, { ...line, quantity: next });
  else showToast("Alcanzaste las existencias disponibles.", "error");
  updateCartBadge();
  renderCart();
}

function renderCart() {
  const container = $("#cart-items");
  container.replaceChildren();
  const lines = [...state.cart.entries()];
  if (!lines.length) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "Tu carrito está esperando una buena idea.";
    container.append(empty);
  }
  let total = 0;
  for (const [productId, line] of lines) {
    total += Number(line.product.precio) * line.quantity;
    const row = document.createElement("article");
    row.className = "cart-line";
    const thumb = document.createElement("div");
    thumb.className = "cart-thumb";
    thumb.textContent = line.product.nombre.slice(0, 1).toUpperCase();
    const details = document.createElement("div");
    const name = document.createElement("p");
    name.className = "cart-line-name";
    name.textContent = line.product.nombre;
    const price = document.createElement("strong");
    price.className = "cart-line-price";
    price.textContent = money(Number(line.product.precio) * line.quantity);
    const controls = document.createElement("div");
    controls.className = "quantity-controls";
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", `Quitar una unidad de ${line.product.nombre}`);
    decrease.addEventListener("click", () => changeCartQuantity(productId, -1));
    const quantity = document.createElement("span");
    quantity.textContent = String(line.quantity);
    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "+";
    increase.setAttribute("aria-label", `Agregar una unidad de ${line.product.nombre}`);
    increase.addEventListener("click", () => changeCartQuantity(productId, 1));
    controls.append(decrease, quantity, increase);
    details.append(name, price, controls);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-line";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Quitar ${line.product.nombre} del carrito`);
    remove.addEventListener("click", () => {
      state.cart.delete(productId);
      updateCartBadge();
      renderCart();
    });
    row.append(thumb, details, remove);
    container.append(row);
  }
  $("#cart-total").textContent = money(total);
  $("#checkout-button").disabled = lines.length === 0;
  $("#checkout-button").setAttribute("aria-disabled", String(lines.length === 0));
}

function openCart() {
  $("#modal-backdrop").hidden = false;
  document.body.style.overflow = "hidden";
  renderCart();
  $(".cart-panel").focus();
}

function closeCart() {
  $("#modal-backdrop").hidden = true;
  document.body.style.overflow = "";
  $("#cart-trigger").focus();
}

function renderCustomers(selectedId = "") {
  const select = $("#customer-select");
  select.replaceChildren();
  if (!state.customers.length) {
    const placeholder = new Option("Registra un cliente para continuar", "");
    select.append(placeholder);
    return;
  }
  select.append(new Option("Selecciona tu nombre", ""));
  for (const customer of state.customers) {
    const option = new Option(`${customer.nombre} · ${customer.correo}`, String(customer.id));
    select.append(option);
  }
  if (selectedId) select.value = String(selectedId);
}

async function loadCustomers(selectedId = "") {
  const select = $("#customer-select");
  select.replaceChildren(new Option("Cargando clientes…", ""));
  try {
    state.customers = await api("/clientes");
    renderCustomers(selectedId);
  } catch (error) {
    select.replaceChildren(new Option("No se pudieron cargar los clientes", ""));
    showToast(`No se pudieron cargar los clientes: ${error.message}`, "error");
  }
}

function openCustomerDialog() {
  $("#customer-backdrop").hidden = false;
  $("#customer-name").value = "";
  $("#customer-email").value = "";
  document.body.style.overflow = "hidden";
  $("#customer-name").focus();
}

function closeCustomerDialog() {
  $("#customer-backdrop").hidden = true;
  document.body.style.overflow = $("#modal-backdrop").hidden ? "" : "hidden";
  $("#add-customer").focus();
}

$("#add-customer").addEventListener("click", openCustomerDialog);
$("#close-customer").addEventListener("click", closeCustomerDialog);
$("#customer-backdrop").addEventListener("click", (event) => {
  if (event.target === $("#customer-backdrop")) closeCustomerDialog();
});
$("#customer-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = event.currentTarget.querySelector("[type=submit]");
  submit.disabled = true;
  try {
    const customer = await api("/clientes", {
      method: "POST",
      body: JSON.stringify({
        nombre: $("#customer-name").value.trim(),
        correo: $("#customer-email").value.trim(),
      }),
    });
    state.customers.push(customer);
    renderCustomers(customer.id);
    closeCustomerDialog();
    showToast(`¡Hola, ${customer.nombre}! Ya puedes finalizar tu compra.`);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submit.disabled = false;
  }
});

async function checkout() {
  const customerId = Number($("#customer-select").value);
  if (!customerId) {
    showToast("Selecciona o registra un cliente antes de continuar.", "error");
    $("#customer-select").focus();
    return;
  }
  if (!state.cart.size) {
    showToast("Agrega al menos un producto a tu carrito.", "error");
    return;
  }
  const button = $("#checkout-button");
  button.disabled = true;
  button.innerHTML = "Procesando tu pedido <span aria-hidden=\"true\">…</span>";
  try {
    const order = await api("/pedidos", {
      method: "POST",
      body: JSON.stringify({
        cliente_id: customerId,
        items: [...state.cart.entries()].map(([producto_id, line]) => ({ producto_id, cantidad: line.quantity })),
      }),
    });
    const customer = state.customers.find((item) => item.id === customerId);
    state.cart.clear();
    updateCartBadge();
    renderCart();
    closeCart();
    showToast(`Pedido #${order.id} confirmado. Total: ${money(order.total)}. ¡Gracias${customer ? `, ${customer.nombre}` : ""}!`);
    await Promise.all([loadProducts(state.search), loadOrders()]);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    button.innerHTML = 'Finalizar pedido <span aria-hidden="true">↗</span>';
    button.disabled = state.cart.size === 0;
  }
}

$("#checkout-button").addEventListener("click", checkout);
$("#customer-select").addEventListener("focus", () => {
  if (!state.customers.length) loadCustomers();
});

$("#cart-trigger").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
$("#modal-backdrop").addEventListener("click", (event) => {
  if (event.target === $("#modal-backdrop")) closeCart();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("#modal-backdrop").hidden) closeCart();
});

async function loadProducts(search = "") {
  const grid = $("#product-grid");
  grid.innerHTML = '<div class="loading-state">Preparando la selección<span>…</span></div>';
  try {
    const query = new URLSearchParams({ pagina: "1", limite: "50" });
    if (search.trim()) query.set("buscar", search.trim());
    state.products = await api(`/productos?${query}`);
    renderProducts();
  } catch (error) {
    grid.innerHTML = "";
    const message = document.createElement("div");
    message.className = "empty-state error-state";
    message.append(document.createTextNode(`No se pudo cargar el catálogo: ${error.message} `));
    const retry = document.createElement("button");
    retry.textContent = "Intentar de nuevo";
    retry.addEventListener("click", () => loadProducts(state.search));
    message.append(retry);
    grid.append(message);
    $("#products-count").textContent = "00";
  }
}

let searchTimer;
$("#search-input").addEventListener("input", (event) => {
  state.search = event.target.value;
  $("#clear-search").hidden = !state.search;
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => loadProducts(state.search), 280);
});
$("#clear-search").addEventListener("click", () => {
  $("#search-input").value = "";
  state.search = "";
  $("#clear-search").hidden = true;
  loadProducts();
});
$("#sort-select").addEventListener("change", renderProducts);
$("#search-toggle").addEventListener("click", () => {
  $("#search-input").focus();
  $("#catalogo").scrollIntoView({ behavior: "smooth" });
});

loadProducts();
loadCustomers();
updateCartBadge();
renderCart();
