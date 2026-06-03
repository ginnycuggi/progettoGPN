// ===== INTEGRAZIONE FRONTEND → BACKEND SCHEMA =====
// Sostituisci la funzione generateSchema() in index.html con questa.
// Chiama il backend PHP che usa Wikipedia per generare lo schema,
// e offre due bottoni: scarica HTML/PDF oppure scarica come immagine.

async function generateSchema() {
  const materia   = document.getElementById("genMateria").value.trim();
  const argomento = document.getElementById("genArgomento").value.trim();
  const anno      = document.getElementById("genAnno").value.trim();

  // Reset errori
  ["genMateria", "genArgomento", "genAnno"].forEach(id => {
    document.getElementById(id + "Error")?.classList.remove("show");
    document.getElementById(id)?.classList.remove("input-error");
  });

  // Validazione
  let hasError = false;
  if (!materia)   { document.getElementById("genMateriaError")?.classList.add("show");   document.getElementById("genMateria")?.classList.add("input-error");   hasError = true; }
  if (!argomento) { document.getElementById("genArgomentoError")?.classList.add("show"); document.getElementById("genArgomento")?.classList.add("input-error"); hasError = true; }
  if (!anno)      { document.getElementById("genAnnoError")?.classList.add("show");      document.getElementById("genAnno")?.classList.add("input-error");      hasError = true; }
  if (hasError) return;

  // Loader
  const results   = document.getElementById("modalResults");
  const noResults = document.getElementById("noResults");
  noResults.style.display = "none";
  results.innerHTML = "<p>⏳ Ricerca su Wikipedia e generazione schema in corso... 🤖</p>";

  try {
    // Chiamata al backend
    const apiUrl = new URL("../backend/api/generate_schema.php", window.location.href).href;
    const response = await fetch(apiUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ materia, argomento, anno, formato: "json" })
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} - ${text.slice(0, 250)}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonErr) {
      throw new Error(`Risposta non valida dal backend: ${text.slice(0, 250)}`);
    }

    if (!data.success) {
      results.innerHTML = `<p>❌ Errore: ${data.error || (data.errors || []).join(", ")}</p>`;
      return;
    }

    // Mostra schema
    const schemaDiv = document.createElement("div");
    schemaDiv.className = "generated-schema";
    schemaDiv.innerHTML = `
      <h3>Schema: ${data.materia} — ${data.argomento} (${data.anno})</h3>
      <small style="color:#888">Fonte: ${data.fonte_wiki}</small>
      <pre id="schemaText">${escapeHtml(data.schema)}</pre>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
        <button onclick="downloadSchemaPDF('${encodeURIComponent(materia)}','${encodeURIComponent(argomento)}','${encodeURIComponent(anno)}')">
          📄 Scarica (apri e premi Ctrl+P → Salva PDF)
        </button>
        <button onclick="downloadSchemaImmagine()">
          🖼️ Scarica come Immagine
        </button>
      </div>
    `;
    results.innerHTML = "";
    results.appendChild(schemaDiv);

  } catch (err) {
    results.innerHTML = `<p>❌ Errore di rete: ${err.message}</p>`;
  }
}

// Download HTML via backend (poi Ctrl+P per PDF)
function downloadSchemaPDF(materia, argomento, anno) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = new URL("../backend/api/generate_schema.php", window.location.href).href;
  form.style.display = "none";
  [["materia", decodeURIComponent(materia)], ["argomento", decodeURIComponent(argomento)],
   ["anno", decodeURIComponent(anno)], ["formato", "pdf"]].forEach(([name, value]) => {
    const input = document.createElement("input");
    input.name = name; input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

// Download come immagine (html2canvas, già presente nel progetto)
function downloadSchemaImmagine() {
  const schemaDiv = document.querySelector(".generated-schema");
  if (typeof html2canvas === "undefined") { alert("libreria html2canvas non caricata."); return; }
  html2canvas(schemaDiv).then(canvas => {
    const link = document.createElement("a");
    link.download = "schema.png";
    link.href = canvas.toDataURL();
    link.click();
  });
}

function escapeHtml(text) {
  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
