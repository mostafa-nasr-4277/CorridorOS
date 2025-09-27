Unified Model of Skewed Aperture Ambient Light and Environmental Stabilization

Overview
- Implements the equations from the provided manuscript (escape integral, modifiers, seven‑source decomposition, glint amplification, blueband spectral extension, dynamic thermal model, time‑weighted exposure).
- Location: `unified-model.js` exposes a global `UnifiedModel` class.

Key APIs
- `directionSet(phi, psi)` → `{ normal, dirs, cosTheta }`
  - Input angles in radians. Computes seven directions (zenith + six azimuthal at ~45° elevation) rotated by yaw `phi` and tilt `psi`. Returns per‑direction `cosTheta` = max(0, n·d).

- `escapeSum(I, cosTheta, T)` → `E`
  - Eq. (7) discrete sum approximation of the escape integral: `sum_i I_i cosθ_i T_i`.

- `escapeWithModifiers(I, cosTheta, T, M)` → `E_tilde`
  - Eq. (6) with multiplicative modifiers `M_{k,i}` per direction.

- `glintGain(cosTheta, F0)` and `applyGlint(I, cosTheta, indices, F0)`
  - Eq. (glint): `1 + F0 (secθ − 1)` applied to chosen directions.

- `spectralBlueband(cosTheta, Lspec, Tspec, wavelengths)` → `{ EB, Evis, BRI }`
  - Eqs. (blueband): computes blueband irradiance `E_B`, broadband visible `E_vis`, and ratio `BRI = E_B / E_vis`. Accepts per‑direction spectral radiance/transmissivity as functions or arrays sampled over `wavelengths` (nm).

- `thermalStep(Tk, dt, C, k_sol, k_loss, T_amb_k, q_ctrl_k, I, cosTheta, Tdir)` → `T_{k+1}`
  - Eq. (thermal_disc) Euler update.

- `thermalSteady(k_sol, k_loss, I, cosTheta, Tdir, q_avg)` → `ΔT_ss`
  - Eq. (thermal_ss) steady‑state rise.

- `timeWeightedExposure(samples)` → `\mathcal{E}_Δ`
  - Eq. (time_weight) discrete accumulation: samples contain `{ s, w, I, cosTheta, T, dt }`.

Ambient Lab app
- File: `ambient-lab.js`. Registers `Ambient Lab` in CorridorOS (Activities → app grid).
- Lets you:
  - Adjust yaw/tilt, glint factor, seven‑source intensities and transmissivities, and thermal parameters.
  - Computes: `E_escape`, `Ẽ_escape` (with modifiers), blueband `E_B`, `BRI`, `ΔT_ss`, and next `T`.
  - Timeline Runner: define multi‑phase schedules (duration, s(t), w(t), φ, ψ, I×, T×, T_amb, q_ctrl), run a simulation at Δt, and plot:
    - Temperature trace T(t)
    - Cumulative time‑weighted exposure 𝓔Δ(t) with total `E_total`

Notes
- The photopic `V(λ)` and blueband `W_B(λ)` are smooth approximations for interactive use. Replace with calibrated curves as needed.
- Shear parameters (κ_x, κ_y) are placeholders in this version; future updates can perturb the direction set or modifiers.
