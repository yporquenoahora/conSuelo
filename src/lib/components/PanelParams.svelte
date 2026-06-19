<script>
  import { inversor } from '../stores/inversor.js';

  function fmt(n) {
    return new Intl.NumberFormat('es-ES').format(Math.round(n));
  }

  // Capital restante tras entrada y gastos en un distrito hipotético
  $: capital_max_inmueble = $inversor.presupuesto_total /
    (($inversor.entrada_pct + $inversor.gastos_compra_pct) / 100);
</script>

<aside class="panel-params">
  <h2>Tu perfil inversor</h2>

  <div class="param-group">
    <label>Capital disponible
      <span class="valor">{fmt($inversor.presupuesto_total)} €</span>
    </label>
    <input type="range" min="80000" max="600000" step="5000"
      bind:value={$inversor.presupuesto_total} />
    <div class="hint">Precio max. inmueble accesible: <strong>{fmt(capital_max_inmueble)} €</strong></div>
  </div>

  <div class="param-group">
    <label>Entrada <span class="valor">{$inversor.entrada_pct}%</span></label>
    <input type="range" min="10" max="40" step="1"
      bind:value={$inversor.entrada_pct} />
  </div>

  <div class="param-group">
    <label>Gastos de compra (ITP + notaría)
      <span class="valor">{$inversor.gastos_compra_pct}%</span>
    </label>
    <input type="range" min="8" max="14" step="0.5"
      bind:value={$inversor.gastos_compra_pct} />
  </div>

  <div class="param-group">
    <label>Tipo hipoteca fija
      <span class="valor">{$inversor.tipo_hipoteca_pct}%</span>
    </label>
    <input type="range" min="2.5" max="5.5" step="0.1"
      bind:value={$inversor.tipo_hipoteca_pct} />
  </div>

  <div class="param-group">
    <label>Plazo hipoteca
      <span class="valor">{$inversor.plazo_hipoteca_anos} años</span>
    </label>
    <input type="range" min="15" max="30" step="1"
      bind:value={$inversor.plazo_hipoteca_anos} />
  </div>

  <div class="param-group">
    <label>Superficie buscada
      <span class="valor">{$inversor.superficie_m2} m²</span>
    </label>
    <input type="range" min="40" max="150" step="5"
      bind:value={$inversor.superficie_m2} />
  </div>

  <div class="param-group">
    <label>Gastos anuales (IBI + comunidad + seguro)
      <span class="valor">{$inversor.gastos_anuales_pct}%</span>
    </label>
    <input type="range" min="0.5" max="3" step="0.1"
      bind:value={$inversor.gastos_anuales_pct} />
    <div class="hint">% sobre precio de compra</div>
  </div>

  <div class="param-group">
    <label>Vacancia estimada
      <span class="valor">{$inversor.vacancia_meses} {$inversor.vacancia_meses === 1 ? 'mes' : 'meses'}/año</span>
    </label>
    <input type="range" min="0" max="3" step="1"
      bind:value={$inversor.vacancia_meses} />
  </div>

  <div class="param-group">
    <label>Filtrar por zona</label>
    <select bind:value={$inversor.filtro_zona}>
      <option value="todas">Todos los distritos</option>
      <option value="dentro_m30">Dentro de la M-30</option>
      <option value="entre_m30_m40">Entre M-30 y M-40</option>
      <option value="fuera_m40">Fuera de la M-40</option>
    </select>
  </div>

  <div class="nota-metodologia">
    <strong>Metodología:</strong> La rentabilidad bruta se calcula sobre precio total de compra.
    La neta sobre capital aportado (entrada + gastos). Los precios son de publicación (oferta),
    el cierre real suele ser 5-10% inferior.
  </div>
</aside>

<style>
 .panel-params {
    background: #0f1117;
    border-right: 1px solid #1e2330;
    padding: 1.5rem 1.25rem;
  }
  h2 {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
    margin: 0 0 1.25rem;
  }
  .param-group {
    margin-bottom: 1.1rem;
  }
  label {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 13px;
    color: #9ca3af;
    margin-bottom: 6px;
  }
  .valor {
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;
    font-variant-numeric: tabular-nums;
  }
  input[type="range"] {
    width: 100%;
    accent-color: #6366f1;
    cursor: pointer;
  }
  select {
    width: 100%;
    background: #1a1f2e;
    border: 1px solid #2d3448;
    color: #e2e8f0;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    margin-top: 4px;
  }
  .hint {
    font-size: 11px;
    color: #4b5563;
    margin-top: 4px;
  }
  .nota-metodologia {
    margin-top: 1.5rem;
    padding: 0.75rem;
    background: #1a1f2e;
    border-radius: 6px;
    font-size: 11px;
    color: #6b7280;
    line-height: 1.5;
    border-left: 2px solid #6366f1;
  }
</style>
