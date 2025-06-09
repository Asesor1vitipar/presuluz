
let ofertas = [];

async function cargarOfertas() {
  const resp = await fetch("ofertas.json");
  ofertas = await resp.json();
  renderOfertas();
}

function renderOfertas() {
  const cont = document.getElementById("ofertas-container");
  cont.innerHTML = "";
  ofertas.forEach((o, i) => {
    const div = document.createElement("div");
    div.className = "col-md-6";
    div.innerHTML = '<div class="form-check">' +
      '<input class="form-check-input oferta-check" type="checkbox" value="' + i + '" id="oferta' + i + '">' +
      '<label class="form-check-label" for="oferta' + i + '">' + o.Oferta + ' (' + o.TipoTarifa + ')</label>' +
      '</div>';
    cont.appendChild(div);
  });

  document.querySelectorAll(".oferta-check").forEach(cb => {
    cb.addEventListener("change", actualizarResultados);
  });

  filtrarOfertas();
}

function filtrarOfertas() {
  const compania = document.getElementById("compania").value.toUpperCase();
  document.querySelectorAll(".oferta-check").forEach(cb => {
    const oferta = ofertas[parseInt(cb.value)];
    if (compania && oferta.Oferta.toUpperCase().includes(compania)) {
      cb.disabled = true;
      cb.checked = false;
    } else {
      cb.disabled = false;
    }
  });
  actualizarResultados();
}

function recogerDatos() {
  return {
    dias: parseFloat(document.getElementById("dias").value),
    potencia: parseFloat(document.getElementById("potencia").value),
    facturaActual: parseFloat(document.getElementById("facturaActual").value),
    alquiler: parseFloat(document.getElementById("alquiler").value || 0),
    bonoSocial: parseFloat(document.getElementById("bonoSocial").value || 0.012742),
    iva: parseFloat(document.getElementById("iva").value || 21),
    consumos: Array.from(document.querySelectorAll(".consumo")).map(i => parseFloat(i.value) || 0),
    seleccionadas: Array.from(document.querySelectorAll(".oferta-check:checked")).map(cb => ofertas[parseInt(cb.value)])
  };
}

function calcular({ dias, potencia, facturaActual, alquiler, bonoSocial, iva, consumos, seleccionadas }) {
  return seleccionadas.map(oferta => {
    const potenciaTotal = dias * oferta.PrecioPotencia.reduce((acc, precio) => acc + (precio * potencia), 0);
    const energiaTotal = oferta.PrecioEnergia.reduce((acc, precio, idx) => acc + (precio * (consumos[idx] || 0)), 0);
    const beneficioUnico = dias * (oferta.BeneficioUnico || 0);
    const subtotal = potenciaTotal + energiaTotal + alquiler + (dias * bonoSocial) + beneficioUnico;
    const impuestoElectrico = 0.05113 * (potenciaTotal + energiaTotal);
    const totalConImpuestos = (subtotal + impuestoElectrico) * (1 + iva / 100);
    return {
      nombre: oferta.Oferta,
      total: totalConImpuestos,
      ahorro: facturaActual ? facturaActual - totalConImpuestos : 0,
      promocion: oferta.Promocion
    };
  }).sort((a, b) => a.total - b.total);
}

function mostrarResultados(resultados, facturaActual) {
  const tablaCont = document.getElementById("tabla-resultados");
  tablaCont.innerHTML = "";

  if (resultados.length === 0) return;

  const todosTotales = [facturaActual, ...resultados.map(r => r.total)];
  const maxTotal = Math.max(...todosTotales);

  const table = document.createElement("table");
  table.className = "table table-striped align-middle";

  const thead = document.createElement("thead");
  thead.innerHTML = "<tr><th>Oferta</th><th>Total (€)</th><th>Ahorro (€)</th><th>Promoción</th><th>Visual</th></tr>";
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  const actualWidth = Math.min((facturaActual / maxTotal) * 100, 100).toFixed(2);
  const actualRow = document.createElement("tr");
  actualRow.innerHTML = "<td><strong>Oferta actual (factura actual)</strong></td>" +
                        "<td>" + facturaActual.toFixed(2) + "</td>" +
                        "<td>-</td><td>-</td>" +
                        "<td><div class='bar-container'><div class='bar blue' style='width:" + actualWidth + "%'></div></div></td>";
  tbody.appendChild(actualRow);

  resultados.forEach(r => {
    const porcentaje = Math.min((r.total / maxTotal) * 100, 100).toFixed(2);
    const color = r.total < facturaActual ? "green" : "red";

    const row = document.createElement("tr");
    row.innerHTML = "<td>" + r.nombre + "</td>" +
                    "<td>" + r.total.toFixed(2) + "</td>" +
                    "<td>" + r.ahorro.toFixed(2) + "</td>" +
                    "<td>" + (r.promocion || "-") + "</td>" +
                    "<td><div class='bar-container'><div class='bar " + color + "' style='width:" + porcentaje + "%'></div></div></td>";
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tablaCont.appendChild(table);
}

function actualizarResultados() {
  const datos = recogerDatos();
  const resultados = calcular(datos);
  mostrarResultados(resultados, datos.facturaActual);
}

window.onload = () => {
  cargarOfertas();
  document.querySelectorAll("#formDatos input").forEach(input => {
    input.addEventListener("input", actualizarResultados);
  });
  document.getElementById("compania").addEventListener("change", filtrarOfertas);
};
