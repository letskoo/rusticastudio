(() => {
  'use strict';
  const dialog = document.getElementById('image-dialog');
  const dialogImage = dialog?.querySelector('img');
  const dialogCaption = dialog?.querySelector('p');
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }
  function openImage(image) {
    if (!dialog || !dialogImage || !image) return;
    dialogImage.src = image.currentSrc || image.src;
    dialogImage.alt = image.alt;
    dialogCaption.textContent = image.closest('figure')?.querySelector('figcaption')?.firstChild?.textContent?.trim() || image.alt;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else window.open(image.src, '_blank', 'noopener,noreferrer');
  }
  document.querySelectorAll('.screenshot').forEach(figure => {
    const image = figure.querySelector('img');
    image?.addEventListener('click', () => openImage(image));
    figure.querySelector('[data-zoom-button]')?.addEventListener('click', () => openImage(image));
    image?.addEventListener('error', () => {
      image.style.display = 'none';
      const fallback = document.createElement('p');
      fallback.className = 'image-fallback';
      fallback.textContent = '이미지를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.';
      figure.insertBefore(fallback, figure.firstChild);
    }, {once:true});
  });
  dialog?.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog?.addEventListener('close', () => { if (dialogImage) dialogImage.removeAttribute('src'); });
  document.querySelector('[data-copy-path]')?.addEventListener('click', async () => {
    const path = '%USERPROFILE%\\Downloads\\RusticaStudio_DSLR_IMPORT';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(path);
      showToast('경로를 복사했습니다.');
    } catch {
      showToast('복사할 수 없습니다. 화면의 경로를 직접 선택해 주세요.');
    }
  });
  const navLinks = [...document.querySelectorAll('.side-nav>a[href^="#"]')];
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  function setActive(id) {
    navLinks.forEach(link => {
      const active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActive(visible[0].target.id);
    }, {rootMargin:'-100px 0px -55% 0px',threshold:0});
    sections.forEach(section => observer.observe(section));
  }
  navLinks.forEach(link => link.addEventListener('click', () => setActive(link.hash.slice(1))));
  document.querySelectorAll('.faq details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      document.querySelectorAll('.faq details').forEach(other => { if (other !== details) other.open = false; });
    });
  });
  const storageLink = '<a class="btn btn-outline" href="./storage.html">촬영 저장 경로 설정 자세히 보기 ↗</a>';
  const cameraSection = document.getElementById('camera');
  if (cameraSection) {
    const pathBox = cameraSection.querySelector('.path-box');
    if (pathBox) {
      const notice = document.createElement('div');
      notice.className = 'callout callout-warning';
      notice.innerHTML = '<strong>앨범에 사진이 나오지 않나요?</strong><p>digiCamControl의 촬영 저장 위치는 RusticaStudio가 감시하는 DSLR_IMPORT 폴더와 일치해야 합니다. RusticaStudio의 최종 저장 위치와 DSLR_IMPORT는 서로 다른 역할입니다. Google Drive 등 다른 폴더에 저장하면 사진이 감지되지 않을 수 있습니다.</p>' + storageLink;
      pathBox.insertAdjacentElement('beforebegin', notice);
    }
  }
  const troubleshooting = document.getElementById('troubleshooting');
  if (troubleshooting) {
    const notice = document.createElement('div');
    notice.className = 'callout callout-info';
    notice.innerHTML = '<strong>촬영은 되는데 앨범이 비어 있나요?</strong><p>먼저 digiCamControl의 실제 JPG 저장 위치와 RusticaStudio의 DSLR_IMPORT 수신 폴더가 일치하는지 확인해 주세요.</p>' + storageLink;
    troubleshooting.insertBefore(notice, troubleshooting.firstChild.nextSibling);
  }
})();
