<?php
// ===== GENERA SCHEMA - BACKEND POTENZIATO =====
// Genera schemi con NOZIONI e INFORMAZIONI reali, non domande generiche.
// Usa Wikipedia IT per contenuti autentici adattati al livello scolastico.

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { http_response_code(405); echo json_encode(['success' => false, 'error' => 'Usa POST.']); exit(); }

// ===== INPUT =====
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$input = strpos($contentType, 'application/json') !== false
    ? json_decode(file_get_contents('php://input'), true)
    : $_POST;

$materia   = trim($input['materia']   ?? '');
$argomento = trim($input['argomento'] ?? '');
$anno      = trim($input['anno']      ?? '');
$formato   = trim($input['formato']   ?? 'json');

// ===== VALIDAZIONE =====
$errors = [];
if (empty($materia))   $errors[] = 'Il campo "materia" è obbligatorio.';
if (empty($argomento)) $errors[] = 'Il campo "argomento" è obbligatorio.';
if (empty($anno))      $errors[] = 'Il campo "anno" è obbligatorio.';

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit();
}

// ===== STEP 1: CERCA SU WIKIPEDIA =====
$wikiData = cercaWikipedia($argomento);

// ===== STEP 2: GENERA LO SCHEMA =====
$schema = generaSchema($materia, $argomento, $anno, $wikiData);

// ===== STEP 3: OUTPUT =====
if ($formato === 'pdf') {
    scaricaPDF($materia, $argomento, $anno, $schema);
} else {
    echo json_encode([
        'success'    => true,
        'schema'     => $schema,
        'materia'    => $materia,
        'argomento'  => $argomento,
        'anno'       => $anno,
        'fonte_wiki' => $wikiData['trovato'] ? 'Wikipedia IT' : 'Schema predefinito'
    ]);
}


// =============================================================================
// FUNZIONE: CERCA SU WIKIPEDIA (testo completo + sezioni)
// =============================================================================
function cercaWikipedia(string $query): array {
    $risultato = ['trovato' => false, 'titolo' => '', 'frasi' => [], 'sezioni' => []];

    // REST API - riassunto
    $url  = 'https://it.wikipedia.org/api/rest_v1/page/summary/' . urlencode($query);
    $json = fetchUrl($url);
    $data = $json ? json_decode($json, true) : null;
    if ($data && !empty($data['extract'])) {
        $risultato['trovato'] = true;
        $risultato['titolo']  = $data['title'] ?? $query;
        $risultato['frasi']   = estraiFrasi($data['extract'], 10);
    }

    // MediaWiki API - testo completo
    $apiUrl  = 'https://it.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true'
             . '&titles=' . urlencode($query) . '&format=json&exsectionformat=plain';
    $apiJson = fetchUrl($apiUrl);
    $apiData = $apiJson ? json_decode($apiJson, true) : null;
    if ($apiData) {
        $pages = $apiData['query']['pages'] ?? [];
        $page  = reset($pages);
        if ($page && !empty($page['extract']) && strpos(($page['extract'] ?? ''), 'Missing') === false) {
            $risultato['trovato'] = true;
            $risultato['titolo']  = $page['title'] ?? $query;
            // Estrai fino a 25 frasi significative
            $risultato['frasi']   = estraiFrasi($page['extract'], 25);
            // Dividi in paragrafi/sezioni
            $paragrafi = array_values(array_filter(
                explode("\n\n", $page['extract']),
                fn($p) => strlen(trim($p)) > 60
            ));
            $risultato['sezioni'] = array_slice($paragrafi, 0, 8);
        }
    }

    return $risultato;
}


// =============================================================================
// FUNZIONE: RILEVA TIPO ARGOMENTO (storia, matematica, scienza, ecc.)
// =============================================================================
function rilevaCategoria(string $argomento, string $materia): string {
    $a = strtolower($argomento);
    $m = strtolower($materia);
    
    $storiaKeywords = ['guerra','rivoluzione','impero','regno','battaglia','civiltà','medioevo','rinascimento','fascismo','nazismo','colonialismo','unificazione','resistenza','shoah','olocausto','crociata','periodo','epoca','secolo','storia'];
    foreach ($storiaKeywords as $k) {
        if (str_contains($a, $k) || str_contains($m, 'storia')) return 'storia';
    }
    
    $matematicaKeywords = ['funzione','equazione','derivata','integrale','limite','teorema','geometria','algebra','trigonometria','probabilità','statistica','polinomio','matrice','vettore','studio di funzione'];
    foreach ($matematicaKeywords as $k) {
        if (str_contains($a, $k) || str_contains($m, 'matematica') || str_contains($m, 'analisi')) return 'matematica';
    }
    
    $scienzaKeywords = ['cellula','dna','evoluzione','fotosintesi','ecosistema','chimica','fisica','reazione','atomo','molecola','energia','forza','velocità','accelerazione','campo','onda','luce'];
    foreach ($scienzaKeywords as $k) {
        if (str_contains($a, $k) || str_contains($m, 'scienze') || str_contains($m, 'fisica') || str_contains($m, 'chimica') || str_contains($m, 'biologia')) return 'scienza';
    }
    
    $letteraturaKeywords = ['romanzo','poeta','scrittore','autore','opera','racconto','commedia','tragedia','dante','leopardi','manzoni','pirandello'];
    foreach ($letteraturaKeywords as $k) {
        if (str_contains($a, $k) || str_contains($m, 'italiano') || str_contains($m, 'letteratura')) return 'letteratura';
    }
    
    return 'generale';
}

// =============================================================================
// FUNZIONE: STRUTTURA SPECIFICA PER CATEGORIA
// =============================================================================
function strutturaPunti(string $categoria, string $argomento, string $livello, array $frasi, array $sezioni): array {
    $f = function(int $i, string $fallback) use ($frasi): string {
        return pulisci($frasi[$i] ?? $fallback);
    };
    
    if ($categoria === 'storia') {
        return [
            'sezioni' => [
                ['titolo' => '1. CONTESTO STORICO E CAUSE', 'punti' => [
                    "Periodo e contesto: " . $f(0, "Evento storico importante che ha segnato la storia."),
                    "Cause principali: " . $f(1, "Le cause che hanno portato a questo evento storico."),
                    "Situazione precedente: " . $f(2, "Il contesto politico e sociale prima dell'evento.")
                ]],
                ['titolo' => '2. INIZIO, SCHIERAMENTI E SVOLGIMENTO', 'punti' => [
                    "Quando è iniziata: " . $f(3, "Il periodo di inizio e le prime fasi dell'evento."),
                    "Schieramenti e fronti: " . $f(4, "Le alleanze, i gruppi e le posizioni coinvolte."),
                    "Fasi chiave: " . $f(5, "Le tappe principali dello svolgimento e i momenti decisivi.")
                ]],
                ['titolo' => '3. COME È FINITA E CONSEGUENZE', 'punti' => [
                    "Come è finita: " . $f(6, "La conclusione dell'evento e le sue modalità."),
                    "Conseguenze immediate: " . $f(7, "I cambiamenti politici e sociali immediati."),
                    "Impatto a lungo termine: " . $f(8, "Le trasformazioni durature nella storia.")
                ]],
                ['titolo' => '4. PERSONAGGI CHIAVE', 'punti' => [
                    $f(9, "I principali protagonisti storici e il loro ruolo."),
                    $f(10, "Figure politiche e militari determinanti."),
                    $livello !== 'base' ? ($sezioni[2] ? pulisci(estraiFrasiJS_php($sezioni[2], 1)[0] ?? "Personaggi di rilevanza storica internazionale.") : "Personaggi di rilevanza storica internazionale.") : "Eroi e figure simbolo del periodo."
                ]],
                ['titolo' => '5. FONTI E APPROFONDIMENTI', 'tipo' => 'risorse']
            ]
        ];
    }
    
    if ($categoria === 'matematica') {
        return [
            'sezioni' => [
                ['titolo' => '1. DEFINIZIONE E CONCETTI BASE', 'punti' => [
                    "Definizione: " . $f(0, "Definizione matematica precisa del concetto."),
                    "Notazione e simboli: " . $f(1, "La notazione standard utilizzata in matematica."),
                    "Prerequisiti: comprensione necessaria dei concetti fondamentali."
                ]],
                ['titolo' => '2. PROPRIETÀ E REGOLE', 'punti' => [
                    "Proprietà fondamentali: " . $f(2, "Le proprietà matematiche principali."),
                    "Teoremi e dimostrazioni: " . $f(3, "I teoremi chiave e le loro applicazioni."),
                    "Casi particolari e condizioni: " . $f(4, "Eccezioni e casi speciali da ricordare.")
                ]],
                ['titolo' => stripos($argomento, 'studio') !== false && stripos($argomento, 'funzione') !== false
                    ? '3. STUDIO DI FUNZIONE - PASSAGGI' : '3. PASSAGGI PROCEDURALI', 'punti' => [
                    "Passo 1 — Analisi iniziale: identifica dominio, condizione di esistenza e tipo di funzione.",
                    "Passo 2 — Calcola limiti e asintoti, se presenti, per capire il comportamento ai bordi.",
                    "Passo 3 — Calcola la derivata e studiane il segno per monotonia e crescenza.",
                    "Passo 4 — Individua massimi, minimi, punti di flesso e concavità.",
                    "Passo 5 — Disegna il grafico complessivo e verifica la coerenza con i risultati."
                ]],
                ['titolo' => '4. ESEMPI E APPLICAZIONI', 'punti' => [
                    $f(5, "Esempio pratico di applicazione del concetto matematico."),
                    $f(6, "Applicazioni in contesti reali e in altre discipline."),
                    "Errori comuni da evitare durante la risoluzione."
                ]],
                ['titolo' => '5. SINTESI E METODO', 'punti' => [
                    $f(7, "Riepilogo del concetto e del metodo risolutivo."),
                    "Schema mentale: definizione → proprietà → procedura → verifica.",
                    "Connessioni con altri argomenti di matematica."
                ]],
                ['titolo' => '6. RISORSE CONSIGLIATE', 'tipo' => 'risorse']
            ]
        ];
    }
    
    if ($categoria === 'scienza') {
        return [
            'sezioni' => [
                ['titolo' => '1. DEFINIZIONE E PRINCIPI', 'punti' => [
                    "Definizione: " . $f(0, "Definizione scientifica del fenomeno o concetto."),
                    "Principi di base: " . $f(1, "Le leggi e i principi scientifici fondamentali."),
                    "Contesto disciplinare: dove si colloca nello studio scientifico."
                ]],
                ['titolo' => '2. STRUTTURA E PROPRIETÀ', 'punti' => [
                    "Caratteristiche principali: " . $f(2, "Le proprietà fisiche o chimiche fondamentali."),
                    "Componenti e struttura: " . $f(3, "La composizione e l'organizzazione interna."),
                    "Grandezze e misure: unità di misura e metodi di misurazione."
                ]],
                ['titolo' => '3. MECCANISMI E PROCESSI', 'punti' => [
                    "Come funziona: " . $f(4, "Il meccanismo o processo scientifico descritto."),
                    "Leggi e formule: " . $f(5, "Le equazioni o leggi che lo governano."),
                    "Variabili e fattori influenzanti: condizioni che modificano il fenomeno."
                ]],
                ['titolo' => '4. APPLICAZIONI E IMPORTANZA', 'punti' => [
                    "Applicazioni pratiche: " . $f(6, "Utilizzi nella vita quotidiana e nella tecnologia."),
                    "Importanza scientifica: " . $f(7, "Perché questo concetto è fondamentale nella scienza."),
                    "Esperimenti e osservazioni: come si studia in laboratorio."
                ]],
                ['titolo' => '5. SINTESI', 'punti' => [
                    $f(8, "Riepilogo dei punti fondamentali del concetto scientifico."),
                    "Collegamento con altri fenomeni e discipline scientifiche.",
                    "Punti chiave da ricordare per lo studio."
                ]],
                ['titolo' => '6. RISORSE CONSIGLIATE', 'tipo' => 'risorse']
            ]
        ];
    }
    
    if ($categoria === 'letteratura') {
        return [
            'sezioni' => [
                ['titolo' => '1. AUTORE E CONTESTO', 'punti' => [
                    "Autore e biografia: " . $f(0, "Informazioni sull'autore e il suo periodo storico."),
                    "Contesto culturale: " . $f(1, "Il movimento letterario e l'epoca di appartenenza."),
                    "Opere principali: " . $f(2, "Le opere più importanti dell'autore o del periodo.")
                ]],
                ['titolo' => "2. ANALISI DELL'OPERA", 'punti' => [
                    "Trama e struttura: " . $f(3, "La struttura narrativa e lo svolgimento della trama."),
                    "Temi principali: " . $f(4, "I temi fondamentali trattati nell'opera."),
                    "Stile e linguaggio: " . $f(5, "Le caratteristiche stilistiche e linguistiche.")
                ]],
                ['titolo' => '3. PERSONAGGI E SIMBOLI', 'punti' => [
                    "Personaggi principali: " . $f(6, "I protagonisti e il loro significato nell'opera."),
                    "Simbolismo: " . $f(7, "I simboli e le metafore ricorrenti."),
                    "Messaggio e interpretazione: il significato profondo dell'opera."
                ]],
                ['titolo' => '4. IMPORTANZA LETTERARIA', 'punti' => [
                    $f(8, "L'impatto dell'opera sulla letteratura italiana e mondiale."),
                    "Influenza sui posteri: autori e opere che ne hanno subito l'influenza.",
                    "Attualità: perché questa opera è ancora rilevante oggi."
                ]],
                ['titolo' => '5. RISORSE E TESTI', 'tipo' => 'risorse']
            ]
        ];
    }
    
    // Categoria generale
    return [
        'sezioni' => [
            ['titolo' => '1. DEFINIZIONE E CONTESTO', 'punti' => [
                pulisci($frasi[0] ?? "Concetto fondamentale nell'ambito di {$argomento}."),
                pulisci($frasi[1] ?? "Campo di studio: si inserisce nel contesto della materia."),
                $livello !== 'base' && isset($frasi[2]) ? pulisci($frasi[2]) : ''
            ]],
            ['titolo' => '2. CARATTERISTICHE E PROPRIETÀ', 'punti' => [
                pulisci($frasi[2] ?? "Proprietà principali e caratteristiche fondamentali."),
                pulisci($frasi[3] ?? "Aspetti fondamentali: relazioni e componenti essenziali."),
                $livello !== 'base' ? (pulisci($frasi[4] ?? "Sviluppo e varianti del concetto nel tempo.")) : ''
            ]],
            ['titolo' => '3. SVILUPPO E APPLICAZIONI', 'punti' => [
                pulisci($frasi[5] ?? "Applicazioni pratiche e riscontri nel mondo reale."),
                pulisci($frasi[6] ?? "Analisi critica: implicazioni e limiti del concetto."),
                pulisci($frasi[7] ?? "Interconnessioni con altri settori e discipline.")
            ]],
            ['titolo' => '4. SINTESI E CONCETTI CHIAVE', 'punti' => [
                pulisci($frasi[8] ?? "{$argomento} rappresenta un nodo concettuale fondamentale."),
                "Punti chiave: definizione, caratteristiche, applicazioni pratiche.",
                "Collegare sempre la teoria agli esempi concreti."
            ]],
            ['titolo' => '5. RISORSE CONSIGLIATE', 'tipo' => 'risorse']
        ]
    ];
}

function estraiFrasiJS_php(string $sez, int $n): array {
    return array_slice(array_filter(
        preg_split('/(?<=[.!?])\s+/', $sez),
        fn($f) => strlen(trim($f)) > 25
    ), 0, $n);
}

// =============================================================================
// FUNZIONE: GENERA LO SCHEMA con nozioni reali
// =============================================================================
function generaSchema(string $materia, string $argomento, string $anno, array $wiki): string {
    $livello = determinaLivello($anno);
    $frasi   = $wiki['frasi'];
    $sezioni = $wiki['sezioni'];
    $trovato = $wiki['trovato'];

    $categoria = rilevaCategoria($argomento, $materia);
    $struttura  = strutturaPunti($categoria, $argomento, $livello, $frasi, $sezioni);

    // ── INTESTAZIONE ──
    $s  = "╔══════════════════════════════════════════════╗\n";
    $s .= "║           SCHEMA DI STUDIO                  ║\n";
    $s .= "╚══════════════════════════════════════════════╝\n\n";
    $s .= "  Materia:         {$materia}\n";
    $s .= "  Argomento:       {$argomento}\n";
    $s .= "  Anno scolastico: {$anno}\n";
    $s .= "  Livello:         " . ucfirst($livello) . "\n";
    $s .= $trovato ? "  Fonte:           Wikipedia IT\n" : "  Fonte:           Schema predefinito\n";
    $s .= "\n";

    foreach ($struttura['sezioni'] as $sez) {
        $titolo = $sez['titolo'];
        $tipo   = $sez['tipo'] ?? 'punti';

        $s .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $s .= "  {$titolo}\n";
        $s .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

        if ($tipo === 'risorse') {
            $s .= "  ▸ Libro di testo del corso di {$materia}\n";
            $s .= "  ▸ Wikipedia IT: https://it.wikipedia.org/wiki/" . urlencode($argomento) . "\n";
            if ($livello === 'base') {
                $s .= "  ▸ Treccani Kids: https://kids.treccani.it\n";
            } elseif ($livello === 'medio') {
                $s .= "  ▸ Treccani: https://www.treccani.it/enciclopedia\n";
                $s .= "  ▸ Khan Academy IT: https://it.khanacademy.org\n";
            } else {
                $s .= "  ▸ Treccani: https://www.treccani.it/enciclopedia\n";
                $s .= "  ▸ Khan Academy: https://www.khanacademy.org\n";
                $s .= "  ▸ Articoli accademici e riviste di settore\n";
            }
        } else {
            foreach (($sez['punti'] ?? []) as $punto) {
                if (empty(trim($punto))) continue;
                $s .= "  ▸ " . wordwrap($punto, 90, "\n      ", true) . "\n\n";
            }
        }
        $s .= "\n";
    }

    $s .= "══════════════════════════════════════════════\n";
    $s .= "  GPN Schema AI  ·  " . date('d/m/Y') . "\n";
    $s .= "══════════════════════════════════════════════\n";

    return $s;
}


// =============================================================================
// FUNZIONE: SCARICA COME HTML (Ctrl+P → PDF)
// =============================================================================
function scaricaPDF(string $materia, string $argomento, string $anno, string $schema): void {
    $nomeFile   = 'schema_' . preg_replace('/[^a-zA-Z0-9_]/', '_', $argomento) . '_' . date('Ymd') . '.html';
    $schemaHtml = nl2br(htmlspecialchars($schema, ENT_QUOTES, 'UTF-8'));
    $titoloSafe = htmlspecialchars("{$materia} — {$argomento}", ENT_QUOTES, 'UTF-8');
    $annoSafe   = htmlspecialchars($anno, ENT_QUOTES, 'UTF-8');
    $dataOggi   = date('d/m/Y');

    while (ob_get_level()) ob_end_clean();
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $nomeFile . '"');

    echo <<<HTML
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Schema – {$titoloSafe}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 820px; margin: 40px auto; padding: 30px; color: #1a1a2e; line-height: 1.85; font-size: 14px; }
    header { border-bottom: 3px solid #4338ca; padding-bottom: 16px; margin-bottom: 28px; text-align: center; }
    header h1 { font-size: 22px; color: #4338ca; margin-bottom: 6px; }
    header .meta { font-size: 13px; color: #555; }
    .hint { background:#eef2ff; border:1px solid #c7d2fe; border-radius:6px; padding:12px 16px; margin-bottom:20px; font-size:13px; color:#4338ca; }
    .schema-body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13.5px; white-space: pre-wrap; line-height: 2; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 28px; }
    footer { margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print { .hint { display:none; } body { margin:0; padding:20px; max-width:100%; } .schema-body { border:none; background:transparent; padding:0; } }
  </style>
</head>
<body>
  <div class="hint">💡 Per salvare come PDF: premi <strong>Ctrl+P</strong> (Cmd+P su Mac) → seleziona <em>Salva come PDF</em>.</div>
  <header>
    <h1>Schema di Studio</h1>
    <div class="meta"><strong>Materia:</strong> {$titoloSafe} &nbsp;·&nbsp; <strong>Anno:</strong> {$annoSafe}</div>
  </header>
  <div class="schema-body">{$schemaHtml}</div>
  <footer>Generato da GPN Schema AI &nbsp;·&nbsp; {$dataOggi}</footer>
</body>
</html>
HTML;
    exit();
}


// =============================================================================
// FUNZIONI DI SUPPORTO
// =============================================================================
function determinaLivello(string $anno): string {
    $a = strtolower($anno);
    if (str_contains($a, 'primaria') || str_contains($a, 'elementar')) return 'base';
    if (str_contains($a, 'media') || str_contains($a, 'i grado') || str_contains($a, 'secondaria i')) return 'medio';
    return 'avanzato';
}

function estraiFrasi(string $testo, int $max = 10): array {
    // Dividi per punto/esclamativo/interrogativo seguiti da spazio
    $frasi = preg_split('/(?<=[.!?])\s+/', $testo);
    $frasi = array_filter($frasi, function($f) {
        $f = trim($f);
        // Scarta frasi troppo brevi, intestazioni (==), URL, numeri isolati
        if (strlen($f) < 30) return false;
        if (str_starts_with($f, '==')) return false;
        if (str_contains($f, 'http')) return false;
        if (preg_match('/^\d+$/', $f)) return false;
        return true;
    });
    return array_slice(array_values($frasi), 0, $max);
}

function pulisci(string $testo): string {
    $testo = trim(preg_replace('/\s+/', ' ', $testo));
    // Rimuovi intestazioni Wikipedia tipo "== Titolo =="
    $testo = preg_replace('/==+[^=]+=+/', '', $testo);
    $testo = trim($testo);
    if ($testo && !in_array(substr($testo, -1), ['.', '!', '?'])) $testo .= '.';
    return $testo;
}

function fetchUrl(string $url): ?string {
    if (!function_exists('curl_init')) return null;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_USERAGENT      => 'GPN-SchemaBot/2.0',
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $result = curl_exec($ch);
    $error  = curl_error($ch);
    curl_close($ch);
    return $error ? null : $result;
}
?>
