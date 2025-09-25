// Lightweight tilt/parallax interactions for cards
(function() {
  const MAX_TILT = 6; // degrees
  const cards = Array.from(document.querySelectorAll('.unit'));

  function handleMove(e) {
    const rect = this.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const rx = Math.max(Math.min(-dy * MAX_TILT, MAX_TILT), -MAX_TILT);
    const ry = Math.max(Math.min(dx * MAX_TILT, MAX_TILT), -MAX_TILT);
    this.style.transform = `translateY(-8px) scale(1.02) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  function reset() {
    this.style.transform = '';
  }

  cards.forEach(card => {
    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseleave', reset);
  });
})();


