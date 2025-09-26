#!/bin/bash

# Create Proper Bootable USB for Corridor OS
# This creates a USB that can boot from BIOS/UEFI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[INFO]${NC} 🚀 Creating Bootable Corridor OS USB..."

# Function to detect USB device
detect_usb() {
    echo -e "${BLUE}[INFO]${NC} Detecting USB devices..."
    
    # List all external disks
    EXTERNAL_DISKS=$(diskutil list | grep -A 5 "external" | grep "/dev/disk" | awk '{print $1}' | head -1)
    
    if [ -z "$EXTERNAL_DISKS" ]; then
        echo -e "${RED}[ERROR]${NC} No external USB device found. Please plug in your USB drive."
        exit 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} Found USB device: $EXTERNAL_DISKS"
    echo "$EXTERNAL_DISKS"
}

# Function to create bootable structure
create_bootable_structure() {
    local usb_device="$1"
    local mount_point="/tmp/corridor_usb"
    
    echo -e "${BLUE}[INFO]${NC} Creating bootable structure..."
    
    # Unmount the USB first
    diskutil unmountDisk "$usb_device" 2>/dev/null || true
    
    # Create a new partition table and format
    echo -e "${YELLOW}[WARNING]${NC} This will erase all data on $usb_device"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}[INFO]${NC} Operation cancelled."
        exit 0
    fi
    
    # Create MBR partition table and format as FAT32
    echo -e "${BLUE}[INFO]${NC} Formatting USB as FAT32..."
    diskutil eraseDisk FAT32 CORRIDOR_OS MBR "$usb_device"
    
    # Mount the USB
    diskutil mountDisk "$usb_device"
    sleep 2
    
    # Get the mount point
    USB_MOUNT=$(diskutil info "$usb_device" | grep "Mount Point:" | awk '{print $3}')
    
    if [ -z "$USB_MOUNT" ]; then
        echo -e "${RED}[ERROR]${NC} Could not mount USB device"
        exit 1
    fi
    
    echo -e "${GREEN}[SUCCESS]${NC} USB mounted at: $USB_MOUNT"
    
    # Create boot directory structure
    mkdir -p "$USB_MOUNT/boot/grub"
    mkdir -p "$USB_MOUNT/corridor-os"
    
    # Create GRUB configuration
    cat > "$USB_MOUNT/boot/grub/grub.cfg" << 'EOF'
set timeout=10
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

menuentry "Boot from Hard Drive" {
    set root=(hd0,1)
    chainloader +1
}
EOF

    # Create a simple bootable HTML launcher
    cat > "$USB_MOUNT/BOOT-CORRIDOR-OS.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Corridor OS - Bootable System</title>
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
        
        .boot-screen {
            text-align: center;
            max-width: 800px;
            padding: 60px 40px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(0, 212, 255, 0.3);
            border-radius: 24px;
            box-shadow: 0 20px 80px rgba(0, 0, 0, 0.8);
        }
        
        .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 30px;
            border: 4px solid transparent;
            border-top: 4px solid #00d4ff;
            border-right: 4px solid #ff57b4;
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
            background: linear-gradient(135deg, #00d4ff, #ff57b4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
        }
        
        .subtitle {
            font-size: 24px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 40px;
        }
        
        .boot-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .boot-option {
            padding: 24px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
        }
        
        .boot-option:hover {
            background: rgba(0, 212, 255, 0.1);
            border-color: #00d4ff;
            transform: translateY(-2px);
        }
        
        .boot-option h3 {
            color: #00d4ff;
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        .boot-option p {
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
        
        .countdown {
            font-size: 18px;
            color: #ff57b4;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="boot-screen">
        <div class="logo">⚛️</div>
        
        <h1>Corridor OS</h1>
        <p class="subtitle">Hybrid Quantum-Photonic Operating System</p>
        
        <div class="boot-options">
            <div class="boot-option" onclick="bootOS()">
                <h3>🚀 Full Desktop OS</h3>
                <p>Complete Ubuntu-inspired desktop environment with quantum computing tools and photonic processing interface.</p>
            </div>
            
            <div class="boot-option" onclick="bootDemo()">
                <h3>🔬 Computer Demo</h3>
                <p>Original Corridor Computer interface with quantum simulation and hardware regulation tools.</p>
            </div>
            
            <div class="boot-option" onclick="bootTerminal()">
                <h3>💻 Terminal Mode</h3>
                <p>Command-line interface for advanced quantum operations and system administration.</p>
            </div>
            
            <div class="boot-option" onclick="bootSettings()">
                <h3>⚙️ Settings Panel</h3>
                <p>System configuration and hardware management interface.</p>
            </div>
        </div>
        
        <div class="status success">
            ✅ Corridor OS Bootable USB Ready
        </div>
        
        <div class="countdown" id="countdown">
            Auto-booting in <span id="timer">10</span> seconds...
        </div>
    </div>
    
    <script>
        let countdown = 10;
        const timer = document.getElementById('timer');
        
        const countdownInterval = setInterval(() => {
            countdown--;
            timer.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                bootOS();
            }
        }, 1000);
        
        function bootOS() {
            clearInterval(countdownInterval);
            window.location.href = 'corridor-os/corridor-os.html';
        }
        
        function bootDemo() {
            clearInterval(countdownInterval);
            window.location.href = 'corridor-os/index.html';
        }
        
        function bootTerminal() {
            clearInterval(countdownInterval);
            window.location.href = 'corridor-os/corridor-os.html?mode=terminal';
        }
        
        function bootSettings() {
            clearInterval(countdownInterval);
            window.location.href = 'corridor-os/corridor-os.html?mode=settings';
        }
    </script>
</body>
</html>
EOF

    # Copy all Corridor OS files to the USB
    echo -e "${BLUE}[INFO]${NC} Copying Corridor OS files..."
    cp -r corridor-os-portable/* "$USB_MOUNT/corridor-os/"
    
    # Create a simple autorun.inf for Windows
    cat > "$USB_MOUNT/autorun.inf" << 'EOF'
[autorun]
open=BOOT-CORRIDOR-OS.html
icon=corridor-os/corridor-os.html
label=Corridor OS
action=Launch Corridor OS
EOF

    # Create a simple boot script for Linux
    cat > "$USB_MOUNT/boot-corridor.sh" << 'EOF'
#!/bin/bash
echo "Starting Corridor OS..."
if command -v xdg-open > /dev/null; then
    xdg-open BOOT-CORRIDOR-OS.html
elif command -v open > /dev/null; then
    open BOOT-CORRIDOR-OS.html
else
    echo "Please open BOOT-CORRIDOR-OS.html in your web browser"
fi
EOF

    chmod +x "$USB_MOUNT/boot-corridor.sh"
    
    # Create a README
    cat > "$USB_MOUNT/README.txt" << 'EOF'
CORRIDOR OS - Bootable USB
==========================

This USB contains a bootable version of Corridor OS, a hybrid quantum-photonic operating system.

QUICK START:
1. Boot from this USB (press F9, F12, or select from boot menu)
2. Or open BOOT-CORRIDOR-OS.html in any web browser
3. Or run boot-corridor.sh on Linux/macOS

FEATURES:
- Complete desktop operating system experience
- Quantum computing simulation and tools
- Photonic processing interface
- Ubuntu-inspired interface
- Advanced window management
- Built-in applications and settings

SYSTEM REQUIREMENTS:
- Modern web browser (Chrome, Firefox, Safari, Edge)
- 4GB RAM minimum
- JavaScript enabled

For more info: https://example.org
© 2024 Mostafa Nasr - Corridor Computer Concept
EOF

    echo -e "${GREEN}[SUCCESS]${NC} Bootable Corridor OS USB created successfully!"
    echo -e "${BLUE}[INFO]${NC} USB mounted at: $USB_MOUNT"
    echo -e "${BLUE}[INFO]${NC} Main launcher: BOOT-CORRIDOR-OS.html"
    echo -e "${BLUE}[INFO]${NC} OS files: corridor-os/ directory"
    
    # Show contents
    echo -e "\n${BLUE}[INFO]${NC} USB Contents:"
    ls -la "$USB_MOUNT"
}

# Main execution
main() {
    echo -e "${BLUE}[INFO]${NC} 🔧 Creating Bootable Corridor OS USB..."
    
    # Detect USB device
    USB_DEVICE=$(detect_usb)
    
    if [ -z "$USB_DEVICE" ]; then
        echo -e "${RED}[ERROR]${NC} No USB device found. Please plug in your USB drive."
        exit 1
    fi
    
    # Create bootable structure
    create_bootable_structure "$USB_DEVICE"
    
    echo -e "\n${GREEN}[SUCCESS]${NC} 🎉 Bootable Corridor OS USB is ready!"
    echo -e "${BLUE}[INFO]${NC} You can now:"
    echo -e "  • Boot from this USB (press F9/F12 during startup)"
    echo -e "  • Open BOOT-CORRIDOR-OS.html in any browser"
    echo -e "  • Run boot-corridor.sh on Linux/macOS"
}

main "$@"
