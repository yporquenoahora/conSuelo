#!/usr/bin/env node
/**
 * scraper.js — Obtiene ofertas de Idealista y las guarda como JSON en public/data/
 *
 * MODOS DE USO:
 *   node scripts/scraper.js --modo demo         → genera datos de ejemplo (sin API)
 *   node scripts/scraper.js --modo apify        → usa Apify Idealista scraper
 *   node scripts/scraper.js --distrito centro   → solo un distrito
 *
 * CONFIGURACIÓN APIFY:
 *   1. Crea cuenta en apify.com (plan gratuito: 5$/mes de créditos incluidos)
 *   2. Activa el actor "petr_cermak/idealista-scraper" o "drobnikj/idealista-scraper"
 *   3. Crea un .env con: APIFY_TOKEN=tu_token
 *   4. Coste estimado: ~0.10-0.30€ por 100 ofertas scrapeadas
 *
 * CRON DIARIO (añade a crontab -e):
 *   0 7 * * * cd /ruta/a/madrid-inversor && node scripts/scraper.js --modo apify >> logs/scraper.log 2>&1
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../public/data');

const args = process.argv.slice(2);
const modoIdx = args.indexOf('--modo');
const modo = modoIdx !== -1 ? args[modoIdx + 1] : 'demo';
const distIdx = args.indexOf('--distrito');
const soloDist = distIdx !== -1 ? args[distIdx + 1] : null;

// Coordenadas de centro de cada distrito para buscar en radio
const DISTRITOS_CONFIG = {
  centro:          { lat: 40.4168, lng: -3.7038, radio_km: 1.2, nombre: "Centro" },
  salamanca:       { lat: 40.4274, lng: -3.6810, radio_km: 1.5, nombre: "Salamanca" },
  chamberi:        { lat: 40.4352, lng: -3.7037, radio_km: 1.5, nombre: "Chamberí" },
  chamartin:       { lat: 40.4560, lng: -3.6782, radio_km: 1.8, nombre: "Chamartín" },
  retiro:          { lat: 40.4093, lng: -3.6793, radio_km: 1.5, nombre: "Retiro" },
  arganzuela:      { lat: 40.3975, lng: -3.7017, radio_km: 1.5, nombre: "Arganzuela" },
  tetuan:          { lat: 40.4530, lng: -3.7057, radio_km: 1.5, nombre: "Tetuán" },
  moncloa:         { lat: 40.4338, lng: -3.7340, radio_km: 2.0, nombre: "Moncloa-Aravaca" },
  usera:           { lat: 40.3889, lng: -3.7120, radio_km: 1.5, nombre: "Usera" },
  latina:          { lat: 40.4063, lng: -3.7391, radio_km: 1.8, nombre: "Latina" },
  carabanchel:     { lat: 40.3840, lng: -3.7391, radio_km: 2.0, nombre: "Carabanchel" },
  vallecas_puente: { lat: 40.3929, lng: -3.6610, radio_km: 2.0, nombre: "Puente de Vallecas" },
  villaverde:      { lat: 40.3497, lng: -3.7120, radio_km: 2.0, nombre: "Villaverde" },
  vallecas_villa:  { lat: 40.3720, lng: -3.6220, radio_km: 2.0, nombre: "Villa de Vallecas" },
  vicalvaro:       { lat: 40.4010, lng: -3.6090, radio_km: 1.8, nombre: "Vicálvaro" },
  san_blas:        { lat: 40.4260, lng: -3.6250, radio_km: 2.0, nombre: "San Blas-Canillejas" },
  moratalaz:       { lat: 40.4030, lng: -3.6490, radio_km: 1.8, nombre: "Moratalaz" },
  ciudad_lineal:   { lat: 40.4460, lng: -3.6520, radio_km: 2.0, nombre: "Ciudad Lineal" },
  hortaleza:       { lat: 40.4770, lng: -3.6460, radio_km: 2.5, nombre: "Hortaleza" },
  fuencarral:      { lat: 40.5000, lng: -3.7100, radio_km: 3.0, nombre: "Fuencarral-El Pardo" },
  barajas:         { lat: 40.4800, lng: -3.5800, radio_km: 2.5, nombre: "Barajas" }
};

// ─── MODO DEMO ────────────────────────────────────────────────────────────────
function generarOfertasDemo(distritoId, config) {
  const precios = {
    centro: [380000, 420000, 510000, 290000, 650000],
    salamanca: [780000, 950000, 1200000, 680000],
    chamberi: [650000, 720000, 890000, 480000],
    chamartin: [520000, 680000, 750000],
    retiro: [340000, 420000, 560000],
    arganzuela: [310000, 380000, 290000],
    tetuan: [350000, 420000, 480000],
    moncloa: [430000, 520000, 600000],
    usera: [190000, 220000, 175000, 250000],
    latina: [230000, 280000, 195000],
    carabanchel: [220000, 260000, 185000, 310000],
    vallecas_puente: [140000, 165000, 130000, 190000],
    villaverde: [125000, 148000, 110000],
    vallecas_villa: [160000, 185000, 200000],
    vicalvaro: [175000, 210000, 195000],
    san_blas: [190000, 225000, 215000],
    moratalaz: [200000, 240000, 220000],
    ciudad_lineal: [230000, 270000, 250000],
    hortaleza: [280000, 320000, 350000],
    fuencarral: [350000, 390000, 420000],
    barajas: [330000, 370000, 290000]
  };

  const preciosList = precios[distritoId] || [200000, 250000, 300000];
  const now = new Date().toISOString();

  return preciosList.map((precio, i) => {
    const m2 = Math.round(55 + Math.random() * 60);
    const hab = Math.round(1 + Math.random() * 3);
    const jitter_lat = (Math.random() - 0.5) * 0.015;
    const jitter_lng = (Math.random() - 0.5) * 0.015;
    return {
      id: `demo_${distritoId}_${i}`,
      titulo: `Piso ${m2}m² · ${hab} hab · ${config.nombre}`,
      precio,
      precio_m2: Math.round(precio / m2),
      m2,
      habitaciones: hab,
      distrito: config.nombre,
      lat: config.lat + jitter_lat,
      lng: config.lng + jitter_lng,
      url: `https://www.idealista.com/venta-viviendas/${distritoId}/`,
      fuente: 'demo',
      fecha_scraped: now
    };
  });
}

// ─── MODO APIFY ───────────────────────────────────────────────────────────────
async function scrapeConApify(distritoId, config) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error('APIFY_TOKEN no encontrado. Crea un .env con APIFY_TOKEN=xxx');
  }

  console.log(`  → Lanzando actor Apify para ${config.nombre}...`);

  // Construcción de URL de Idealista para búsqueda por zona
  const url_idealista = `https://www.idealista.com/venta-viviendas/madrid/con-precio-hasta_600000,metros-cuadrados-mas-de_40/`;

  const input = {
    startUrls: [{ url: url_idealista }],
    maxItems: 50,
    searchType: 'sale',
    // Filtro geográfico por coordenadas
    location: {
      lat: config.lat,
      lng: config.lng,
      radius: config.radio_km
    }
  };

  // Llamada a Apify API - actor de scraping de Idealista
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/petr_cermak~idealista-scraper/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, timeout: 120, memoryMbytes: 512 })
    }
  );

  if (!runRes.ok) throw new Error(`Error Apify: ${runRes.status} ${await runRes.text()}`);
  const run = await runRes.json();
  const runId = run.data.id;

  // Esperar a que termine (polling)
  let intentos = 0;
  while (intentos < 24) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
    );
    const status = await statusRes.json();
    if (status.data.status === 'SUCCEEDED') break;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status.data.status)) {
      throw new Error(`Actor Apify falló: ${status.data.status}`);
    }
    intentos++;
  }

  // Obtener resultados del dataset
  const dataRes = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${token}&format=json&clean=true`
  );
  const items = await dataRes.json();

  // Normalizar al formato de la app
  const now = new Date().toISOString();
  return items.map(item => ({
    id: item.propertyCode || item.id,
    titulo: item.title || item.description?.substring(0, 60) || 'Sin título',
    precio: item.price || item.priceAmount,
    precio_m2: item.priceByArea || Math.round((item.price || 0) / (item.size || 1)),
    m2: item.size || item.area,
    habitaciones: item.rooms || item.bedrooms,
    distrito: config.nombre,
    lat: item.latitude || item.lat || config.lat + (Math.random()-0.5)*0.01,
    lng: item.longitude || item.lng || config.lng + (Math.random()-0.5)*0.01,
    url: item.url || item.detailUrl || `https://www.idealista.com/inmueble/${item.propertyCode}/`,
    fuente: 'apify_idealista',
    fecha_scraped: now
  })).filter(o => o.precio && o.precio > 50000);
}

// ─── RUNNER PRINCIPAL ─────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const distritosAProcesar = soloDist
    ? { [soloDist]: DISTRITOS_CONFIG[soloDist] }
    : DISTRITOS_CONFIG;

  const resumen = { fecha: new Date().toISOString(), modo, distritos: {} };

  for (const [id, config] of Object.entries(distritosAProcesar)) {
    try {
      console.log(`[${new Date().toLocaleTimeString()}] Procesando ${config.nombre} (modo: ${modo})...`);
      let ofertas;

      if (modo === 'apify') {
        ofertas = await scrapeConApify(id, config);
      } else {
        ofertas = generarOfertasDemo(id, config);
      }

      const outputPath = join(OUTPUT_DIR, `ofertas_${id}.json`);
      writeFileSync(outputPath, JSON.stringify(ofertas, null, 2));
      console.log(`  ✓ ${ofertas.length} ofertas → ${outputPath}`);
      resumen.distritos[id] = { ok: true, count: ofertas.length };

    } catch (err) {
      console.error(`  ✗ Error en ${config.nombre}: ${err.message}`);
      resumen.distritos[id] = { ok: false, error: err.message };
      // En caso de error, generar demo como fallback
      if (modo === 'apify') {
        const demoOfertas = generarOfertasDemo(id, config);
        writeFileSync(join(OUTPUT_DIR, `ofertas_${id}.json`), JSON.stringify(demoOfertas, null, 2));
        console.log(`  → Fallback a demo: ${demoOfertas.length} ofertas generadas`);
      }
    }

    // Pausa entre distritos para no saturar la API
    if (modo === 'apify') await new Promise(r => setTimeout(r, 2000));
  }

  writeFileSync(join(OUTPUT_DIR, 'ultimo_scrape.json'), JSON.stringify(resumen, null, 2));
  console.log(`\n✓ Scraping completado. Resumen en public/data/ultimo_scrape.json`);
}

main().catch(console.error);
