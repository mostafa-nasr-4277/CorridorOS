// Corridor OS Window Manager
class CorridorWindowManager {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.zIndex = 1000;
        this.isDragging = false;
        this.isResizing = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.dragStartWindowPos = { x: 0, y: 0 };
        this.resizeStartPos = { x: 0, y: 0 };
        this.resizeStartSize = { width: 0, height: 0 };
        this.dragTarget = null;
        this.resizeTarget = null;
        this.resizeDirection = null;
    }
    
    createWindow(appId, title, icon, content, options = {}) {
        const windowId = `window-${appId}`;
        
        // Default window options
        const defaultOptions = {
            width: 800,
            height: 600,
            x: Math.random() * (window.innerWidth - 800) + 100,
            y: Math.random() * (window.innerHeight - 600) + 100,
            minWidth: 400,
            minHeight: 300,
            resizable: true,
            maximizable: true,
            closable: true
        };
        
        const windowOptions = { ...defaultOptions, ...options };
        
        // Create window element
        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        windowElement.id = windowId;
        windowElement.style.cssText = `
            left: ${windowOptions.x}px;
            top: ${windowOptions.y}px;
            width: ${windowOptions.width}px;
            height: ${windowOptions.height}px;
            z-index: ${++this.zIndex};
        `;
        
        // Window HTML structure
        windowElement.innerHTML = `
            <div class="window-titlebar" onmousedown="corridorWindowManager.startDrag(event, '${windowId}')">
                <div class="window-title-content">
                    <span class="window-icon">${icon}</span>
                    <span class="window-title">${title}</span>
                </div>
                <div class="window-controls">
                    ${windowOptions.closable ? `<div class="window-control minimize" onclick="corridorWindowManager.minimizeWindow('${windowId}')" title="Minimize"></div>` : ''}
                    ${windowOptions.maximizable ? `<div class="window-control maximize" onclick="corridorWindowManager.toggleMaximize('${windowId}')" title="Maximize"></div>` : ''}
                    ${windowOptions.closable ? `<div class="window-control close" onclick="corridorWindowManager.closeWindow('${windowId}')" title="Close"></div>` : ''}
                </div>
            </div>
            <div class="window-content">
                ${content}
            </div>
            ${windowOptions.resizable ? this.createResizeHandles() : ''}
        `;
        
        // Add to container
        const container = document.getElementById('windows-container');
        container.appendChild(windowElement);
        
        // Store window data
        this.windows.set(windowId, {
            element: windowElement,
            appId: appId,
            title: title,
            icon: icon,
            options: windowOptions,
            isMaximized: false,
            isMinimized: false,
            restoreState: null
        });
        
        // Set as active window
        this.focusWindow(windowElement);
        
        // Update dock indicator
        this.updateDockIndicator(appId, true);
        
        return windowElement;
    }
    
    createResizeHandles() {
        return `
            <div class="resize-handle resize-n" onmousedown="corridorWindowManager.startResize(event, 'n')"></div>
            <div class="resize-handle resize-s" onmousedown="corridorWindowManager.startResize(event, 's')"></div>
            <div class="resize-handle resize-e" onmousedown="corridorWindowManager.startResize(event, 'e')"></div>
            <div class="resize-handle resize-w" onmousedown="corridorWindowManager.startResize(event, 'w')"></div>
            <div class="resize-handle resize-ne" onmousedown="corridorWindowManager.startResize(event, 'ne')"></div>
            <div class="resize-handle resize-nw" onmousedown="corridorWindowManager.startResize(event, 'nw')"></div>
            <div class="resize-handle resize-se" onmousedown="corridorWindowManager.startResize(event, 'se')"></div>
            <div class="resize-handle resize-sw" onmousedown="corridorWindowManager.startResize(event, 'sw')"></div>
        `;
    }
    
    focusWindow(windowElement) {
        // Remove active class from all windows
        document.querySelectorAll('.window').forEach(win => {
            win.classList.remove('active');
        });
        
        // Set new active window
        windowElement.classList.add('active');
        windowElement.style.zIndex = ++this.zIndex;
        this.activeWindow = windowElement;
        
        // Focus first input in window if available
        const firstInput = windowElement.querySelector('input, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
    
    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        // Remove window element
        windowData.element.remove();
        
        // Remove from windows map
        this.windows.delete(windowId);
        
        // Update dock indicator
        this.updateDockIndicator(windowData.appId, false);
        
        // Set focus to next window
        if (this.activeWindow && this.activeWindow.id === windowId) {
            this.activeWindow = null;
            const remainingWindows = document.querySelectorAll('.window');
            if (remainingWindows.length > 0) {
                this.focusWindow(remainingWindows[remainingWindows.length - 1]);
            }
        }
        
        // Show notification
        if (window.corridorOS) {
            window.corridorOS.showNotification('Application Closed', `${windowData.title} has been closed`);
        }
    }
    
    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const windowElement = windowData.element;
        
        if (windowData.isMinimized) {
            // Restore window
            windowElement.style.display = 'flex';
            windowData.isMinimized = false;
            this.focusWindow(windowElement);
        } else {
            // Minimize window
            windowElement.style.display = 'none';
            windowData.isMinimized = true;
            
            // Set focus to next window
            if (this.activeWindow === windowElement) {
                this.activeWindow = null;
                const visibleWindows = Array.from(document.querySelectorAll('.window')).filter(win => 
                    win.style.display !== 'none'
                );
                if (visibleWindows.length > 0) {
                    this.focusWindow(visibleWindows[visibleWindows.length - 1]);
                }
            }
        }
    }
    
    toggleMaximize(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const windowElement = windowData.element;
        
        if (windowData.isMaximized) {
            // Restore window
            if (windowData.restoreState) {
                windowElement.style.cssText = windowData.restoreState;
                windowElement.classList.remove('maximized');
                windowData.isMaximized = false;
                windowData.restoreState = null;
            }
        } else {
            // Maximize window
            windowData.restoreState = windowElement.style.cssText;
            windowElement.style.cssText = `
                left: 0px !important;
                top: 0px !important;
                width: 100vw !important;
                height: calc(100vh - 48px) !important;
                z-index: ${windowElement.style.zIndex};
            `;
            windowElement.classList.add('maximized');
            windowData.isMaximized = true;
        }
        
        this.focusWindow(windowElement);
    }
    
    startDrag(event, windowId) {
        event.preventDefault();
        
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isMaximized) return;
        
        const windowElement = windowData.element;
        
        this.isDragging = true;
        this.dragTarget = windowElement;
        this.dragStartPos = { x: event.clientX, y: event.clientY };
        this.dragStartWindowPos = {
            x: parseInt(windowElement.style.left),
            y: parseInt(windowElement.style.top)
        };
        
        // Focus window
        this.focusWindow(windowElement);
        
        // Add dragging class
        windowElement.classList.add('dragging');
        document.body.style.cursor = 'move';
        document.body.style.userSelect = 'none';
    }
    
    startResize(event, direction) {
        event.preventDefault();
        event.stopPropagation();
        
        const windowElement = event.target.closest('.window');
        if (!windowElement) return;
        
        const windowData = this.windows.get(windowElement.id);
        if (!windowData || windowData.isMaximized) return;
        
        this.isResizing = true;
        this.resizeTarget = windowElement;
        this.resizeDirection = direction;
        this.resizeStartPos = { x: event.clientX, y: event.clientY };
        this.resizeStartSize = {
            width: windowElement.offsetWidth,
            height: windowElement.offsetHeight
        };
        
        // Focus window
        this.focusWindow(windowElement);
        
        // Set cursor
        const cursors = {
            'n': 'n-resize',
            's': 's-resize',
            'e': 'e-resize',
            'w': 'w-resize',
            'ne': 'ne-resize',
            'nw': 'nw-resize',
            'se': 'se-resize',
            'sw': 'sw-resize'
        };
        document.body.style.cursor = cursors[direction] || 'default';
        document.body.style.userSelect = 'none';
        
        // Add resizing class
        windowElement.classList.add('resizing');
    }
    
    handleMouseDown(event) {
        // Window focus handling
        const windowElement = event.target.closest('.window');
        if (windowElement) {
            this.focusWindow(windowElement);
        }
    }
    
    handleMouseMove(event) {
        if (this.isDragging && this.dragTarget) {
            const deltaX = event.clientX - this.dragStartPos.x;
            const deltaY = event.clientY - this.dragStartPos.y;
            
            let newX = this.dragStartWindowPos.x + deltaX;
            let newY = this.dragStartWindowPos.y + deltaY;
            
            // Keep window within viewport
            newX = Math.max(0, Math.min(newX, window.innerWidth - this.dragTarget.offsetWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - this.dragTarget.offsetHeight));
            
            this.dragTarget.style.left = `${newX}px`;
            this.dragTarget.style.top = `${newY}px`;
        }
        
        if (this.isResizing && this.resizeTarget) {
            const deltaX = event.clientX - this.resizeStartPos.x;
            const deltaY = event.clientY - this.resizeStartPos.y;
            
            const windowData = this.windows.get(this.resizeTarget.id);
            const minWidth = windowData.options.minWidth;
            const minHeight = windowData.options.minHeight;
            
            let newWidth = this.resizeStartSize.width;
            let newHeight = this.resizeStartSize.height;
            let newX = parseInt(this.resizeTarget.style.left);
            let newY = parseInt(this.resizeTarget.style.top);
            
            // Calculate new dimensions based on resize direction
            switch (this.resizeDirection) {
                case 'e':
                    newWidth = Math.max(minWidth, this.resizeStartSize.width + deltaX);
                    break;
                case 'w':
                    newWidth = Math.max(minWidth, this.resizeStartSize.width - deltaX);
                    newX = this.resizeStartSize.width - newWidth + parseInt(this.resizeTarget.style.left);
                    break;
                case 's':
                    newHeight = Math.max(minHeight, this.resizeStartSize.height + deltaY);
                    break;
                case 'n':
                    newHeight = Math.max(minHeight, this.resizeStartSize.height - deltaY);
                    newY = this.resizeStartSize.height - newHeight + parseInt(this.resizeTarget.style.top);
                    break;
                case 'se':
                    newWidth = Math.max(minWidth, this.resizeStartSize.width + deltaX);
                    newHeight = Math.max(minHeight, this.resizeStartSize.height + deltaY);
                    break;
                case 'sw':
                    newWidth = Math.max(minWidth, this.resizeStartSize.width - deltaX);
                    newHeight = Math.max(minHeight, this.resizeStartSize.height + deltaY);
                    newX = this.resizeStartSize.width - newWidth + parseInt(this.resizeTarget.style.left);
                    break;
                case 'ne':
                    newWidth = Math.max(minWidth, this.resizeStartSize.width + deltaX);
                    newHeight = Math.max(minHeight, this.resizeStartSize.height - deltaY);
                    newY = this.resizeStartSize.height - newHeight + parseInt(this.resizeTarget.style.top);
                    break;
                case 'nw':
                    newWidth = Math.max(minWidth, this.resizeStartSize.width - deltaX);
                    newHeight = Math.max(minHeight, this.resizeStartSize.height - deltaY);
                    newX = this.resizeStartSize.width - newWidth + parseInt(this.resizeTarget.style.left);
                    newY = this.resizeStartSize.height - newHeight + parseInt(this.resizeTarget.style.top);
                    break;
            }
            
            // Apply new dimensions
            this.resizeTarget.style.width = `${newWidth}px`;
            this.resizeTarget.style.height = `${newHeight}px`;
            this.resizeTarget.style.left = `${newX}px`;
            this.resizeTarget.style.top = `${newY}px`;
        }
    }
    
    handleMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            if (this.dragTarget) {
                this.dragTarget.classList.remove('dragging');
                this.dragTarget = null;
            }
        }
        
        if (this.isResizing) {
            this.isResizing = false;
            if (this.resizeTarget) {
                this.resizeTarget.classList.remove('resizing');
                this.resizeTarget = null;
            }
            this.resizeDirection = null;
        }
        
        // Reset cursor and selection
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
    
    updateDockIndicator(appId, isOpen) {
        const dockApp = document.querySelector(`[onclick*="${appId}"]`);
        if (dockApp) {
            dockApp.classList.toggle('active', isOpen);
        }
    }
    
    closeActiveWindow() {
        if (this.activeWindow) {
            this.closeWindow(this.activeWindow.id);
        }
    }
    
    getWindowByAppId(appId) {
        for (const [windowId, windowData] of this.windows) {
            if (windowData.appId === appId) {
                return windowData;
            }
        }
        return null;
    }
    
    getAllWindows() {
        return Array.from(this.windows.values());
    }
    
    minimizeAllWindows() {
        this.windows.forEach((windowData, windowId) => {
            if (!windowData.isMinimized) {
                this.minimizeWindow(windowId);
            }
        });
    }
    
    restoreAllWindows() {
        this.windows.forEach((windowData, windowId) => {
            if (windowData.isMinimized) {
                this.minimizeWindow(windowId);
            }
        });
    }
    
    tileWindows() {
        const visibleWindows = Array.from(this.windows.values()).filter(w => !w.isMinimized);
        if (visibleWindows.length === 0) return;
        
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight - 48; // Account for top panel
        
        // Simple tiling algorithm
        const cols = Math.ceil(Math.sqrt(visibleWindows.length));
        const rows = Math.ceil(visibleWindows.length / cols);
        const windowWidth = containerWidth / cols;
        const windowHeight = containerHeight / rows;
        
        visibleWindows.forEach((windowData, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const windowElement = windowData.element;
            windowElement.style.left = `${col * windowWidth}px`;
            windowElement.style.top = `${row * windowHeight}px`;
            windowElement.style.width = `${windowWidth}px`;
            windowElement.style.height = `${windowHeight}px`;
            
            windowElement.classList.remove('maximized');
            windowData.isMaximized = false;
        });
    }
}

// Create global instance
window.corridorWindowManager = new CorridorWindowManager();

// Add CSS for window management
const windowCSS = `
/* Window Management Styles */
.window {
    position: absolute;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-medium);
    box-shadow: var(--shadow-large);
    min-width: 400px;
    min-height: 300px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: var(--transition-medium);
}

.window.active {
    border-color: var(--primary-cyan);
    box-shadow: var(--shadow-large), var(--glow-cyan);
}

.window.dragging,
.window.resizing {
    transition: none;
    user-select: none;
}

.window-titlebar {
    height: 40px;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    cursor: move;
    user-select: none;
}

.window-title-content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
}

.window-icon {
    font-size: 16px;
    flex-shrink: 0;
}

.window-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.window-controls {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
}

.window-control {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    cursor: pointer;
    transition: var(--transition-fast);
    position: relative;
}

.window-control:hover {
    transform: scale(1.1);
}

.window-control.close {
    background: #ff5f56;
}

.window-control.minimize {
    background: #ffbd2e;
}

.window-control.maximize {
    background: #27ca3f;
}

.window-control:hover::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
}

.window-content {
    flex: 1;
    overflow: auto;
    background: var(--bg-secondary);
}

/* Resize Handles */
.resize-handle {
    position: absolute;
    background: transparent;
}

.resize-handle.resize-n {
    top: 0;
    left: 8px;
    right: 8px;
    height: 4px;
    cursor: n-resize;
}

.resize-handle.resize-s {
    bottom: 0;
    left: 8px;
    right: 8px;
    height: 4px;
    cursor: s-resize;
}

.resize-handle.resize-e {
    top: 8px;
    right: 0;
    bottom: 8px;
    width: 4px;
    cursor: e-resize;
}

.resize-handle.resize-w {
    top: 8px;
    left: 0;
    bottom: 8px;
    width: 4px;
    cursor: w-resize;
}

.resize-handle.resize-ne {
    top: 0;
    right: 0;
    width: 8px;
    height: 8px;
    cursor: ne-resize;
}

.resize-handle.resize-nw {
    top: 0;
    left: 0;
    width: 8px;
    height: 8px;
    cursor: nw-resize;
}

.resize-handle.resize-se {
    bottom: 0;
    right: 0;
    width: 8px;
    height: 8px;
    cursor: se-resize;
}

.resize-handle.resize-sw {
    bottom: 0;
    left: 0;
    width: 8px;
    height: 8px;
    cursor: sw-resize;
}

/* App-specific styles */
.settings-container {
    display: flex;
    height: 100%;
    background: var(--bg-secondary);
}

.settings-sidebar {
    width: 280px;
    background: var(--bg-tertiary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
}

.settings-search {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
}

.settings-search input {
    width: 100%;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-small);
    color: var(--text-primary);
    outline: none;
}

.settings-categories {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.settings-category {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: var(--radius-small);
    cursor: pointer;
    transition: var(--transition-fast);
    margin-bottom: 4px;
}

.settings-category:hover {
    background: var(--bg-glass-hover);
}

.settings-category.active {
    background: var(--primary-orange);
    color: white;
}

.category-icon {
    font-size: 20px;
    flex-shrink: 0;
}

.category-info {
    flex: 1;
    min-width: 0;
}

.category-name {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 2px;
}

.category-description {
    font-size: 12px;
    opacity: 0.8;
    line-height: 1.3;
}

.settings-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.settings-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap; /* keep tidy on smaller widths */
}

.settings-header h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
}

.settings-header p {
    color: var(--text-secondary);
    font-size: 14px;
}

.settings-header-left {
    display: flex;
    align-items: baseline;
    gap: 12px;
}

.settings-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.settings-panel {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

.settings-section {
    margin-bottom: 32px;
}

.settings-section h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text-primary);
}

.setting-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.setting-item:last-child {
    border-bottom: none;
}

.setting-info {
    flex: 1;
}

.setting-name {
    font-weight: 500;
    margin-bottom: 4px;
}

.setting-description {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.4;
}

.toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    transition: var(--transition-medium);
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 2px;
    bottom: 2px;
    background: var(--text-primary);
    border-radius: 50%;
    transition: var(--transition-medium);
}

input:checked + .toggle-slider {
    background: var(--primary-orange);
    border-color: var(--primary-orange);
}

input:checked + .toggle-slider:before {
    transform: translateX(20px);
}

.settings-input {
    padding: 8px 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-small);
    color: var(--text-primary);
    font-size: 14px;
    min-width: 200px;
}

.settings-select {
    padding: 8px 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-small);
    color: var(--text-primary);
    font-size: 14px;
    min-width: 150px;
}

.settings-button {
    padding: 10px 16px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-small);
    color: var(--text-primary);
    cursor: pointer;
    transition: var(--transition-fast);
}

.settings-button:hover {
    background: var(--bg-glass-hover);
}

.settings-button.primary {
    background: var(--primary-orange);
    border-color: var(--primary-orange);
    color: white;
}

.settings-button.primary:hover {
    background: #d14b1f;
}

.range-input {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 200px;
}

.range-input input[type="range"] {
    flex: 1;
}

.range-value {
    font-weight: 500;
    min-width: 40px;
    text-align: right;
}

/* Terminal App Styles */
.terminal-app {
    height: 100%;
    background: #1e1e1e;
    color: #00ff00;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    display: flex;
    flex-direction: column;
}

.terminal-header {
    padding: 8px 16px;
    background: #2d2d2d;
    border-bottom: 1px solid #444;
    font-size: 12px;
}

.terminal-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    line-height: 1.4;
}

.terminal-line {
    margin-bottom: 4px;
    word-wrap: break-word;
}

.terminal-prompt {
    color: #00d4ff;
    font-weight: bold;
}

.terminal-text {
    color: #00ff00;
}

.current-line {
    display: flex;
    align-items: center;
}

.terminal-input {
    background: transparent;
    border: none;
    outline: none;
    color: #00ff00;
    font-family: inherit;
    font-size: inherit;
    flex: 1;
    direction: ltr;
    text-align: left;
}

.terminal-cursor { display: none; }

@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}
`;

const windowStyle = document.createElement('style');
windowStyle.textContent = windowCSS;
document.head.appendChild(windowStyle);
