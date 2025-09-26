(() => {
  const chip = document.getElementById('webgpu-chip');
  if (!chip) return;

  const show = (text) => {
    chip.textContent = text;
    chip.style.display = 'inline-flex';
  };

  async function init() {
    if (!('gpu' in navigator)) {
      show('WebGPU: Off');
      return;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        show('WebGPU: Off');
        return;
      }
      const device = await adapter.requestDevice();
      const feats = (adapter.features || device.features);
      const has = (name) => (feats && typeof feats.has === 'function' ? feats.has(name) : false);
      const flags = [];
      if (has('shader-f16')) flags.push('f16');
      if (has('timestamp-query')) flags.push('tsq');

      let vendor = '';
      if (adapter.requestAdapterInfo) {
        try {
          const info = await adapter.requestAdapterInfo();
          vendor = info.vendor || info.architecture || info.description || '';
        } catch {}
      }
      const iso = self.crossOriginIsolated ? 'threads ✓' : 'threads ×';
      show(`WebGPU: On${vendor ? ' • ' + vendor : ''} • ${iso}${flags.length ? ' • ' + flags.join(',') : ''}`);
      if (device && typeof device.destroy === 'function') device.destroy();
    } catch (_) {
      show('WebGPU: Off');
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

