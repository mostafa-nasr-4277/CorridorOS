// Photon Linear Unit Emulator
class PhotonProcessor {
    constructor() {
        this.channels = 6;
        this.isProcessing = false;
        this.processingInterval = null;
        this.matrixSize = 256;
        this.wdmChannels = 8;
        this.currentTask = null;
        this.processingQueue = [];
        this.fftBuffer = new Array(this.matrixSize).fill(0).map(() => new Array(this.matrixSize).fill(0));
    }

    // Initialize photon processing system
    initialize() {
        this.isProcessing = false;
        this.processingQueue = [];
        this.updateStatus('Idle');
        this.log("Photon Linear Unit initialized");
    }

    // Start photon processing
    startProcessing() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.updateStatus('Processing');
        this.activateChannels();
        
        // Simulate continuous processing
        this.processingInterval = setInterval(() => {
            this.processPhotonData();
        }, 100);
        
        this.log("Photon processing started");
    }

    // Stop photon processing
    stopProcessing() {
        this.isProcessing = false;
        this.updateStatus('Idle');
        this.deactivateChannels();
        
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        
        this.log("Photon processing stopped");
    }

    // Process photon data through matrix operations
    processPhotonData() {
        if (!this.isProcessing) return;

        // Simulate matrix multiplication and FFT operations
        this.performMatrixOperations();
        this.performFFT();
        this.processWDMChannels();
        
        // Update processing statistics
        this.updateProcessingStats();
    }

    // Perform matrix operations
    performMatrixOperations() {
        // Simulate matrix multiplication for photonic processing
        const matrixA = this.generateRandomMatrix();
        const matrixB = this.generateRandomMatrix();
        const result = this.multiplyMatrices(matrixA, matrixB);
        
        // Store result in FFT buffer
        this.fftBuffer = result;
    }

    // Perform FFT operations
    performFFT() {
        // Simulate FFT processing on the matrix
        for (let i = 0; i < this.matrixSize; i++) {
            for (let j = 0; j < this.matrixSize; j++) {
                // Simulate FFT computation
                const real = Math.cos(2 * Math.PI * i * j / this.matrixSize);
                const imag = Math.sin(2 * Math.PI * i * j / this.matrixSize);
                this.fftBuffer[i][j] = Math.sqrt(real * real + imag * imag);
            }
        }
    }

    // Process WDM channels
    processWDMChannels() {
        for (let channel = 0; channel < this.wdmChannels; channel++) {
            const wavelength = 1550 + (channel * 0.8); // nm
            const power = this.calculateChannelPower(channel);
            this.updateChannelData(channel, wavelength, power);
        }
    }

    // Calculate channel power
    calculateChannelPower(channel) {
        // Simulate power calculation based on processing load
        const basePower = 0.5;
        const processingLoad = this.getProcessingLoad();
        return basePower + (processingLoad * 0.3) + (Math.random() * 0.2);
    }

    // Get current processing load
    getProcessingLoad() {
        return this.processingQueue.length / 10; // Normalize to 0-1
    }

    // Update channel data
    updateChannelData(channel, wavelength, power) {
        // This would update the actual channel display
        this.log(`Channel ${channel}: λ=${wavelength.toFixed(1)}nm, P=${power.toFixed(3)}W`);
    }

    // Generate random matrix for processing
    generateRandomMatrix() {
        return new Array(this.matrixSize).fill(0).map(() => 
            new Array(this.matrixSize).fill(0).map(() => Math.random() * 2 - 1)
        );
    }

    // Matrix multiplication
    multiplyMatrices(a, b) {
        const result = new Array(this.matrixSize).fill(0).map(() => 
            new Array(this.matrixSize).fill(0)
        );
        
        for (let i = 0; i < this.matrixSize; i++) {
            for (let j = 0; j < this.matrixSize; j++) {
                for (let k = 0; k < this.matrixSize; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        
        return result;
    }

    // Activate photon channels
    activateChannels() {
        for (let i = 0; i < this.channels; i++) {
            const channelElement = document.getElementById(`channel-${i}`);
            if (channelElement) {
                channelElement.classList.add('active');
            }
        }
    }

    // Deactivate photon channels
    deactivateChannels() {
        for (let i = 0; i < this.channels; i++) {
            const channelElement = document.getElementById(`channel-${i}`);
            if (channelElement) {
                channelElement.classList.remove('active');
            }
        }
    }

    // Update processing status
    updateStatus(status) {
        const statusElement = document.getElementById('photon-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    // Update processing statistics
    updateProcessingStats() {
        const processingLoad = this.getProcessingLoad();
        const throughput = this.calculateThroughput();
        
        this.log(`Processing load: ${(processingLoad * 100).toFixed(1)}%, Throughput: ${throughput.toFixed(2)} GOps/s`);
    }

    // Calculate processing throughput
    calculateThroughput() {
        // Simulate GOps/s calculation
        const baseThroughput = 100; // Base GOps/s
        const loadFactor = this.getProcessingLoad();
        return baseThroughput * (1 + loadFactor);
    }

    // Add processing task to queue
    addTask(task) {
        this.processingQueue.push({
            id: Date.now(),
            task: task,
            priority: task.priority || 1,
            timestamp: Date.now()
        });
        
        this.log(`Added task: ${task.name}`);
    }

    // Process next task in queue
    processNextTask() {
        if (this.processingQueue.length === 0) return;
        
        // Sort by priority
        this.processingQueue.sort((a, b) => b.priority - a.priority);
        const task = this.processingQueue.shift();
        
        this.currentTask = task;
        this.log(`Processing task: ${task.task.name}`);
        
        // Simulate task processing
        setTimeout(() => {
            this.currentTask = null;
            this.log(`Completed task: ${task.task.name}`);
        }, task.task.duration || 1000);
    }

    // Log photon operations
    log(message) {
        const console = document.getElementById('console-output');
        if (console) {
            const logEntry = document.createElement('div');
            logEntry.className = 'console-line info';
            logEntry.textContent = `[Photon] ${message}`;
            console.appendChild(logEntry);
            console.scrollTop = console.scrollHeight;
        }
    }

    // Get system information
    getSystemInfo() {
        return {
            channels: this.channels,
            isProcessing: this.isProcessing,
            processingQueue: this.processingQueue.length,
            currentTask: this.currentTask,
            matrixSize: this.matrixSize,
            wdmChannels: this.wdmChannels
        };
    }
}

// Global photon processor instance
const photonProcessor = new PhotonProcessor();

// Global functions for UI interaction
function startPhotonProcessing() {
    photonProcessor.startProcessing();
}

function stopPhotonProcessing() {
    photonProcessor.stopProcessing();
}

// Initialize photon processor on page load
document.addEventListener('DOMContentLoaded', function() {
    photonProcessor.initialize();
});
