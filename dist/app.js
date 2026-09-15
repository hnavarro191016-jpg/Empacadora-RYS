'use strict';
const form = document.getElementById('quote-form');
const product = document.getElementById('product');
const quantity = document.getElementById('quantity');
const city = document.getElementById('city');
const panel = document.getElementById('summary-panel');
const summary = document.getElementById('summary');
const status = document.getElementById('copy-status');
function prepareRequest(details) {
  const allowed = Array.from(product.options, option => option.value);
  if (!details || !allowed.includes(details.product) || typeof details.quantity !== 'string' || typeof details.city !== 'string' || !details.quantity.trim() || !details.city.trim() || details.quantity.length > 120 || details.city.length > 120) {
    throw new Error('Selecciona un producto válido y escribe cantidad y ciudad, hasta 120 caracteres por campo.');
  }
  product.value = details.product;
  quantity.value = details.quantity.trim();
  city.value = details.city.trim();
  quantity.setCustomValidity('');
  city.setCustomValidity('');
  summary.value = `Hola, Empacadora RyS. Me gustaría solicitar una cotización.\n\nProducto: ${product.value}\nCantidad y presentación: ${quantity.value}\nCiudad o zona: ${city.value}\n\n¿Me comparten precio, disponibilidad y condiciones de entrega?`;
  panel.hidden = false;
  document.getElementById('send-whatsapp').href = 'https://wa.me/528142477041?text=' + encodeURIComponent(summary.value);
  status.textContent = 'Solicitud preparada. Aún no se ha enviado.';
  return {summary: summary.value, sent: false};
}
document.querySelectorAll('[data-product]').forEach(link => {
  link.addEventListener('click', () => {
    product.value = link.dataset.product;
    panel.hidden = true;
  });
});
form.addEventListener('input', () => {
  panel.hidden = true;
  quantity.setCustomValidity('');
  city.setCustomValidity('');
});
form.addEventListener('submit', event => {
  event.preventDefault();
  quantity.setCustomValidity(quantity.value.trim() ? '' : 'Escribe la cantidad y presentación que necesitas.');
  city.setCustomValidity(city.value.trim() ? '' : 'Escribe tu ciudad o zona de entrega.');
  if (!form.reportValidity()) return;
  prepareRequest({product: product.value, quantity: quantity.value, city: city.value});
  summary.focus();
});
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const tool = {
    name: 'prepare_quote_request',
    title: 'Preparar solicitud de cotización',
    description: 'Prepara un resumen visible y un enlace para abrir WhatsApp. No abre WhatsApp, envía mensajes ni confirma pedidos.',
    inputSchema: {
      type: 'object',
      properties: {
        product: {type: 'string', enum: Array.from(product.options, option => option.value)},
        quantity: {type: 'string', minLength: 1, maxLength: 120},
        city: {type: 'string', minLength: 1, maxLength: 120}
      },
      required: ['product', 'quantity', 'city'], additionalProperties: false
    },
    annotations: {readOnlyHint: false, untrustedContentHint: true},
    execute: prepareRequest
  };
  try {
    Promise.resolve(document.modelContext.registerTool(tool, {signal: lifecycle.signal})).catch(() => {});
  } catch { /* La solicitud por formulario permanece disponible. */ }
  window.addEventListener('pagehide', () => lifecycle.abort(), {once: true});
}
document.getElementById('copy').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(summary.value);
    status.textContent = 'Solicitud copiada. Aún no se ha enviado.';
  } catch {
    summary.focus();
    summary.select();
    status.textContent = 'Seleccionamos el texto. Usa Copiar en tu dispositivo para guardarlo.';
  }
});
