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
  const projectNameInput = document.getElementById('projectNameInput');
  const navDot = document.getElementById('navDot');
  const navStatusText = document.getElementById('navStatusText');
  const cameraCountText = document.getElementById('cameraCountText');

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

  function setCameraVisualState(active) {
    navDot.classList.toggle('active', active);
    navStatusText.textContent = active ? 'Kamera aktiv' : 'Kamera inaktiv';
  }

  function updateStatus() {
    const active = !!stream;
    imageCount.textContent = capturedImages.length;
    cameraCountText.textContent = capturedImages.length;
    cameraStatus.textContent = active ? 'Live-Aufnahme läuft' : 'Bereit zum Start';
    cameraStateText.textContent = active ? 'Aktiv' : 'Inaktiv';
    setCameraVisualState(active);

    captureBtn.disabled = !active;
    stopCameraBtn.disabled = !active;
    captureBtn.style.opacity = active ? '1' : '.6';
    stopCameraBtn.style.opacity = active ? '1' : '.6';
  }

  function renderGallery() {
    shotsGrid.innerHTML = '';

    if (capturedImages.length === 0) {
      shotsGrid.innerHTML = `
        <article class="shot" style="animation-delay:0ms">
          <div class="shot-empty">
            Noch keine Bilder vorhanden.<br>
            Starte die Kamera oder lade Fotos von deinem Gerät hoch.
          </div>
        </article>
      `;
      updateStatus();
      saveToStorage();
      return;
    }

    capturedImages.forEach((src, index) => {
      const item = document.createElement('article');
      item.className = 'shot';
      item.style.animationDelay = `${index * 70}ms`;
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

  async function startCamera() {
    try {
      if (stream) return;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Dein Browser unterstützt keinen Kamerazugriff.');
        return;
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }
        },
        audio: false
      });

      video.srcObject = stream;
      await video.play();
      updateStatus();
    } catch (error) {
      alert('Kamera konnte nicht gestartet werden. Bitte Kamera-Freigabe erlauben.');
      console.error('Kamerafehler:', error);
      stream = null;
      updateStatus();
    }
  }

  function stopCamera() {
    if (!stream) return;

    stream.getTracks().forEach(track => {
      track.stop();
    });

    stream = null;
    video.pause();
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

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
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

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  loadFromStorage();
  renderGallery();
  updateStatus();

  window.addEventListener('beforeunload', stopCamera);
});
