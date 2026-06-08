function renderGallery() {
  shotsGrid.innerHTML = '';

  if (capturedImages.length === 0) {
    shotsGrid.innerHTML = `
      <div class="shot">
        <div class="shot-empty">Noch keine Bilder vorhanden.<br>Starte die Kamera oder wähle Fotos aus.</div>
      </div>
    `;
    updateStatus();
    saveToStorage();
    return;
  }

  capturedImages.forEach((src, index) => {
    const item = document.createElement('article');
    item.className = 'shot';
    item.innerHTML = `
      <span class="shot-tag">Ansicht ${index + 1}</span>
      <button class="delete-shot-btn" aria-label="Bild ${index + 1} löschen">×</button>
      <img src="${src}" alt="Aufgenommenes Objektbild ${index + 1}">
    `;

    item.querySelector('.delete-shot-btn').addEventListener('click', () => {
      capturedImages.splice(index, 1);
      renderGallery();
    });

    shotsGrid.appendChild(item);
  });

  updateStatus();
  saveToStorage();
}
