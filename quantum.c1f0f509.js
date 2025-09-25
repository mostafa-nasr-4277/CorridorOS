// Quantum Co-processor Emulator
class QuantumProcessor {
    constructor() {
        this.qubits = 5;
        this.state = new Array(this.qubits).fill(0); // |00000⟩
        this.entangledPairs = new Set();
        this.superpositionStates = new Set();
        this.circuit = [];
        this.isRunning = false;
    }

    // Initialize quantum state
    initialize() {
        this.state = new Array(this.qubits).fill(0);
        this.entangledPairs.clear();
        this.superpositionStates.clear();
        this.circuit = [];
        this.updateDisplay();
    }

    // Apply Hadamard gate to create superposition
    hadamard(qubitIndex) {
        if (qubitIndex >= 0 && qubitIndex < this.qubits) {
            this.superpositionStates.add(qubitIndex);
            this.circuit.push({ gate: 'H', qubit: qubitIndex, time: Date.now() });
            this.updateDisplay();
            this.log(`Applied Hadamard gate to q${qubitIndex}`);
        }
    }

    // Apply CNOT gate for entanglement
    cnot(controlQubit, targetQubit) {
        if (controlQubit !== targetQubit && 
            controlQubit >= 0 && controlQubit < this.qubits &&
            targetQubit >= 0 && targetQubit < this.qubits) {
            
            this.entangledPairs.add(`${controlQubit}-${targetQubit}`);
            this.circuit.push({ 
                gate: 'CNOT', 
                control: controlQubit, 
                target: targetQubit, 
                time: Date.now() 
            });
            this.updateDisplay();
            this.log(`Applied CNOT gate: q${controlQubit} -> q${targetQubit}`);
        }
    }

    // Apply rotation gate
    rotate(qubitIndex, angle) {
        if (qubitIndex >= 0 && qubitIndex < this.qubits) {
            this.circuit.push({ 
                gate: 'R', 
                qubit: qubitIndex, 
                angle: angle, 
                time: Date.now() 
            });
            this.log(`Applied rotation gate to q${qubitIndex}: ${angle}°`);
        }
    }

    // Measure quantum state
    measure(qubitIndex) {
        if (qubitIndex >= 0 && qubitIndex < this.qubits) {
            // Simulate quantum measurement with some randomness
            const isSuperposition = this.superpositionStates.has(qubitIndex);
            const result = isSuperposition ? (Math.random() < 0.5 ? 0 : 1) : this.state[qubitIndex];
            
            this.state[qubitIndex] = result;
            this.superpositionStates.delete(qubitIndex);
            this.updateDisplay();
            this.log(`Measured q${qubitIndex}: ${result}`);
            return result;
        }
        return null;
    }

    // Run a complete quantum circuit
    runCircuit() {
        this.isRunning = true;
        this.log("Starting quantum circuit execution...");
        
        // Example circuit: Create Bell state
        this.hadamard(0);
        setTimeout(() => this.cnot(0, 1), 500);
        setTimeout(() => this.hadamard(2), 1000);
        setTimeout(() => this.rotate(3, 45), 1500);
        setTimeout(() => this.measure(0), 2000);
        setTimeout(() => this.measure(1), 2500);
        setTimeout(() => {
            this.isRunning = false;
            this.log("Quantum circuit execution completed");
        }, 3000);
    }

    // Update visual display
    updateDisplay() {
        for (let i = 0; i < this.qubits; i++) {
            const qubitElement = document.getElementById(`q${i}`);
            if (qubitElement) {
                qubitElement.className = 'qubit';
                
                if (this.superpositionStates.has(i)) {
                    qubitElement.classList.add('superposition');
                }
                
                if (this.entangledPairs.has(`${i}-${(i+1)%this.qubits}`) || 
                    this.entangledPairs.has(`${(i-1+this.qubits)%this.qubits}-${i}`)) {
                    qubitElement.classList.add('entangled');
                }
            }
        }
        
        // Update quantum state display
        const stateElement = document.getElementById('quantum-state');
        if (stateElement) {
            const stateString = '|' + this.state.join('') + '⟩';
            stateElement.textContent = stateString;
        }
    }

    // Log quantum operations
    log(message) {
        const console = document.getElementById('console-output');
        if (console) {
            const logEntry = document.createElement('div');
            logEntry.className = 'console-line info';
            logEntry.textContent = `[Quantum] ${message}`;
            console.appendChild(logEntry);
            console.scrollTop = console.scrollHeight;
        }
    }

    // Get circuit information
    getCircuitInfo() {
        return {
            qubits: this.qubits,
            state: [...this.state],
            circuit: [...this.circuit],
            entangledPairs: [...this.entangledPairs],
            superpositionStates: [...this.superpositionStates]
        };
    }
}

// Global quantum processor instance
const quantumProcessor = new QuantumProcessor();

// Global functions for UI interaction
function runQuantumCircuit() {
    quantumProcessor.runCircuit();
}

function resetQuantumState() {
    quantumProcessor.initialize();
}

// Initialize quantum processor on page load
document.addEventListener('DOMContentLoaded', function() {
    quantumProcessor.initialize();
});
