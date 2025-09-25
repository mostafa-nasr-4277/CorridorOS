/**
 * Auto-Cycle System for Corridor Computer Emulator
 * Automatically cycles through different system states and demonstrations
 */

class AutoCycle {
    constructor() {
        this.isActive = false;
        this.cycleInterval = null;
        this.currentCycle = 0;
        this.cycleDuration = 10000; // 10 seconds per cycle to match system patterns
        this.cycles = [
            'quantum_processing',
            'photon_channels',
            'memory_optimization',
            'thermal_management',
            'aperture_calibration',
            'sprint_execution'
        ];
        
        this.init();
    }

    init() {
        this.createControlPanel();
        this.bindEvents();
    }

    createControlPanel() {
        // Add auto-cycle controls to the header
        const header = document.querySelector('.header');
        if (header) {
            const cycleControls = document.createElement('div');
            cycleControls.className = 'auto-cycle-controls';
            cycleControls.innerHTML = `
                <div class="cycle-status">
                    <span class="cycle-indicator"></span>
                    <span class="cycle-text">Auto-Cycle: Off</span>
                </div>
                <button class="cycle-toggle" onclick="autoCycle.toggle()">
                    <span class="cycle-icon">▶</span>
                </button>
            `;
            header.appendChild(cycleControls);
        }
    }

    bindEvents() {
        // Add keyboard shortcut (Space to toggle)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        this.isActive = true;
        this.updateUI();
        this.cycleInterval = setInterval(() => {
            this.nextCycle();
        }, this.cycleDuration);
        
        // Start first cycle immediately
        this.nextCycle();
    }

    stop() {
        this.isActive = false;
        if (this.cycleInterval) {
            clearInterval(this.cycleInterval);
            this.cycleInterval = null;
        }
        this.updateUI();
        this.resetAllSystems();
    }

    nextCycle() {
        if (!this.isActive) return;
        
        const cycle = this.cycles[this.currentCycle];
        this.executeCycle(cycle);
        
        this.currentCycle = (this.currentCycle + 1) % this.cycles.length;
    }

    executeCycle(cycleType) {
        switch (cycleType) {
            case 'quantum_processing':
                this.cycleQuantumProcessing();
                break;
            case 'photon_channels':
                this.cyclePhotonChannels();
                break;
            case 'memory_optimization':
                this.cycleMemoryOptimization();
                break;
            case 'thermal_management':
                this.cycleThermalManagement();
                break;
            case 'aperture_calibration':
                this.cycleApertureCalibration();
                break;
            case 'sprint_execution':
                this.cycleSprintExecution();
                break;
        }
    }

    cycleQuantumProcessing() {
        // Use the actual quantum processor run pattern
        if (typeof quantumProcessor !== 'undefined' && quantumProcessor.runCircuit) {
            quantumProcessor.runCircuit();
        }
        
        // Visual feedback
        this.updateStatus('Quantum Co-processor', 'Running variational algorithms...');
        this.highlightComponent('.quantum-processor');
    }

    cyclePhotonChannels() {
        // Use the actual photon processor run pattern
        if (typeof photonProcessor !== 'undefined' && photonProcessor.startProcessing) {
            photonProcessor.startProcessing();
            // Stop after 8 seconds to match cycle duration
            setTimeout(() => {
                if (photonProcessor.stopProcessing) {
                    photonProcessor.stopProcessing();
                }
            }, 8000);
        }
        
        // Visual feedback
        this.updateStatus('Photonic Linear Unit', 'Processing WDM channels...');
        this.highlightComponent('.photon-unit');
    }

    cycleMemoryOptimization() {
        // Use the actual memory mesh allocation pattern
        if (typeof memoryMesh !== 'undefined' && memoryMesh.allocateOpticalLease) {
            // Allocate some memory leases to demonstrate
            const lease1 = memoryMesh.allocateOpticalLease(64 * 1024 * 1024, 5000); // 64MB for 5s
            setTimeout(() => {
                const lease2 = memoryMesh.allocateOpticalLease(32 * 1024 * 1024, 4000); // 32MB for 4s
            }, 1000);
            setTimeout(() => {
                const lease3 = memoryMesh.allocateOpticalLease(16 * 1024 * 1024, 3000); // 16MB for 3s
            }, 2000);
        }
        
        // Visual feedback
        this.updateStatus('Free-form Memory Mesh', 'Optimizing memory allocation...');
        this.highlightComponent('.memory-mesh');
    }

    cycleThermalManagement() {
        // Use the actual thermal model if available
        if (typeof thermalModel !== 'undefined' && thermalModel.updateThermalState) {
            // Simulate thermal stress test
            thermalModel.updateThermalState(0.8); // High load
            setTimeout(() => {
                thermalModel.updateThermalState(0.3); // Cool down
            }, 4000);
        }
        
        // Visual feedback
        this.updateStatus('Thermal Management', 'Monitoring system temperature...');
        this.highlightComponent('.thermal-model');
    }

    cycleApertureCalibration() {
        // Only animate if auto-cycle is active and user hasn't manually interacted
        if (this.isActive) {
            const sliders = document.querySelectorAll('input[type="range"]');
            sliders.forEach((slider, index) => {
                // Check if slider has been manually modified recently
                const lastManualChange = slider.dataset.lastManualChange;
                const now = Date.now();
                
                if (!lastManualChange || (now - parseInt(lastManualChange)) > 5000) {
                    const originalValue = slider.value;
                    const targetValue = Math.random() * (slider.max - slider.min) + slider.min;
                    
                    setTimeout(() => {
                        this.animateSlider(slider, originalValue, targetValue);
                    }, index * 300);
                }
            });
        }

        this.updateStatus('Skewed Aperture Geometry', 'Calibrating yaw/pitch/shear...');
        this.highlightComponent('.aperture-geometry');
    }

    cycleSprintExecution() {
        // Use the actual orchestrator sprint pattern
        if (typeof hostOrchestrator !== 'undefined' && hostOrchestrator.startSprint) {
            hostOrchestrator.startSprint(8000); // 8 second sprint
        }

        // Visual feedback
        this.updateStatus('Host Orchestrator', 'Executing sprint burst...');
        this.highlightComponent('.host-orchestrator');
    }

    animateSlider(slider, from, to) {
        const duration = 2000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = from + (to - from) * this.easeInOutCubic(progress);
            slider.value = currentValue;
            
            // Trigger change event
            slider.dispatchEvent(new Event('input'));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    updateStatus(component, message) {
        // Update status displays
        const statusElements = document.querySelectorAll('.status, .sprint-status');
        statusElements.forEach(element => {
            element.textContent = message;
        });

        // Add visual feedback
        const componentElement = document.querySelector(`[class*="${component.toLowerCase().replace(/\s+/g, '-')}"]`);
        if (componentElement) {
            componentElement.classList.add('cycle-highlight');
            setTimeout(() => {
                componentElement.classList.remove('cycle-highlight');
            }, 2000);
        }
    }

    highlightComponent(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('cycle-highlight');
            setTimeout(() => {
                element.classList.remove('cycle-highlight');
            }, 2000);
        }
    }

    resetAllSystems() {
        // Stop all running processes
        if (typeof photonProcessor !== 'undefined' && photonProcessor.stopProcessing) {
            photonProcessor.stopProcessing();
        }
        
        if (typeof hostOrchestrator !== 'undefined' && hostOrchestrator.stopSprint) {
            hostOrchestrator.stopSprint();
        }
        
        // Reset all visual states
        document.querySelectorAll('.quantum-active, .channel-active, .memory-active, .thermal-active, .cycle-highlight').forEach(element => {
            element.classList.remove('quantum-active', 'channel-active', 'memory-active', 'thermal-active', 'cycle-highlight');
        });

        // Reset status
        this.updateStatus('System', 'Standby');
    }

    updateUI() {
        const indicator = document.querySelector('.cycle-indicator');
        const text = document.querySelector('.cycle-text');
        const icon = document.querySelector('.cycle-icon');
        
        if (indicator && text && icon) {
            if (this.isActive) {
                indicator.classList.add('active');
                text.textContent = 'Auto-Cycle: On';
                icon.textContent = '⏸';
            } else {
                indicator.classList.remove('active');
                text.textContent = 'Auto-Cycle: Off';
                icon.textContent = '▶';
            }
        }
    }
}

// Initialize auto-cycle system
const autoCycle = new AutoCycle();

// Export for global access
window.autoCycle = autoCycle;
