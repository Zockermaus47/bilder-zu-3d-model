document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('captureCanvas');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const openUploadBtn = document.getElementById('openUploadBtn');
  const fileInput = document.getElementById('fileInput');
  const shotsGrid = document.getElementById('shotsGrid');
  const imageCount = document.getElementById('imageCount');
  const clearBtn = document.getElementById('clearBtn');
  const downloadJsonBtn = document.getElementById('downloadJsonBtn');
  const cameraStatus = document.getElementById('cameraStatus');
  const cameraStateText = document.getElementById('cameraStateText');
  const heroCopy = document.querySelector('.hero-copy');
  const metaRow = document.querySelector('.meta-row');

  if (!video || !canvas || !startCameraBtn || !stopCameraBtn || !captureBtn || !openUploadBtn || !fileInput || !shotsGrid || !imageCount || !clearBtn || !downloadJsonBtn || !cameraStatus || !cameraStateText) {
    console.error('Ein oder mehrere benötigte HTML-Elemente fehlen.');
    return;
  }

  const projectNameInput = document.createElement('input');
  projectNameInput.type = 'text';
  projectNameInput.placeholder = 'Projektname, z. B. Blume_01';
  projectNameInput.style.cssText = `
    width:100%;
    margin-top:18px;
    padding:14px 16px;
    border-radius:14px;
    border:1px solid rgba(31,27,24,0.12);
    background:rgba(255,255,255,0.72);
    font:inherit;
    outline:none;
    box-sizing:border-box;
  `;

  if (heroCopy) {
    if (metaRow) {
      heroCopy.insertBefore(projectNameInput, metaRow);
    } else {
      heroCopy.appendChild(projectNameInput);
    }
  }

  let stream = null;
  let capturedImages = [];
  let projectName = localStorage.getItem('projectName') || 'bild_zu_3d_session';

  projectNameInput.value = projectName;

  function saveToStorage() {
    localStorage.setItem('projectName', projectName);
    localStorage.setItem('capturedImages', JSON.stringify(capturedImages));
  }

  function loadFromStorage() {
    const savedName = localStorage.getItem('projectName');
    const savedImages = localStorage.getItem('capturedImages');

    if (savedName) {
      projectName = savedName;
      projectNameInput.value = savedName;
    }

    if (savedImages) {
      try {
        capturedImages = JSON.parse(savedImages) || [];
      } catch (e) {
        capturedImages = [];
      }
    }
  }

  function updateStatus() {
    imageCount.textContent = capturedImages.length;
    const active = !!stream;
    cameraStatus.textContent = active ? 'Kamera aktiv' : 'Kamera aus';
    cameraStateText.textContent = active ? 'Aktiv' : 'Inaktiv';
  }

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

      const deleteBtn = item.querySelector('.delete-shot-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          capturedImages.splice(index, 1);
          renderGallery();
        });
      }

      shotsGrid.appendChild(item);
    });

    updateStatus();
    saveToStorage();
  }

  async function startCamera() {
    try {
      if (stream) return;

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      video.srcObject = stream;
      updateStatus();
    } catch (error) {
      alert('Kamera konnte nicht gestartet werden. Bitte Kamera-Freigabe erlauben.');
      console.error('Kamerafehler:', error);
    }
  }

  function stopCamera() {
    if (!stream) return;

    stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    updateStatus();
  }

  function captureImage() {
    if (!stream) {
      alert('Bitte zuerst die Kamera starten.');
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      alert('Kamera ist noch nicht bereit. Bitte kurz warten und erneut versuchen.');
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    capturedImages.push(dataUrl);
    renderGallery();
  }

  function handleFileSelect(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = e => {
        capturedImages.push(e.target.result);
        renderGallery();
      };
      reader.readAsDataURL(file);
    });

    fileInput.value = '';
  }

  function clearAllImages() {
    if (!capturedImages.length) return;
    const confirmDelete = confirm('Möchtest du wirklich alle Bilder löschen?');
    if (!confirmDelete) return;
    capturedImages = [];
    renderGallery();
  }

  function downloadProjectJson() {
    const payload = {
      project_name: projectName,
      created_at: new Date().toISOString(),
      image_count: capturedImages.length,
      images: capturedImages
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'projekt'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  projectNameInput.addEventListener('input', () => {
    projectName = projectNameInput.value.trim() || 'bild_zu_3d_session';
    saveToStorage();
  });

  startCameraBtn.addEventListener('click', startCamera);
  stopCameraBtn.addEventListener('click', stopCamera);
  captureBtn.addEventListener('click', captureImage);
  openUploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  clearBtn.addEventListener('click', clearAllImages);
  downloadJsonBtn.addEventListener('click', downloadProjectJson);

  loadFromStorage();
  renderGallery();
  updateStatus();

  window.addEventListener('beforeunload', () => {
    stopCamera();
  });
});
