<script>
  import PanelParams from './lib/components/PanelParams.svelte';
  import TablaRanking from './lib/components/TablaRanking.svelte';
  import MapaOfertas from './lib/components/MapaOfertas.svelte';
  import { inversor, distritosScorados } from './lib/stores/inversor.js';

  let vistaActiva = 'ranking';

  function fmt(n) { return new Intl.NumberFormat('es-ES').format(Math.round(n)); }

  $: accesibles = $distritosScorados.filter(d => d.accesible);
  $: mejorScore = accesibles[0];
</script>

<div class="app">
  <header class="topbar">
    <div class="topbar-left">
      <span class="logo">Madrid Inversor</span>
      <span class="version">datos junio 2026</span>
    </div>
    {#if mejorScore}
      <div class="topbar-insight">
        Mejor opción para tu presupuesto:
        <strong>{mejorScore.nombre}</strong>
        · Score {mejorScore.score}
        · Flujo {mejorScore.flujo_neto_mensual > 0 ? '+' : ''}{fmt(mejorScore.flujo_neto_mensual)} €/mes
        · R. bruta {mejorScore.rent_bruta}%
      </div>
    {/if}
    <div class="topbar-tabs">
      <button class:active={vistaActiva === 'ranking'} on:click={() => vistaActiva = 'ranking'}>
        Ranking
      </button>
      <button class:active={vistaActiva === 'mapa'} on:click={() => vistaActiva = 'mapa'}>
        Mapa
      </button>
    </div>
  </header>

  <div class="layout">
    <PanelParams />
    <main class="contenido">
      {#if vistaActiva === 'ranking'}
        <TablaRanking />
      {:else}
        <MapaOfertas />
      {/if}
    </main>
  </div>
</div>

<style>
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    background: #080a10;
    color: #e2e8f0;
    font-family: 'Inter', 'SF Pro Display', system-ui, sans-serif;
    height: 100vh;
    overflow: hidden;
  }
  :global(#app) { height: 100vh; display: flex; flex-direction: column; }

  .app { display: flex; flex-direction: column; height: 100vh; }

  .topbar {
    display: flex;
    align-items: center;
    padding: 0 1.25rem;
    height: 48px;
    background: #0a0d14;
    border-bottom: 1px solid #1e2330;
    flex-shrink: 0;
    gap: 1.5rem;
  }
  .topbar-left { display: flex; align-items: baseline; gap: 10px; }
  .logo { font-size: 15px; font-weight: 700; color: #e2e8f0; letter-spacing: -0.02em; }
  .version { font-size: 11px; color: #4b5563; }
  .topbar-insight { flex: 1; font-size: 12px; color: #6b7280; text-align: center; }
  .topbar-insight strong { color: #a5b4fc; }

  .topbar-tabs { display: flex; gap: 4px; }
  .topbar-tabs button {
    background: none;
    border: 1px solid transparent;
    color: #6b7280;
    padding: 5px 14px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .topbar-tabs button:hover { color: #e2e8f0; }
  .topbar-tabs button.active {
    background: #6366f115;
    border-color: #6366f140;
    color: #a5b4fc;
  }

  .layout { display: flex; flex: 1; overflow: hidden; min-height: 0; }
  .layout :global(.panel-params) {
    width: 260px;
    min-width: 260px;
    max-width: 260px;
    flex-shrink: 0;
    overflow-y: auto;
  }
  .contenido { flex: 1; min-width: 0; overflow: hidden; display: flex; flex-direction: column; }
</style>
