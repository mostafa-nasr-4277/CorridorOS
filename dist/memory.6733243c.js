// Free-form Memory Mesh Emulator
class MemoryMesh {
    constructor() {
        this.totalMemory = 1024 * 1024 * 1024; // 1GB total
        this.usedMemory = 0;
        this.opticalLeases = new Map();
        this.quantumLeases = new Map();
        this.buffers = new Map();
        this.memoryRings = {
            outer: { capacity: 0.6, used: 0 },
            middle: { capacity: 0.3, used: 0 },
            inner: { capacity: 0.1, used: 0 }
        };
        this.updateInterval = null;
    }

    // Initialize memory mesh
    initialize() {
        this.usedMemory = 0;
        this.opticalLeases.clear();
        this.quantumLeases.clear();
        this.buffers.clear();
        this.resetMemoryRings();
        this.startMemoryMonitoring();
        this.log("Memory mesh initialized");
    }

    // Allocate optical memory lease
    allocateOpticalLease(size, duration = 5000) {
        const leaseId = this.generateLeaseId();
        const lease = {
            id: leaseId,
            type: 'optical',
            size: size,
            duration: duration,
            startTime: Date.now(),
            endTime: Date.now() + duration,
            status: 'active'
        };

        if (this.canAllocate(size)) {
            this.opticalLeases.set(leaseId, lease);
            this.usedMemory += size;
            this.updateMemoryRings();
            this.log(`Allocated optical lease: ${this.formatBytes(size)} for ${duration}ms`);
            return leaseId;
        } else {
            this.log(`Failed to allocate optical lease: insufficient memory`);
            return null;
        }
    }

    // Allocate quantum memory lease
    allocateQuantumLease(size, duration = 3000) {
        const leaseId = this.generateLeaseId();
        const lease = {
            id: leaseId,
            type: 'quantum',
            size: size,
            duration: duration,
            startTime: Date.now(),
            endTime: Date.now() + duration,
            status: 'active'
        };

        if (this.canAllocate(size)) {
            this.quantumLeases.set(leaseId, lease);
            this.usedMemory += size;
            this.updateMemoryRings();
            this.log(`Allocated quantum lease: ${this.formatBytes(size)} for ${duration}ms`);
            return leaseId;
        } else {
            this.log(`Failed to allocate quantum lease: insufficient memory`);
            return null;
        }
    }

    // Create single-consume buffer
    createBuffer(size, type = 'optical') {
        const bufferId = this.generateBufferId();
        const buffer = {
            id: bufferId,
            type: type,
            size: size,
            data: new Array(size).fill(0),
            consumed: false,
            created: Date.now()
        };

        if (this.canAllocate(size)) {
            this.buffers.set(bufferId, buffer);
            this.usedMemory += size;
            this.updateMemoryRings();
            this.log(`Created ${type} buffer: ${this.formatBytes(size)}`);
            return bufferId;
        } else {
            this.log(`Failed to create buffer: insufficient memory`);
            return null;
        }
    }

    // Consume buffer (single-use)
    consumeBuffer(bufferId) {
        const buffer = this.buffers.get(bufferId);
        if (!buffer) {
            this.log(`Buffer ${bufferId} not found`);
            return null;
        }

        if (buffer.consumed) {
            this.log(`Buffer ${bufferId} already consumed`);
            return null;
        }

        buffer.consumed = true;
        this.usedMemory -= buffer.size;
        this.updateMemoryRings();
        this.log(`Consumed buffer: ${bufferId}`);
        
        // Remove consumed buffer after a delay
        setTimeout(() => {
            this.buffers.delete(bufferId);
        }, 1000);

        return buffer.data;
    }

    // Check if memory can be allocated
    canAllocate(size) {
        return (this.usedMemory + size) <= this.totalMemory;
    }

    // Update memory rings based on usage
    updateMemoryRings() {
        const usagePercent = this.usedMemory / this.totalMemory;
        
        // Distribute usage across rings
        this.memoryRings.outer.used = Math.min(usagePercent * 0.6, 0.6);
        this.memoryRings.middle.used = Math.min(Math.max(usagePercent - 0.6, 0) * 0.3, 0.3);
        this.memoryRings.inner.used = Math.min(Math.max(usagePercent - 0.9, 0) * 0.1, 0.1);

        this.updateMemoryDisplay();
    }

    // Reset memory rings
    resetMemoryRings() {
        this.memoryRings.outer.used = 0;
        this.memoryRings.middle.used = 0;
        this.memoryRings.inner.used = 0;
        this.updateMemoryDisplay();
    }

    // Update memory display
    updateMemoryDisplay() {
        const usagePercent = (this.usedMemory / this.totalMemory) * 100;
        const usageElement = document.getElementById('memory-usage');
        const percentElement = document.getElementById('memory-percent');
        
        if (usageElement) {
            usageElement.style.width = `${usagePercent}%`;
        }
        
        if (percentElement) {
            percentElement.textContent = `${usagePercent.toFixed(1)}%`;
        }

        // Update ring animations
        this.updateRingAnimations();
    }

    // Update ring animations
    updateRingAnimations() {
        const rings = document.querySelectorAll('.ring');
        rings.forEach((ring, index) => {
            const ringData = Object.values(this.memoryRings)[index];
            const intensity = ringData.used / ringData.capacity;
            
            if (intensity > 0.8) {
                ring.style.animationDuration = '1s';
            } else if (intensity > 0.5) {
                ring.style.animationDuration = '2s';
            } else {
                ring.style.animationDuration = '3s';
            }
        });
    }

    // Start memory monitoring
    startMemoryMonitoring() {
        this.updateInterval = setInterval(() => {
            this.cleanupExpiredLeases();
            this.updateMemoryRings();
        }, 1000);
    }

    // Cleanup expired leases
    cleanupExpiredLeases() {
        const now = Date.now();
        
        // Cleanup optical leases
        for (const [id, lease] of this.opticalLeases) {
            if (now > lease.endTime) {
                this.usedMemory -= lease.size;
                this.opticalLeases.delete(id);
                this.log(`Expired optical lease: ${id}`);
            }
        }

        // Cleanup quantum leases
        for (const [id, lease] of this.quantumLeases) {
            if (now > lease.endTime) {
                this.usedMemory -= lease.size;
                this.quantumLeases.delete(id);
                this.log(`Expired quantum lease: ${id}`);
            }
        }
    }

    // Generate unique lease ID
    generateLeaseId() {
        return 'lease_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Generate unique buffer ID
    generateBufferId() {
        return 'buffer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Format bytes for display
    formatBytes(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Log memory operations
    log(message) {
        const console = document.getElementById('console-output');
        if (console) {
            const logEntry = document.createElement('div');
            logEntry.className = 'console-line success';
            logEntry.textContent = `[Memory] ${message}`;
            console.appendChild(logEntry);
            console.scrollTop = console.scrollHeight;
        }
    }

    // Get memory statistics
    getMemoryStats() {
        return {
            totalMemory: this.totalMemory,
            usedMemory: this.usedMemory,
            freeMemory: this.totalMemory - this.usedMemory,
            usagePercent: (this.usedMemory / this.totalMemory) * 100,
            opticalLeases: this.opticalLeases.size,
            quantumLeases: this.quantumLeases.size,
            buffers: this.buffers.size,
            memoryRings: { ...this.memoryRings }
        };
    }

    // Simulate memory stress test
    stressTest() {
        this.log("Starting memory stress test...");
        
        // Allocate multiple leases
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.allocateOpticalLease(1024 * 1024 * 10); // 10MB
            }, i * 100);
        }
        
        // Create buffers
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createBuffer(1024 * 1024 * 5); // 5MB
            }, i * 200);
        }
    }
}

// Global memory mesh instance
const memoryMesh = new MemoryMesh();

// Initialize memory mesh on page load
document.addEventListener('DOMContentLoaded', function() {
    memoryMesh.initialize();
});
