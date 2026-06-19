<script>
  import { onMount, onDestroy } from 'svelte';
  import { distritosScorados, distritoSeleccionado, ofertas, cargandoOfertas, inversor } from '../stores/inversor.js';

  let mapEl;
  let map;
  let L;
  let marcadoresDistrito = {};
  let marcadoresOfertas = [];
  let capas = { distritos: null, ofertas: null };

  function scoreColor(s) {
    if (s >= 70) return '#10b981';
    if (s >= 50) return '#f59e0b';
    if (s >= 25) return '#6366f1';
    return '#374151';
  }

  function crearIconoDistrito(d) {
    const color = d.accesible ? scoreColor(d.score) : '#374151';
    const size = d.accesible ? 36 : 28;
    const html = `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:${color}22;
        border:2px solid ${color};
        display:flex;align-items:center;justify-content:center;
        font-size:${d.accesible ? 11 : 9}px;
        font-weight:700;
        color:${color};
        backdrop-filter:blur(4px);
        box-shadow:0 0 12px ${color}44;
      ">${d.accesible ? d.score : '—'}</div>
    `;
    return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size/2, size/2] });
  }

  function crearIconoOferta(precio) {
    return L.divIcon({
      html: `<div style="
        background:#1e293b;border:1px solid #6366f1;
        color:#a5b4fc;font-size:10px;font-weight:600;
        padding:3px 6px;border-radius:4px;white-space:nowrap;
        box-shadow:0 2px 8px #00000088;
      ">🏠 ${new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(precio)}€</div>`,
      className: '',
      iconSize: [null, null],
      iconAnchor: [0, 0]
    });
  }

  function renderizarDistritosEnMapa(distritos) {
    if (!map || !L) return;

    // Limpiar marcadores anteriores
    Object.values(marcadoresDistrito).forEach(m => m.remove());
    marcadoresDistrito = {};

    distritos.forEach(d => {
      const m = L.marker([d.lat, d.lng], { icon: crearIconoDistrito(d), zIndexOffset: d.accesible ? 100 : 0 })
        .bindTooltip(`
          <div style="font-family:monospace;font-size:12px;min-width:180px">
            <strong style="font-size:13px">${d.nombre}</strong><br>
            ${d.accesible ? `Score: <strong>${d.score}</strong> · Flujo: <strong style="color:${d.flujo_neto_mensual>0?'#10b981':'#ef4444'}">${d.flujo_neto_mensual>0?'+':''}${new Intl.NumberFormat('es-ES').format(d.flujo_neto_mensual)} €/mes</strong><br>` : '<em style="color:#ef4444">Fuera de presupuesto</em><br>'}
            Venta: ${new Intl.NumberFormat('es-ES').format(d.venta_m2)} €/m² · Alquiler: ${d.alquiler_m2_mes} €/m²/mes<br>
            R. bruta: ${d.rent_bruta}%
          </div>
        `, { className: 'tooltip-mapa', direction: 'top', offset: [0, -10] })
        .on('click', () => {
          distritoSeleccionado.set($distritoSeleccionado?.id === d.id ? null : d);
        });
      m.addTo(map);
      marcadoresDistrito[d.id] = m;
    });
  }

  function renderizarOfertasEnMapa(listaOfertas) {
    if (!map || !L) return;
    marcadoresOfertas.forEach(m => m.remove());
    marcadoresOfertas = [];

    listaOfertas.forEach(o => {
      const m = L.marker([o.lat, o.lng], { icon: crearIconoOferta(o.precio), zIndexOffset: 200 })
        .bindPopup(`
          <div style="font-size:12px;max-width:220px">
            <strong>${o.titulo}</strong><br>
            ${o.m2 ? o.m2 + ' m² · ' : ''}${o.habitaciones ? o.habitaciones + ' hab · ' : ''}${o.distrito}<br>
            <strong style="font-size:14px">${new Intl.NumberFormat('es-ES').format(o.precio)} €</strong><br>
            ${o.precio_m2 ? `${new Intl.NumberFormat('es-ES').format(o.precio_m2)} €/m²<br>` : ''}
            <a href="${o.url}" target="_blank" style="color:#6366f1">Ver anuncio →</a>
          </div>
        `);
      m.addTo(map);
      marcadoresOfertas.push(m);
    });
  }

  // Resaltar distrito seleccionado
  $: if (map && L && $distritoSeleccionado) {
    const m = marcadoresDistrito[$distritoSeleccionado.id];
    if (m) map.setView([$distritoSeleccionado.lat, $distritoSeleccionado.lng], 14, { animate: true });
  }

  $: if (map && L) renderizarDistritosEnMapa($distritosScorados);
  $: if (map && L) renderizarOfertasEnMapa($ofertas);

  onMount(async () => {
    L = (await import('leaflet')).default;
    await import('leaflet/dist/leaflet.css');

    map = L.map(mapEl, {
      center: [40.416775, -3.703790],
      zoom: 12,
      zoomControl: true,
    });

    // Tiles oscuros (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    renderizarDistritosEnMapa($distritosScorados);
  });

  onDestroy(() => { if (map) map.remove(); });

  async function cargarOfertas() {
    if (!$distritoSeleccionado) return;
    cargandoOfertas.set(true);
    try {
      const res = await fetch(`/data/ofertas_${$distritoSeleccionado.id}.json`);
      if (res.ok) {
        ofertas.set(await res.json());
      } else {
        ofertas.set([]);
      }
    } catch {
      ofertas.set([]);
    }
    cargandoOfertas.set(false);
  }
</script>

<div class="mapa-wrapper">
  <div bind:this={mapEl} class="mapa-leaflet"></div>

  <div class="mapa-overlay-top">
    <div class="leyenda-mapa">
      <span class="litem" style="--c:#10b981">Score >70</span>
      <span class="litem" style="--c:#f59e0b">50–70</span>
      <span class="litem" style="--c:#6366f1">25–50</span>
      <span class="litem" style="--c:#374151">Fuera presupuesto</span>
    </div>

    {#if $distritoSeleccionado}
      <button class="btn-cargar-ofertas" on:click={cargarOfertas} disabled={$cargandoOfertas}>
        {#if $cargandoOfertas}
          Cargando…
        {:else}
          Ver ofertas en {$distritoSeleccionado.nombre}
        {/if}
      </button>
    {/if}
  </div>

  {#if $ofertas.length > 0}
    <div class="mapa-overlay-bottom">
      <span class="ofertas-count">{$ofertas.length} ofertas en mapa</span>
      <button class="btn-limpiar" on:click={() => ofertas.set([])}>✕ Limpiar</button>
    </div>
  {/if}
</div>

<style>
  .mapa-wrapper { position: relative; width: 100%; height: 100%; }
  .mapa-leaflet { width: 100%; height: 100%; }

  .mapa-overlay-top {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    z-index: 1000;
    pointer-events: none;
  }
  .leyenda-mapa {
    display: flex;
    gap: 8px;
    background: #0f111788;
    backdrop-filter: blur(8px);
    border: 1px solid #1e2330;
    border-radius: 8px;
    padding: 8px 12px;
    pointer-events: auto;
  }
  .litem {
    font-size: 11px;
    color: var(--c);
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .litem::before {
    content: '';
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--c);
    display: inline-block;
  }

  .btn-cargar-ofertas {
    pointer-events: auto;
    background: #6366f1;
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 12px #6366f166;
    transition: background 0.15s;
  }
  .btn-cargar-ofertas:hover { background: #4f46e5; }
  .btn-cargar-ofertas:disabled { opacity: 0.6; cursor: default; }

  .mapa-overlay-bottom {
    position: absolute;
    bottom: 30px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1000;
    background: #0f111788;
    backdrop-filter: blur(8px);
    border: 1px solid #6366f1;
    border-radius: 8px;
    padding: 8px 12px;
  }
  .ofertas-count { font-size: 12px; color: #a5b4fc; }
  .btn-limpiar {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    font-size: 12px;
    padding: 0;
  }
  .btn-limpiar:hover { color: #e2e8f0; }

  :global(.tooltip-mapa) {
    background: #0f1117 !important;
    border: 1px solid #2d3448 !important;
    color: #cbd5e1 !important;
    border-radius: 6px !important;
    padding: 8px 10px !important;
    box-shadow: 0 4px 20px #00000088 !important;
  }
  :global(.tooltip-mapa::before) { display: none !important; }
  :global(.leaflet-popup-content-wrapper) {
    background: #0f1117 !important;
    border: 1px solid #2d3448 !important;
    color: #cbd5e1 !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 20px #00000088 !important;
  }
  :global(.leaflet-popup-tip) { background: #0f1117 !important; }
  :global(.leaflet-popup-close-button) { color: #6b7280 !important; }
</style>
