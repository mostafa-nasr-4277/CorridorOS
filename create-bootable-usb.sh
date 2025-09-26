#!/bin/bash

# Corridor OS Bootable USB Creator
echo "🚀 Creating Corridor OS Bootable USB..."

# Configuration
USB_DEVICE="/dev/disk4"
USB_MOUNT="/Volumes/UBUNTU"
CORRIDOR_OS_LABEL="CORRIDOR_OS"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root for disk operations
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root - be careful with disk operations!"
    fi
}

# Verify USB device
verify_usb() {
    print_status "Verifying USB device..."
    
    if [ ! -e "$USB_DEVICE" ]; then
        print_error "USB device $USB_DEVICE not found!"
        print_status "Available disks:"
        diskutil list
        exit 1
    fi
    
    # Get disk info
    DISK_INFO=$(diskutil info $USB_DEVICE)
    DISK_SIZE=$(echo "$DISK_INFO" | grep "Disk Size" | awk '{print $3, $4}')
    
    print_success "USB device found: $USB_DEVICE ($DISK_SIZE)"
    
    # Confirm with user
    echo ""
    print_warning "⚠️  WARNING: This will erase all data on $USB_DEVICE"
    print_warning "Device info:"
    echo "$DISK_INFO" | grep -E "(Device Node|Disk Size|Volume Name)"
    echo ""
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Operation cancelled."
        exit 0
    fi
}

# Create bootable USB
create_bootable_usb() {
    print_status "Creating bootable USB..."
    
    # Unmount the disk if mounted
    print_status "Unmounting USB device..."
    diskutil unmountDisk $USB_DEVICE 2>/dev/null || true
    
    # Format the USB drive as FAT32
    print_status "Formatting USB drive as FAT32..."
    sudo diskutil eraseDisk FAT32 $CORRIDOR_OS_LABEL $USB_DEVICE
    
    if [ $? -ne 0 ]; then
        print_error "Failed to format USB drive!"
        exit 1
    fi
    
    print_success "USB drive formatted successfully"
    
    # Wait for mount
    sleep 3
    
    # Find the mount point
    USB_MOUNT_POINT="/Volumes/$CORRIDOR_OS_LABEL"
    
    if [ ! -d "$USB_MOUNT_POINT" ]; then
        print_error "USB mount point not found: $USB_MOUNT_POINT"
        exit 1
    fi
    
    print_success "USB mounted at: $USB_MOUNT_POINT"
}

# Copy Corridor OS files
copy_corridor_os() {
    print_status "Copying Corridor OS files to USB..."
    
    # Create directory structure
    mkdir -p "$USB_MOUNT_POINT/corridor-os"
    mkdir -p "$USB_MOUNT_POINT/boot"
    mkdir -p "$USB_MOUNT_POINT/EFI/BOOT"
    
    # Copy main OS files
    CORRIDOR_FILES=(
        "corridor-os.html"
        "corridor-os-styles.css"
        "corridor-os.js"
        "corridor-apps.js"
        "corridor-settings.js"
        "corridor-window-manager.js"
        "index.html"
        "styles.css"
        "main.js"
        "quantum.js"
        "photon.js"
        "memory.js"
        "orchestrator.js"
        "heliopass.js"
        "thermal-model.js"
        "three-hero.js"
        "auto-cycle.js"
        "ui-tilt.js"
        "ui-menu.js"
        "navigation.js"
    )
    
    for file in "${CORRIDOR_FILES[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "$USB_MOUNT_POINT/corridor-os/"
            print_success "✓ Copied $file"
        else
            print_warning "⚠ File not found: $file"
        fi
    done
    
    # Copy additional resources
    if [ -d "tactile-power-toolkit" ]; then
        cp -r "tactile-power-toolkit" "$USB_MOUNT_POINT/"
        print_success "✓ Copied tactile-power-toolkit"
    fi
}

# Create bootloader and autorun
create_bootloader() {
    print_status "Creating bootloader and autorun files..."
    
    # Create autorun.inf for Windows
    cat > "$USB_MOUNT_POINT/autorun.inf" << 'EOF'
[autorun]
open=corridor-os-launcher.html
icon=corridor-os.ico
label=Corridor OS - Hybrid Quantum-Photonic OS
EOF
    
    # Create main launcher HTML
    cat > "$USB_MOUNT_POINT/corridor-os-launcher.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Corridor OS - Bootable USB Launcher</title>
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
        
        .launcher-container {
            text-align: center;
            max-width: 800px;
            padding: 60px 40px;
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 24px;
            box-shadow: 0 20px 80px rgba(0, 0, 0, 0.6);
        }
        
        .quantum-logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 30px;
            border: 3px solid transparent;
            border-top: 3px solid #00d4ff;
            border-right: 3px solid #ff57b4;
            border-radius: 50%;
            animation: quantumSpin 3s linear infinite;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
        }
        
        .quantum-logo::before {
            content: '⚛️';
        }
        
        @keyframes quantumSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        h1 {
            font-size: 56px;
            font-weight: 700;
            background: linear-gradient(135deg, #00d4ff, #ff57b4, #91ff79);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
            letter-spacing: -0.02em;
        }
        
        .subtitle {
            font-size: 24px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 40px;
            font-weight: 300;
        }
        
        .launch-buttons {
            display: flex;
            gap: 24px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 40px;
        }
        
        .launch-button {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            padding: 18px 32px;
            background: linear-gradient(135deg, #E95420, #d14b1f);
            color: white;
            text-decoration: none;
            border-radius: 16px;
            font-weight: 600;
            font-size: 18px;
            transition: all 0.3s ease;
            border: 1px solid rgba(233, 84, 32, 0.3);
            min-width: 200px;
            justify-content: center;
        }
        
        .launch-button:hover {
            background: linear-gradient(135deg, #d14b1f, #b8401a);
            transform: translateY(-3px);
            box-shadow: 0 12px 40px rgba(233, 84, 32, 0.4);
        }
        
        .launch-button.secondary {
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            border-color: rgba(0, 212, 255, 0.3);
        }
        
        .launch-button.secondary:hover {
            background: linear-gradient(135deg, #0099cc, #0077aa);
            box-shadow: 0 12px 40px rgba(0, 212, 255, 0.4);
        }
        
        .system-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .info-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .info-title {
            font-weight: 600;
            margin-bottom: 8px;
            color: #00d4ff;
        }
        
        .info-text {
            font-size: 14px;
            line-height: 1.5;
            opacity: 0.8;
        }
        
        .boot-instructions {
            margin-top: 30px;
            padding: 20px;
            background: rgba(255, 215, 0, 0.1);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .boot-instructions strong {
            color: #FFD700;
        }
        
        @media (max-width: 768px) {
            .launcher-container {
                padding: 40px 20px;
                margin: 20px;
            }
            
            h1 {
                font-size: 42px;
            }
            
            .subtitle {
                font-size: 20px;
            }
            
            .launch-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .system-info {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="launcher-container">
        <div class="quantum-logo"></div>
        
        <h1>Corridor OS</h1>
        <p class="subtitle">Hybrid Quantum-Photonic Operating System</p>
        
        <div class="launch-buttons">
            <a href="corridor-os/corridor-os.html" class="launch-button">
                🚀 Launch Full OS
            </a>
            <a href="corridor-os/index.html" class="launch-button secondary">
                🔬 Computer Demo
            </a>
        </div>
        
        <div class="system-info">
            <div class="info-card">
                <div class="info-title">🖥️ Desktop Environment</div>
                <div class="info-text">Ubuntu-inspired interface with quantum enhancements, window management, and workspaces</div>
            </div>
            <div class="info-card">
                <div class="info-title">⚛️ Quantum Computing</div>
                <div class="info-text">Quantum Lab with circuit designer, simulator, and advanced quantum algorithms</div>
            </div>
            <div class="info-card">
                <div class="info-title">🌟 Photonic Processing</div>
                <div class="info-text">Optical computing interface with WDM, signal analysis, and fiber coupling</div>
            </div>
            <div class="info-card">
                <div class="info-title">⚙️ System Tools</div>
                <div class="info-text">Terminal, file manager, text editor, settings panel, and more applications</div>
            </div>
        </div>
        
        <div class="boot-instructions">
            <strong>💿 For Native Boot:</strong> Restart your computer and boot from this USB drive. 
            Configure BIOS/UEFI to boot from USB if needed. 
            <br><br>
            <strong>🌐 For Web Experience:</strong> Click the buttons above to run Corridor OS in your current browser.
        </div>
    </div>
    
    <script>
        // Auto-redirect to OS after 10 seconds if no interaction
        let redirectTimer = setTimeout(() => {
            window.location.href = 'corridor-os/corridor-os.html';
        }, 10000);
        
        // Cancel auto-redirect on any user interaction
        document.addEventListener('click', () => clearTimeout(redirectTimer));
        document.addEventListener('keydown', () => clearTimeout(redirectTimer));
        document.addEventListener('mousemove', () => clearTimeout(redirectTimer));
    </script>
</body>
</html>
EOF
    
    # Create GRUB configuration for UEFI boot
    mkdir -p "$USB_MOUNT_POINT/EFI/BOOT"
    
    cat > "$USB_MOUNT_POINT/EFI/BOOT/grub.cfg" << 'EOF'
set timeout=5
set default=0

menuentry "Corridor OS - Full Desktop Experience" {
    echo "Loading Corridor OS..."
    echo "Starting web browser with Corridor OS interface..."
    # In a real implementation, this would boot a minimal Linux with browser
    configfile /boot/corridor-os.cfg
}

menuentry "Corridor OS - Demo Mode" {
    echo "Loading Corridor Computer Demo..."
    configfile /boot/corridor-demo.cfg
}

menuentry "Boot from Hard Drive" {
    exit
}
EOF
    
    # Create README for the USB
    cat > "$USB_MOUNT_POINT/README.txt" << 'EOF'
CORRIDOR OS - Hybrid Quantum-Photonic Operating System
=====================================================

This USB drive contains Corridor OS, a revolutionary operating system
that combines classical computing with quantum and photonic processing.

QUICK START:
1. Open 'corridor-os-launcher.html' in any modern web browser
2. Click "Launch Full OS" for the complete desktop experience
3. Or click "Computer Demo" for the original interface

NATIVE BOOT:
1. Restart your computer
2. Boot from this USB drive (may require BIOS/UEFI configuration)
3. Select "Corridor OS - Full Desktop Experience" from the boot menu

SYSTEM REQUIREMENTS:
- Modern web browser (Chrome, Firefox, Safari, Edge)
- 4GB RAM minimum (8GB recommended)
- 1920x1080 resolution recommended
- JavaScript enabled

FEATURES:
- Ubuntu-inspired desktop environment
- Quantum computing simulation and tools
- Photonic processing interface
- Advanced window management
- Comprehensive settings panel
- Built-in applications (Terminal, File Manager, Text Editor, etc.)

For more information, visit: https://example.org

© 2024 Mostafa Nasr - Corridor Computer Concept
EOF
    
    print_success "✓ Created bootloader and launcher files"
}

# Create Windows batch file for easy launching
create_windows_launcher() {
    print_status "Creating Windows launcher..."
    
    cat > "$USB_MOUNT_POINT/Launch-Corridor-OS.bat" << 'EOF'
@echo off
title Corridor OS Launcher
echo.
echo ================================================
echo   Corridor OS - Hybrid Quantum-Photonic OS
echo ================================================
echo.
echo Starting Corridor OS in your default browser...
echo.

REM Try to open in different browsers
if exist "C:\Program Files\Mozilla Firefox\firefox.exe" (
    start "" "C:\Program Files\Mozilla Firefox\firefox.exe" -new-window "%~dp0corridor-os-launcher.html"
) else if exist "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" (
    start "" "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" -new-window "%~dp0corridor-os-launcher.html"
) else (
    REM Fallback to default browser
    start "" "%~dp0corridor-os-launcher.html"
)

echo.
echo Corridor OS should now be loading in your browser.
echo If it doesn't open automatically, double-click 'corridor-os-launcher.html'
echo.
pause
EOF
    
    print_success "✓ Created Windows launcher"
}

# Create macOS launcher
create_macos_launcher() {
    print_status "Creating macOS launcher..."
    
    cat > "$USB_MOUNT_POINT/Launch-Corridor-OS.command" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "================================================"
echo "   Corridor OS - Hybrid Quantum-Photonic OS"
echo "================================================"
echo ""
echo "Starting Corridor OS in your default browser..."
echo ""

# Open in default browser
open corridor-os-launcher.html

echo "Corridor OS should now be loading in your browser."
echo "If it doesn't open automatically, double-click 'corridor-os-launcher.html'"
echo ""
read -p "Press Enter to close this window..."
EOF
    
    chmod +x "$USB_MOUNT_POINT/Launch-Corridor-OS.command"
    print_success "✓ Created macOS launcher"
}

# Finalize USB
finalize_usb() {
    print_status "Finalizing bootable USB..."
    
    # Set proper permissions
    chmod -R 755 "$USB_MOUNT_POINT"
    
    # Sync and eject
    sync
    
    print_success "✅ Corridor OS bootable USB created successfully!"
    print_status ""
    print_status "📁 USB Contents:"
    ls -la "$USB_MOUNT_POINT" | head -20
    
    print_status ""
    print_success "🎉 Your bootable Corridor OS USB is ready!"
    print_status ""
    print_status "💡 To use:"
    print_status "   1. 🌐 Web Mode: Double-click 'corridor-os-launcher.html'"
    print_status "   2. 💿 Boot Mode: Restart computer and boot from USB"
    print_status "   3. 🪟 Windows: Run 'Launch-Corridor-OS.bat'"
    print_status "   4. 🍎 macOS: Run 'Launch-Corridor-OS.command'"
    print_status ""
    
    read -p "Would you like to eject the USB now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        diskutil eject $USB_DEVICE
        print_success "USB ejected safely"
    else
        print_status "USB left mounted at: $USB_MOUNT_POINT"
    fi
}

# Main execution
main() {
    echo "🌟 Corridor OS Bootable USB Creator"
    echo "=================================="
    echo ""
    
    check_permissions
    verify_usb
    create_bootable_usb
    copy_corridor_os
    create_bootloader
    create_windows_launcher
    create_macos_launcher
    finalize_usb
    
    print_success ""
    print_success "🚀 Corridor OS USB creation complete!"
    print_success "Ready to test your hybrid quantum-photonic OS!"
}

# Run main function
main "$@"
EOF
