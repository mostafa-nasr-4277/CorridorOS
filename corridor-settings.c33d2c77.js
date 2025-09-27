// Corridor OS Settings - Ubuntu-inspired Settings Panel
class CorridorSettings {
    constructor() {
        this.settings = {
            // System
            system: {
                computerName: 'Corridor-Computer',
                aboutSystem: true,
                softwareUpdates: true,
                recovery: true
            },
            
            // Appearance
            appearance: {
                theme: 'dark',
                wallpaper: 'quantum-gradient',
                iconTheme: 'corridor-icons',
                windowTheme: 'corridor-dark',
                fontSize: 'medium',
                animations: true,
                transparency: true
            },
            
            // Quantum & Photonic
            quantum: {
                quantumProcessing: true,
                qubitCount: 5,
                coherenceTime: 100,
                errorCorrection: true,
                quantumTeleportation: false,
                quantumCryptography: true
            },
            
            photonic: {
                photonicProcessing: true,
                wavelengthChannels: 6,
                opticalAmplification: true,
                wdmMultiplexing: true,
                fiberCoupling: 'auto',
                laserCalibration: 'optimal'
            },
            
            // Network & Connectivity
            network: {
                wifi: {
                    enabled: true,
                    ssid: 'Corridor-Network',
                    security: 'WPA3',
                    autoConnect: true
                },
                ethernet: {
                    enabled: true,
                    speed: '1000Mbps',
                    duplex: 'full'
                },
                quantumNetwork: {
                    enabled: false,
                    entanglementDistribution: false,
                    quantumInternet: false
                }
            },
            
            // Privacy & Security
            privacy: {
                quantumEncryption: true,
                biometricAuth: false,
                automaticLock: true,
                lockDelay: 300,
                fileVault: true,
                firewallEnabled: true,
                locationServices: false
            },
            
            // Power & Thermal
            power: {
                powerMode: 'balanced',
                quantumCooling: true,
                thermalThrottling: true,
                sleepMode: 'hybrid',
                wakeOnQuantum: false,
                powerSaving: {
                    dimDisplay: 120,
                    sleepDisplay: 600,
                    sleepComputer: 1800
                }
            },
            
            // Audio & Video
            multimedia: {
                audio: {
                    outputDevice: 'Quantum Audio Interface',
                    inputDevice: 'Photonic Microphone',
                    volume: 75,
                    balance: 0,
                    enhancement: true
                },
                video: {
                    resolution: '2560x1600',
                    refreshRate: 120,
                    colorProfile: 'Quantum Display P3',
                    brightness: 80,
                    contrast: 100
                }
            },
            
            // Accessibility
            accessibility: {
                highContrast: false,
                largeText: false,
                screenReader: false,
                magnifier: false,
                stickyKeys: false,
                slowKeys: false,
                bounceKeys: false,
                mouseKeys: false
            },
            
            // Applications
            applications: {
                defaultBrowser: 'Quantum Browser',
                defaultTextEditor: 'Corridor Text',
                defaultFileManager: 'Corridor Files',
                startupApps: ['corridor-computer', 'quantum-lab'],
                autostart: true
            }
        };
        // Keep a deep copy for reset-to-defaults
        this.defaults = JSON.parse(JSON.stringify(this.settings));
        
        this.currentCategory = 'system';
        this.searchQuery = '';
        try {
            this.loadSettings();
            this.applySettingChange('appearance.theme', this.settings.appearance.theme);
            this.applySettingChange('appearance.animations', this.settings.appearance.animations);
            this.applySettingChange('appearance.fontSize', this.settings.appearance.fontSize);
        } catch (_) {}
    }
    
    createSettingsWindow() {
        const windowContent = `
            <div class="settings-container">
                <div class="settings-sidebar">
                    <div class="settings-search">
                        <input type="text" placeholder="Search settings..." id="settings-search" 
                               oninput="corridorSettings.searchSettings(this.value)">
                    </div>
                    <div class="settings-categories" id="settings-categories">
                        ${this.renderCategories()}
                    </div>
                </div>
                <div class="settings-content">
                    <div class="settings-header">
                        <div class="settings-header-left">
                            <h2 id="settings-title">System</h2>
                            <p id="settings-subtitle">System information and updates</p>
                        </div>
                        <div class="settings-actions">
                            <button class="settings-button" onclick="corridorSettings.resetToDefaults()" title="Reset to defaults">Reset</button>
                            <button class="settings-button primary" onclick="corridorSettings.applyChanges()" title="Apply changes">Apply</button>
                        </div>
                    </div>
                    <div class="settings-panel" id="settings-panel">
                        ${this.renderSystemSettings()}
                    </div>
                </div>
            </div>
        `;
        
        return windowContent;
    }
    
    renderCategories() {
        const categories = [
            { id: 'system', name: 'System', icon: '🖥️', description: 'System information and updates' },
            { id: 'appearance', name: 'Appearance', icon: '🎨', description: 'Themes, wallpapers, and visual settings' },
            { id: 'quantum', name: 'Quantum', icon: '⚛️', description: 'Quantum processing and computing settings' },
            { id: 'photonic', name: 'Photonic', icon: '🌟', description: 'Optical processing and photonic settings' },
            { id: 'network', name: 'Network', icon: '🌐', description: 'Network and connectivity settings' },
            { id: 'privacy', name: 'Privacy & Security', icon: '🔒', description: 'Security and privacy settings' },
            { id: 'power', name: 'Power & Thermal', icon: '🔋', description: 'Power management and thermal control' },
            { id: 'multimedia', name: 'Audio & Video', icon: '🎵', description: 'Audio and video settings' },
            { id: 'accessibility', name: 'Accessibility', icon: '♿', description: 'Accessibility features' },
            { id: 'applications', name: 'Applications', icon: '📱', description: 'Default applications and startup' }
        ];
        
        return categories.map(cat => `
            <div class="settings-category ${cat.id === this.currentCategory ? 'active' : ''}" 
                 onclick="corridorSettings.selectCategory('${cat.id}', '${cat.name}', '${cat.description}')">
                <span class="category-icon">${cat.icon}</span>
                <div class="category-info">
                    <div class="category-name">${cat.name}</div>
                    <div class="category-description">${cat.description}</div>
                </div>
            </div>
        `).join('');
    }
    
    selectCategory(categoryId, name, description) {
        this.currentCategory = categoryId;
        
        // Update active category
        document.querySelectorAll('.settings-category').forEach(cat => {
            cat.classList.remove('active');
        });
        event.target.closest('.settings-category').classList.add('active');
        
        // Update header
        document.getElementById('settings-title').textContent = name;
        document.getElementById('settings-subtitle').textContent = description;
        
        // Update panel content
        const panel = document.getElementById('settings-panel');
        panel.innerHTML = this.renderCategorySettings(categoryId);
    }

    // Header actions
    resetToDefaults() {
        this.settings = JSON.parse(JSON.stringify(this.defaults));
        // Re-render current panel to reflect defaults
        const title = document.getElementById('settings-title')?.textContent || '';
        const desc = document.getElementById('settings-subtitle')?.textContent || '';
        const panel = document.getElementById('settings-panel');
        if (panel) panel.innerHTML = this.renderCategorySettings(this.currentCategory);
        if (window.corridorOS) {
            window.corridorOS.showNotification('Settings Reset', 'All settings restored to defaults.');
        }
        // Preserve header text
        if (title) document.getElementById('settings-title').textContent = title;
        if (desc) document.getElementById('settings-subtitle').textContent = desc;
    }

    applyChanges() {
        if (window.corridorOS) {
            window.corridorOS.showNotification('Settings Applied', 'Your changes have been applied.');
        }
    }
    
    renderCategorySettings(categoryId) {
        switch (categoryId) {
            case 'system':
                return this.renderSystemSettings();
            case 'appearance':
                return this.renderAppearanceSettings();
            case 'quantum':
                return this.renderQuantumSettings();
            case 'photonic':
                return this.renderPhotonicSettings();
            case 'network':
                return this.renderNetworkSettings();
            case 'privacy':
                return this.renderPrivacySettings();
            case 'power':
                return this.renderPowerSettings();
            case 'multimedia':
                return this.renderMultimediaSettings();
            case 'accessibility':
                return this.renderAccessibilitySettings();
            case 'applications':
                return this.renderApplicationsSettings();
            default:
                return '<div class="settings-placeholder">Settings category not found</div>';
        }
    }
    
    renderSystemSettings() {
        const systemInfo = window.corridorOS?.systemInfo || {};
        return `
            <div class="settings-section">
                <h3>About This Computer</h3>
                <div class="system-info">
                    <div class="system-logo">
                        <div class="corridor-logo-large">⚛️</div>
                        <div class="system-name">Corridor OS</div>
                        <div class="system-version">Version ${systemInfo.version || '1.0.0'}</div>
                    </div>
                    <div class="system-specs">
                        <div class="spec-item">
                            <span class="spec-label">Processor:</span>
                            <span class="spec-value">${systemInfo.cpu || 'Quantum Processing Unit'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Graphics:</span>
                            <span class="spec-value">${systemInfo.gpu || 'Photonic Rendering Engine'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Memory:</span>
                            <span class="spec-value">${systemInfo.memory || '16GB'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Storage:</span>
                            <span class="spec-value">${systemInfo.storage || '512GB NVMe'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Architecture:</span>
                            <span class="spec-value">${systemInfo.architecture || 'x86_64'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Computer Name</h3>
                <div class="setting-item">
                    <input type="text" class="settings-input" value="${this.settings.system.computerName}" 
                           onchange="corridorSettings.updateSetting('system.computerName', this.value)">
                    <p class="setting-description">This name identifies your computer on the network</p>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Software Updates</h3>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.system.softwareUpdates ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('system.softwareUpdates', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Automatic Updates</div>
                        <div class="setting-description">Automatically download and install system updates</div>
                    </div>
                </div>
                <button class="settings-button primary" onclick="corridorSettings.checkForUpdates()">
                    Check for Updates
                </button>
            </div>
        `;
    }
    
    renderAppearanceSettings() {
        return `
            <div class="settings-section">
                <h3>Theme</h3>
                <div class="theme-selector">
                    <div class="theme-option ${this.settings.appearance.theme === 'dark' ? 'selected' : ''}"
                         onclick="corridorSettings.updateSetting('appearance.theme', 'dark')">
                        <div class="theme-preview dark-theme"></div>
                        <span>Dark</span>
                    </div>
                    <div class="theme-option ${this.settings.appearance.theme === 'light' ? 'selected' : ''}"
                         onclick="corridorSettings.updateSetting('appearance.theme', 'light')">
                        <div class="theme-preview light-theme"></div>
                        <span>Light</span>
                    </div>
                    <div class="theme-option ${this.settings.appearance.theme === 'auto' ? 'selected' : ''}"
                         onclick="corridorSettings.updateSetting('appearance.theme', 'auto')">
                        <div class="theme-preview auto-theme"></div>
                        <span>Auto</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Wallpaper</h3>
                <div class="wallpaper-selector">
                    <div class="wallpaper-option ${this.settings.appearance.wallpaper === 'quantum-gradient' ? 'selected' : ''}"
                         onclick="corridorSettings.updateSetting('appearance.wallpaper', 'quantum-gradient')">
                        <div class="wallpaper-preview quantum-gradient"></div>
                        <span>Quantum Gradient</span>
                    </div>
                    <div class="wallpaper-option ${this.settings.appearance.wallpaper === 'photonic-waves' ? 'selected' : ''}"
                         onclick="corridorSettings.updateSetting('appearance.wallpaper', 'photonic-waves')">
                        <div class="wallpaper-preview photonic-waves"></div>
                        <span>Photonic Waves</span>
                    </div>
                    <div class="wallpaper-option ${this.settings.appearance.wallpaper === 'corridor-abstract' ? 'selected' : ''}"
                         onclick="corridorSettings.updateSetting('appearance.wallpaper', 'corridor-abstract')">
                        <div class="wallpaper-preview corridor-abstract"></div>
                        <span>Corridor Abstract</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Visual Effects</h3>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.appearance.animations ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('appearance.animations', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Animations</div>
                        <div class="setting-description">Enable smooth animations and transitions</div>
                    </div>
                </div>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.appearance.transparency ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('appearance.transparency', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Transparency</div>
                        <div class="setting-description">Enable window transparency and blur effects</div>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Font Size</h3>
                <div class="font-size-selector">
                    <button class="size-option ${this.settings.appearance.fontSize === 'small' ? 'selected' : ''}"
                            onclick="corridorSettings.updateSetting('appearance.fontSize', 'small')">Small</button>
                    <button class="size-option ${this.settings.appearance.fontSize === 'medium' ? 'selected' : ''}"
                            onclick="corridorSettings.updateSetting('appearance.fontSize', 'medium')">Medium</button>
                    <button class="size-option ${this.settings.appearance.fontSize === 'large' ? 'selected' : ''}"
                            onclick="corridorSettings.updateSetting('appearance.fontSize', 'large')">Large</button>
                </div>
            </div>
        `;
    }
    
    renderQuantumSettings() {
        return `
            <div class="settings-section">
                <h3>Quantum Processing</h3>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.quantum.quantumProcessing ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('quantum.quantumProcessing', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Enable Quantum Processing</div>
                        <div class="setting-description">Use quantum algorithms for enhanced computation</div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-name">Qubit Count</div>
                        <div class="setting-description">Number of qubits available for quantum operations</div>
                    </div>
                    <div class="range-input">
                        <input type="range" min="1" max="10" value="${this.settings.quantum.qubitCount}"
                               onchange="corridorSettings.updateSetting('quantum.qubitCount', parseInt(this.value))">
                        <span class="range-value">${this.settings.quantum.qubitCount}</span>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-name">Coherence Time</div>
                        <div class="setting-description">Quantum coherence time in microseconds</div>
                    </div>
                    <div class="range-input">
                        <input type="range" min="10" max="1000" value="${this.settings.quantum.coherenceTime}"
                               onchange="corridorSettings.updateSetting('quantum.coherenceTime', parseInt(this.value))">
                        <span class="range-value">${this.settings.quantum.coherenceTime}μs</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Quantum Features</h3>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.quantum.errorCorrection ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('quantum.errorCorrection', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Quantum Error Correction</div>
                        <div class="setting-description">Enable quantum error correction protocols</div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.quantum.quantumCryptography ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('quantum.quantumCryptography', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Quantum Cryptography</div>
                        <div class="setting-description">Use quantum key distribution for secure communications</div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.quantum.quantumTeleportation ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('quantum.quantumTeleportation', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Quantum Teleportation</div>
                        <div class="setting-description">Enable quantum state teleportation (experimental)</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderPhotonicSettings() {
        return `
            <div class="settings-section">
                <h3>Photonic Processing</h3>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.photonic.photonicProcessing ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('photonic.photonicProcessing', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Enable Photonic Processing</div>
                        <div class="setting-description">Use optical computing for high-speed operations</div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-name">Wavelength Channels</div>
                        <div class="setting-description">Number of optical wavelength channels</div>
                    </div>
                    <div class="range-input">
                        <input type="range" min="1" max="16" value="${this.settings.photonic.wavelengthChannels}"
                               onchange="corridorSettings.updateSetting('photonic.wavelengthChannels', parseInt(this.value))">
                        <span class="range-value">${this.settings.photonic.wavelengthChannels}</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Optical Configuration</h3>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.photonic.opticalAmplification ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('photonic.opticalAmplification', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Optical Amplification</div>
                        <div class="setting-description">Enable optical signal amplification</div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.photonic.wdmMultiplexing ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('photonic.wdmMultiplexing', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">WDM Multiplexing</div>
                        <div class="setting-description">Wavelength Division Multiplexing for increased bandwidth</div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-name">Fiber Coupling</div>
                        <div class="setting-description">Optical fiber coupling mode</div>
                    </div>
                    <select class="settings-select" onchange="corridorSettings.updateSetting('photonic.fiberCoupling', this.value)">
                        <option value="auto" ${this.settings.photonic.fiberCoupling === 'auto' ? 'selected' : ''}>Automatic</option>
                        <option value="manual" ${this.settings.photonic.fiberCoupling === 'manual' ? 'selected' : ''}>Manual</option>
                        <option value="adaptive" ${this.settings.photonic.fiberCoupling === 'adaptive' ? 'selected' : ''}>Adaptive</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    // Additional render methods for other categories...
    renderNetworkSettings() {
        return `
            <div class="settings-section">
                <h3>Wi-Fi</h3>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.network.wifi.enabled ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('network.wifi.enabled', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Wi-Fi</div>
                        <div class="setting-description">Enable wireless networking</div>
                    </div>
                </div>
                
                <div class="wifi-networks">
                    <div class="network-item connected">
                        <span class="network-name">${this.settings.network.wifi.ssid}</span>
                        <span class="network-status">Connected</span>
                        <span class="network-signal">📶</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Quantum Network</h3>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.network.quantumNetwork.enabled ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('network.quantumNetwork.enabled', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Quantum Network</div>
                        <div class="setting-description">Enable quantum communication protocols (experimental)</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderPrivacySettings() {
        return `
            <div class="settings-section">
                <h3>Security</h3>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.privacy.quantumEncryption ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('privacy.quantumEncryption', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Quantum Encryption</div>
                        <div class="setting-description">Use quantum cryptography for maximum security</div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.privacy.automaticLock ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('privacy.automaticLock', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Automatic Lock</div>
                        <div class="setting-description">Automatically lock screen when idle</div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-name">Lock Delay</div>
                        <div class="setting-description">Time before automatic lock (seconds)</div>
                    </div>
                    <div class="range-input">
                        <input type="range" min="30" max="3600" step="30" value="${this.settings.privacy.lockDelay}"
                               onchange="corridorSettings.updateSetting('privacy.lockDelay', parseInt(this.value))">
                        <span class="range-value">${this.settings.privacy.lockDelay}s</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderPowerSettings() {
        return `
            <div class="settings-section">
                <h3>Power Mode</h3>
                <div class="power-modes">
                    <div class="power-mode ${this.settings.power.powerMode === 'performance' ? 'selected' : ''}"
                         onclick="corridorSettings.updateSetting('power.powerMode', 'performance')">
                        <span class="mode-icon">⚡</span>
                        <span class="mode-name">Performance</span>
                    </div>
                    <div class="power-mode ${this.settings.power.powerMode === 'balanced' ? 'selected' : ''}"
                         onclick="corridorSettings.updateSetting('power.powerMode', 'balanced')">
                        <span class="mode-icon">⚖️</span>
                        <span class="mode-name">Balanced</span>
                    </div>
                    <div class="power-mode ${this.settings.power.powerMode === 'power-saver' ? 'selected' : ''}"
                         onclick="corridorSettings.updateSetting('power.powerMode', 'power-saver')">
                        <span class="mode-icon">🔋</span>
                        <span class="mode-name">Power Saver</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Thermal Management</h3>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.power.quantumCooling ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('power.quantumCooling', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Quantum Cooling</div>
                        <div class="setting-description">Use quantum effects for enhanced cooling</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMultimediaSettings() {
        return `
            <div class="settings-section">
                <h3>Audio</h3>
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-name">Output Volume</div>
                    </div>
                    <div class="range-input">
                        <input type="range" min="0" max="100" value="${this.settings.multimedia.audio.volume}"
                               onchange="corridorSettings.updateSetting('multimedia.audio.volume', parseInt(this.value))">
                        <span class="range-value">${this.settings.multimedia.audio.volume}%</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Display</h3>
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-name">Resolution</div>
                    </div>
                    <select class="settings-select" onchange="corridorSettings.updateSetting('multimedia.video.resolution', this.value)">
                        <option value="1920x1080" ${this.settings.multimedia.video.resolution === '1920x1080' ? 'selected' : ''}>1920×1080</option>
                        <option value="2560x1600" ${this.settings.multimedia.video.resolution === '2560x1600' ? 'selected' : ''}>2560×1600</option>
                        <option value="3840x2160" ${this.settings.multimedia.video.resolution === '3840x2160' ? 'selected' : ''}>3840×2160</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    renderAccessibilitySettings() {
        return `
            <div class="settings-section">
                <h3>Visual</h3>
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.accessibility.highContrast ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('accessibility.highContrast', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">High Contrast</div>
                        <div class="setting-description">Increase contrast for better visibility</div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="toggle-switch">
                        <input type="checkbox" ${this.settings.accessibility.largeText ? 'checked' : ''}
                               onchange="corridorSettings.updateSetting('accessibility.largeText', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <div class="setting-name">Large Text</div>
                        <div class="setting-description">Use larger text throughout the system</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderApplicationsSettings() {
        return `
            <div class="settings-section">
                <h3>Default Applications</h3>
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-name">Web Browser</div>
                    </div>
                    <select class="settings-select" onchange="corridorSettings.updateSetting('applications.defaultBrowser', this.value)">
                        <option value="Quantum Browser" ${this.settings.applications.defaultBrowser === 'Quantum Browser' ? 'selected' : ''}>Quantum Browser</option>
                        <option value="Photonic Web" ${this.settings.applications.defaultBrowser === 'Photonic Web' ? 'selected' : ''}>Photonic Web</option>
                        <option value="Corridor Navigator" ${this.settings.applications.defaultBrowser === 'Corridor Navigator' ? 'selected' : ''}>Corridor Navigator</option>
                    </select>
                </div>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-name">Text Editor</div>
                    </div>
                    <select class="settings-select" onchange="corridorSettings.updateSetting('applications.defaultTextEditor', this.value)">
                        <option value="Corridor Text" ${this.settings.applications.defaultTextEditor === 'Corridor Text' ? 'selected' : ''}>Corridor Text</option>
                        <option value="Quantum Editor" ${this.settings.applications.defaultTextEditor === 'Quantum Editor' ? 'selected' : ''}>Quantum Editor</option>
                        <option value="Photonic Code" ${this.settings.applications.defaultTextEditor === 'Photonic Code' ? 'selected' : ''}>Photonic Code</option>
                    </select>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Startup Applications</h3>
                <div class="startup-apps">
                    ${this.settings.applications.startupApps.map(app => `
                        <div class="startup-app">
                            <span class="app-name">${app}</span>
                            <button class="remove-app" onclick="corridorSettings.removeStartupApp('${app}')">Remove</button>
                        </div>
                    `).join('')}
                </div>
                <button class="settings-button" onclick="corridorSettings.addStartupApp()">Add Application</button>
            </div>
        `;
    }
    
    updateSetting(path, value) {
        const keys = path.split('.');
        let obj = this.settings;
        
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        
        // Apply setting changes
        this.applySettingChange(path, value);
        
        // Save settings
        this.saveSettings();
        
        // Show notification
        window.corridorOS?.showNotification('Settings Updated', `${path} has been changed`);
    }
    
    applySettingChange(path, value) {
        switch (path) {
            case 'appearance.theme':
                document.body.setAttribute('data-theme', value);
                break;
            case 'appearance.animations':
                document.body.classList.toggle('no-animations', !value);
                break;
            case 'appearance.fontSize':
                document.body.setAttribute('data-font-size', value);
                break;
            case 'appearance.wallpaper':
                document.body.setAttribute('data-wallpaper', value);
                break;
            case 'privacy.lockDelay':
                if (window.corridorOS) {
                    window.corridorOS.preferences.autoLock = value * 1000;
                    window.corridorOS.resetAutoLockTimer();
                }
                break;
        }
    }
    
    saveSettings() {
        localStorage.setItem('corridor-os-settings', JSON.stringify(this.settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('corridor-os-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }
    
    searchSettings(query) {
        this.searchQuery = query.toLowerCase();
        // Implementation for settings search
        console.log('Searching settings for:', query);
    }
    
    checkForUpdates() {
        window.corridorOS?.showNotification('Software Updates', 'Checking for updates...');
        setTimeout(() => {
            window.corridorOS?.showNotification('Software Updates', 'Your system is up to date!');
        }, 2000);
    }
    
    removeStartupApp(appName) {
        const index = this.settings.applications.startupApps.indexOf(appName);
        if (index > -1) {
            this.settings.applications.startupApps.splice(index, 1);
            this.saveSettings();
            // Refresh the applications settings panel
            this.selectCategory('applications', 'Applications', 'Default applications and startup');
        }
    }
    
    addStartupApp() {
        // Simple implementation - in a real OS this would show an app picker
        const appName = prompt('Enter application name:');
        if (appName && !this.settings.applications.startupApps.includes(appName)) {
            this.settings.applications.startupApps.push(appName);
            this.saveSettings();
            this.selectCategory('applications', 'Applications', 'Default applications and startup');
        }
    }
}

// Create global instance
window.corridorSettings = new CorridorSettings();
