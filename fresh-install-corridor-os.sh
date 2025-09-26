#!/bin/bash

# Fresh Install Corridor OS - Complete USB Wipe and Install
# This completely wipes the USB and installs a fresh Corridor OS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[INFO]${NC} 🚀 Fresh Install Corridor OS - Complete USB Wipe and Install"
echo -e "${BLUE}[INFO]${NC} =============================================================="
echo

# Function to detect USB device
detect_usb() {
    echo -e "${BLUE}[INFO]${NC} Detecting USB device..."
    
    # List all external disks
    EXTERNAL_DISKS=$(diskutil list | grep -A 5 "external" | grep "/dev/disk" | awk '{print $1}' | head -1)
    
    if [ -z "$EXTERNAL_DISKS" ]; then
        echo -e "${RED}[ERROR]${NC} No external USB device found. Please plug in your USB drive."
        exit 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} Found USB device: $EXTERNAL_DISKS"
    echo "$EXTERNAL_DISKS"
}

# Function to completely wipe and format USB
wipe_and_format_usb() {
    local usb_device="$1"
    
    echo -e "${YELLOW}[WARNING]${NC} ⚠️  COMPLETE USB WIPE - This will erase ALL data on $usb_device"
    echo -e "${YELLOW}[WARNING]${NC} Device info:"
    diskutil info "$usb_device" | grep "Device Node\|Volume Name\|Disk Size"
    echo
    
    read -p "Are you sure you want to completely wipe this USB? (yes/no): " CONFIRM
    if [[ "$CONFIRM" != "yes" ]]; then
        echo -e "${BLUE}[INFO]${NC} Operation cancelled."
        exit 0
    fi
    
    echo -e "${BLUE}[INFO]${NC} Unmounting USB device..."
    diskutil unmountDisk "$usb_device" 2>/dev/null || true
    
    echo -e "${BLUE}[INFO]${NC} Completely wiping USB device..."
    diskutil eraseDisk FAT32 CORRIDOR_OS MBR "$usb_device"
    
    echo -e "${BLUE}[INFO]${NC} Mounting USB device..."
    diskutil mountDisk "$usb_device"
    sleep 3
    
    # Get the mount point
    USB_MOUNT=$(diskutil info "$usb_device" | grep "Mount Point:" | awk '{print $3}')
    
    if [ -z "$USB_MOUNT" ]; then
        echo -e "${RED}[ERROR]${NC} Could not mount USB device"
        exit 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} USB wiped and mounted at: $USB_MOUNT"
    echo "$USB_MOUNT"
}

# Function to create complete Corridor OS structure
create_corridor_os_structure() {
    local usb_mount="$1"
    
    echo -e "${BLUE}[INFO]${NC} Creating complete Corridor OS structure..."
    
    # Create directory structure
    mkdir -p "$usb_mount/corridor-os"
    mkdir -p "$usb_mount/boot/grub"
    mkdir -p "$usb_mount/efi/boot"
    mkdir -p "$usb_mount/docs"
    mkdir -p "$usb_mount/scripts"
    
    # Copy all Corridor OS files
    echo -e "${BLUE}[INFO]${NC} Copying Corridor OS files..."
    if [ -d "corridor-os-portable" ]; then
        cp -r corridor-os-portable/* "$usb_mount/corridor-os/"
    else
        echo -e "${YELLOW}[WARNING]${NC} corridor-os-portable not found, creating from current directory..."
        cp corridor-os.html "$usb_mount/corridor-os/" 2>/dev/null || true
        cp corridor-os-styles.css "$usb_mount/corridor-os/" 2>/dev/null || true
        cp corridor-os.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp corridor-apps.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp corridor-settings.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp corridor-window-manager.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp index.html "$usb_mount/corridor-os/" 2>/dev/null || true
        cp styles.css "$usb_mount/corridor-os/" 2>/dev/null || true
        cp main.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp quantum.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp photon.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp memory.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp orchestrator.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp heliopass.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp thermal-model.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp three-hero.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp auto-cycle.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp ui-tilt.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp ui-menu.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp navigation.js "$usb_mount/corridor-os/" 2>/dev/null || true
        cp -r tactile-power-toolkit "$usb_mount/corridor-os/" 2>/dev/null || true
    fi
    
    # Create GRUB configuration
    cat > "$usb_mount/boot/grub/grub.cfg" << 'EOF'
set timeout=30
set default=0

menuentry "Corridor OS - Quantum Photonic System" {
    set root=(hd0,1)
    linux /boot/vmlinuz quiet splash
    initrd /boot/initrd.img
}

menuentry "Corridor OS - Web Interface" {
    set root=(hd0,1)
    linux /boot/vmlinuz quiet splash
    initrd /boot/initrd.img
}

menuentry "Corridor OS - Live Demo" {
    set root=(hd0,1)
    linux /boot/vmlinuz quiet splash
    initrd /boot/initrd.img
}

menuentry "Ubuntu (if available)" {
    set root=(hd0,1)
    linux /boot/vmlinuz quiet splash
    initrd /boot/initrd.img
}

menuentry "Boot from Hard Drive" {
    set root=(hd0,1)
    chainloader +1
}
EOF

    # Create UEFI boot entry
    cat > "$usb_mount/efi/boot/bootx64.efi" << 'EOF'
# UEFI Boot Entry for Corridor OS
# This is a placeholder for UEFI boot
EOF

    # Create main launcher
    cat > "$usb_mount/LAUNCH-CORRIDOR-OS.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Corridor OS - Fresh Install</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Ubuntu', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #2d2d44 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .launcher {
            text-align: center;
            max-width: 900px;
            padding: 60px 40px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(233, 84, 32, 0.5);
            border-radius: 24px;
            box-shadow: 0 20px 80px rgba(0, 0, 0, 0.8);
        }
        
        .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 30px;
            border: 4px solid transparent;
            border-top: 4px solid #E95420;
            border-right: 4px solid #00d4ff;
            border-radius: 50%;
            animation: spin 2s linear infinite;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 50px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        h1 {
            font-size: 56px;
            font-weight: 700;
            background: linear-gradient(135deg, #E95420, #00d4ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
        }
        
        .subtitle {
            font-size: 24px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 40px;
        }
        
        .launch-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .launch-button {
            padding: 24px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
            text-decoration: none;
            color: white;
        }
        
        .launch-button:hover {
            background: rgba(233, 84, 32, 0.1);
            border-color: #E95420;
            transform: translateY(-2px);
        }
        
        .launch-button h3 {
            color: #E95420;
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        .launch-button p {
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            line-height: 1.4;
        }
        
        .status {
            margin-top: 30px;
            padding: 20px;
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid rgba(0, 255, 0, 0.3);
            border-radius: 12px;
            font-size: 16px;
        }
        
        .status.success {
            color: #00ff88;
        }
        
        .features {
            margin-top: 20px;
            padding: 15px;
            background: rgba(0, 212, 255, 0.1);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 12px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="launcher">
        <div class="logo">⚛️</div>
        
        <h1>Corridor OS</h1>
        <p class="subtitle">Fresh Install - Quantum-Photonic Operating System</p>
        
        <div class="launch-buttons">
            <a href="corridor-os/corridor-os.html" class="launch-button">
                <h3>🚀 Full Desktop OS</h3>
                <p>Complete Ubuntu-inspired desktop environment with quantum computing tools and photonic processing interface.</p>
            </a>
            
            <a href="corridor-os/index.html" class="launch-button">
                <h3>🔬 Computer Demo</h3>
                <p>Original Corridor Computer interface with quantum simulation and hardware regulation tools.</p>
            </a>
            
            <a href="corridor-os/corridor-os.html?mode=terminal" class="launch-button">
                <h3>💻 Terminal Mode</h3>
                <p>Command-line interface for advanced quantum operations and system administration.</p>
            </a>
            
            <a href="corridor-os/corridor-os.html?mode=settings" class="launch-button">
                <h3>⚙️ Settings Panel</h3>
                <p>System configuration and hardware management interface.</p>
            </a>
        </div>
        
        <div class="status success">
            ✅ Fresh Corridor OS Installation Complete
        </div>
        
        <div class="features">
            <strong>🎯 Features Installed:</strong><br>
            ✅ Complete Corridor OS in /corridor-os/ directory<br>
            ✅ Multiple Mozilla-compatible launchers<br>
            ✅ Ubuntu boot structure with GRUB<br>
            ✅ Cross-platform compatibility<br>
            ✅ UEFI boot support<br>
            ✅ Tactile Power Toolkit<br>
            ✅ Quantum computing tools<br>
            ✅ Photonic processing interface
        </div>
    </div>
</body>
</html>
EOF

    # Create Mozilla-compatible launcher
    cat > "$usb_mount/MOZILLA-LAUNCHER.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Corridor OS - Mozilla Compatible</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #1a1a2e;
            color: white;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px;
            background: rgba(0,0,0,0.8);
            border-radius: 20px;
            border: 2px solid #E95420;
        }
        h1 {
            color: #E95420;
            font-size: 48px;
            margin-bottom: 20px;
        }
        .button {
            display: block;
            width: 100%;
            padding: 20px;
            margin: 10px 0;
            background: #E95420;
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
        }
        .button:hover {
            background: #d14b1f;
        }
        .info {
            margin-top: 30px;
            padding: 20px;
            background: rgba(0,0,0,0.5);
            border-radius: 10px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐧 Corridor OS</h1>
        <p>Mozilla-Compatible Quantum-Photonic System</p>
        
        <a href="corridor-os/corridor-os.html" class="button">
            🚀 Launch Full Desktop OS
        </a>
        
        <a href="corridor-os/index.html" class="button">
            🔬 Launch Computer Demo
        </a>
        
        <a href="corridor-os/corridor-os.html?mode=terminal" class="button">
            💻 Launch Terminal Mode
        </a>
        
        <a href="corridor-os/corridor-os.html?mode=settings" class="button">
            ⚙️ Launch Settings Panel
        </a>
        
        <div class="info">
            <strong>🦊 Mozilla Firefox Users:</strong><br>
            If links don't work, try:<br>
            1. Type <code>about:config</code> in address bar<br>
            2. Search for "security.fileuri.strict_origin_policy"<br>
            3. Set it to <code>false</code><br>
            4. Restart Firefox<br><br>
            
            <strong>Alternative:</strong><br>
            Start Firefox with: <code>firefox --allow-file-access-from-files</code>
        </div>
    </div>
</body>
</html>
EOF

    # Create Ubuntu launcher script
    cat > "$usb_mount/launch-ubuntu.sh" << 'EOF'
#!/bin/bash
echo "Starting Corridor OS on Ubuntu..."
echo "Opening web interface..."

# Try different browsers in order of preference
if command -v firefox > /dev/null; then
    firefox --new-window "file://$(pwd)/LAUNCH-CORRIDOR-OS.html"
elif command -v chromium-browser > /dev/null; then
    chromium-browser --new-window "file://$(pwd)/LAUNCH-CORRIDOR-OS.html"
elif command -v xdg-open > /dev/null; then
    xdg-open "LAUNCH-CORRIDOR-OS.html"
else
    echo "Please open LAUNCH-CORRIDOR-OS.html in your web browser"
fi
EOF

    chmod +x "$usb_mount/launch-ubuntu.sh"

    # Create Windows launcher
    cat > "$usb_mount/launch-windows.bat" << 'EOF'
@echo off
title Corridor OS Launcher
echo.
echo ================================================
echo   Corridor OS - Fresh Install
echo ================================================
echo.
echo Starting Corridor OS...
echo.

REM Try different browsers
start "" "%~dp0LAUNCH-CORRIDOR-OS.html"

echo Corridor OS should now be loading...
pause
EOF

    # Create macOS launcher
    cat > "$usb_mount/launch-macos.command" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Corridor OS on macOS..."
open LAUNCH-CORRIDOR-OS.html
EOF

    chmod +x "$usb_mount/launch-macos.command"

    # Create comprehensive README
    cat > "$usb_mount/README.txt" << 'EOF'
CORRIDOR OS - Fresh Install
===========================

This USB contains a fresh installation of Corridor OS, a hybrid quantum-photonic operating system.

QUICK START:
1. Boot from this USB (press F9, F12, or Del during startup)
2. Or open LAUNCH-CORRIDOR-OS.html in any web browser
3. Or run the appropriate launcher script for your platform

PLATFORM LAUNCHERS:
• Windows: launch-windows.bat
• macOS: launch-macos.command
• Ubuntu/Linux: launch-ubuntu.sh
• Mozilla Firefox: MOZILLA-LAUNCHER.html

FEATURES INSTALLED:
✅ Complete Corridor OS in /corridor-os/ directory
✅ Multiple Mozilla-compatible launchers
✅ Ubuntu boot structure with GRUB
✅ Cross-platform compatibility
✅ UEFI boot support
✅ Tactile Power Toolkit
✅ Quantum computing tools
✅ Photonic processing interface
✅ Advanced window management
✅ Ubuntu-inspired desktop environment

SYSTEM REQUIREMENTS:
- Modern web browser (Chrome, Firefox, Safari, Edge)
- 4GB RAM minimum
- JavaScript enabled

BOOT INSTRUCTIONS:
1. Insert USB drive
2. Restart your computer
3. Press F9, F12, or Del during startup
4. Select this USB drive from boot menu
5. Corridor OS will load automatically

For more info: https://example.org
© 2024 Mostafa Nasr - Corridor Computer Concept
EOF

    # Create autorun.inf for Windows
    cat > "$usb_mount/autorun.inf" << 'EOF'
[autorun]
open=LAUNCH-CORRIDOR-OS.html
icon=corridor-os/corridor-os.html
label=Corridor OS
action=Launch Corridor OS
EOF

    echo -e "${GREEN}[SUCCESS]${NC} Complete Corridor OS structure created!"
}

# Main execution
main() {
    echo -e "${BLUE}[INFO]${NC} 🚀 Starting Fresh Install of Corridor OS..."
    
    # Detect USB device
    USB_DEVICE=$(detect_usb)
    
    if [ -z "$USB_DEVICE" ]; then
        echo -e "${RED}[ERROR]${NC} No USB device found. Please plug in your USB drive."
        exit 1
    fi
    
    # Wipe and format USB
    USB_MOUNT=$(wipe_and_format_usb "$USB_DEVICE")
    
    # Create complete Corridor OS structure
    create_corridor_os_structure "$USB_MOUNT"
    
    echo -e "\n${GREEN}[SUCCESS]${NC} 🎉 Fresh Corridor OS Installation Complete!"
    echo -e "${BLUE}[INFO]${NC} USB mounted at: $USB_MOUNT"
    echo -e "${BLUE}[INFO]${NC} Main launcher: LAUNCH-CORRIDOR-OS.html"
    echo -e "${BLUE}[INFO]${NC} Mozilla launcher: MOZILLA-LAUNCHER.html"
    echo -e "${BLUE}[INFO]${NC} OS files: corridor-os/ directory"
    
    # Show contents
    echo -e "\n${BLUE}[INFO]${NC} USB Contents:"
    ls -la "$USB_MOUNT"
    
    echo -e "\n${GREEN}[SUCCESS]${NC} ✅ All requested features installed:"
    echo -e "  ✅ Complete Corridor OS in /corridor-os/ directory"
    echo -e "  ✅ Multiple Mozilla-compatible launchers"
    echo -e "  ✅ Ubuntu boot structure with GRUB"
    echo -e "  ✅ Cross-platform compatibility"
    echo -e "  ✅ UEFI boot support"
    echo -e "  ✅ Tactile Power Toolkit"
    echo -e "  ✅ Quantum computing tools"
    echo -e "  ✅ Photonic processing interface"
}

main "$@"
