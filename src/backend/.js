// Upload
const formData = new FormData();
formData.append('file', fileInput.files[0]);
fetch('api/upload.php', {
  method: 'POST',
  body: formData
}).then(res => res.json()).then(data => {
  alert(`File caricato: ${data.name}`);
});

// Search
fetch(`api/search.php?q=${query}`)
  .then(res => res.json())
  .then(results => {
    alert(`Trovati ${results.length} schemi`);
  });