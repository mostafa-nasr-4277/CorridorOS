// Corridor OS Applications
class CorridorApps {
    constructor() {
        this.apps = new Map();
        this.registerApps();
    }
    
    registerApps() {
        // System Applications
        this.apps.set('settings', {
            name: 'Settings',
            icon: '⚙️',
            category: 'system',
            createWindow: () => this.createSettingsApp()
        });
        
        this.apps.set('terminal', {
            name: 'Terminal',
            icon: '💻',
            category: 'system',
            createWindow: () => this.createTerminalApp()
        });
        
        this.apps.set('files', {
            name: 'Files',
            icon: '📁',
            category: 'system',
            createWindow: () => this.createFilesApp()
        });
        
        // Quantum & Photonic Applications
        this.apps.set('quantum-lab', {
            name: 'Quantum Lab',
            icon: '⚛️',
            category: 'quantum',
            createWindow: () => this.createQuantumLabApp()
        });
        
        this.apps.set('photonic-studio', {
            name: 'Photonic Studio',
            icon: '🌟',
            category: 'photonic',
            createWindow: () => this.createPhotonicStudioApp()
        });
        
        this.apps.set('corridor-computer', {
            name: 'Corridor Computer',
            icon: '🔬',
            category: 'quantum',
            createWindow: () => this.createCorridorComputerApp()
        });
        
        // Productivity Applications
        this.apps.set('text-editor', {
            name: 'Text Editor',
            icon: '📝',
            category: 'productivity',
            createWindow: () => this.createTextEditorApp()
        });
        
        this.apps.set('calculator', {
            name: 'Calculator',
            icon: '🧮',
            category: 'utility',
            createWindow: () => this.createCalculatorApp()
        });
        
        this.apps.set('web-browser', {
            name: 'Web Browser',
            icon: '🌐',
            category: 'internet',
            createWindow: () => this.createWebBrowserApp()
        });
        
        // Media Applications
        this.apps.set('image-viewer', {
            name: 'Image Viewer',
            icon: '🖼️',
            category: 'media',
            createWindow: () => this.createImageViewerApp()
        });
        
        this.apps.set('music-player', {
            name: 'Music Player',
            icon: '🎵',
            category: 'media',
            createWindow: () => this.createMusicPlayerApp()
        });
        
        this.apps.set('video-player', {
            name: 'Video Player',
            icon: '🎬',
            category: 'media',
            createWindow: () => this.createVideoPlayerApp()
        });
        
        // Network & System Tools
        this.apps.set('network-manager', {
            name: 'Network Manager',
            icon: '📶',
            category: 'system',
            createWindow: () => this.createNetworkManagerApp()
        });
        
        this.apps.set('power-manager', {
            name: 'Power Manager',
            icon: '🔋',
            category: 'system',
            createWindow: () => this.createPowerManagerApp()
        });
        
        this.apps.set('system-monitor', {
            name: 'System Monitor',
            icon: '📊',
            category: 'system',
            createWindow: () => this.createSystemMonitorApp()
        });
        
        this.apps.set('help', {
            name: 'Help',
            icon: '❓',
            category: 'system',
            createWindow: () => this.createHelpApp()
        });
        
        this.apps.set('trash', {
            name: 'Trash',
            icon: '🗑️',
            category: 'system',
            createWindow: () => this.createTrashApp()
        });
    }
    
    openApp(appName) {
        const app = this.apps.get(appName);
        if (!app) {
            console.error(`App '${appName}' not found`);
            return;
        }
        
        // Check if app is already open
        const existingWindow = document.getElementById(`window-${appName}`);
        if (existingWindow) {
            this.focusWindow(existingWindow);
            return;
        }
        
        // Create new window
        const windowContent = app.createWindow();
        this.createWindow(appName, app.name, app.icon, windowContent);
        
        // Hide activities overview if open
        if (window.corridorOS) {
            window.corridorOS.hideActivitiesOverview();
        }
    }
    
    createWindow(appId, title, icon, content) {
        if (!window.corridorWindowManager) {
            console.error('Window manager not available');
            return;
        }
        
        window.corridorWindowManager.createWindow(appId, title, icon, content);
    }
    
    focusWindow(windowElement) {
        if (window.corridorWindowManager) {
            window.corridorWindowManager.focusWindow(windowElement);
        }
    }
    
    // Application Implementations
    createSettingsApp() {
        return window.corridorSettings.createSettingsWindow();
    }
    
    createTerminalApp() {
        return `
            <div class="terminal-app">
                <div class="terminal-header">
                    <span class="terminal-title">corridor@quantum-computer:~$</span>
                </div>
                <div class="terminal-content" id="terminal-content">
                    <div class="terminal-line">
                        <span class="terminal-prompt">corridor@quantum-computer:~$ </span>
                        <span class="terminal-text">Welcome to Corridor OS Terminal</span>
                    </div>
                    <div class="terminal-line">
                        <span class="terminal-prompt">corridor@quantum-computer:~$ </span>
                        <span class="terminal-text">Quantum-Photonic Computing Environment</span>
                    </div>
                    <div class="terminal-line">
                        <span class="terminal-prompt">corridor@quantum-computer:~$ </span>
                        <span class="terminal-text">Type 'help' for available commands</span>
                    </div>
                    <div class="terminal-line current-line">
                        <span class="terminal-prompt">corridor@quantum-computer:~$ </span>
                        <input type="text" class="terminal-input" id="terminal-input" autofocus
                               onkeydown="corridorApps.handleTerminalInput(event)">
                        <span class="terminal-cursor">█</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    createFilesApp() {
        return `
            <div class="files-app">
                <div class="files-toolbar">
                    <button class="toolbar-button" onclick="corridorApps.navigateFiles('back')">← Back</button>
                    <button class="toolbar-button" onclick="corridorApps.navigateFiles('forward')">Forward →</button>
                    <button class="toolbar-button" onclick="corridorApps.navigateFiles('up')">↑ Up</button>
                    <div class="location-bar">
                        <span class="location-icon">📁</span>
                        <span class="location-path">/home/corridor</span>
                    </div>
                </div>
                <div class="files-content">
                    <div class="files-sidebar">
                        <div class="sidebar-section">
                            <h4>Quick Access</h4>
                            <div class="sidebar-item" onclick="corridorApps.openFolder('home')">
                                <span class="item-icon">🏠</span>
                                <span class="item-name">Home</span>
                            </div>
                            <div class="sidebar-item" onclick="corridorApps.openFolder('documents')">
                                <span class="item-icon">📄</span>
                                <span class="item-name">Documents</span>
                            </div>
                            <div class="sidebar-item" onclick="corridorApps.openFolder('downloads')">
                                <span class="item-icon">📥</span>
                                <span class="item-name">Downloads</span>
                            </div>
                            <div class="sidebar-item" onclick="corridorApps.openFolder('quantum')">
                                <span class="item-icon">⚛️</span>
                                <span class="item-name">Quantum Data</span>
                            </div>
                            <div class="sidebar-item" onclick="corridorApps.openFolder('photonic')">
                                <span class="item-icon">🌟</span>
                                <span class="item-name">Photonic Data</span>
                            </div>
                        </div>
                    </div>
                    <div class="files-main">
                        <div class="file-grid" id="file-grid">
                            <div class="file-item folder" ondblclick="corridorApps.openFolder('documents')">
                                <span class="file-icon">📁</span>
                                <span class="file-name">Documents</span>
                            </div>
                            <div class="file-item folder" ondblclick="corridorApps.openFolder('downloads')">
                                <span class="file-icon">📁</span>
                                <span class="file-name">Downloads</span>
                            </div>
                            <div class="file-item folder" ondblclick="corridorApps.openFolder('quantum-experiments')">
                                <span class="file-icon">📁</span>
                                <span class="file-name">Quantum Experiments</span>
                            </div>
                            <div class="file-item file" ondblclick="corridorApps.openFile('readme.txt')">
                                <span class="file-icon">📄</span>
                                <span class="file-name">readme.txt</span>
                            </div>
                            <div class="file-item file" ondblclick="corridorApps.openFile('quantum-circuit.qc')">
                                <span class="file-icon">⚛️</span>
                                <span class="file-name">quantum-circuit.qc</span>
                            </div>
                            <div class="file-item file" ondblclick="corridorApps.openFile('photonic-config.json')">
                                <span class="file-icon">🌟</span>
                                <span class="file-name">photonic-config.json</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="files-statusbar">
                    <span>6 items</span>
                    <span>2.3 GB available</span>
                </div>
            </div>
        `;
    }
    
    createQuantumLabApp() {
        return `
            <div class="quantum-lab-app">
                <div class="lab-toolbar">
                    <button class="lab-button" onclick="corridorApps.createQuantumCircuit()">New Circuit</button>
                    <button class="lab-button" onclick="corridorApps.runQuantumSimulation()">Run Simulation</button>
                    <button class="lab-button" onclick="corridorApps.analyzeResults()">Analyze</button>
                </div>
                <div class="lab-content">
                    <div class="circuit-designer">
                        <h3>Quantum Circuit Designer</h3>
                        <div class="qubit-lines">
                            <div class="qubit-line">
                                <span class="qubit-label">|q0⟩</span>
                                <div class="circuit-line">
                                    <div class="gate hadamard" title="Hadamard Gate">H</div>
                                    <div class="gate cnot-control" title="CNOT Control">●</div>
                                    <div class="gate measure" title="Measurement">📊</div>
                                </div>
                            </div>
                            <div class="qubit-line">
                                <span class="qubit-label">|q1⟩</span>
                                <div class="circuit-line">
                                    <div class="gate identity" title="Identity">I</div>
                                    <div class="gate cnot-target" title="CNOT Target">⊕</div>
                                    <div class="gate measure" title="Measurement">📊</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="quantum-results">
                        <h3>Simulation Results</h3>
                        <div class="results-display">
                            <div class="state-vector">
                                <h4>State Vector</h4>
                                <div class="state-item">|00⟩: 0.707</div>
                                <div class="state-item">|01⟩: 0.000</div>
                                <div class="state-item">|10⟩: 0.000</div>
                                <div class="state-item">|11⟩: 0.707</div>
                            </div>
                            <div class="measurement-stats">
                                <h4>Measurement Statistics</h4>
                                <div class="stat-bar">
                                    <span>|00⟩</span>
                                    <div class="bar"><div class="fill" style="width: 50%"></div></div>
                                    <span>50%</span>
                                </div>
                                <div class="stat-bar">
                                    <span>|11⟩</span>
                                    <div class="bar"><div class="fill" style="width: 50%"></div></div>
                                    <span>50%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createPhotonicStudioApp() {
        return `
            <div class="photonic-studio-app">
                <div class="studio-toolbar">
                    <button class="studio-button" onclick="corridorApps.newPhotonicDesign()">New Design</button>
                    <button class="studio-button" onclick="corridorApps.simulateOptics()">Simulate</button>
                    <button class="studio-button" onclick="corridorApps.optimizeWavelength()">Optimize</button>
                </div>
                <div class="studio-content">
                    <div class="optical-designer">
                        <h3>Optical Circuit Designer</h3>
                        <div class="wavelength-channels">
                            <div class="channel-line" style="background: linear-gradient(90deg, #ff0000, #ff4444);">
                                <span class="channel-label">λ1: 1550nm</span>
                                <div class="optical-path">
                                    <div class="optical-component splitter">⚡</div>
                                    <div class="optical-component amplifier">📶</div>
                                    <div class="optical-component modulator">🌊</div>
                                </div>
                            </div>
                            <div class="channel-line" style="background: linear-gradient(90deg, #00ff00, #44ff44);">
                                <span class="channel-label">λ2: 1552nm</span>
                                <div class="optical-path">
                                    <div class="optical-component splitter">⚡</div>
                                    <div class="optical-component amplifier">📶</div>
                                    <div class="optical-component modulator">🌊</div>
                                </div>
                            </div>
                            <div class="channel-line" style="background: linear-gradient(90deg, #0000ff, #4444ff);">
                                <span class="channel-label">λ3: 1554nm</span>
                                <div class="optical-path">
                                    <div class="optical-component splitter">⚡</div>
                                    <div class="optical-component amplifier">📶</div>
                                    <div class="optical-component modulator">🌊</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="photonic-analysis">
                        <h3>Optical Analysis</h3>
                        <div class="analysis-metrics">
                            <div class="metric-card">
                                <h4>Power Efficiency</h4>
                                <div class="metric-value">94.2%</div>
                            </div>
                            <div class="metric-card">
                                <h4>Signal Quality</h4>
                                <div class="metric-value">-2.1 dB</div>
                            </div>
                            <div class="metric-card">
                                <h4>Bandwidth</h4>
                                <div class="metric-value">40 GHz</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createCorridorComputerApp() {
        // Embed the original Corridor Computer interface
        return `
            <div class="corridor-computer-app">
                <iframe src="index.html" style="width: 100%; height: 100%; border: none; border-radius: 8px;">
                </iframe>
            </div>
        `;
    }
    
    createTextEditorApp() {
        return `
            <div class="text-editor-app">
                <div class="editor-toolbar">
                    <button class="editor-button" onclick="corridorApps.newFile()">New</button>
                    <button class="editor-button" onclick="corridorApps.openFile()">Open</button>
                    <button class="editor-button" onclick="corridorApps.saveFile()">Save</button>
                    <div class="editor-separator"></div>
                    <button class="editor-button" onclick="corridorApps.undoEdit()">Undo</button>
                    <button class="editor-button" onclick="corridorApps.redoEdit()">Redo</button>
                </div>
                <div class="editor-content">
                    <div class="editor-sidebar">
                        <div class="file-tree">
                            <div class="tree-item folder expanded">
                                <span class="tree-icon">📁</span>
                                <span class="tree-name">Project</span>
                            </div>
                            <div class="tree-item file selected">
                                <span class="tree-icon">📄</span>
                                <span class="tree-name">quantum-algorithm.py</span>
                            </div>
                            <div class="tree-item file">
                                <span class="tree-icon">📄</span>
                                <span class="tree-name">photonic-config.json</span>
                            </div>
                        </div>
                    </div>
                    <div class="editor-main">
                        <div class="editor-tabs">
                            <div class="editor-tab active">
                                <span>quantum-algorithm.py</span>
                                <button class="tab-close">×</button>
                            </div>
                        </div>
                        <div class="code-editor">
                            <div class="line-numbers">
                                <div>1</div>
                                <div>2</div>
                                <div>3</div>
                                <div>4</div>
                                <div>5</div>
                                <div>6</div>
                                <div>7</div>
                                <div>8</div>
                            </div>
                            <textarea class="code-area" spellcheck="false"># Quantum Algorithm Implementation
import numpy as np
from qiskit import QuantumCircuit, QuantumRegister

def create_bell_state():
    """Create a Bell state using quantum superposition"""
    qc = QuantumCircuit(2)
    qc.h(0)  # Hadamard gate on qubit 0
    qc.cx(0, 1)  # CNOT gate
    return qc</textarea>
                        </div>
                    </div>
                </div>
                <div class="editor-statusbar">
                    <span>Python</span>
                    <span>UTF-8</span>
                    <span>Line 8, Column 12</span>
                </div>
            </div>
        `;
    }
    
    createCalculatorApp() {
        return `
            <div class="calculator-app">
                <div class="calculator-display">
                    <div class="display-result" id="calc-result">0</div>
                </div>
                <div class="calculator-buttons">
                    <button class="calc-btn clear" onclick="corridorApps.calcClear()">C</button>
                    <button class="calc-btn operator" onclick="corridorApps.calcInput('±')">±</button>
                    <button class="calc-btn operator" onclick="corridorApps.calcInput('%')">%</button>
                    <button class="calc-btn operator" onclick="corridorApps.calcInput('÷')">÷</button>
                    
                    <button class="calc-btn number" onclick="corridorApps.calcInput('7')">7</button>
                    <button class="calc-btn number" onclick="corridorApps.calcInput('8')">8</button>
                    <button class="calc-btn number" onclick="corridorApps.calcInput('9')">9</button>
                    <button class="calc-btn operator" onclick="corridorApps.calcInput('×')">×</button>
                    
                    <button class="calc-btn number" onclick="corridorApps.calcInput('4')">4</button>
                    <button class="calc-btn number" onclick="corridorApps.calcInput('5')">5</button>
                    <button class="calc-btn number" onclick="corridorApps.calcInput('6')">6</button>
                    <button class="calc-btn operator" onclick="corridorApps.calcInput('-')">-</button>
                    
                    <button class="calc-btn number" onclick="corridorApps.calcInput('1')">1</button>
                    <button class="calc-btn number" onclick="corridorApps.calcInput('2')">2</button>
                    <button class="calc-btn number" onclick="corridorApps.calcInput('3')">3</button>
                    <button class="calc-btn operator" onclick="corridorApps.calcInput('+')">+</button>
                    
                    <button class="calc-btn number zero" onclick="corridorApps.calcInput('0')">0</button>
                    <button class="calc-btn number" onclick="corridorApps.calcInput('.')">.</button>
                    <button class="calc-btn equals" onclick="corridorApps.calcEquals()">=</button>
                </div>
            </div>
        `;
    }
    
    createWebBrowserApp() {
        return `
            <div class="browser-app">
                <div class="browser-toolbar">
                    <button class="browser-button" onclick="corridorApps.browserBack()">←</button>
                    <button class="browser-button" onclick="corridorApps.browserForward()">→</button>
                    <button class="browser-button" onclick="corridorApps.browserRefresh()">⟳</button>
                    <div class="address-bar">
                        <input type="text" placeholder="Enter URL or search..." value="https://redseaportal.com"
                               onkeydown="corridorApps.handleAddressBar(event)">
                    </div>
                    <button class="browser-button" onclick="corridorApps.browserBookmark()">⭐</button>
                </div>
                <div class="browser-content">
                    <iframe src="https://redseaportal.com" style="width: 100%; height: 100%; border: none;">
                    </iframe>
                </div>
            </div>
        `;
    }
    
    createSystemMonitorApp() {
        return `
            <div class="system-monitor-app">
                <div class="monitor-tabs">
                    <button class="monitor-tab active" onclick="corridorApps.showMonitorTab('processes')">Processes</button>
                    <button class="monitor-tab" onclick="corridorApps.showMonitorTab('performance')">Performance</button>
                    <button class="monitor-tab" onclick="corridorApps.showMonitorTab('quantum')">Quantum</button>
                </div>
                <div class="monitor-content" id="monitor-content">
                    <div class="processes-view">
                        <div class="process-header">
                            <span>Process</span>
                            <span>CPU</span>
                            <span>Memory</span>
                            <span>Quantum</span>
                        </div>
                        <div class="process-list">
                            <div class="process-item">
                                <span>corridor-os</span>
                                <span>12.3%</span>
                                <span>256 MB</span>
                                <span>5 qubits</span>
                            </div>
                            <div class="process-item">
                                <span>quantum-lab</span>
                                <span>8.7%</span>
                                <span>128 MB</span>
                                <span>3 qubits</span>
                            </div>
                            <div class="process-item">
                                <span>photonic-studio</span>
                                <span>15.2%</span>
                                <span>192 MB</span>
                                <span>0 qubits</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createHelpApp() {
        return `
            <div class="help-app">
                <div class="help-sidebar">
                    <div class="help-search">
                        <input type="text" placeholder="Search help...">
                    </div>
                    <div class="help-topics">
                        <div class="help-topic active">Getting Started</div>
                        <div class="help-topic">Quantum Computing</div>
                        <div class="help-topic">Photonic Processing</div>
                        <div class="help-topic">System Settings</div>
                        <div class="help-topic">Keyboard Shortcuts</div>
                        <div class="help-topic">Troubleshooting</div>
                    </div>
                </div>
                <div class="help-content">
                    <h2>Getting Started with Corridor OS</h2>
                    <p>Welcome to Corridor OS, the world's first hybrid quantum-photonic operating system!</p>
                    
                    <h3>Key Features</h3>
                    <ul>
                        <li><strong>Quantum Processing:</strong> Harness the power of quantum computing for complex calculations</li>
                        <li><strong>Photonic Computing:</strong> Ultra-fast optical processing for data-intensive tasks</li>
                        <li><strong>Hybrid Architecture:</strong> Seamlessly combines classical, quantum, and photonic computing</li>
                        <li><strong>Modern Interface:</strong> Ubuntu-inspired design with quantum enhancements</li>
                    </ul>
                    
                    <h3>Getting Around</h3>
                    <p>Use the Activities button or press <kbd>Ctrl+Space</kbd> to open the activities overview.</p>
                    <p>The dock at the bottom provides quick access to your favorite applications.</p>
                    
                    <h3>Keyboard Shortcuts</h3>
                    <ul>
                        <li><kbd>Ctrl+Space</kbd> - Activities overview</li>
                        <li><kbd>Ctrl+T</kbd> - Open terminal</li>
                        <li><kbd>Ctrl+L</kbd> - Lock screen</li>
                        <li><kbd>F1-F12</kbd> - Function key shortcuts</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    createTrashApp() {
        return `
            <div class="trash-app">
                <div class="trash-toolbar">
                    <button class="trash-button" onclick="corridorApps.emptyTrash()">Empty Trash</button>
                    <button class="trash-button" onclick="corridorApps.restoreAll()">Restore All</button>
                </div>
                <div class="trash-content">
                    <div class="trash-empty">
                        <div class="empty-icon">🗑️</div>
                        <h3>Trash is Empty</h3>
                        <p>Items you delete will appear here before being permanently removed.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // App-specific methods
    handleTerminalInput(event) {
        if (event.key === 'Enter') {
            const input = event.target;
            const command = input.value.trim();
            
            if (command) {
                this.processTerminalCommand(command);
            }
            
            input.value = '';
        }
    }
    
    processTerminalCommand(command) {
        const terminal = document.getElementById('terminal-content');
        const currentLine = terminal.querySelector('.current-line');
        
        // Add command to history
        const commandLine = document.createElement('div');
        commandLine.className = 'terminal-line';
        commandLine.innerHTML = `
            <span class="terminal-prompt">corridor@quantum-computer:~$ </span>
            <span class="terminal-text">${command}</span>
        `;
        terminal.insertBefore(commandLine, currentLine);
        
        // Process command
        let output = '';
        switch (command.toLowerCase()) {
            case 'help':
                output = `Available commands:
  help     - Show this help message
  ls       - List directory contents
  pwd      - Print working directory
  quantum  - Show quantum system status
  photonic - Show photonic system status
  clear    - Clear terminal
  date     - Show current date and time
  whoami   - Show current user`;
                break;
            case 'ls':
                output = `Documents/  Downloads/  Quantum-Experiments/  quantum-circuit.qc  photonic-config.json  readme.txt`;
                break;
            case 'pwd':
                output = `/home/corridor`;
                break;
            case 'quantum':
                output = `Quantum System Status:
  Qubits: 5/10 active
  Coherence Time: 100μs
  Error Rate: 0.001%
  Temperature: 15mK`;
                break;
            case 'photonic':
                output = `Photonic System Status:
  Wavelength Channels: 6/16 active
  Optical Power: 10mW
  Signal Quality: -2.1dB
  Fiber Coupling: 94.2%`;
                break;
            case 'clear':
                terminal.innerHTML = `
                    <div class="terminal-line current-line">
                        <span class="terminal-prompt">corridor@quantum-computer:~$ </span>
                        <input type="text" class="terminal-input" id="terminal-input" autofocus
                               onkeydown="corridorApps.handleTerminalInput(event)">
                        <span class="terminal-cursor">█</span>
                    </div>
                `;
                return;
            case 'date':
                output = new Date().toString();
                break;
            case 'whoami':
                output = 'corridor';
                break;
            default:
                output = `Command not found: ${command}. Type 'help' for available commands.`;
        }
        
        // Add output
        if (output) {
            const outputLine = document.createElement('div');
            outputLine.className = 'terminal-line';
            outputLine.innerHTML = `<span class="terminal-text">${output}</span>`;
            terminal.insertBefore(outputLine, currentLine);
        }
        
        // Scroll to bottom
        terminal.scrollTop = terminal.scrollHeight;
    }
    
    // Calculator methods
    calcInput(value) {
        const display = document.getElementById('calc-result');
        if (display.textContent === '0') {
            display.textContent = value;
        } else {
            display.textContent += value;
        }
    }
    
    calcClear() {
        const display = document.getElementById('calc-result');
        display.textContent = '0';
    }
    
    calcEquals() {
        const display = document.getElementById('calc-result');
        try {
            const expression = display.textContent
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-');
            const result = eval(expression);
            display.textContent = result.toString();
        } catch (error) {
            display.textContent = 'Error';
        }
    }
    
    // Placeholder methods for other app interactions
    navigateFiles(direction) {
        console.log(`Navigate files: ${direction}`);
    }
    
    openFolder(folder) {
        console.log(`Open folder: ${folder}`);
    }
    
    openFile(file) {
        console.log(`Open file: ${file}`);
    }
    
    createQuantumCircuit() {
        console.log('Create quantum circuit');
    }
    
    runQuantumSimulation() {
        console.log('Run quantum simulation');
    }
    
    analyzeResults() {
        console.log('Analyze results');
    }
    
    newPhotonicDesign() {
        console.log('New photonic design');
    }
    
    simulateOptics() {
        console.log('Simulate optics');
    }
    
    optimizeWavelength() {
        console.log('Optimize wavelength');
    }
}

// Create global instance
window.corridorApps = new CorridorApps();
