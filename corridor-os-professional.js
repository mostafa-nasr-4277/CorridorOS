// Corridor OS Professional - Streamlined Professional Version
class CorridorOSProfessional {
    constructor() {
        this.isBooted = false;
        this.isLocked = false;
        this.currentWorkspace = 1;
        this.openWindows = new Map();
        this.windowZIndex = 1000;
        this.notifications = [];
        this.systemTime = new Date();
        
        // Professional system state
        this.systemInfo = {
            version: '1.0.0 Professional',
            buildNumber: '20241217-Pro',
            kernel: 'Corridor Quantum Kernel',
            architecture: 'x86_64',
            memory: '16GB',
            storage: '512GB NVMe',
            cpu: 'Quantum Processing Unit',
            gpu: 'Photonic Rendering Engine'
        };
        
        // Professional preferences
        this.preferences = {
            theme: 'professional-dark',
            wallpaper: 'professional-gradient',
            animations: true,
            notifications: true,
            autoLock: 600000, // 10 minutes for professional use
            language: 'en-US',
            timezone: 'UTC',
            contactInfo: {
                company: '[Company Name]',
                email: 'info@company.com',
                phone: '+1 (555) 123-4567',
                address: '123 Quantum Street\nInnovation City, IC 12345'
            }
        };
        
        this.bootSpeedKey = 'corridoros-boot-speed';
        this.fastBootKey = 'corridoros-fast-boot';
        this.bootSpeedFactor = this.readBootSpeedFactor();

        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.wireFastBootToggle();
        this.startBootSequence();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }
    
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Mouse events
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        document.addEventListener('click', (e) => this.handleClick(e));
        
        // Window management
        document.addEventListener('mousedown', (e) => this.handleWindowInteraction(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Contact form
        document.addEventListener('submit', (e) => this.handleContactForm(e));
    }
    
    async startBootSequence() {
        const SPEED = this.bootSpeedFactor || 0.5; // default twice as fast
        const bootSteps = [
            { message: 'Initializing quantum substrate...', duration: 600 * SPEED },
            { message: 'Loading photonic drivers...', duration: 400 * SPEED },
            { message: 'Calibrating optical pathways...', duration: 500 * SPEED },
            { message: 'Starting memory mesh...', duration: 400 * SPEED },
            { message: 'Initializing heliopass sensors...', duration: 300 * SPEED },
            { message: 'Loading thermal equilibrium model...', duration: 400 * SPEED },
            { message: 'Starting professional services...', duration: 400 * SPEED },
            { message: 'Loading user environment...', duration: 300 * SPEED },
            { message: 'Corridor OS Professional ready!', duration: 400 * SPEED }
        ];
        
        const progressFill = document.getElementById('boot-progress-fill');
        const statusElement = document.getElementById('boot-status');
        
        for (let i = 0; i < bootSteps.length; i++) {
            const step = bootSteps[i];
            statusElement.textContent = step.message;
            progressFill.style.width = `${((i + 1) / bootSteps.length) * 100}%`;
            
            await new Promise(resolve => setTimeout(resolve, step.duration));
        }
        
        // Boot complete
        await new Promise(resolve => setTimeout(resolve, Math.max(100, 150 * SPEED)));
        this.completeBootSequence();
    }

    readBootSpeedFactor() {
        try {
            const url = new URL(window.location.href);
            const q = url.searchParams;
            if (q.get('instant') === '1') return 0.05;
            const fromParam = q.get('bootFactor') || q.get('speed');
            if (fromParam) {
                const f = Math.max(0.05, Math.min(1, parseFloat(fromParam)));
                if (!isNaN(f)) {
                    localStorage.setItem(this.bootSpeedKey, String(f));
                    return f;
                }
            }
            if (q.get('fastboot') === '1' || q.get('fast') === '1') {
                localStorage.setItem(this.fastBootKey, '1');
            }
            const storedFactor = parseFloat(localStorage.getItem(this.bootSpeedKey) || '');
            if (!isNaN(storedFactor)) return Math.max(0.05, Math.min(1, storedFactor));
            const fast = localStorage.getItem(this.fastBootKey) === '1';
            return fast ? 0.2 : 0.3; // default: reasonably fast
        } catch (_) {
            return 0.3;
        }
    }

    wireFastBootToggle() {
        const el = document.getElementById('fast-boot-toggle');
        if (!el) return;
        const isFast = (this.bootSpeedFactor || 0.5) <= 0.2;
        el.checked = isFast;
        el.addEventListener('change', () => {
            const fast = el.checked;
            if (fast) {
                localStorage.setItem(this.fastBootKey, '1');
                localStorage.setItem(this.bootSpeedKey, '0.2');
                this.bootSpeedFactor = 0.2;
            } else {
                localStorage.removeItem(this.fastBootKey);
                localStorage.setItem(this.bootSpeedKey, '0.5');
                this.bootSpeedFactor = 0.5;
            }
            // No toast here to keep Pro splash clean
        });
    }
    
    completeBootSequence() {
        this.isBooted = true;
        document.getElementById('boot-splash').style.display = 'none';
        document.getElementById('desktop').style.display = 'block';
        
        // Show professional welcome notification
        this.showNotification('Corridor OS Professional', 'Quantum-Photonic Operating System ready for professional use.');
        
        // Auto-lock timer for professional environment
        this.resetAutoLockTimer();
        
        // Load Corridor Computer interface by default
        setTimeout(() => {
            this.openApp('corridor-computer');
        }, 1000);
    }
    
    updateClock() {
        this.systemTime = new Date();
        const timeString = this.systemTime.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const dateString = this.systemTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Update desktop clock
        const desktopClock = document.getElementById('desktop-clock');
        if (desktopClock) {
            desktopClock.textContent = timeString;
        }
        
        // Update lock screen clock
        const lockClock = document.getElementById('lock-clock');
        const lockDate = document.getElementById('lock-date');
        if (lockClock && lockDate) {
            lockClock.textContent = timeString;
            lockDate.textContent = dateString;
        }
    }
    
    handleKeyboard(e) {
        // Professional shortcuts
        if (e.metaKey || e.ctrlKey) {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.showActivitiesOverview();
                    break;
                case 'l':
                    e.preventDefault();
                    this.lockScreen();
                    break;
                case ',':
                    e.preventDefault();
                    this.openApp('settings');
                    break;
                case 'k':
                    e.preventDefault();
                    this.openApp('contact');
                    break;
            }
        }
        
        // Escape key
        if (e.key === 'Escape') {
            this.hideOverlays();
        }
    }
    
    handleContextMenu(e) {
        e.preventDefault();
        this.showContextMenu(e.clientX, e.clientY);
    }
    
    handleClick(e) {
        this.hideContextMenu();
        this.hideUserMenu();
        this.resetAutoLockTimer();
    }
    
    handleContactForm(e) {
        if (e.target.id === 'professional-contact-form') {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const contactData = {
                name: formData.get('name'),
                email: formData.get('email'),
                company: formData.get('company'),
                subject: formData.get('subject'),
                message: formData.get('message'),
                timestamp: new Date().toISOString()
            };
            
            // Store contact submission (in real app, this would send to server)
            console.log('Contact form submitted:', contactData);
            
            // Show success message
            this.showNotification('Message Sent', 'Thank you for contacting us. We will respond shortly.');
            
            // Reset form
            e.target.reset();
            
            // Close contact panel after a delay
            setTimeout(() => {
                this.closeContactPanel();
            }, 2000);
        }
    }
    
    showContextMenu(x, y) {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        
        // Ensure menu stays within viewport
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
        }
    }
    
    hideContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'none';
    }
    
    showUserMenu() {
        const userMenu = document.getElementById('user-menu');
        userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
    }
    
    hideUserMenu() {
        const userMenu = document.getElementById('user-menu');
        userMenu.style.display = 'none';
    }
    
    showActivitiesOverview() {
        const overview = document.getElementById('activities-overview');
        overview.style.display = 'flex';
        
        // Focus search input
        const searchInput = document.getElementById('app-search');
        setTimeout(() => searchInput.focus(), 100);
    }
    
    hideActivitiesOverview() {
        const overview = document.getElementById('activities-overview');
        overview.style.display = 'none';
    }
    
    hideOverlays() {
        this.hideActivitiesOverview();
        this.hideContextMenu();
        this.hideUserMenu();
        this.closeContactPanel();
    }
    
    showContactPanel() {
        const contactPanel = document.getElementById('contact-panel');
        contactPanel.style.display = 'flex';
    }
    
    closeContactPanel() {
        const contactPanel = document.getElementById('contact-panel');
        contactPanel.style.display = 'none';
    }
    
    switchWorkspace(number) {
        if (number >= 1 && number <= 3) {
            this.currentWorkspace = number;
            
            // Update workspace indicators
            document.querySelectorAll('.workspace').forEach((ws, index) => {
                ws.classList.toggle('active', index + 1 === number);
            });
            
            this.updateWorkspaceWindows();
            this.showNotification('Workspace Changed', `Switched to Workspace ${number}`);
        }
    }
    
    updateWorkspaceWindows() {
        this.openWindows.forEach((windowData, windowId) => {
            const windowElement = document.getElementById(windowId);
            if (windowElement) {
                const isCurrentWorkspace = windowData.workspace === this.currentWorkspace;
                windowElement.style.display = isCurrentWorkspace ? 'flex' : 'none';
            }
        });
    }
    
    showNotification(title, content, type = 'info', duration = 4000) {
        if (!this.preferences.notifications) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-content">${content}</div>
        `;
        
        const container = document.getElementById('notifications');
        container.appendChild(notification);
        
        // Auto-remove notification
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
        
        // Limit number of notifications
        const notifications = container.children;
        if (notifications.length > 3) {
            notifications[0].remove();
        }
    }
    
    lockScreen() {
        this.isLocked = true;
        document.getElementById('lock-screen').style.display = 'flex';
        document.getElementById('desktop').style.display = 'none';
        
        const passwordInput = document.getElementById('password-input');
        passwordInput.value = '';
        setTimeout(() => passwordInput.focus(), 100);
    }
    
    unlock() {
        const passwordInput = document.getElementById('password-input');
        const password = passwordInput.value;
        
        // Professional password check
        if (password === 'corridor' || password === 'professional' || password === '') {
            this.isLocked = false;
            document.getElementById('lock-screen').style.display = 'none';
            document.getElementById('desktop').style.display = 'block';
            this.resetAutoLockTimer();
        } else {
            passwordInput.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                passwordInput.style.animation = '';
                passwordInput.value = '';
                passwordInput.focus();
            }, 500);
        }
    }
    
    resetAutoLockTimer() {
        if (this.autoLockTimer) {
            clearTimeout(this.autoLockTimer);
        }
        
        if (this.preferences.autoLock > 0 && !this.isLocked) {
            this.autoLockTimer = setTimeout(() => {
                this.lockScreen();
            }, this.preferences.autoLock);
        }
    }
    
    logout() {
        if (confirm('Are you sure you want to log out?')) {
            this.openWindows.clear();
            document.getElementById('windows-container').innerHTML = '';
            
            document.getElementById('desktop').style.display = 'none';
            document.getElementById('boot-splash').style.display = 'flex';
            document.getElementById('boot-status').textContent = 'Logging out...';
            document.getElementById('boot-progress-fill').style.width = '100%';
            
            setTimeout(() => {
                location.reload();
            }, 1500);
        }
    }
    
    restart() {
        if (confirm('Are you sure you want to restart?')) {
            this.showNotification('System Restart', 'Restarting Corridor OS Professional...');
            setTimeout(() => location.reload(), 1500);
        }
    }
    
    shutdown() {
        if (confirm('Are you sure you want to shut down?')) {
            document.body.style.transition = 'opacity 1.5s ease';
            document.body.style.opacity = '0';
            
            setTimeout(() => {
                document.body.innerHTML = `
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        background: #1e1e1e;
                        color: #fff;
                        font-family: Inter, sans-serif;
                        flex-direction: column;
                        gap: 20px;
                    ">
                        <div style="font-size: 40px; color: #0073e6;">⏻</div>
                        <div style="font-size: 18px; font-weight: 500;">Corridor OS Professional</div>
                        <div style="font-size: 14px; opacity: 0.7;">System has shut down safely</div>
                    </div>
                `;
            }, 1500);
        }
    }
    
    // App launching
    openApp(appName) {
        if (appName === 'contact') {
            this.showContactPanel();
            return;
        }
        
        if (window.corridorApps) {
            window.corridorApps.openApp(appName);
        }
    }
    
    // Window management delegation
    handleWindowInteraction(e) {
        if (window.corridorWindowManager) {
            window.corridorWindowManager.handleMouseDown(e);
        }
    }
    
    handleMouseMove(e) {
        if (window.corridorWindowManager) {
            window.corridorWindowManager.handleMouseMove(e);
        }
    }
    
    handleMouseUp(e) {
        if (window.corridorWindowManager) {
            window.corridorWindowManager.handleMouseUp(e);
        }
    }
    
    closeActiveWindow() {
        if (window.corridorWindowManager) {
            window.corridorWindowManager.closeActiveWindow();
        }
    }
}

// Global functions for HTML event handlers
function showActivitiesOverview() {
    window.corridorOSPro.showActivitiesOverview();
}

function showUserMenu() {
    window.corridorOSPro.showUserMenu();
}

function switchWorkspace(number) {
    window.corridorOSPro.switchWorkspace(number);
}

function lockScreen() {
    window.corridorOSPro.lockScreen();
}

function unlock() {
    window.corridorOSPro.unlock();
}

function logout() {
    window.corridorOSPro.logout();
}

function restart() {
    window.corridorOSPro.restart();
}

function shutdown() {
    window.corridorOSPro.shutdown();
}

function openApp(appName) {
    window.corridorOSPro.openApp(appName);
}

function createFile() {
    window.corridorOSPro.showNotification('Create File', 'File creation feature available in full version.');
}

function createFolder() {
    window.corridorOSPro.showNotification('Create Folder', 'Folder creation feature available in full version.');
}

function closeContactPanel() {
    window.corridorOSPro.closeContactPanel();
}

// Initialize Corridor OS Professional when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.corridorOSPro = new CorridorOSProfessional();
});

// Professional styling additions
const professionalCSS = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
    20%, 40%, 60%, 80% { transform: translateX(8px); }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

/* Professional contact panel animations */
.contact-panel {
    animation: fadeInScale 0.3s ease;
}

@keyframes fadeInScale {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* Professional focus styles */
.window.active {
    box-shadow: 0 8px 32px rgba(0, 115, 230, 0.15), 0 0 0 1px rgba(0, 115, 230, 0.2);
}

/* Professional button styles */
.activities-button {
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.25px;
}

.dock-app:hover {
    box-shadow: 0 4px 12px rgba(0, 115, 230, 0.1);
}
`;

const professionalStyle = document.createElement('style');
professionalStyle.textContent = professionalCSS;
document.head.appendChild(professionalStyle);
