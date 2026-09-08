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
})();
