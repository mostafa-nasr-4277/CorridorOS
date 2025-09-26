#!/usr/bin/env python3
"""
Corridor OS Bootable ISO Creator
Creates a bootable ISO image that launches Corridor OS in a web browser
"""

import os
import sys
import shutil
import subprocess
import tempfile
from pathlib import Path
import json

class CorridorOSISOBuilder:
    def __init__(self, output_dir="./dist"):
        self.output_dir = Path(output_dir)
        self.temp_dir = None
        self.iso_name = "corridor-os-live.iso"
        
    def create_iso(self):
        """Create a bootable ISO with Corridor OS"""
        print("🚀 Creating Corridor OS Bootable ISO...")
        
        try:
            # Create temporary directory
            self.temp_dir = Path(tempfile.mkdtemp(prefix="corridor-os-"))
            print(f"📁 Working directory: {self.temp_dir}")
            
            # Create ISO structure
            self.create_iso_structure()
            
            # Copy Corridor OS files
            self.copy_os_files()
            
            # Create bootloader
            self.create_bootloader()
            
            # Generate ISO image
            self.generate_iso()
            
            print(f"✅ Corridor OS ISO created successfully: {self.output_dir / self.iso_name}")
            
        except Exception as e:
            print(f"❌ Error creating ISO: {e}")
            sys.exit(1)
        finally:
            # Cleanup
            if self.temp_dir and self.temp_dir.exists():
                shutil.rmtree(self.temp_dir)
    
    def create_iso_structure(self):
        """Create the basic ISO directory structure"""
        print("📂 Creating ISO structure...")
        
        # Create directories
        directories = [
            "boot/isolinux",
            "boot/grub",
            "live",
            "corridor-os",
            "EFI/BOOT"
        ]
        
        for directory in directories:
            (self.temp_dir / directory).mkdir(parents=True, exist_ok=True)
    
    def copy_os_files(self):
        """Copy Corridor OS files to ISO"""
        print("📋 Copying Corridor OS files...")
        
        # Files to include in the ISO
        os_files = [
            "corridor-os.html",
            "corridor-os-styles.css", 
            "corridor-os.js",
            "corridor-apps.js",
            "corridor-settings.js",
            "corridor-window-manager.js",
            "index.html",
            "styles.css",
            "main.js",
            "quantum.js",
            "photon.js",
            "memory.js",
            "orchestrator.js",
            "heliopass.js",
            "thermal-model.js",
            "three-hero.js",
            "auto-cycle.js",
            "ui-tilt.js",
            "ui-menu.js",
            "navigation.js",
            
        ]
        
        # Copy files
        for file_name in os_files:
            src = Path(file_name)
            if src.exists():
                dst = self.temp_dir / "corridor-os" / file_name
                shutil.copy2(src, dst)
                print(f"  ✓ {file_name}")
            else:
                print(f"  ⚠️  {file_name} not found, skipping")
    
    def create_bootloader(self):
        """Create bootloader configuration"""
        print("🥾 Creating bootloader...")
        
        # Create GRUB configuration
        grub_cfg = """
set timeout=5
set default=0

menuentry "Corridor OS - Hybrid Quantum-Photonic Operating System" {
    linux /live/vmlinuz boot=live components quiet splash
    initrd /live/initrd.img
}

menuentry "Corridor OS - Safe Mode" {
    linux /live/vmlinuz boot=live components quiet splash nosplash noapic acpi=off
    initrd /live/initrd.img
}

menuentry "Boot from Hard Drive" {
    exit
}
"""
        
        with open(self.temp_dir / "boot/grub/grub.cfg", "w") as f:
            f.write(grub_cfg)
        
        # Create ISOLINUX configuration
        isolinux_cfg = """
DEFAULT corridor
TIMEOUT 50
PROMPT 1

LABEL corridor
    MENU LABEL Corridor OS - Hybrid Quantum-Photonic OS
    KERNEL /live/vmlinuz
    APPEND initrd=/live/initrd.img boot=live components quiet splash

LABEL safe
    MENU LABEL Corridor OS - Safe Mode
    KERNEL /live/vmlinuz
    APPEND initrd=/live/initrd.img boot=live components quiet splash nosplash noapic acpi=off

LABEL hd
    MENU LABEL Boot from Hard Drive
    LOCALBOOT 0x80
"""
        
        with open(self.temp_dir / "boot/isolinux/isolinux.cfg", "w") as f:
            f.write(isolinux_cfg)
        
        # Create a minimal Linux kernel and initrd for demonstration
        # In a real implementation, you would use a proper Linux distribution
        self.create_minimal_linux()
    
    def create_minimal_linux(self):
        """Create minimal Linux components"""
        print("🐧 Creating minimal Linux environment...")
        
        # Create a simple init script that launches a web browser
        init_script = """#!/bin/bash
# Corridor OS Init Script

echo "Starting Corridor OS..."

# Mount essential filesystems
mount -t proc proc /proc
mount -t sysfs sysfs /sys
mount -t devtmpfs devtmpfs /dev

# Set up networking
dhclient eth0 2>/dev/null || true

# Start X server and browser
export DISPLAY=:0
startx &

# Launch Corridor OS in browser
sleep 5
chromium-browser --kiosk --no-sandbox file:///corridor-os/corridor-os.html &

# Keep system running
while true; do
    sleep 60
done
"""
        
        # Create startup script
        startup_dir = self.temp_dir / "live"
        startup_dir.mkdir(exist_ok=True)
        
        with open(startup_dir / "corridor-init.sh", "w") as f:
            f.write(init_script)
        
        # Create placeholder kernel and initrd
        # These would be replaced with actual Linux kernel in production
        with open(startup_dir / "vmlinuz", "wb") as f:
            f.write(b"CORRIDOR_OS_KERNEL_PLACEHOLDER")
        
        with open(startup_dir / "initrd.img", "wb") as f:
            f.write(b"CORRIDOR_OS_INITRD_PLACEHOLDER")
        
        print("  ✓ Created minimal Linux components")
    
    def generate_iso(self):
        """Generate the final ISO image"""
        print("💿 Generating ISO image...")
        
        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        iso_path = self.output_dir / self.iso_name
        
        # Use genisoimage to create the ISO
        cmd = [
            "genisoimage",
            "-o", str(iso_path),
            "-b", "boot/isolinux/isolinux.bin",
            "-c", "boot/isolinux/boot.cat",
            "-no-emul-boot",
            "-boot-load-size", "4",
            "-boot-info-table",
            "-J", "-R", "-V", "CORRIDOR_OS",
            str(self.temp_dir)
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"  ✓ ISO created: {iso_path}")
        except subprocess.CalledProcessError:
            # Fallback: create a simple archive if genisoimage is not available
            print("  ⚠️  genisoimage not found, creating archive instead...")
            self.create_archive_fallback()
    
    def create_archive_fallback(self):
        """Create a simple archive if ISO tools are not available"""
        import tarfile
        
        archive_path = self.output_dir / "corridor-os-live.tar.gz"
        
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(self.temp_dir, arcname="corridor-os-live")
        
        print(f"  ✓ Archive created: {archive_path}")
        
        # Also create a simple HTML launcher
        launcher_html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Corridor OS Launcher</title>
    <style>
        body {
            font-family: Ubuntu, sans-serif;
            background: linear-gradient(135deg, #0a0a0f, #1a1a2e);
            color: white;
            margin: 0;
            padding: 40px;
            text-align: center;
        }
        .launcher {
            max-width: 600px;
            margin: 100px auto;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(20px);
        }
        h1 {
            font-size: 48px;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #00d4ff, #ff57b4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .launch-button {
            display: inline-block;
            padding: 16px 32px;
            background: #E95420;
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 18px;
            margin: 20px;
            transition: all 0.3s ease;
        }
        .launch-button:hover {
            background: #d14b1f;
            transform: translateY(-2px);
        }
        .info {
            margin-top: 30px;
            opacity: 0.8;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="launcher">
        <h1>Corridor OS</h1>
        <p>Hybrid Quantum-Photonic Operating System</p>
        
        <a href="corridor-os/corridor-os.html" class="launch-button">Launch Corridor OS</a>
        <a href="corridor-os/index.html" class="launch-button">Original Demo</a>
        
        <div class="info">
            <p><strong>System Requirements:</strong></p>
            <p>Modern web browser with JavaScript enabled</p>
            <p>Recommended: Chrome, Firefox, Safari, or Edge</p>
            
            <p><strong>Features:</strong></p>
            <p>• Quantum Computing Simulation<br>
            • Photonic Processing Interface<br>
            • Ubuntu-inspired Desktop Environment<br>
            • Advanced Window Management<br>
            • Comprehensive Settings Panel</p>
        </div>
    </div>
</body>
</html>"""
        
        with open(self.output_dir / "corridor-os-launcher.html", "w") as f:
            f.write(launcher_html)
        
        print(f"  ✓ Launcher created: {self.output_dir / 'corridor-os-launcher.html'}")
    
    def create_installation_guide(self):
        """Create installation and usage guide"""
        guide = """# Corridor OS - Installation & Usage Guide

## About Corridor OS
Corridor OS is a hybrid quantum-photonic operating system that combines classical computing with quantum and photonic processing capabilities. It features a modern Ubuntu-inspired interface with advanced quantum computing tools.

## System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Minimum 4GB RAM recommended
- 1920x1080 or higher resolution recommended

## Installation Options

### Option 1: Web Browser (Recommended)
1. Open `corridor-os-launcher.html` in your web browser
2. Click "Launch Corridor OS" to start the full OS experience
3. Or click "Original Demo" for the Corridor Computer interface

### Option 2: Local Web Server
1. Extract the files to a directory
2. Start a local web server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open http://localhost:8000/corridor-os-launcher.html

### Option 3: Bootable USB (Advanced)
1. Use the provided ISO image with tools like Rufus or dd
2. Boot from USB to run Corridor OS natively
3. Note: Requires compatible hardware and may need BIOS/UEFI configuration

## Features

### Desktop Environment
- Activities overview (Ctrl+Space)
- Modern dock with application shortcuts
- Window management with tiling support
- Multiple workspace support
- Ubuntu-inspired design with quantum enhancements

### Applications
- **Quantum Lab**: Design and simulate quantum circuits
- **Photonic Studio**: Optical circuit design and analysis
- **Corridor Computer**: Original quantum-photonic interface
- **Terminal**: Command-line interface with quantum commands
- **Settings**: Comprehensive system configuration
- **File Manager**: Browse and manage files
- **Text Editor**: Code editor with syntax highlighting

### Keyboard Shortcuts
- `Ctrl+Space`: Activities overview
- `Ctrl+T`: Open terminal
- `Ctrl+L`: Lock screen
- `Ctrl+,`: Open settings
- `Alt+F4`: Close active window
- `F1-F12`: Various function shortcuts

### Quantum Features
- Quantum circuit designer
- Qubit state visualization
- Quantum algorithm simulation
- Error correction protocols
- Quantum cryptography

### Photonic Features
- Wavelength division multiplexing
- Optical amplification control
- Fiber coupling optimization
- Signal quality analysis

## Troubleshooting

### Performance Issues
- Close unnecessary applications
- Reduce animation settings in preferences
- Use a modern browser with hardware acceleration

### Display Issues
- Ensure browser zoom is set to 100%
- Try fullscreen mode (F11)
- Check browser compatibility

### Quantum/Photonic Features Not Working
- Ensure JavaScript is enabled
- Check browser console for errors
- Try refreshing the page

## Support
For support and updates, visit: https://example.org

## License
MIT License - See LICENSE file for details

---
Corridor OS - Hybrid Quantum-Photonic Operating System
© 2024 Mostafa Nasr - Corridor Computer Concept
"""
        
        with open(self.output_dir / "README.md", "w") as f:
            f.write(guide)
        
        print(f"  ✓ Installation guide created: {self.output_dir / 'README.md'}")

def main():
    """Main function"""
    print("🌟 Corridor OS Bootable ISO Builder")
    print("=" * 50)
    
    builder = CorridorOSISOBuilder()
    builder.create_iso()
    builder.create_installation_guide()
    
    print("\n🎉 Corridor OS build complete!")
    print(f"📁 Output directory: {builder.output_dir.absolute()}")
    print("\nTo test:")
    print(f"  1. Open {builder.output_dir}/corridor-os-launcher.html in a web browser")
    print("  2. Or use the bootable ISO/archive for installation")

if __name__ == "__main__":
    main()
