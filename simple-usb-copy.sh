#!/bin/bash

# Simple Corridor OS USB Copy Script
echo "🚀 Creating Corridor OS for USB..."

# Create a portable directory
PORTABLE_DIR="./corridor-os-portable"
echo "📁 Creating portable directory: $PORTABLE_DIR"

# Remove old directory if it exists
rm -rf "$PORTABLE_DIR"
mkdir -p "$PORTABLE_DIR"

# Copy all Corridor OS files
echo "📋 Copying Corridor OS files..."

# Main OS files
cp corridor-os.html "$PORTABLE_DIR/"
cp corridor-os-styles.css "$PORTABLE_DIR/"
cp corridor-os.js "$PORTABLE_DIR/"
cp corridor-apps.js "$PORTABLE_DIR/"
cp corridor-settings.js "$PORTABLE_DIR/"
cp corridor-window-manager.js "$PORTABLE_DIR/"

# Original Corridor Computer files
cp index.html "$PORTABLE_DIR/"
cp styles.css "$PORTABLE_DIR/"
cp main.js "$PORTABLE_DIR/"
cp quantum.js "$PORTABLE_DIR/"
cp photon.js "$PORTABLE_DIR/"
cp memory.js "$PORTABLE_DIR/"
cp orchestrator.js "$PORTABLE_DIR/"
cp heliopass.js "$PORTABLE_DIR/"
cp thermal-model.js "$PORTABLE_DIR/"
cp three-hero.js "$PORTABLE_DIR/"
cp auto-cycle.js "$PORTABLE_DIR/"
cp ui-tilt.js "$PORTABLE_DIR/"
cp ui-menu.js "$PORTABLE_DIR/"
cp navigation.js "$PORTABLE_DIR/"

# Copy tactile power toolkit
if [ -d "tactile-power-toolkit" ]; then
    cp -r tactile-power-toolkit "$PORTABLE_DIR/"
fi

# Create a simple launcher
cat > "$PORTABLE_DIR/START-CORRIDOR-OS.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Corridor OS - Portable Launcher</title>
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
            max-width: 600px;
            padding: 60px 40px;
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 24px;
            box-shadow: 0 20px 80px rgba(0, 0, 0, 0.6);
        }
        
        .logo {
            width: 100px;
            height: 100px;
            margin: 0 auto 30px;
            border: 3px solid transparent;
            border-top: 3px solid #00d4ff;
            border-right: 3px solid #ff57b4;
            border-radius: 50%;
            animation: spin 3s linear infinite;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        h1 {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, #00d4ff, #ff57b4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
        }
        
        .subtitle {
            font-size: 20px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 40px;
        }
        
        .launch-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 30px;
        }
        
        .launch-button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #E95420, #d14b1f);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            min-width: 180px;
        }
        
        .launch-button:hover {
            background: linear-gradient(135deg, #d14b1f, #b8401a);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(233, 84, 32, 0.4);
        }
        
        .launch-button.secondary {
            background: linear-gradient(135deg, #00d4ff, #0099cc);
        }
        
        .launch-button.secondary:hover {
            background: linear-gradient(135deg, #0099cc, #0077aa);
            box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
        }
        
        .info {
            margin-top: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .info strong {
            color: #00d4ff;
        }
    </style>
</head>
<body>
    <div class="launcher">
        <div class="logo">⚛️</div>
        
        <h1>Corridor OS</h1>
        <p class="subtitle">Hybrid Quantum-Photonic Operating System</p>
        
        <div class="launch-buttons">
            <a href="corridor-os.html" class="launch-button">
                🚀 Launch Full OS
            </a>
            <a href="index.html" class="launch-button secondary">
                🔬 Computer Demo
            </a>
        </div>
        
        <div class="info">
            <strong>💡 Instructions:</strong><br>
            • Click "Launch Full OS" for the complete desktop experience<br>
            • Click "Computer Demo" for the original Corridor Computer interface<br>
            • Copy this entire folder to any USB drive for portable use<br>
            • Works on Windows, macOS, and Linux
        </div>
    </div>
    
    <script>
        // Auto-redirect to OS after 8 seconds
        setTimeout(() => {
            window.location.href = 'corridor-os.html';
        }, 8000);
    </script>
</body>
</html>
EOF

# Create Windows batch file
cat > "$PORTABLE_DIR/Launch-Corridor-OS.bat" << 'EOF'
@echo off
title Corridor OS Launcher
echo.
echo ================================================
echo   Corridor OS - Hybrid Quantum-Photonic OS
echo ================================================
echo.
echo Starting Corridor OS...
echo.

REM Try different browsers
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --new-window "%~dp0START-CORRIDOR-OS.html"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --new-window "%~dp0START-CORRIDOR-OS.html"
) else if exist "C:\Program Files\Mozilla Firefox\firefox.exe" (
    start "" "C:\Program Files\Mozilla Firefox\firefox.exe" -new-window "%~dp0START-CORRIDOR-OS.html"
) else (
    start "" "%~dp0START-CORRIDOR-OS.html"
)

echo Corridor OS should now be loading...
pause
EOF

# Create macOS launcher
cat > "$PORTABLE_DIR/Launch-Corridor-OS.command" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Corridor OS..."
open START-CORRIDOR-OS.html
EOF

chmod +x "$PORTABLE_DIR/Launch-Corridor-OS.command"

# Create README
cat > "$PORTABLE_DIR/README.txt" << 'EOF'
CORRIDOR OS - Portable Version
==============================

This is a portable version of Corridor OS that can run from any USB drive
or local folder without installation.

QUICK START:
1. Double-click "START-CORRIDOR-OS.html" to launch
2. Or run "Launch-Corridor-OS.bat" (Windows) / "Launch-Corridor-OS.command" (macOS)

FEATURES:
- Complete desktop operating system experience
- Quantum computing simulation and tools
- Photonic processing interface
- Ubuntu-inspired interface
- Advanced window management
- Built-in applications

SYSTEM REQUIREMENTS:
- Modern web browser (Chrome, Firefox, Safari, Edge)
- 4GB RAM minimum
- JavaScript enabled

For more info: https://example.org
© 2024 Mostafa Nasr - Corridor Computer Concept
EOF

echo "✅ Portable Corridor OS created successfully!"
echo ""
echo "📁 Location: $PORTABLE_DIR"
echo ""
echo "💡 To use:"
echo "   1. Copy the '$PORTABLE_DIR' folder to your USB drive"
echo "   2. Double-click 'START-CORRIDOR-OS.html' on any computer"
echo "   3. Or run the appropriate launcher script"
echo ""
echo "🚀 Ready to test Corridor OS!"

# Show the contents
echo "📋 Contents:"
ls -la "$PORTABLE_DIR"
