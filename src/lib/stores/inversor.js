import { writable, derived } from 'svelte/store';
import { distritos } from '../data/distritos.js';

// Parámetros del inversor
export const inversor = writable({
  presupuesto_total: 250000,      // capital total disponible (€)
  entrada_pct: 20,                // % de entrada sobre precio de compra
  gastos_compra_pct: 10,          // ITP + notaría + registro (~10%)
  tipo_hipoteca_pct: 3.5,         // TAE hipoteca fija actual
  plazo_hipoteca_anos: 25,
  superficie_m2: 70,              // m² objetivo
  gastos_anuales_pct: 1.5,        // IBI + comunidad + seguro + mantenimiento (% sobre precio)
  vacancia_meses: 1,              // meses al año sin inquilino
  objetivo: 'primera_vivienda',   // primera_vivienda | inversion_pura | mixto
  filtro_zona: 'todas'            // todas | dentro_m30 | entre_m30_m40 | fuera_m40
});

// Scoring de cada distrito según los parámetros del inversor
export const distritosScorados = derived(inversor, ($inv) => {
  return distritos.map(d => {
    const precio_total = d.venta_m2 * $inv.superficie_m2;
    const entrada = precio_total * ($inv.entrada_pct / 100);
    const gastos_compra = precio_total * ($inv.gastos_compra_pct / 100);
    const capital_necesario = entrada + gastos_compra;
    const principal_hipoteca = precio_total - entrada;

    // Cuota hipoteca mensual
    const r = ($inv.tipo_hipoteca_pct / 100) / 12;
    const n = $inv.plazo_hipoteca_anos * 12;
    const cuota_mensual = r === 0 ? principal_hipoteca / n :
      principal_hipoteca * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    // Ingresos alquiler
    const meses_alquilados = 12 - $inv.vacancia_meses;
    const ingreso_mensual = d.alquiler_m2_mes * $inv.superficie_m2;
    const ingreso_anual = ingreso_mensual * meses_alquilados;

    // Gastos anuales
    const gastos_anuales = precio_total * ($inv.gastos_anuales_pct / 100);
    const cuota_anual = cuota_mensual * 12;

    // Flujo neto mensual si se alquila (ingreso - hipoteca - gastos/12)
    const flujo_neto_mensual = ingreso_mensual - cuota_mensual - (gastos_anuales / 12);

    // Rentabilidad bruta sobre precio total
    const rent_bruta = (ingreso_anual / precio_total) * 100;

    // Rentabilidad neta sobre capital invertido (entrada + gastos)
    const beneficio_neto_anual = ingreso_anual - gastos_anuales;
    const rent_neta_capital = capital_necesario > 0 ? (beneficio_neto_anual / capital_necesario) * 100 : 0;

    // Payback en años (capital_necesario / beneficio_neto_anual)
    const payback_anos = beneficio_neto_anual > 0 ? capital_necesario / beneficio_neto_anual : 999;

    // ¿Es accesible con el presupuesto?
    const accesible = capital_necesario <= $inv.presupuesto_total;

    // Score compuesto (0-100)
    // Para primera vivienda: pondera accesibilidad, flujo neto, revalorización
    let score = 0;
    if (accesible) {
      const s_rent = Math.min(rent_bruta / 12 * 35, 35);          // hasta 35 pts por rentabilidad
      const s_revalor = Math.min(d.var_venta_anual / 25 * 25, 25); // hasta 25 pts revalorización
      const s_alquiler = Math.min(d.var_alquiler_anual / 25 * 20, 20); // hasta 20 pts tendencia alquiler
      const s_esfuerzo = Math.max(0, (50 - d.tasa_esfuerzo) / 50 * 20); // hasta 20 pts mercado sano
      score = Math.round(s_rent + s_revalor + s_alquiler + s_esfuerzo);
    }

    return {
      ...d,
      precio_total: Math.round(precio_total),
      capital_necesario: Math.round(capital_necesario),
      entrada: Math.round(entrada),
      gastos_compra: Math.round(gastos_compra),
      cuota_mensual: Math.round(cuota_mensual),
      principal_hipoteca: Math.round(principal_hipoteca),
      ingreso_mensual: Math.round(ingreso_mensual),
      ingreso_anual: Math.round(ingreso_anual),
      gastos_anuales: Math.round(gastos_anuales),
      flujo_neto_mensual: Math.round(flujo_neto_mensual),
      rent_bruta: Math.round(rent_bruta * 10) / 10,
      rent_neta_capital: Math.round(rent_neta_capital * 10) / 10,
      payback_anos: Math.round(payback_anos),
      accesible,
      score
    };
  }).sort((a, b) => b.score - a.score);
});

export const distritoSeleccionado = writable(null);
export const ofertas = writable([]);
export const cargandoOfertas = writable(false);
