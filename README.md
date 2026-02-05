progettoGPN
===========
[TOC]

v0.0.3 3-11-25

Componenti progettoGPN:

- Ginny (Developer)
- Pallola (Head of Design / Developer)
- Noe (Human resources manager / Chief of Finance)

Questa è un'applicazione web frontend / backend con lo scopo di condividere schemi utilizzati in ambito educativo. Per esempio gli schemi utilizzati a scuola per gli studenti DSA. Un sito utile sia per professori che studenti 

1. Catalogo e scambio contenuti

  Caricamento e download di schemi in vari formati (PDF, PNG, SVG, .docx).
  
  Tag, categorie e filtri (materia, anno scolastico, difficoltà, formato DSA).

  Sistema di valutazione e commenti per ogni schema.

2. Abbonamenti
   
   Gestione abbonamento dall’area utente: rinnovo automatico attivabile/disattivabile, storici pagamenti, fatture scaricabili.

3. Metodi di pagamento
      
  Carte di credito/debito (Visa, Mastercard, American Express)

  PayPal
  
  Apple Pay / Google Pay
  
  Carte prepagate e wallet locali 

  
![Schema Esempio](https://upload.wikimedia.org/wikipedia/commons/c/c7/Mappaconcettuale.jpg)

# frontend
Il frontend è sviluppato utilizzando HTML, CSS, Javascript. Entrare nella cartella per frontend e utilizzare qualsisi Http server per visualizzare l'applicazione (es. static hosting 8000 port):

```bash
python -m http.server 8000
```

# backend
Il backend è sviluppato utilizzando php, js e xampp per la creazione dei database.
