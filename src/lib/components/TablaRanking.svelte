<script>
  import { distritosScorados, distritoSeleccionado, inversor } from '../stores/inversor.js';

  function fmt(n) { return new Intl.NumberFormat('es-ES').format(n); }
  function fmtEur(n) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n); }

  $: filtrados = $inversor.filtro_zona === 'todas'
    ? $distritosScorados
    : $distritosScorados.filter(d => d.zona === $inversor.filtro_zona);

  function scoreColor(s) {
    if (s >= 70) return '#10b981';
    if (s >= 50) return '#f59e0b';
    if (s >= 25) return '#6366f1';
    return '#ef4444';
  }

  function flujoColor(n) {
    if (n > 200) return '#10b981';
    if (n > 0) return '#f59e0b';
    return '#ef4444';
  }

  $: accesibles = filtrados.filter(d => d.accesible).length;
</script>

<div class="ranking">
  <div class="ranking-header">
    <div class="ranking-titulo">
      <span class="ranking-count">{filtrados.length} distritos</span>
      <span class="accesibles-badge">{accesibles} accesibles con tu presupuesto</span>
    </div>
    <div class="leyenda">
      <span class="dot" style="background:#10b981"></span> Score >70
      <span class="dot" style="background:#f59e0b"></span> 50-70
      <span class="dot" style="background:#6366f1"></span> 25-50
      <span class="dot" style="background:#ef4444"></span> No accesible
    </div>
  </div>

  <div class="tabla-scroll">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Distrito</th>
          <th>Score</th>
          <th title="Precio total para tu superficie">Precio total</th>
          <th title="Capital necesario: entrada + gastos compra">Capital req.</th>
          <th title="Cuota mensual hipoteca">Hipoteca/mes</th>
          <th title="Ingreso mensual alquiler estimado">Alquiler/mes</th>
          <th title="Alquiler - Hipoteca - Gastos">Flujo neto</th>
          <th title="Rentabilidad bruta sobre precio total">R. bruta</th>
          <th title="Rentabilidad neta sobre capital aportado">R. neta/cap.</th>
        </tr>
      </thead>
      <tbody>
        {#each filtrados as d, i}
          <tr
            class:seleccionado={$distritoSeleccionado?.id === d.id}
            class:no-accesible={!d.accesible}
            on:click={() => distritoSeleccionado.set($distritoSeleccionado?.id === d.id ? null : d)}
            role="button"
            tabindex="0"
            on:keydown={e => e.key === 'Enter' && distritoSeleccionado.set(d)}
          >
            <td class="rank-num">{i + 1}</td>
            <td class="nombre-celda">
              <span class="zona-dot" style="background:{d.color_zona}"></span>
              {d.nombre}
              <span class="zona-label">{d.zona.replace(/_/g, ' ')}</span>
            </td>
            <td>
              {#if d.accesible}
                <span class="score-badge" style="background:{scoreColor(d.score)}22; color:{scoreColor(d.score)}; border-color:{scoreColor(d.score)}44">
                  {d.score}
                </span>
              {:else}
                <span class="score-badge no-acc">—</span>
              {/if}
            </td>
            <td class:highlight={d.accesible}>{fmtEur(d.precio_total)}</td>
            <td class:highlight={d.accesible}>{fmtEur(d.capital_necesario)}</td>
            <td>{fmtEur(d.cuota_mensual)}</td>
            <td>{fmtEur(d.ingreso_mensual)}</td>
            <td>
              {#if d.accesible}
                <span style="color:{flujoColor(d.flujo_neto_mensual)}; font-weight:600">
                  {d.flujo_neto_mensual > 0 ? '+' : ''}{fmtEur(d.flujo_neto_mensual)}
                </span>
              {:else}
                <span class="nd">—</span>
              {/if}
            </td>
            <td>{d.rent_bruta}%</td>
            <td>
              {#if d.accesible}
                {d.rent_neta_capital}%
              {:else}
                <span class="nd">—</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if $distritoSeleccionado}
    <div class="detalle-distrito">
      <button class="cerrar" on:click={() => distritoSeleccionado.set(null)}>✕</button>
      <h3>{$distritoSeleccionado.nombre}</h3>
      <p class="notas-texto">{$distritoSeleccionado.notas}</p>
      <div class="detalle-grid">
        <div class="detalle-item">
          <span class="dl">Precio m²</span>
          <span class="dv">{fmt($distritoSeleccionado.venta_m2)} €</span>
        </div>
        <div class="detalle-item">
          <span class="dl">Entrada ({$inversor.entrada_pct}%)</span>
          <span class="dv">{fmtEur($distritoSeleccionado.entrada)}</span>
        </div>
        <div class="detalle-item">
          <span class="dl">Gastos compra ({$inversor.gastos_compra_pct}%)</span>
          <span class="dv">{fmtEur($distritoSeleccionado.gastos_compra)}</span>
        </div>
        <div class="detalle-item">
          <span class="dl">Hipoteca mensual</span>
          <span class="dv">{fmtEur($distritoSeleccionado.cuota_mensual)}</span>
        </div>
        <div class="detalle-item">
          <span class="dl">Ingreso alquiler/mes</span>
          <span class="dv" style="color:#10b981">{fmtEur($distritoSeleccionado.ingreso_mensual)}</span>
        </div>
        <div class="detalle-item">
          <span class="dl">Flujo neto/mes</span>
          <span class="dv" style="color:{flujoColor($distritoSeleccionado.flujo_neto_mensual)}">
            {$distritoSeleccionado.flujo_neto_mensual > 0 ? '+' : ''}{fmtEur($distritoSeleccionado.flujo_neto_mensual)}
          </span>
        </div>
        <div class="detalle-item">
          <span class="dl">Rent. bruta</span>
          <span class="dv">{$distritoSeleccionado.rent_bruta}%</span>
        </div>
        <div class="detalle-item">
          <span class="dl">Rent. neta s/capital</span>
          <span class="dv">{$distritoSeleccionado.rent_neta_capital}%</span>
        </div>
        <div class="detalle-item">
          <span class="dl">Payback estimado</span>
          <span class="dv">{$distritoSeleccionado.payback_anos} años</span>
        </div>
        <div class="detalle-item">
          <span class="dl">Var. alquiler anual</span>
          <span class="dv" style="color:#10b981">+{$distritoSeleccionado.var_alquiler_anual}%</span>
        </div>
        <div class="detalle-item">
          <span class="dl">Var. venta anual</span>
          <span class="dv" style="color:#10b981">+{$distritoSeleccionado.var_venta_anual}%</span>
        </div>
        <div class="detalle-item">
          <span class="dl">Tasa esfuerzo inquilinos</span>
          <span class="dv">{$distritoSeleccionado.tasa_esfuerzo}%</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .ranking { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .ranking-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #1e2330;
    flex-shrink: 0;
  }
  .ranking-titulo { display: flex; gap: 12px; align-items: center; }
  .ranking-count { font-size: 13px; color: #6b7280; }
  .accesibles-badge {
    font-size: 12px;
    background: #10b98120;
    color: #10b981;
    border: 1px solid #10b98140;
    padding: 2px 8px;
    border-radius: 10px;
  }
  .leyenda {
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 11px;
    color: #6b7280;
  }
  .dot {
    width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px;
  }
  .tabla-scroll { overflow-y: auto; flex: 1; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  thead th {
    background: #0a0d14;
    color: #6b7280;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 8px 10px;
    text-align: right;
    border-bottom: 1px solid #1e2330;
    position: sticky;
    top: 0;
    white-space: nowrap;
    cursor: default;
  }
  thead th:nth-child(1), thead th:nth-child(2) { text-align: left; }
  tbody tr {
    cursor: pointer;
    border-bottom: 1px solid #12151f;
    transition: background 0.1s;
  }
  tbody tr:hover { background: #1a1f2e; }
  tbody tr.seleccionado { background: #6366f115; border-left: 2px solid #6366f1; }
  tbody tr.no-accesible { opacity: 0.45; }
  td {
    padding: 8px 10px;
    color: #cbd5e1;
    text-align: right;
    white-space: nowrap;
  }
  td:nth-child(1), td:nth-child(2) { text-align: left; }
  td.highlight { color: #e2e8f0; }
  .rank-num { color: #4b5563; font-size: 11px; width: 24px; }
  .nombre-celda { display: flex; flex-direction: column; gap: 2px; min-width: 120px; }
  .zona-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 6px; flex-shrink: 0; }
  .zona-label { font-size: 10px; color: #4b5563; margin-left: 12px; }
  .score-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid;
  }
  .score-badge.no-acc { background: #1e2330; color: #4b5563; border-color: #2d3448; }
  .nd { color: #4b5563; }

  .detalle-distrito {
    border-top: 1px solid #1e2330;
    padding: 1rem;
    background: #0a0d14;
    flex-shrink: 0;
    position: relative;
  }
  .cerrar {
    position: absolute;
    right: 1rem; top: 1rem;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    font-size: 14px;
  }
  .cerrar:hover { color: #e2e8f0; }
  h3 { font-size: 14px; font-weight: 600; color: #e2e8f0; margin: 0 0 0.5rem; }
  .notas-texto { font-size: 12px; color: #6b7280; margin: 0 0 0.75rem; line-height: 1.5; }
  .detalle-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .detalle-item { background: #1a1f2e; border-radius: 6px; padding: 8px 10px; }
  .dl { display: block; font-size: 10px; color: #6b7280; margin-bottom: 2px; }
  .dv { display: block; font-size: 13px; font-weight: 600; color: #e2e8f0; font-variant-numeric: tabular-nums; }
</style>
