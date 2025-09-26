#!/usr/bin/env python3
import os, zlib, struct

MAGENTA = (0xFF, 0x00, 0x80, 0xFF)  # #ff0080
PURPLE  = (0x8B, 0x00, 0xFF, 0xFF)  # #8b00ff

def chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

def write_png(path, w, h, pixels_rgba):
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)  # 8-bit RGBA
    # add filter byte 0 for each scanline
    raw = bytearray()
    row_bytes = w * 4
    for y in range(h):
        raw.append(0)
        start = y * row_bytes
        raw.extend(pixels_rgba[start:start+row_bytes])
    idat = zlib.compress(bytes(raw), 9)
    png = sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(png)

def solid(w, h, rgba):
    return bytes(rgba) * (w * h)

def lerp(a, b, t):
    return int(a + (b - a) * t)

def gradient_lr(w, h, left_rgba, right_rgba):
    buf = bytearray()
    for _y in range(h):
        for x in range(w):
            t = x / (w - 1 if w > 1 else 1)
            r = lerp(left_rgba[0], right_rgba[0], t)
            g = lerp(left_rgba[1], right_rgba[1], t)
            b = lerp(left_rgba[2], right_rgba[2], t)
            a = lerp(left_rgba[3], right_rgba[3], t)
            buf.extend((r, g, b, a))
    return bytes(buf)

def pill_gradient(w, h, left_rgba, right_rgba, border_rgba=None, border_px=0):
    buf = bytearray()
    r = h // 2
    for y in range(h):
        for x in range(w):
            inside = False
            if r <= x < w - r:
                inside = True
            else:
                cx = r if x < r else (w - r - 1)
                dx = x - cx
                dy = y - r
                inside = (dx*dx + dy*dy) <= (r*r)

            if inside:
                t = x / (w - 1 if w > 1 else 1)
                rr = lerp(left_rgba[0], right_rgba[0], t)
                gg = lerp(left_rgba[1], right_rgba[1], t)
                bb = lerp(left_rgba[2], right_rgba[2], t)
                aa = 255
                # Optional border ring
                if border_rgba and border_px > 0:
                    on_edge = False
                    if not (border_px <= x < w - border_px and border_px <= y < h - border_px):
                        on_edge = True
                    else:
                        if x < r:
                            cx = r
                            dx = x - cx
                            dy = y - r
                            d2 = dx*dx + dy*dy
                            on_edge = d2 >= (r - border_px) * (r - border_px)
                        elif x >= w - r:
                            cx = w - r - 1
                            dx = x - cx
                            dy = y - r
                            d2 = dx*dx + dy*dy
                            on_edge = d2 >= (r - border_px) * (r - border_px)
                    if on_edge:
                        rr, gg, bb, aa = border_rgba
                buf.extend((rr, gg, bb, aa))
            else:
                buf.extend((0, 0, 0, 0))
    return bytes(buf)

def main():
    out_dir = os.path.join('brand', 'pngs')
    os.makedirs(out_dir, exist_ok=True)

    # Solids
    write_png(os.path.join(out_dir, 'magenta_solid_256.png'), 256, 256, solid(256, 256, MAGENTA))
    write_png(os.path.join(out_dir, 'purple_solid_256.png'), 256, 256, solid(256, 256, PURPLE))

    # Gradient banner
    write_png(os.path.join(out_dir, 'grad_1024x256.png'), 1024, 256, gradient_lr(1024, 256, MAGENTA, PURPLE))
    write_png(os.path.join(out_dir, 'grad_512x128.png'), 512, 128, gradient_lr(512, 128, MAGENTA, PURPLE))
    write_png(os.path.join(out_dir, 'grad_1920x480.png'), 1920, 480, gradient_lr(1920, 480, MAGENTA, PURPLE))

    # Transparent pill backgrounds
    border = (255, 255, 255, 64)
    write_png(os.path.join(out_dir, 'pill_transparent_240x56.png'), 240, 56, pill_gradient(240, 56, MAGENTA, PURPLE, border_rgba=border, border_px=1))
    write_png(os.path.join(out_dir, 'pill_transparent_512x128.png'), 512, 128, pill_gradient(512, 128, MAGENTA, PURPLE, border_rgba=border, border_px=2))

if __name__ == '__main__':
    main()
