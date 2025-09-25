// Three.js hero background with subtle 3D nodes and lines
(function() {
  if (!window.THREE) return;
  const container = document.getElementById('hero3d');
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 20;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Gradient background fog for depth
  scene.fog = new THREE.FogExp2(0x0b1220, 0.03);

  // Node field
  const nodeGeometry = new THREE.SphereGeometry(0.06, 12, 12);
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.9 });
  const nodes = new THREE.Group();
  scene.add(nodes);

  const NODE_COUNT = 450;
  for (let i = 0; i < NODE_COUNT; i++) {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    node.position.set((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
    nodes.add(node);
  }

  // Subtle moving lines (photonic paths)
  const lines = new THREE.Group();
  scene.add(lines);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x91ff79, transparent: true, opacity: 0.35 });

  function addLine() {
    const points = [];
    const start = new THREE.Vector3((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 30);
    const end = start.clone().add(new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10));
    points.push(start, end);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, lineMaterial);
    line.userData.life = 0;
    lines.add(line);
  }

  // Lighting glows
  const cyanLight = new THREE.PointLight(0x00d4ff, 0.6, 100);
  cyanLight.position.set(10, 8, 10);
  scene.add(cyanLight);
  const magentaLight = new THREE.PointLight(0xff57b4, 0.4, 100);
  magentaLight.position.set(-10, -6, -12);
  scene.add(magentaLight);

  // Mouse parallax
  const target = new THREE.Vector2();
  window.addEventListener('mousemove', (e) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function animate() {
    requestAnimationFrame(animate);
    camera.position.x += (target.x * 2 - camera.position.x) * 0.02;
    camera.position.y += (target.y * 1 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    nodes.rotation.y += 0.0008;

    if (Math.random() < 0.06) addLine();
    for (let i = lines.children.length - 1; i >= 0; i--) {
      const line = lines.children[i];
      line.userData.life += 0.01;
      line.material.opacity = Math.max(0, 0.35 - line.userData.life * 0.35);
      if (line.userData.life > 1) {
        lines.remove(line);
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();


