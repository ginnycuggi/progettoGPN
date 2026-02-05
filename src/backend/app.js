// ===== GESTIONE SESSIONE UTENTE =====
const UserSession = {
  isLoggedIn: function() {
    return localStorage.getItem('userLoggedIn') === 'true';
  },
  login: function(userData) {
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.setItem('userName', userData.name || 'Utente');
    localStorage.setItem('userEmail', userData.email || '');
    this.updateUI();
  },
  logout: function() {
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    this.updateUI();
  },
  getUserName: function() {
    return localStorage.getItem('userName') || 'Ospite';
  },
  updateUI: function() {
    const accountLink = document.querySelector('.account-link');
    if (this.isLoggedIn()) {
      accountLink.innerHTML = `
        <span style="color: white; margin-right: 10px;">Ciao, ${this.getUserName()}!</span>
        <a href="#" class="register-button" onclick="UserSession.logout(); return false;">🚪 Esci</a>
      `;
    } else {
      accountLink.innerHTML = `
        <a href="registrazione.html" class="register-button">👤 Crea un account</a>
      `;
    }
  }
};

// ===== INIZIALIZZAZIONE AL CARICAMENTO PAGINA =====
document.addEventListener('DOMContentLoaded', function() {
  UserSession.updateUI();
  initializeExampleSchemas();
  loadUserSchemas();
  addAnimationStyles();
});

// ===== INIZIALIZZA STELLE NEGLI SCHEMI DI ESEMPIO =====
function initializeExampleSchemas() {
  const exampleSchemas = document.querySelectorAll('#uploadedSchemas .schema-box');
  exampleSchemas.forEach(schema => {
    const stars = schema.querySelectorAll('.star');
    stars.forEach(star => {
      star.addEventListener('click', (e) => {
        e.stopPropagation();
        handleStarRating(star, stars, schema);
      });
    });
  });
}

// ===== GESTIONE RATING STELLE =====
function handleStarRating(clickedStar, allStars, schemaBox) {
  const rating = parseInt(clickedStar.getAttribute('data-value'));
  allStars.forEach(s => {
    s.classList.toggle('selected', parseInt(s.getAttribute('data-value')) <= rating);
  });
  const fileName = schemaBox.querySelector('strong').textContent;
  
  // Salva rating in localStorage
  const schemaId = fileName.replace(/[^a-zA-Z0-9]/g, '_');
  localStorage.setItem(`rating_${schemaId}`, rating);
  
  // Rimuovi vecchi messaggi di conferma nello stesso schema
  const oldMessages = schemaBox.querySelectorAll('.rating-success-message');
  oldMessages.forEach(msg => msg.remove());
  
  // Mostra messaggio di conferma sotto le stelle
  const successMessage = document.createElement('div');
  successMessage.className = 'rating-success-message';
  successMessage.style.cssText = `
    color: #28a745;
    font-size: 0.85em;
    font-weight: 600;
    margin-top: 8px;
    animation: fadeIn 0.3s ease-in;
  `;
  successMessage.textContent = `✅ Valutazione salvata: ${rating} stelle`;
  
  const starsContainer = schemaBox.querySelector('.stars');
  starsContainer.parentNode.insertBefore(successMessage, starsContainer.nextSibling);
  
  // Rimuovi il messaggio dopo 3 secondi
  setTimeout(() => {
    successMessage.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => successMessage.remove(), 300);
  }, 3000);
}

// ===== NOTIFICHE TOAST =====
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 
                  type === 'error' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
    font-weight: 600;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== CARICA SCHEMI SALVATI DALL'UTENTE =====
function loadUserSchemas() {
  const savedSchemas = JSON.parse(localStorage.getItem('userSchemas') || '[]');
  const container = document.getElementById('uploadedSchemas');
  
  savedSchemas.forEach(schema => {
    addSchemaToDOM(schema, container, false);
  });
}

// ===== SALVA SCHEMA IN LOCALSTORAGE =====
function saveSchemaToStorage(schemaData) {
  const savedSchemas = JSON.parse(localStorage.getItem('userSchemas') || '[]');
  savedSchemas.push(schemaData);
  localStorage.setItem('userSchemas', JSON.stringify(savedSchemas));
}

// ===== AGGIUNGI SCHEMA AL DOM =====
function addSchemaToDOM(schemaData, container, isNew = true) {
  const box = document.createElement("div");
  box.className = "schema-box";
  box.setAttribute("data-materia", schemaData.materia.toLowerCase());
  box.setAttribute("data-argomento", schemaData.argomento.toLowerCase());
  box.setAttribute("data-anno", schemaData.anno.toLowerCase());
  box.setAttribute("data-id", schemaData.id);

  box.innerHTML = `
    <strong>${schemaData.fileName}</strong><br>
    <em>${schemaData.materia} – ${schemaData.argomento}</em><br>
    <small>${schemaData.anno}</small>
    <div class="stars">
      <span class="star" data-value="1">&#9733;</span>
      <span class="star" data-value="2">&#9733;</span>
      <span class="star" data-value="3">&#9733;</span>
      <span class="star" data-value="4">&#9733;</span>
      <span class="star" data-value="5">&#9733;</span>
    </div>
    ${isNew ? '<button class="delete-schema" onclick="deleteSchema(this)" style="margin-top: 10px; padding: 5px 15px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.9em;">🗑️ Elimina</button>' : ''}
  `;

  if (isNew) {
    container.insertBefore(box, container.firstChild);
  } else {
    container.appendChild(box);
  }

  // Aggiungi funzionalità stelle
  const stars = box.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      handleStarRating(star, stars, box);
    });
  });
}

// ===== ELIMINA SCHEMA =====
function deleteSchema(button) {
  if (!confirm('Sei sicuro di voler eliminare questo schema?')) {
    return;
  }

  const schemaBox = button.closest('.schema-box');
  const schemaId = schemaBox.getAttribute('data-id');
  
  // Rimuovi da localStorage
  let savedSchemas = JSON.parse(localStorage.getItem('userSchemas') || '[]');
  savedSchemas = savedSchemas.filter(s => s.id !== schemaId);
  localStorage.setItem('userSchemas', JSON.stringify(savedSchemas));
  
  // Rimuovi dal DOM con animazione
  schemaBox.style.animation = 'fadeOut 0.3s ease-out';
  setTimeout(() => schemaBox.remove(), 300);
  
  showNotification('Schema eliminato con successo', 'success');
}

// ===== GESTIONE UPLOAD CON API =====
function handleUpload() {
  const fileInput = document.getElementById("schemaUpload");
  const materia = document.getElementById("materia").value.trim();
  const argomento = document.getElementById("argomento").value.trim();
  const anno = document.getElementById("annoScolastico").value;
  const container = document.getElementById("uploadedSchemas");

  // Reset errori precedenti
  document.getElementById("materiaError").classList.remove("show");
  document.getElementById("argomentoError").classList.remove("show");
  document.getElementById("annoError").classList.remove("show");
  document.getElementById("fileError").classList.remove("show");
  document.getElementById("materia").classList.remove("input-error");
  document.getElementById("argomento").classList.remove("input-error");
  document.getElementById("annoScolastico").classList.remove("input-error");
  document.getElementById("schemaUpload").classList.remove("input-error");

  let hasError = false;

  // Validazione campi
  if (!materia) {
    document.getElementById("materiaError").classList.add("show");
    document.getElementById("materia").classList.add("input-error");
    hasError = true;
  }

  if (!argomento) {
    document.getElementById("argomentoError").classList.add("show");
    document.getElementById("argomento").classList.add("input-error");
    hasError = true;
  }

  if (!anno) {
    document.getElementById("annoError").classList.add("show");
    document.getElementById("annoScolastico").classList.add("input-error");
    hasError = true;
  }

  if (!fileInput.files.length) {
    document.getElementById("fileError").classList.add("show");
    document.getElementById("schemaUpload").classList.add("input-error");
    hasError = true;
  }

  // Se ci sono errori, non procedere
  if (hasError) {
    return;
  }

  const file = fileInput.files[0];

  // Validazione dimensione file (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    document.getElementById("fileError").textContent = "⚠️ Il file supera i 5MB";
    document.getElementById("fileError").classList.add("show");
    document.getElementById("schemaUpload").classList.add("input-error");
    return;
  }

  // Mostra loader
  const uploadButton = document.querySelector('.option button[onclick="handleUpload()"]');
  const originalText = uploadButton.textContent;
  uploadButton.textContent = '⏳ Caricamento...';
  uploadButton.disabled = true;

  // Prepara dati schema
  const schemaId = `schema_${Date.now()}`;
  const schemaData = {
    id: schemaId,
    fileName: file.name,
    materia: materia,
    argomento: argomento,
    anno: anno,
    uploadDate: new Date().toISOString()
  };

  // Simula upload API (in produzione sostituire con vera chiamata API)
  // uploadToAPI(file, schemaData);
  
  // Per ora salviamo localmente
  setTimeout(() => {
    // Salva in localStorage
    saveSchemaToStorage(schemaData);
    
    // Aggiungi al DOM
    addSchemaToDOM(schemaData, container, true);

    // Reset form
    fileInput.value = "";
    document.getElementById("materia").value = "";
    document.getElementById("argomento").value = "";
    document.getElementById("annoScolastico").value = "";

    // Ripristina bottone
    uploadButton.textContent = originalText;
    uploadButton.disabled = false;

    // Mostra messaggio di successo sotto il form
    showSuccessMessage('uploadSuccess', '✅ Schema caricato correttamente');
  }, 1000);
}

// ===== UPLOAD API (per integrazione futura) =====
function uploadToAPI(file, schemaData) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('materia', schemaData.materia);
  formData.append('argomento', schemaData.argomento);
  formData.append('anno', schemaData.anno);

  fetch('api/upload.php', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showNotification(`File caricato: ${data.name}`, 'success');
      schemaData.id = data.id; // ID dal server
      saveSchemaToStorage(schemaData);
      addSchemaToDOM(schemaData, document.getElementById("uploadedSchemas"), true);
    } else {
      showNotification('Errore durante il caricamento', 'error');
    }
  })
  .catch(error => {
    console.error('Errore upload:', error);
    showNotification('Errore di connessione', 'error');
  });
}

// ===== GESTIONE RICERCA CON API =====
function handleSearch() {
  const materia = document.getElementById("materiaSearch").value.trim().toLowerCase();
  const argomento = document.getElementById("argomentoSearch").value.trim().toLowerCase();
  const anno = document.getElementById("annoSearch").value.trim().toLowerCase();

  const results = document.getElementById("modalResults");
  const noResults = document.getElementById("noResults");
  const modal = document.getElementById("searchModal");
  const searchError = document.getElementById("searchError");

  // Reset errore precedente
  searchError.classList.remove("show");

  results.innerHTML = "";
  noResults.style.display = "none";

  if (!materia && !argomento && !anno) {
    searchError.textContent = "⚠️ Compila almeno un campo per effettuare la ricerca";
    searchError.classList.add("show");
    return;
  }

  // Mostra loader
  modal.style.display = "flex";
  results.innerHTML = "<p style='text-align: center;'>🔍 Ricerca in corso...</p>";

  // Costruisci query
  const query = [materia, argomento, anno].filter(Boolean).join(' ');

  // Simula chiamata API (in produzione sostituire con vera chiamata)
  // searchAPI(query, materia, argomento, anno);

  // Per ora cerchiamo localmente
  setTimeout(() => {
    const schemi = document.querySelectorAll(".schema-box");
    let trovati = 0;

    results.innerHTML = "";

    schemi.forEach(schema => {
      const matchMateria = !materia || schema.dataset.materia.includes(materia);
      const matchArgomento = !argomento || schema.dataset.argomento.includes(argomento);
      const matchAnno = !anno || schema.dataset.anno.includes(anno);

      if (matchMateria && matchArgomento && matchAnno) {
        const clone = schema.cloneNode(true);
        // Rimuovi bottone elimina dai risultati
        const deleteBtn = clone.querySelector('.delete-schema');
        if (deleteBtn) deleteBtn.remove();
        // Rimuovi messaggi di rating dai risultati
        const ratingMsg = clone.querySelector('.rating-success-message');
        if (ratingMsg) ratingMsg.remove();
        results.appendChild(clone);
        trovati++;
      }
    });

    if (trovati === 0) {
      noResults.style.display = "block";
    } else {
      // Mostra messaggio di conferma
      const confirmMsg = document.createElement('p');
      confirmMsg.style.cssText = 'color: #28a745; font-weight: 600; text-align: center; margin-bottom: 15px;';
      confirmMsg.textContent = `✅ Trovati ${trovati} schemi`;
      results.insertBefore(confirmMsg, results.firstChild);
    }
  }, 500);
}

// ===== RICERCA API (per integrazione futura) =====
function searchAPI(query, materia, argomento, anno) {
  const params = new URLSearchParams({
    q: query,
    materia: materia,
    argomento: argomento,
    anno: anno
  });

  fetch(`api/search.php?${params}`)
    .then(res => res.json())
    .then(data => {
      const results = document.getElementById("modalResults");
      results.innerHTML = "";

      if (data.results && data.results.length > 0) {
        data.results.forEach(schema => {
          addSchemaToDOM(schema, results, false);
        });
        showNotification(`Trovati ${data.results.length} schemi`, 'success');
      } else {
        document.getElementById("noResults").style.display = "block";
      }
    })
    .catch(error => {
      console.error('Errore ricerca:', error);
      showNotification('Errore durante la ricerca', 'error');
    });
}

// ===== CHIUDI MODAL =====
function closeModal() {
  document.getElementById("searchModal").style.display = "none";
}

// ===== GENERA SCHEMA AI =====
async function generateSchema() {
  const materia = document.getElementById("genMateria").value.trim();
  const argomento = document.getElementById("genArgomento").value.trim();
  const anno = document.getElementById("genAnno").value.trim();

  // Reset errori precedenti
  document.getElementById("genMateriaError").classList.remove("show");
  document.getElementById("genArgomentoError").classList.remove("show");
  document.getElementById("genAnnoError").classList.remove("show");
  document.getElementById("genMateria").classList.remove("input-error");
  document.getElementById("genArgomento").classList.remove("input-error");
  document.getElementById("genAnno").classList.remove("input-error");

  let hasError = false;

  // Validazione campi
  if (!materia) {
    document.getElementById("genMateriaError").classList.add("show");
    document.getElementById("genMateria").classList.add("input-error");
    hasError = true;
  }

  if (!argomento) {
    document.getElementById("genArgomentoError").classList.add("show");
    document.getElementById("genArgomento").classList.add("input-error");
    hasError = true;
  }

  if (!anno) {
    document.getElementById("genAnnoError").classList.add("show");
    document.getElementById("genAnno").classList.add("input-error");
    hasError = true;
  }

  // Se ci sono errori, non procedere
  if (hasError) {
    return;
  }

  // Mostra caricamento
  const results = document.getElementById("modalResults");
  const noResults = document.getElementById("noResults");
  noResults.style.display = "none";
  results.innerHTML = "<p style='text-align: center;'>🤖 Generazione schema in corso...</p>";

  try {
    // Cerca informazioni su Wikipedia
    const info = await searchWikipedia(argomento);

    // Genera schema basato sulle info
    const schema = generateAISchema(materia, argomento, anno, info);

    // Mostra lo schema
    const schemaDiv = document.createElement("div");
    schemaDiv.className = "generated-schema";
    schemaDiv.innerHTML = `
      <div style="color: #28a745; font-weight: 600; margin-bottom: 15px; text-align: center;">
        ✅ Schema generato correttamente
      </div>
      <h3>Schema Generato per ${materia} - ${argomento} (${anno})</h3>
      <pre id="schemaText">${schema}</pre>
      <button onclick="downloadSchema()">📥 Scarica come Immagine</button>
      <button onclick="saveGeneratedSchema('${materia}', '${argomento}', '${anno}')" style="margin-top: 10px;">💾 Salva nei miei schemi</button>
    `;
    results.innerHTML = "";
    results.appendChild(schemaDiv);
  } catch (error) {
    console.error('Errore generazione schema:', error);
    results.innerHTML = `
      <div style="color: #dc3545; text-align: center; padding: 20px;">
        <strong>❌ Errore durante la generazione</strong>
        <p>Si è verificato un errore. Riprova.</p>
      </div>
    `;
  }
}

// ===== SALVA SCHEMA GENERATO =====
function saveGeneratedSchema(materia, argomento, anno) {
  const schemaText = document.getElementById('schemaText').textContent;
  const schemaData = {
    id: `generated_${Date.now()}`,
    fileName: `Schema_${argomento}_${Date.now()}.txt`,
    materia: materia,
    argomento: argomento,
    anno: anno,
    content: schemaText,
    uploadDate: new Date().toISOString()
  };

  saveSchemaToStorage(schemaData);
  addSchemaToDOM(schemaData, document.getElementById("uploadedSchemas"), true);
  
  // Mostra messaggio di conferma nel modal
  const results = document.getElementById("modalResults");
  results.innerHTML = `
    <div style="text-align: center; padding: 30px;">
      <div style="color: #28a745; font-size: 1.2em; font-weight: 600; margin-bottom: 15px;">
        ✅ Schema caricato correttamente
      </div>
      <p style="color: #555;">Lo schema è stato salvato nei tuoi schemi caricati.</p>
      <button onclick="closeModal()" style="margin-top: 20px; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 50px; cursor: pointer; font-weight: 600;">
        Chiudi
      </button>
    </div>
  `;
}

// ===== RICERCA WIKIPEDIA =====
async function searchWikipedia(query) {
  try {
    const response = await fetch(`https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.extract || "Informazioni non trovate.";
  } catch (e) {
    console.error('Errore Wikipedia:', e);
    return "Errore nella ricerca.";
  }
}

// ===== GENERA SCHEMA CON AI =====
function generateAISchema(materia, argomento, anno, info) {
  let schema = `Schema per la materia: ${materia}\nArgomento: ${argomento}\nAnno Scolastico: ${anno}\n\n`;

  // Sintesi delle informazioni chiave
  const sintesi = sintetizzaInfo(info);

  // Adatta la complessità basata sull'anno
  const livello = getLivello(anno);

  schema += "1. Introduzione\n";
  schema += `   - ${sintesi.definizione || `Definizione di ${argomento} in ${materia}`}\n`;
  schema += `   - Importanza: ${sintesi.importanza || 'Fondamentale per la comprensione della materia'}\n\n`;

  schema += "2. Sviluppo\n";
  if (livello === 'base') {
    schema += `   - Concetti base: ${sintesi.concetti || `Elementi fondamentali di ${argomento}`}\n`;
    schema += "   - Esempi semplici\n";
  } else {
    schema += `   - Concetti avanzati: ${sintesi.concetti || `Approfondimenti su ${argomento}`}\n`;
    schema += "   - Esempi pratici e applicazioni\n";
    schema += "   - Collegamenti interdisciplinari\n";
  }
  schema += "\n";

  schema += "3. Conclusione\n";
  schema += "   - Riassunto dei punti principali\n";
  schema += "   - Riflessioni e collegamenti futuri\n\n";

  schema += "Risorse aggiuntive:\n";
  schema += "- Libri di testo consigliati\n";
  schema += "- Esercizi online e piattaforme educative\n";
  schema += "- Approfondimenti su siti affidabili\n";

  return schema;
}

// ===== SINTETIZZA INFORMAZIONI =====
function sintetizzaInfo(info) {
  const sentences = info.split('.').slice(0, 3);
  return {
    definizione: sentences[0] || '',
    importanza: sentences[1] || '',
    concetti: sentences[2] || ''
  };
}

// ===== DETERMINA LIVELLO =====
function getLivello(anno) {
  if (anno.includes('Primaria')) return 'base';
  if (anno.includes('Secondaria I Grado')) return 'medio';
  return 'avanzato';
}

// ===== DOWNLOAD SCHEMA COME IMMAGINE =====
function downloadSchema() {
  const schemaDiv = document.querySelector('.generated-schema');
  if (typeof html2canvas !== 'undefined') {
    // Mostra loader
    const originalContent = schemaDiv.innerHTML;
    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = 'color: #667eea; text-align: center; padding: 10px; font-weight: 600;';
    loadingMsg.textContent = '⏳ Generazione immagine in corso...';
    schemaDiv.appendChild(loadingMsg);

    html2canvas(schemaDiv).then(canvas => {
      // Rimuovi loader
      loadingMsg.remove();

      const link = document.createElement('a');
      link.download = 'schema.png';
      link.href = canvas.toDataURL();
      link.click();

      // Mostra messaggio di successo
      const successMsg = document.createElement('div');
      successMsg.style.cssText = 'color: #28a745; text-align: center; padding: 10px; font-weight: 600; animation: fadeIn 0.3s;';
      successMsg.textContent = '✅ Schema scaricato correttamente';
      schemaDiv.appendChild(successMsg);

      setTimeout(() => {
        successMsg.style.animation = 'fadeOut 0.3s';
        setTimeout(() => successMsg.remove(), 300);
      }, 3000);
    });
  } else {
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = 'color: #dc3545; text-align: center; padding: 10px; font-weight: 600;';
    errorMsg.textContent = '❌ Errore: libreria html2canvas non caricata';
    schemaDiv.appendChild(errorMsg);
  }
}

// ===== ESPORTA TUTTI GLI SCHEMI =====
function exportAllSchemas() {
  const schemas = JSON.parse(localStorage.getItem('userSchemas') || '[]');
  const dataStr = JSON.stringify(schemas, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'miei_schemi_backup.json';
  link.click();
  showNotification('Backup esportato!', 'success');
}

// ===== IMPORTA SCHEMI =====
function importSchemas(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const schemas = JSON.parse(e.target.result);
      localStorage.setItem('userSchemas', JSON.stringify(schemas));
      location.reload();
      showNotification('Schemi importati con successo!', 'success');
    } catch (error) {
      showNotification('Errore durante l\'importazione', 'error');
    }
  };
  reader.readAsText(file);
}

// ===== MOSTRA MESSAGGIO DI SUCCESSO =====
function showSuccessMessage(elementId, message) {
  // Rimuovi vecchi messaggi
  const oldMessage = document.getElementById(elementId);
  if (oldMessage) {
    oldMessage.remove();
  }

  // Crea nuovo messaggio
  const successDiv = document.createElement('div');
  successDiv.id = elementId;
  successDiv.className = 'success-message';
  successDiv.style.cssText = `
    color: #28a745;
    font-size: 1em;
    font-weight: 600;
    margin-top: 15px;
    padding: 12px 20px;
    background: #d4edda;
    border: 2px solid #28a745;
    border-radius: 10px;
    animation: fadeIn 0.3s ease-in;
    text-align: center;
  `;
  successDiv.textContent = message;

  // Aggiungi dopo il bottone di upload
  const uploadButton = document.querySelector('.option button[onclick="handleUpload()"]');
  uploadButton.parentNode.insertBefore(successDiv, uploadButton.nextSibling);

  // Rimuovi dopo 5 secondi
  setTimeout(() => {
    successDiv.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => successDiv.remove(), 300);
  }, 5000);
}

// ===== AGGIUNGI STILI ANIMAZIONI =====
function addAnimationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.8); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}