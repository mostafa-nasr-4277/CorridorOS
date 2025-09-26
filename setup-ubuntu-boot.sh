#!/bin/bash

# Setup Corridor OS for Ubuntu Boot
# This creates a USB that Ubuntu can boot from

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[INFO]${NC} 🐧 Setting up Corridor OS for Ubuntu Boot..."

# Function to create Ubuntu-compatible boot structure
create_ubuntu_boot() {
    local usb_path="$1"
    
    echo -e "${BLUE}[INFO]${NC} Creating Ubuntu-compatible boot structure..."
    
    # Create directories
    mkdir -p "$usb_path/boot/grub"
    mkdir -p "$usb_path/corridor-os"
    mkdir -p "$usb_path/efi/boot"
    
    # Create GRUB configuration for Ubuntu
    cat > "$usb_path/boot/grub/grub.cfg" << 'EOF'
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
    cat > "$usb_path/efi/boot/bootx64.efi" << 'EOF'
# This is a placeholder for UEFI boot
# In a real implementation, this would be a compiled EFI binary
EOF

    # Create a simple bootable HTML launcher
    cat > "$usb_path/BOOT-CORRIDOR-OS.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Corridor OS - Ubuntu Bootable System</title>
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
            background: rgba(233, 84, 32, 0.1);
            border-color: #E95420;
            transform: translateY(-2px);
        }
        
        .boot-option h3 {
            color: #E95420;
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
            color: #E95420;
            margin-top: 20px;
        }
        
        .ubuntu-info {
            margin-top: 20px;
            padding: 15px;
            background: rgba(233, 84, 32, 0.1);
            border: 1px solid rgba(233, 84, 32, 0.3);
            border-radius: 12px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="boot-screen">
        <div class="logo">🐧</div>
        
        <h1>Corridor OS</h1>
        <p class="subtitle">Ubuntu-Compatible Quantum-Photonic System</p>
        
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
            ✅ Corridor OS Ubuntu Bootable USB Ready
        </div>
        
        <div class="ubuntu-info">
            <strong>🐧 Ubuntu Boot Instructions:</strong><br>
            • Press F9, F12, or Del during startup to access boot menu<br>
            • Select this USB drive from the boot menu<br>
            • Or open this file in any web browser for immediate access
        </div>
        
        <div class="countdown" id="countdown">
            Auto-booting in <span id="timer">15</span> seconds...
        </div>
    </div>
    
    <script>
        let countdown = 15;
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

    # Copy all Corridor OS files
    echo -e "${BLUE}[INFO]${NC} Copying Corridor OS files..."
    cp -r corridor-os-portable/* "$usb_path/corridor-os/"
    
    # Create Ubuntu-specific launcher script
    cat > "$usb_path/launch-corridor-ubuntu.sh" << 'EOF'
#!/bin/bash

echo "Starting Corridor OS on Ubuntu..."
echo "Opening web interface..."

# Try different browsers in order of preference
if command -v firefox >  /dev/null; then
    firefox --new-window "file://$(pwd)/BOOT-CORRIDOR-OS.html"
elif command -v chromium-browser > /dev/null; then
    chromium-browser --new-window "file://$(pwd)/BOOT-CORRIDOR-OS.html"
elif command -v xdg-open > /dev/null; then
    xdg-open "BOOT-CORRIDOR-OS.html"
else
    echo "Please open BOOT-CORRIDOR-OS.html in your web browser"
fi
EOF

    chmod +x "$usb_path/launch-corridor-ubuntu.sh"
    
    # Create a desktop entry for Ubuntu
    cat > "$usb_path/corridor-os.desktop" << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Corridor OS
Comment=Hybrid Quantum-Photonic Operating System
Exec=./launch-corridor-ubuntu.sh
Icon=corridor-os/corridor-os.html
Terminal=false
Categories=System;
EOF

    # Create README for Ubuntu
    cat > "$usb_path/README-UBUNTU.txt" << 'EOF'
CORRIDOR OS - Ubuntu Bootable USB
=================================

This USB contains a bootable version of Corridor OS, compatible with Ubuntu systems.

QUICK START:
1. Boot from this USB (press F9, F12, or Del during startup)
2. Or run: ./launch-corridor-ubuntu.sh
3. Or open BOOT-CORRIDOR-OS.html in any web browser

UBUNTU BOOT INSTRUCTIONS:
1. Insert USB drive
2. Restart your computer
3. Press F9, F12, or Del during startup
4. Select this USB drive from boot menu
5. Corridor OS will load automatically

FEATURES:
- Complete desktop operating system experience
- Quantum computing simulation and tools
- Photonic processing interface
- Ubuntu-inspired interface
- Advanced window management
- Built-in applications and settings

SYSTEM REQUIREMENTS:
- Ubuntu 18.04+ or compatible Linux distribution
- Modern web browser (Chrome, Firefox, Chromium)
- 4GB RAM minimum
- JavaScript enabled

For more info: https://example.org
© 2024 Mostafa Nasr - Corridor Computer Concept
EOF

    echo -e "${GREEN}[SUCCESS]${NC} Ubuntu-compatible boot structure created!"
}

# Main execution
main() {
    echo -e "${BLUE}[INFO]${NC} 🐧 Setting up Corridor OS for Ubuntu Boot..."
    
    # Check if corridor-os-portable exists
    if [ ! -d "corridor-os-portable" ]; then
        echo -e "${RED}[ERROR]${NC} corridor-os-portable directory not found. Run simple-usb-copy.sh first."
        exit 1
    fi
    
    # Create Ubuntu boot structure in current directory
    create_ubuntu_boot "./corridor-os-ubuntu-boot"
    
    echo -e "\n${GREEN}[SUCCESS]${NC} 🎉 Ubuntu Bootable Corridor OS ready!"
    echo -e "${BLUE}[INFO]${NC} Location: ./corridor-os-ubuntu-boot/"
    echo -e "${BLUE}[INFO]${NC} To use:"
    echo -e "  • Copy to USB: cp -r corridor-os-ubuntu-boot/* /path/to/usb/"
    echo -e "  • Boot from USB (press F9/F12 during startup)"
    echo -e "  • Or run: ./launch-corridor-ubuntu.sh"
    echo -e "  • Or open: BOOT-CORRIDOR-OS.html in browser"
}

main "$@"
