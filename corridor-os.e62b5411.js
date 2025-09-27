// Corridor OS - Main Operating System Logic
class CorridorOS {
    constructor() {
        this.isBooted = false;
        this.isLocked = false;
        this.currentWorkspace = 1;
        this.openWindows = new Map();
        this.windowZIndex = 1000;
        this.notifications = [];
        this.unreadCount = 0;
        this.notificationsKey = 'corridor-os-notifications-v1';
        this.systemTime = new Date();
        
        // System state
        this.systemInfo = {
            version: '1.0.0',
            buildNumber: '20241217',
            kernel: 'Corridor Quantum Kernel',
            architecture: 'x86_64',
            memory: '16GB',
            storage: '512GB NVMe',
            cpu: 'Quantum Processing Unit',
            gpu: 'Photonic Rendering Engine'
        };
        
        // User preferences
        this.preferences = {
            theme: 'dark',
            wallpaper: 'quantum-gradient',
            animations: true,
            notifications: true,
            autoLock: 300000, // 5 minutes
            language: 'en-US',
            timezone: 'UTC'
        };
        
        // Boot speed control
        this.bootSpeedKey = 'corridoros-boot-speed';
        this.fastBootKey = 'corridoros-fast-boot';
        this.bootSpeedFactor = this.readBootSpeedFactor();

        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.applySavedAppearanceOnStartup();
        this.loadNotificationsFromStorage();
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
        
        // Prevent default behaviors
        document.addEventListener('dragstart', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
        document.addEventListener('dragover', (e) => e.preventDefault());
    }
    
    async startBootSequence() {
        // Use dynamic speed factor; default already 2x faster than original
        const SPEED = this.bootSpeedFactor || 0.5;
        const bootSteps = [
            { message: 'Initializing quantum substrate...', duration: 800 * SPEED },
            { message: 'Loading photonic drivers...', duration: 600 * SPEED },
            { message: 'Calibrating optical pathways...', duration: 700 * SPEED },
            { message: 'Starting memory mesh...', duration: 500 * SPEED },
            { message: 'Initializing heliopass sensors...', duration: 400 * SPEED },
            { message: 'Loading thermal equilibrium model...', duration: 600 * SPEED },
            { message: 'Starting orchestrator services...', duration: 500 * SPEED },
            { message: 'Mounting quantum filesystem...', duration: 400 * SPEED },
            { message: 'Loading user environment...', duration: 300 * SPEED },
            { message: 'Corridor OS ready!', duration: 500 * SPEED }
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
        await new Promise(resolve => setTimeout(resolve, Math.max(120, 250 * SPEED)));
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
                localStorage.setItem(this.bootSpeedKey, '0.3');
                this.bootSpeedFactor = 0.3;
            }
            this.showNotification('Boot Speed', fast ? 'Fast Boot enabled' : 'Fast Boot disabled');
        });
    }
    
    completeBootSequence() {
        this.isBooted = true;
        document.getElementById('boot-splash').style.display = 'none';
        document.getElementById('desktop').style.display = 'block';
        
        // Show welcome notification
        this.showNotification('Welcome to Corridor OS', 'Hybrid Quantum-Photonic Operating System ready for use.');
        
        // Auto-lock timer
        this.resetAutoLockTimer();
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
        // Global shortcuts
        if (e.altKey && e.key === 'F4') {
            e.preventDefault();
            this.closeActiveWindow();
        }
        
        if (e.metaKey || e.ctrlKey) {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.showActivitiesOverview();
                    break;
                case 't':
                    e.preventDefault();
                    this.openApp('terminal');
                    break;
                case 'l':
                    e.preventDefault();
                    this.lockScreen();
                    break;
                case ',':
                    e.preventDefault();
                    this.openApp('settings');
                    break;
            }
        }
        
        // Function keys
        if (e.key.startsWith('F') && !e.altKey && !e.ctrlKey && !e.metaKey) {
            const fNumber = parseInt(e.key.substring(1));
            if (fNumber >= 1 && fNumber <= 12) {
                e.preventDefault();
                this.handleFunctionKey(fNumber);
            }
        }
        
        // Escape key
        if (e.key === 'Escape') {
            this.hideOverlays();
        }
    }
    
    handleFunctionKey(number) {
        const functionKeyActions = {
            1: () => this.showHelp(),
            2: () => this.openApp('files'),
            3: () => this.openApp('terminal'),
            4: () => this.openApp('text-editor'),
            5: () => this.refreshDesktop(),
            6: () => this.openApp('quantum-lab'),
            7: () => this.openApp('photonic-studio'),
            8: () => this.openApp('corridor-computer'),
            9: () => this.openApp('settings'),
            10: () => this.openApp('web-browser'),
            11: () => this.toggleFullscreen(),
            12: () => this.openApp('system-monitor')
        };
        
        const action = functionKeyActions[number];
        if (action) {
            action();
        }
    }
    
    handleContextMenu(e) {
        e.preventDefault();
        this.showContextMenu(e.clientX, e.clientY);
    }
    
    handleClick(e) {
        // Hide context menu and user menu on click
        this.hideContextMenu();
        this.hideUserMenu();
        
        // Reset auto-lock timer
        this.resetAutoLockTimer();
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
    }
    
    switchWorkspace(number) {
        if (number >= 1 && number <= 3) {
            this.currentWorkspace = number;
            
            // Update workspace indicators
            document.querySelectorAll('.workspace').forEach((ws, index) => {
                ws.classList.toggle('active', index + 1 === number);
            });
            
            // Hide/show windows based on workspace
            this.updateWorkspaceWindows();
            
            this.showNotification('Workspace Changed', `Switched to Workspace ${number}`);
        }
    }
    
    updateWorkspaceWindows() {
        // Implementation for workspace-specific window management
        this.openWindows.forEach((windowData, windowId) => {
            const windowElement = document.getElementById(windowId);
            if (windowElement) {
                const isCurrentWorkspace = windowData.workspace === this.currentWorkspace;
                windowElement.style.display = isCurrentWorkspace ? 'flex' : 'none';
            }
        });
    }
    
    showNotification(title, content, type = 'info', duration = 5000) {
        if (!this.preferences.notifications) return;
        // Persist to notification center
        const notif = {
            id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            title,
            content,
            type,
            timestamp: Date.now(),
            read: false
        };
        this.notifications.unshift(notif);
        this.unreadCount++;
        this.saveNotificationsToStorage();
        this.renderNotificationList();
        this.updateNotificationBadge();

        // Also show ephemeral toast with a close button
        const container = document.getElementById('notifications');
        const toast = document.createElement('div');
        toast.className = `notification ${type}`;
        toast.innerHTML = `
            <div class="notification-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span>${title}</span>
                <button aria-label="Dismiss" style="background:transparent;border:none;color:inherit;cursor:pointer;font-size:16px;line-height:1;">×</button>
            </div>
            <div class="notification-content">${content}</div>
        `;
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', () => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 280);
        });
        container.appendChild(toast);

        // Auto-remove toast
        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => toast.remove(), 280);
                }
            }, duration);
        }
        // Limit number of concurrent toasts
        const toasts = container.children;
        if (toasts.length > 5) {
            toasts[0].remove();
        }
    }

    // Notification Center helpers
    loadNotificationsFromStorage() {
        try {
            const raw = localStorage.getItem(this.notificationsKey);
            this.notifications = raw ? JSON.parse(raw) : [];
            // Unread count from items marked read:false
            this.unreadCount = this.notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
            this.renderNotificationList();
            this.updateNotificationBadge();
        } catch (e) {
            console.error('Failed to load notifications', e);
            this.notifications = [];
        }
    }

    saveNotificationsToStorage() {
        try {
            localStorage.setItem(this.notificationsKey, JSON.stringify(this.notifications));
        } catch (e) {
            console.error('Failed to save notifications', e);
        }
    }

    renderNotificationList() {
        const list = document.getElementById('notifications-list');
        const empty = document.getElementById('notifications-empty');
        if (!list) return;

        list.innerHTML = '';
        if (!this.notifications.length) {
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';

        this.notifications.forEach((n) => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.setAttribute('role', 'listitem');
            const time = new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            item.innerHTML = `
                <div class="title">${n.title}</div>
                <button class="close-btn" title="Dismiss">×</button>
                <div class="meta">${time}</div>
                <div class="body">${n.content}</div>
            `;
            item.querySelector('.close-btn').addEventListener('click', () => this.dismissNotification(n.id));
            list.appendChild(item);
        });
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationsBadge');
        if (!badge) return;
        if (this.unreadCount > 0) {
            badge.textContent = String(this.unreadCount);
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }

    toggleNotificationsPanel() {
        const panel = document.getElementById('notifications-panel');
        if (!panel) return;
        const isOpen = panel.classList.toggle('open');
        panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (isOpen) {
            // Mark all as read when opening
            let changed = false;
            this.notifications.forEach(n => { if (!n.read) { n.read = true; changed = true; } });
            if (changed) {
                this.unreadCount = 0;
                this.saveNotificationsToStorage();
                this.updateNotificationBadge();
                this.renderNotificationList();
            }
        }
    }

    dismissNotification(id) {
        const idx = this.notifications.findIndex(n => n.id === id);
        if (idx !== -1) {
            // Adjust unread count if still unread
            if (this.notifications[idx].read === false && this.unreadCount > 0) {
                this.unreadCount--;
            }
            this.notifications.splice(idx, 1);
            this.saveNotificationsToStorage();
            this.renderNotificationList();
            this.updateNotificationBadge();
        }
    }

    clearAllNotifications() {
        this.notifications = [];
        this.unreadCount = 0;
        this.saveNotificationsToStorage();
        this.renderNotificationList();
        this.updateNotificationBadge();
    }
    
    lockScreen() {
        this.isLocked = true;
        document.getElementById('lock-screen').style.display = 'flex';
        document.getElementById('desktop').style.display = 'none';
        
        // Clear password input
        const passwordInput = document.getElementById('password-input');
        passwordInput.value = '';
        setTimeout(() => passwordInput.focus(), 100);
    }
    
    unlock() {
        const passwordInput = document.getElementById('password-input');
        const password = passwordInput.value;
        
        // Simple password check (in real OS this would be properly secured)
        if (password === 'corridor' || password === '') {
            this.isLocked = false;
            document.getElementById('lock-screen').style.display = 'none';
            document.getElementById('desktop').style.display = 'block';
            this.resetAutoLockTimer();
        } else {
            // Shake animation for wrong password
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
            // Close all windows
            this.openWindows.clear();
            document.getElementById('windows-container').innerHTML = '';
            
            // Show boot splash as logout screen
            document.getElementById('desktop').style.display = 'none';
            document.getElementById('boot-splash').style.display = 'flex';
            document.getElementById('boot-status').textContent = 'Logging out...';
            document.getElementById('boot-progress-fill').style.width = '100%';
            
            // Simulate logout process
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }
    
    restart() {
        if (confirm('Are you sure you want to restart?')) {
            this.showNotification('System Restart', 'Restarting Corridor OS...');
            setTimeout(() => location.reload(), 2000);
        }
    }
    
    shutdown() {
        if (confirm('Are you sure you want to shut down?')) {
            // Fade to black
            document.body.style.transition = 'opacity 2s ease';
            document.body.style.opacity = '0';
            
            setTimeout(() => {
                document.body.innerHTML = `
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        background: #000;
                        color: #fff;
                        font-family: Ubuntu, sans-serif;
                        flex-direction: column;
                        gap: 20px;
                    ">
                        <div style="font-size: 48px;">⏻</div>
                        <div>Corridor OS has shut down</div>
                        <div style="font-size: 14px; opacity: 0.7;">You can safely close this window</div>
                    </div>
                `;
            }, 2000);
        }
    }
    
    refreshDesktop() {
        // Refresh desktop icons and background
        this.showNotification('Desktop Refreshed', 'Desktop environment has been refreshed.');
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    showHelp() {
        this.openApp('help');
    }
    
    // Window management methods will be implemented in corridor-window-manager.js
    handleWindowInteraction(e) {
        // Delegate to window manager
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
    
    // App launching will be implemented in corridor-apps.js
    openApp(appName) {
        if (window.corridorApps) {
            window.corridorApps.openApp(appName);
        }
    }
    }

    // Global functions for HTML event handlers
function showActivitiesOverview() {
    window.corridorOS.showActivitiesOverview();
}

function showUserMenu() {
    window.corridorOS.showUserMenu();
}

function switchWorkspace(number) {
    window.corridorOS.switchWorkspace(number);
}

function lockScreen() {
    window.corridorOS.lockScreen();
}

function unlock() {
    window.corridorOS.unlock();
}

function logout() {
    window.corridorOS.logout();
}

function restart() {
    window.corridorOS.restart();
}

function shutdown() {
    window.corridorOS.shutdown();
}

function openApp(appName) {
    window.corridorOS.openApp(appName);
}

function createFile() {
    window.corridorOS.showNotification('Create File', 'File creation feature coming soon!');
}

function createFolder() {
    window.corridorOS.showNotification('Create Folder', 'Folder creation feature coming soon!');
}

function openTerminalHere() {
    window.corridorOS.openApp('terminal');
}

function openSettings() {
    window.corridorOS.openApp('settings');
}

// Notification Center global bindings
function toggleNotificationsPanel() {
    window.corridorOS.toggleNotificationsPanel();
}

function clearAllNotifications() {
    window.corridorOS.clearAllNotifications();
}

// Initialize Corridor OS when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.corridorOS = new CorridorOS();
});

// Add CSS for shake animation
const shakeCSS = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
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
`;

const style = document.createElement('style');
style.textContent = shakeCSS;
document.head.appendChild(style);

// Appearance helpers: apply saved theme/animation/font size on early init
CorridorOS.prototype.applySavedAppearanceOnStartup = function() {
    try {
        const savedRaw = localStorage.getItem('corridor-os-settings');
        if (!savedRaw) return;
        const saved = JSON.parse(savedRaw);
        const app = saved.appearance || {};
        if (app.theme) {
            document.body.setAttribute('data-theme', app.theme);
        }
        if (typeof app.animations === 'boolean') {
            document.body.classList.toggle('no-animations', !app.animations);
        }
        if (app.fontSize) {
            document.body.setAttribute('data-font-size', app.fontSize);
        }
        if (app.wallpaper) {
            document.body.setAttribute('data-wallpaper', app.wallpaper);
        }
    } catch (_) { /* ignore */ }
};
