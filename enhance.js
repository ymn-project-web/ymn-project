// Native anchors and details still work without JavaScript. No form handlers or analytics.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  document.querySelector('.mobile-menu')?.removeAttribute('open');
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});
document.addEventListener('keydown', event => {
  const menu = document.querySelector('.mobile-menu[open]');
  if (event.key === 'Escape' && menu) {
    menu.removeAttribute('open');
    menu.querySelector('summary').focus();
  }
});
