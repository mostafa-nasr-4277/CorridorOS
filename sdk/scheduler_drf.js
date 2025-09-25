// Simple DRF-like scheduler for two resources: lanes (photonic) and gbps (memory bandwidth)
// This is a reference implementation for planning and tests; wire into services later.

class DRFScheduler {
  constructor(capacity) {
    this.capacity = { lanes: capacity.lanes || 0, gbps: capacity.gbps || 0 };
    this.alloc = new Map(); // id -> {lanes, gbps}
  }

  dominantShare(req){
    const sL = req.lanes / Math.max(1, this.capacity.lanes);
    const sB = req.gbps / Math.max(1, this.capacity.gbps);
    return Math.max(sL, sB);
  }

  canFit(req){
    const used = this._used();
    return (used.lanes + req.lanes <= this.capacity.lanes) &&
           (used.gbps + req.gbps <= this.capacity.gbps);
  }

  allocate(id, req){
    if (this.canFit(req)){
      this.alloc.set(id, { lanes: req.lanes, gbps: req.gbps });
      return { granted: req, floorMet: true };
    }
    // Try to grant floors partially (keep floor, degrade surplus)
    const granted = { lanes: 0, gbps: 0 };
    const used = this._used();
    granted.lanes = Math.max(0, Math.min(req.lanes, this.capacity.lanes - used.lanes));
    granted.gbps = Math.max(0, Math.min(req.gbps, this.capacity.gbps - used.gbps));
    this.alloc.set(id, granted);
    return { granted, floorMet: granted.gbps >= req.gbps && granted.lanes >= req.lanes };
  }

  release(id){ this.alloc.delete(id); }

  _used(){
    let l=0,b=0; for (const v of this.alloc.values()){ l+=v.lanes; b+=v.gbps; } return { lanes:l, gbps:b };
  }
}

// Export for browser and Node
if (typeof module !== 'undefined') module.exports = DRFScheduler;
if (typeof window !== 'undefined') window.DRFScheduler = DRFScheduler;

