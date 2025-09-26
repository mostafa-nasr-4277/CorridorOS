// Main Corridor Computer Emulator
class CorridorComputer {
    constructor() {
        this.isOnline = true;
        this.temperature = 23;
        this.power = 45;
        this.uptime = 0;
        this.startTime = Date.now();
        this.updateInterval = null;
        this.systemComponents = {
            quantum: quantumProcessor,
            photon: photonProcessor,
            memory: memoryMesh,
            orchestrator: hostOrchestrator,
            heliopass: heliopassSystem
        };
    }

    // Initialize the complete system
    initialize() {
        this.log("Corridor Computer Emulator v1.0 starting...");
        this.startSystemMonitoring();
        this.initializeGeometryControls();
        this.log("All systems online and ready");
    }

    // Start system monitoring
    startSystemMonitoring() {
        this.updateInterval = setInterval(() => {
            this.updateSystemStatus();
            this.updateUptime();
            this.updateTemperature();
            this.updatePower();
        }, 1000);
    }

    // Update system status
    updateSystemStatus() {
        const statusElement = document.getElementById('system-status');
        if (statusElement) {
            statusElement.textContent = this.isOnline ? 'Online' : 'Offline';
            statusElement.style.color = this.isOnline ? '#91FF79' : '#FF57B4';
        }
    }

    // Update uptime
    updateUptime() {
        this.uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(this.uptime / 3600);
        const minutes = Math.floor((this.uptime % 3600) / 60);
        const seconds = this.uptime % 60;
        
        const uptimeElement = document.getElementById('uptime');
        if (uptimeElement) {
            uptimeElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // Update temperature using unified light-thermal equilibrium model
    updateTemperature() {
        // Get system load for thermal modeling
        const systemLoad = {
            quantum: quantumProcessor.isRunning ? 0.8 : 0.1,
            photon: photonProcessor.isProcessing ? 0.9 : 0.2,
            memory: memoryMesh.usedMemory / memoryMesh.totalMemory
        };
        
        // Get light intensity from HELIOPASS
        const lightIntensity = heliopassSystem.sensors.lunar.value + 
                              heliopassSystem.sensors.zodiacal.value + 
                              heliopassSystem.sensors.airglow.value;
        
        // Calculate thermal equilibrium using research model
        const thermalState = thermalModel.calculateEquilibrium(lightIntensity, systemLoad);
        this.temperature = thermalState.temperature;
        
        const tempElement = document.getElementById('temperature');
        if (tempElement) {
            tempElement.textContent = `${this.temperature.toFixed(1)}°C`;
            
            // Color coding based on thermal efficiency
            const efficiency = thermalModel.getThermalEfficiency();
            if (efficiency > 0.8) {
                tempElement.style.color = '#91FF79'; // Green - optimal
            } else if (efficiency > 0.6) {
                tempElement.style.color = '#FFD200'; // Yellow - warning
            } else {
                tempElement.style.color = '#FF57B4'; // Red - critical
            }
        }
        
        // Update thermal efficiency display
        const efficiencyElement = document.getElementById('thermal-efficiency');
        if (efficiencyElement) {
            const efficiency = thermalModel.getThermalEfficiency();
            efficiencyElement.textContent = `${(efficiency * 100).toFixed(0)}%`;
            efficiencyElement.style.color = efficiency > 0.8 ? '#91FF79' : efficiency > 0.6 ? '#FFD200' : '#FF57B4';
        }
        
        // Update thermal equilibrium display
        const equilibriumElement = document.getElementById('thermal-equilibrium');
        if (equilibriumElement) {
            const isEquilibrium = thermalModel.isInEquilibrium();
            equilibriumElement.textContent = isEquilibrium ? 'Stable' : 'Adjusting';
            equilibriumElement.style.color = isEquilibrium ? '#91FF79' : '#FFD200';
        }
    }

    // Update power consumption
    updatePower() {
        const quantumPower = quantumProcessor.isRunning ? 15 : 5;
        const photonPower = photonProcessor.isProcessing ? 20 : 8;
        const memoryPower = (memoryMesh.usedMemory / memoryMesh.totalMemory) * 10;
        const heliopassPower = 2;
        
        this.power = quantumPower + photonPower + memoryPower + heliopassPower;
        
        const powerElement = document.getElementById('power');
        if (powerElement) {
            powerElement.textContent = `${this.power.toFixed(0)}W`;
            powerElement.style.color = this.power > 60 ? '#FF57B4' : '#91FF79';
        }
    }

    // Initialize geometry controls
    initializeGeometryControls() {
        console.log('Initializing geometry controls...');
        const sliders = [
            { id: 'yaw-slider', valueId: 'yaw-value', min: -180, max: 180 },
            { id: 'pitch-slider', valueId: 'pitch-value', min: -90, max: 90 },
            { id: 'shear-x-slider', valueId: 'shear-x-value', min: -1, max: 1, step: 0.1 },
            { id: 'shear-y-slider', valueId: 'shear-y-value', min: -1, max: 1, step: 0.1 }
        ];

        sliders.forEach(slider => {
            const sliderElement = document.getElementById(slider.id);
            const valueElement = document.getElementById(slider.valueId);
            
            console.log(`Setting up slider: ${slider.id}`, sliderElement, valueElement);
            
            if (sliderElement && valueElement) {
                // Set initial value display
                const initialValue = parseFloat(sliderElement.value);
                valueElement.textContent = slider.step ? initialValue.toFixed(1) : `${initialValue}°`;
                
                // Remove any existing event listeners first
                sliderElement.removeEventListener('input', this.handleSliderInput);
                sliderElement.removeEventListener('change', this.handleSliderChange);
                
                // Create bound event handlers
                this.handleSliderInput = (e) => {
                    const value = parseFloat(e.target.value);
                    valueElement.textContent = slider.step ? value.toFixed(1) : `${value}°`;
                    this.updateGeometry(slider.id, value);
                    console.log(`Slider ${slider.id} changed to:`, value);
                    
                    // Mark as manually changed to prevent auto-cycle override
                    e.target.dataset.lastManualChange = Date.now().toString();
                };
                
                this.handleSliderChange = (e) => {
                    const value = parseFloat(e.target.value);
                    valueElement.textContent = slider.step ? value.toFixed(1) : `${value}°`;
                    this.updateGeometry(slider.id, value);
                    console.log(`Slider ${slider.id} changed to:`, value);
                    
                    // Mark as manually changed to prevent auto-cycle override
                    e.target.dataset.lastManualChange = Date.now().toString();
                };
                
                // Add event listeners
                sliderElement.addEventListener('input', this.handleSliderInput);
                sliderElement.addEventListener('change', this.handleSliderChange);
                sliderElement.addEventListener('click', (e) => {
                    console.log(`Slider ${slider.id} clicked!`);
                });
                
                // Test if slider is working
                console.log(`Slider ${slider.id} setup complete. Value: ${sliderElement.value}`);
                
                // Make sure slider is not disabled
                sliderElement.disabled = false;
                sliderElement.style.pointerEvents = 'auto';
            } else {
                console.error(`Could not find elements for slider: ${slider.id}`);
            }
        });
    }

    // Update geometry parameters
    updateGeometry(parameter, value) {
        switch (parameter) {
            case 'yaw-slider':
                this.log(`Yaw updated: ${value}°`);
                break;
            case 'pitch-slider':
                this.log(`Pitch updated: ${value}°`);
                break;
            case 'shear-x-slider':
                this.log(`Shear X updated: ${value}`);
                break;
            case 'shear-y-slider':
                this.log(`Shear Y updated: ${value}`);
                break;
        }
    }

    // Run system diagnostics
    runDiagnostics() {
        this.log("Running system diagnostics...");
        
        const diagnostics = {
            quantum: quantumProcessor.getCircuitInfo(),
            photon: photonProcessor.getSystemInfo(),
            memory: memoryMesh.getMemoryStats(),
            orchestrator: hostOrchestrator.getStats(),
            heliopass: heliopassSystem.getSensorData()
        };

        this.log("Diagnostics completed");
        return diagnostics;
    }

    // Create system report
    createSystemReport() {
        const report = {
            timestamp: new Date().toISOString(),
            uptime: this.uptime,
            temperature: this.temperature,
            power: this.power,
            diagnostics: this.runDiagnostics()
        };

        this.log("System report created");
        return report;
    }

    // Simulate system stress test
    stressTest() {
        this.log("Starting system stress test...");
        
        // Start all systems
        quantumProcessor.runCircuit();
        photonProcessor.startProcessing();
        memoryMesh.stressTest();
        hostOrchestrator.startSprint(10000);
        
        this.log("Stress test initiated - monitoring system performance");
    }

    // Emergency shutdown
    emergencyShutdown() {
        this.log("EMERGENCY SHUTDOWN INITIATED");
        this.isOnline = false;
        
        // Stop all systems
        quantumProcessor.initialize();
        photonProcessor.stopProcessing();
        hostOrchestrator.endSprint();
        
        this.log("System offline");
    }

    // Log system operations
    log(message) {
        const console = document.getElementById('console-output');
        if (console) {
            const logEntry = document.createElement('div');
            logEntry.className = 'console-line info';
            logEntry.textContent = `[System] ${message}`;
            console.appendChild(logEntry);
            console.scrollTop = console.scrollHeight;
        }
    }

    // Cleanup
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Cleanup all components
        Object.values(this.systemComponents).forEach(component => {
            if (component.destroy) {
                component.destroy();
            }
        });
    }
}

// Global corridor computer instance
const corridorComputer = new CorridorComputer();

// Initialize system on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Corridor Computer...');
    corridorComputer.initialize();
    
    // Add some demo functionality
    setTimeout(() => {
        corridorComputer.log("Demo: Running initial system check");
        corridorComputer.runDiagnostics();
    }, 2000);
});

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Fallback DOM loaded, initializing Corridor Computer...');
        corridorComputer.initialize();
    });
} else {
    console.log('DOM already loaded, initializing Corridor Computer immediately...');
    corridorComputer.initialize();
}

// Global utility functions
function runSystemDiagnostics() {
    corridorComputer.runDiagnostics();
}

function testSliders() {
    console.log('Testing sliders...');
    const sliders = ['yaw-slider', 'pitch-slider', 'shear-x-slider', 'shear-y-slider'];
    sliders.forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            console.log(`${id}:`, slider.value, slider.disabled, slider.style.pointerEvents);
        } else {
            console.error(`Slider ${id} not found!`);
        }
    });
}

// Make test function globally available
window.testSliders = testSliders;

function createSystemReport() {
    const report = corridorComputer.createSystemReport();
    console.log("System Report:", report);
    corridorComputer.log("System report exported to console");
}

function runStressTest() {
    corridorComputer.stressTest();
}

function emergencyShutdown() {
    if (confirm("Are you sure you want to initiate emergency shutdown?")) {
        corridorComputer.emergencyShutdown();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'k':
                e.preventDefault();
                corridorComputer.log("Command+K pressed - Opening command palette");
                break;
            case 's':
                e.preventDefault();
                createSystemReport();
                break;
            case 'd':
                e.preventDefault();
                runSystemDiagnostics();
                break;
        }
    }
    
    // F-key shortcuts
    if (e.key.startsWith('F') && e.key.length <= 3) {
        const fNumber = parseInt(e.key.substring(1));
        if (fNumber >= 1 && fNumber <= 12) {
            corridorComputer.log(`F${fNumber} pressed`);
        }
    }
});
