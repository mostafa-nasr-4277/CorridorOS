// Unified Model of Skewed Aperture Ambient Light and Environmental Stabilization
// Implements equations from the provided manuscript.
// Exposes a single class UnifiedModel with stateless helpers and small state for convenience.

(function(global){
  const deg = (x)=> x * Math.PI / 180;

  // Minimal CIE photopic luminosity function approximation V(λ) over 380–780nm
  // Using a smooth log-normal style approximation peaking near 555nm.
  function V_lambda_nm(lambda){
    // Clamp to visible range
    if (lambda < 380 || lambda > 780) return 0;
    const peak = 555;
    const sigma = 60; // broad
    const x = (lambda - peak) / sigma;
    return Math.exp(-0.5 * x * x);
  }

  // Blueband weighting W_B(λ), unit-normalised, peaked near 470nm
  function Wb_lambda_nm(lambda){
    const peak = 475;
    const sigma = 20;
    const x = (lambda - peak) / sigma;
    return Math.exp(-0.5 * x * x);
  }

  // Numerical integration over wavelength grid
  function integrateSpectrum(wavelengths, fn){
    // Trapezoidal rule
    let acc = 0;
    for (let i = 1; i < wavelengths.length; i++){
      const x0 = wavelengths[i-1], x1 = wavelengths[i];
      const y0 = fn(x0); const y1 = fn(x1);
      acc += (x1 - x0) * 0.5 * (y0 + y1);
    }
    return acc;
  }

  // Vector helpers
  function dot(a,b){ return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
  function norm(a){ return Math.sqrt(dot(a,a)); }
  function normalize(a){ const n = norm(a)||1; return [a[0]/n,a[1]/n,a[2]/n]; }
  // Rotation by yaw φ (around z) then tilt ψ (around x′)
  function rotateYawTilt(v, phi, psi){
    const c1=Math.cos(phi), s1=Math.sin(phi);
    const Rz = [ [c1,-s1,0],[s1,c1,0],[0,0,1] ];
    const v1 = [ dot(Rz[0],v), dot(Rz[1],v), dot(Rz[2],v) ];
    const c2=Math.cos(psi), s2=Math.sin(psi);
    const Rx = [ [1,0,0],[0,c2,-s2],[0,s2,c2] ];
    return [ dot(Rx[0],v1), dot(Rx[1],v1), dot(Rx[2],v1) ];
  }

  class UnifiedModel {
    constructor(){
      // Default seven-direction basis (one zenith, six around at ~45° elevation)
      // Basis is defined in aperture-local frame; we’ll rotate by yaw/tilt to world.
      const elev = deg(45); // elevation above plane
      const azis = [0,60,120,180,240,300].map(deg);
      this.basisLocal = [ [0,0,1], ...azis.map(a=> normalize([Math.cos(a)*Math.cos(Math.PI/2 - elev), Math.sin(a)*Math.cos(Math.PI/2 - elev), Math.sin(elev)]) ) ];
      // Wavelength grid (nm)
      this.lambda = (()=>{ const arr=[]; for(let l=400;l<=700;l+=5) arr.push(l); return arr;})();
    }

    // Compute direction set in world frame given yaw φ and tilt ψ (radians) and aperture normal n
    directionSet(phi, psi){
      // Aperture normal in world frame (rotate local [0,0,1])
      const n = rotateYawTilt([0,0,1], phi, psi);
      const dirs = this.basisLocal.map(v => normalize(rotateYawTilt(v, phi, psi)));
      // cosθ_i = max(0, n · d_i)
      const cosTheta = dirs.map(d => Math.max(0, dot(n, d)));
      return { normal: normalize(n), dirs, cosTheta };
    }

    // Eq. (7) discrete approximation of escape integral (with transmissivity T_i)
    escapeSum(I, cosTheta, T){
      let E = 0;
      for (let i=0;i<cosTheta.length;i++){
        const Ii = I[i]||0, ci = cosTheta[i]||0, Ti = (T && T[i]!=null)?T[i]:1;
        E += Ii * ci * Ti;
      }
      return E; // Illuminance/irradiance proxy
    }

    // Eq. (6) with multiplicative modifiers M_{k,i}
    escapeWithModifiers(I, cosTheta, T, M){
      let E = 0;
      for (let i=0;i<cosTheta.length;i++){
        const Ii = I[i]||0, ci = cosTheta[i]||0, Ti = (T && T[i]!=null)?T[i]:1;
        let prod = 1;
        const mods = (M && M[i]) || [];
        for (let k=0;k<mods.length;k++){ prod *= mods[k]; }
        E += Ii * ci * Ti * prod;
      }
      return E;
    }

    // Glint amplification G(θ) = 1 + F0 (secθ - 1), secθ = 1/cosθ
    glintGain(cosTheta, F0){
      const eps = 1e-6;
      const c = Math.max(eps, Math.min(1, cosTheta));
      const sec = 1/c;
      return 1 + F0 * (sec - 1);
    }

    // Apply glint for a subset of indices G
    applyGlint(I, cosTheta, indices, F0){
      const out = I.slice();
      indices.forEach(i=>{ out[i] = (out[i]||0) * this.glintGain(cosTheta[i]||0, F0); });
      return out;
    }

    // Spectral blueband irradiance E_B and broadband E_vis, using provided per-direction spectra
    // Lspec[i](λ) and Tspec[i](λ) functions or arrays over this.lambda grid
    spectralBlueband(cosTheta, Lspec, Tspec, wavelengths){
      const lam = wavelengths || this.lambda;
      const EB_dir = new Array(cosTheta.length).fill(0);
      const EV_dir = new Array(cosTheta.length).fill(0);
      const toFn = (f)=>{
        if (typeof f === 'function') return f;
        if (Array.isArray(f)){
          // Interpret as sampled values over lam grid
          return (x)=>{
            // nearest-neighbor index
            let idx = 0; let minD = Infinity;
            for (let j=0;j<lam.length;j++){ const d = Math.abs(lam[j]-x); if (d<minD){minD=d; idx=j;} }
            return f[idx]||0;
          };
        }
        return ()=>0;
      };
      for (let i=0;i<cosTheta.length;i++){
        const Lf = toFn(Lspec[i]||(()=>0));
        const Tf = toFn(Tspec[i]||(()=>1));
        const EB = integrateSpectrum(lam, (l)=> Lf(l)*Tf(l)*Wb_lambda_nm(l));
        const EV = integrateSpectrum(lam, (l)=> Lf(l)*Tf(l)*V_lambda_nm(l));
        EB_dir[i] = (cosTheta[i]||0) * EB;
        EV_dir[i] = (cosTheta[i]||0) * EV;
      }
      const EBsum = EB_dir.reduce((a,b)=>a+b,0);
      const EVsum = EV_dir.reduce((a,b)=>a+b,0) || 1e-12;
      const BRI = EBsum / EVsum;
      return { EB: EBsum, Evis: EVsum, BRI };
    }

    // Discrete-time thermal update Eq. (thermal_disc)
    thermalStep(Tk, dt, C, k_sol, k_loss, T_amb_k, q_ctrl_k, I, cosTheta, Tdir){
      const sum = this.escapeSum(I, cosTheta, Tdir);
      const dTdt = (k_sol * sum - k_loss * (Tk - T_amb_k) + q_ctrl_k) / C;
      return Tk + dt * dTdt;
    }

    // Steady-state Eq. (thermal_ss)
    thermalSteady(k_sol, k_loss, I, cosTheta, Tdir, q_ctrl_avg){
      const sum = this.escapeSum(I, cosTheta, Tdir);
      const dT = (k_sol / k_loss) * sum + (q_ctrl_avg||0)/k_loss;
      return dT;
    }

    // Time-weighted exposure over discrete timeline Eq. (time_weight)
    timeWeightedExposure(samples){
      // samples: array of { s, w, I:[7], cosTheta:[7], T:[7], dt }
      let acc = 0;
      for (const m of samples){
        const S = (m.s!=null?m.s:1) * (m.w!=null?m.w:1);
        const sum = this.escapeSum(m.I||[], m.cosTheta||[], m.T||[]);
        acc += (m.dt||1) * S * sum;
      }
      return acc;
    }
  }

  global.UnifiedModel = UnifiedModel;
})(typeof window !== 'undefined' ? window : globalThis);

