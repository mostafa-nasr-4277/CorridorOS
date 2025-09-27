#!/usr/bin/env python3
"""
Create a lightweight PDF presentation (no external deps) with built‑in Helvetica.
Outputs: CorridorOS_Presentation.pdf in repo root.
"""
from typing import List, Tuple

PAGE_W, PAGE_H = 792, 612  # Landscape Letter in points
MARGIN_X, MARGIN_Y = 60, 60

slides: List[Tuple[str, str, str]] = [
    (
        "CorridorOS — Theory of Compute",
        "A 2‑minute tour",
        "Photonic corridors (λ lanes), Free‑Form Memory (CXL) with bandwidth floors, HELIOPASS calibration, and system safety.",
    ),
    (
        "HELIOPASS — Photonic Environment Calibration",
        "Stabilize BER and eye with minimal power",
        "HELIOPASS estimates background offset from lunar, airglow, galactic, and skyglow contributions and tunes bias/λ to hold error targets.",
    ),
    (
        "Photonic Corridors (λ Lanes)",
        "Reserve wavelength sets per workload",
        "Corridors allocate WDM lanes with policy: shaping, preemption guards, and power‑aware bias tuning via HELIOPASS integration.",
    ),
    (
        "Free‑Form Memory (CXL)",
        "GB/s floors as first‑class resources",
        "Pooled memory carved into QoS bundles with floor guarantees and latency classes; exposed to schedulers via CRDs and attested at boot.",
    ),
    (
        "Tactile Power — Pin‑free, Genderless",
        "Pad‑to‑pad, magnet‑aligned, or contactless",
        "Devices receive power without exposed pins: capacitive/inductive couplers with pre‑charge, or flush pads with current sharing.",
    ),
    (
        "Observability — Proof, Not Promises",
        "Grafana Pack · Floors · BER · Energy/Bit",
        "CorridorOS exports floors, lane utilization, BER, and energy/bit out‑of‑the‑box. Golden dashboards ship day one — pilots see p99 drop, floors hold.",
    ),
    (
        "Security & Integrity — Built‑In",
        "Measured Boot · SPDM · PQC Ready",
        "Attested startup, signed components, SPDM policy lanes, and PQC‑ready crypto harden the plane — production stays safe; Labs stays sandboxed.",
    ),
    (
        "Putting It Together",
        "Schedule compute, light, memory — and power",
        "CorridorOS unifies photonic corridors, calibrated by HELIOPASS, with QoS memory and safe, pin‑free power delivery — observable and schedulable from day one.",
    ),
]

# Simple PDF builder
class PDF:
    def __init__(self):
        self.objs: List[bytes] = []
        self.offsets: List[int] = []
        self.pages = []
        self.font_obj = None

    def add_object(self, body: bytes) -> int:
        self.objs.append(body)
        return len(self.objs)

    def add_font(self) -> int:
        body = b"<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>"
        self.font_obj = self.add_object(body)
        return self.font_obj

    def add_page(self, content_obj: int) -> int:
        # Resources: only font F1
        resources = f"<< /Font << /F1 {self.font_obj} 0 R >> >>".encode()
        body = (
            b"<< /Type /Page /Parent 0 0 R /MediaBox [0 0 %d %d] " % (PAGE_W, PAGE_H)
            + b"/Resources " + resources + b" /Contents %d 0 R >>" % (content_obj)
        )
        page_obj = self.add_object(body)
        self.pages.append(page_obj)
        return page_obj

    def add_stream(self, stream: bytes) -> int:
        body = b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream"
        return self.add_object(body)

    def build(self) -> bytes:
        # Build Pages tree
        kids = b"[" + b" ".join(f"{n} 0 R".encode() for n in self.pages) + b"]"
        pages_body = b"<< /Type /Pages /Count %d /Kids %s >>" % (len(self.pages), kids)
        pages_obj = self.add_object(pages_body)

        # Fix page parent refs (replace placeholder 0 0 R with actual pages ref)
        fixed = []
        for i, body in enumerate(self.objs, start=1):
            if body.startswith(b"<< /Type /Page "):
                body = body.replace(b"/Parent 0 0 R", f"/Parent {pages_obj} 0 R".encode())
            fixed.append(body)
        self.objs = fixed

        catalog_obj = self.add_object(f"<< /Type /Catalog /Pages {pages_obj} 0 R >>".encode())

        # Assemble file
        out = bytearray()
        out += b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
        self.offsets = []
        for idx, body in enumerate(self.objs, start=1):
            self.offsets.append(len(out))
            out += f"{idx} 0 obj\n".encode() + body + b"\nendobj\n"
        xref_pos = len(out)
        out += b"xref\n0 %d\n" % (len(self.objs) + 1)
        out += b"0000000000 65535 f \n"
        for off in self.offsets:
            out += f"{off:010d} 00000 n \n".encode()
        out += b"trailer<< /Size %d /Root %d 0 R >>\nstartxref\n%d\n%%%%EOF" % (
            len(self.objs) + 1,
            len(self.objs),  # catalog is last object
            xref_pos,
        )
        return bytes(out)


def esc(s: str) -> str:
    return s.replace("(", "\\(").replace(")", "\\)")


def wrap(text: str, width: int) -> List[str]:
    words = text.split()
    lines, cur = [], []
    for w in words:
        if sum(len(x) for x in cur) + len(cur) + len(w) > width:
            lines.append(" ".join(cur))
            cur = [w]
        else:
            cur.append(w)
    if cur:
        lines.append(" ".join(cur))
    return lines


def slide_stream(title: str, subtitle: str, body: str, idx: int, total: int) -> bytes:
    # Background color per slide (cycle cyan/teal/purple tones)
    palettes = [
        (0.04, 0.08, 0.20),  # deep blue
        (0.02, 0.16, 0.24),  # teal-ish
        (0.09, 0.10, 0.25),  # purple-ish
    ]
    r, g, b = palettes[idx % len(palettes)]
    cmds = []
    def c(s): cmds.append(s)
    # Background rectangle (non-stroking color)
    c(f"{r} {g} {b} rg 0 0 {PAGE_W} {PAGE_H} re f")

    def text(x: int, y: int, size: int, rgb: Tuple[float, float, float], s: str):
        rr, gg, bb = rgb
        s = esc(s)
        c(f"BT /F1 {size} Tf {rr} {gg} {bb} rg 1 0 0 1 {x} {y} Tm ({s}) Tj ET")

    # Title
    y = PAGE_H - MARGIN_Y - 20
    text(MARGIN_X, y, 28, (0.95, 0.98, 1.0), title)
    # Subtitle
    y -= 38
    text(MARGIN_X, y, 18, (0.70, 0.90, 1.0), subtitle)
    # Body
    y -= 16
    for line in wrap(body, 78):
        y -= 18
        text(MARGIN_X, y, 14, (0.92, 0.95, 1.0), line)
    # Footer (slide count)
    text(PAGE_W - 140, 24, 10, (0.80, 0.90, 1.0), f"Slide {idx+1} of {total}")

    stream = ("q\n" + "\n".join(cmds) + "\nQ\n").encode()
    return stream


def main():
    pdf = PDF()
    pdf.add_font()
    for i, (t, s, b) in enumerate(slides):
        stream = slide_stream(t, s, b, i, len(slides))
        content_obj = pdf.add_stream(stream)
        pdf.add_page(content_obj)
    data = pdf.build()
    out_path = "CorridorOS_Presentation.pdf"
    with open(out_path, "wb") as f:
        f.write(data)
    print(out_path)

if __name__ == "__main__":
    main()
