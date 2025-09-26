// HELIOPASS Environmental Sensing System
class HeliopassSystem {
    constructor() {
        this.sensors = {
            lunar: { value: 0, unit: 'lux', status: 'active' },
            zodiacal: { value: 0, unit: 'mag/arcsec²', status: 'active' },
            airglow: { value: 0, unit: 'Rayleigh', status: 'active' },
            galactic: { value: 0, unit: 'mag/arcsec²', status: 'active' },
            skyglow: { value: 0, unit: 'mag/arcsec²', status: 'active' }
        };
        this.backgroundOffset = 0;
        this.calibrationData = new Map();
        this.updateInterval = null;
        this.isCalibrated = false;
    }

    // Initialize HELIOPASS system
    initialize() {
        this.startSensorMonitoring();
        this.performCalibration();
        this.log("HELIOPASS system initialized");
    }

    // Start sensor monitoring
    startSensorMonitoring() {
        this.updateInterval = setInterval(() => {
            this.updateSensorReadings();
            this.calculateBackgroundOffset();
        }, 1000);
    }

    // Update sensor readings
    updateSensorReadings() {
        // Simulate realistic environmental sensor readings
        this.sensors.lunar.value = this.simulateLunarBrightness();
        this.sensors.zodiacal.value = this.simulateZodiacalLight();
        this.sensors.airglow.value = this.simulateAirglow();
        this.sensors.galactic.value = this.simulateGalacticLight();
        this.sensors.skyglow.value = this.simulateSkyglow();

        this.logSensorReadings();
    }

    // Simulate lunar brightness
    simulateLunarBrightness() {
        // Simulate lunar phase effect (0-1)
        const lunarPhase = this.getLunarPhase();
        const baseBrightness = 0.1; // Base sky brightness
        const lunarContribution = lunarPhase * 0.3; // Max 30% increase
        return baseBrightness + lunarContribution + (Math.random() * 0.05);
    }

    // Simulate zodiacal light
    simulateZodiacalLight() {
        // Zodiacal light varies with solar elongation
        const solarElongation = this.getSolarElongation();
        const baseZodiacal = 0.2; // Base zodiacal light
        const elongationFactor = Math.sin(solarElongation * Math.PI / 180);
        return baseZodiacal + (elongationFactor * 0.1) + (Math.random() * 0.02);
    }

    // Simulate airglow
    simulateAirglow() {
        // Airglow varies with time of day and season
        const timeOfDay = this.getTimeOfDay();
        const seasonalFactor = this.getSeasonalFactor();
        const baseAirglow = 0.15;
        const timeFactor = Math.sin(timeOfDay * Math.PI / 12) * 0.1;
        return baseAirglow + timeFactor + (seasonalFactor * 0.05) + (Math.random() * 0.03);
    }

    // Simulate galactic light
    simulateGalacticLight() {
        // Galactic light varies with galactic latitude
        const galacticLatitude = this.getGalacticLatitude();
        const baseGalactic = 0.1;
        const latitudeFactor = Math.cos(galacticLatitude * Math.PI / 180) * 0.08;
        return baseGalactic + latitudeFactor + (Math.random() * 0.02);
    }

    // Simulate skyglow
    simulateSkyglow() {
        // Skyglow from light pollution
        const lightPollution = this.getLightPollutionLevel();
        const baseSkyglow = 0.05;
        return baseSkyglow + (lightPollution * 0.2) + (Math.random() * 0.01);
    }

    // Calculate background offset
    calculateBackgroundOffset() {
        const readings = Object.values(this.sensors);
        const totalContribution = readings.reduce((sum, sensor) => sum + sensor.value, 0);
        
        // Apply calibration if available
        if (this.isCalibrated) {
            this.backgroundOffset = this.applyCalibration(totalContribution);
        } else {
            this.backgroundOffset = totalContribution;
        }

        this.updateBackgroundOffsetDisplay();
    }

    // Apply calibration
    applyCalibration(rawValue) {
        const calibrationFactor = this.calibrationData.get('background_offset') || 1.0;
        return rawValue * calibrationFactor;
    }

    // Perform system calibration
    performCalibration() {
        this.log("Starting HELIOPASS calibration...");
        
        // Simulate calibration process
        setTimeout(() => {
            this.calibrationData.set('background_offset', 0.95);
            this.calibrationData.set('lunar_correction', 1.02);
            this.calibrationData.set('zodiacal_correction', 0.98);
            this.calibrationData.set('airglow_correction', 1.01);
            this.calibrationData.set('galactic_correction', 0.99);
            this.calibrationData.set('skyglow_correction', 1.03);
            
            this.isCalibrated = true;
            this.log("HELIOPASS calibration completed");
        }, 3000);
    }

    // Get lunar phase (0-1)
    getLunarPhase() {
        const now = new Date();
        const lunarCycle = 29.53; // days
        const daysSinceNewMoon = (now.getTime() / (1000 * 60 * 60 * 24)) % lunarCycle;
        return Math.sin(daysSinceNewMoon * 2 * Math.PI / lunarCycle) * 0.5 + 0.5;
    }

    // Get solar elongation (degrees)
    getSolarElongation() {
        const now = new Date();
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        return (dayOfYear / 365) * 360;
    }

    // Get time of day (0-24)
    getTimeOfDay() {
        const now = new Date();
        return now.getHours() + now.getMinutes() / 60;
    }

    // Get seasonal factor
    getSeasonalFactor() {
        const now = new Date();
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        return Math.sin(dayOfYear * 2 * Math.PI / 365);
    }

    // Get galactic latitude
    getGalacticLatitude() {
        // Simulate galactic latitude variation
        return Math.random() * 180 - 90;
    }

    // Get light pollution level
    getLightPollutionLevel() {
        // Simulate light pollution (0-1)
        return Math.random() * 0.3;
    }

    // Update background offset display
    updateBackgroundOffsetDisplay() {
        const offsetElement = document.querySelector('.heliopass-banner span');
        if (offsetElement) {
            const offsetText = `HELIOPASS: lunar • zodiacal • airglow • galactic • skyglow → background offset: ${this.backgroundOffset.toFixed(3)}`;
            offsetElement.textContent = offsetText;
        }
    }

    // Log sensor readings
    logSensorReadings() {
        if (Math.random() < 0.1) { // Log 10% of readings
            this.log(`Lunar: ${this.sensors.lunar.value.toFixed(3)} ${this.sensors.lunar.unit}`);
            this.log(`Zodiacal: ${this.sensors.zodiacal.value.toFixed(3)} ${this.sensors.zodiacal.unit}`);
            this.log(`Airglow: ${this.sensors.airglow.value.toFixed(3)} ${this.sensors.airglow.unit}`);
            this.log(`Galactic: ${this.sensors.galactic.value.toFixed(3)} ${this.sensors.galactic.unit}`);
            this.log(`Skyglow: ${this.sensors.skyglow.value.toFixed(3)} ${this.sensors.skyglow.unit}`);
        }
    }

    // Get sensor data
    getSensorData() {
        return {
            sensors: { ...this.sensors },
            backgroundOffset: this.backgroundOffset,
            isCalibrated: this.isCalibrated,
            calibrationData: Object.fromEntries(this.calibrationData)
        };
    }

    // Log HELIOPASS operations
    log(message) {
        const console = document.getElementById('console-output');
        if (console) {
            const logEntry = document.createElement('div');
            logEntry.className = 'console-line success';
            logEntry.textContent = `[HELIOPASS] ${message}`;
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
    }
}

// Global HELIOPASS instance
const heliopassSystem = new HeliopassSystem();

// Initialize HELIOPASS on page load
document.addEventListener('DOMContentLoaded', function() {
    heliopassSystem.initialize();
});
