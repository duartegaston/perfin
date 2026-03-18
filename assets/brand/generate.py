from PIL import Image, ImageDraw, ImageFont
import math, os

FONTS = "/Users/gaston.duarte/Documents/Gaston/perfin/.agents/skills/canvas-design/canvas-fonts"
OUT   = "/Users/gaston.duarte/Documents/Gaston/perfin/assets/brand"

# ── Palette ────────────────────────────────────────────────────────────────────
NAVY       = (11, 17, 32)
NAVY_MID   = (22, 34, 57)
NAVY_CARD  = (18, 28, 48)
TEAL       = (16, 185, 129)
TEAL_DIM   = (16, 185, 129, 60)
WHITE      = (248, 250, 252)
WHITE_DIM  = (148, 163, 184)
WHITE_SUB  = (71, 85, 105)

def load(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


# ══════════════════════════════════════════════════════════════════════════════
#  LOGO — 1024 × 1024
# ══════════════════════════════════════════════════════════════════════════════
def draw_mark(draw, cx, cy, scale=1.0, color_stem=None, color_cap=None):
    """Draw the geometric 'P' bar-chart mark centred at (cx, cy)."""
    color_stem = color_stem or WHITE
    color_cap  = color_cap  or TEAL

    S = scale
    # Stem — tall left bar
    sw, sh = int(52*S), int(320*S)
    sx = cx - int(20*S)
    sy = cy - sh // 2
    draw.rectangle([sx, sy, sx+sw, sy+sh], fill=color_stem)

    # Cap bump — right rectangle attached to top half of stem
    bw, bh = int(200*S), int(168*S)
    bx = sx + sw
    by = sy
    draw.rectangle([bx, by, bx+bw, by+bh], fill=color_stem)

    # Teal accent block — bottom strip of the cap
    ah = int(14*S)
    draw.rectangle([bx, by+bh-ah, bx+bw, by+bh], fill=color_cap)

    # Teal accent — small square at bottom right of stem
    ts = int(18*S)
    draw.rectangle([sx, sy+sh-ts, sx+sw, sy+sh], fill=color_cap)

    # Thin teal horizontal rule below the full mark
    ry = sy + sh + int(18*S)
    lx1 = sx - int(8*S)
    lx2 = bx + bw + int(8*S)
    draw.rectangle([lx1, ry, lx2, ry + int(3*S)], fill=color_cap)


def make_logo():
    SIZE = 1024
    img  = Image.new("RGB", (SIZE, SIZE), NAVY)
    draw = ImageDraw.Draw(img)

    # Subtle background grid — very faint
    grid_color = (22, 34, 57)
    step = 64
    for x in range(0, SIZE, step):
        draw.line([(x, 0), (x, SIZE)], fill=grid_color, width=1)
    for y in range(0, SIZE, step):
        draw.line([(0, y), (SIZE, y)], fill=grid_color, width=1)

    # Dot at each grid intersection
    dot_color = (28, 42, 68)
    for x in range(0, SIZE, step):
        for y in range(0, SIZE, step):
            draw.ellipse([x-2, y-2, x+2, y+2], fill=dot_color)

    # Mark — centred, scale 1.6
    draw_mark(draw, cx=SIZE//2 - 10, cy=SIZE//2 - 20, scale=1.6)

    # "PerFin" wordmark below the mark
    font_name = load("BricolageGrotesque-Bold.ttf", 98)
    font_sub  = load("InstrumentSans-Regular.ttf", 36)

    text = "PerFin"
    bbox = draw.textbbox((0, 0), text, font=font_name)
    tw = bbox[2] - bbox[0]
    tx = (SIZE - tw) // 2
    ty = SIZE // 2 + 230
    draw.text((tx, ty), text, font=font_name, fill=WHITE)

    # Tagline
    tag = "finanzas personales"
    bbox2 = draw.textbbox((0, 0), tag, font=font_sub)
    tw2 = bbox2[2] - bbox2[0]
    draw.text(((SIZE - tw2) // 2, ty + 108), tag, font=font_sub, fill=WHITE_DIM)

    path = os.path.join(OUT, "perfin-logo.png")
    img.save(path, "PNG")
    print(f"✓  Logo saved → {path}")


# ══════════════════════════════════════════════════════════════════════════════
#  POSTER — 1200 × 1800
# ══════════════════════════════════════════════════════════════════════════════
def make_poster():
    W, H = 1200, 1800
    img  = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)

    # ── Background: fine dot grid ──────────────────────────────────────────
    step = 48
    for x in range(0, W, step):
        for y in range(0, H, step):
            draw.ellipse([x-1, y-1, x+1, y+1], fill=(22, 34, 57))

    # ── Concentric teal arcs — large abstract composition (top-right origin) ──
    arc_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    arc_draw = ImageDraw.Draw(arc_img)
    origin = (W + 120, 300)
    for i, r in enumerate(range(200, 1400, 120)):
        alpha = max(8, 55 - i * 5)
        arc_draw.arc(
            [origin[0]-r, origin[1]-r, origin[0]+r, origin[1]+r],
            start=160, end=240,
            fill=(16, 185, 129, alpha), width=2
        )
    img = Image.alpha_composite(img.convert("RGBA"), arc_img).convert("RGB")
    draw = ImageDraw.Draw(img)

    # ── Large geometric mark — top section ────────────────────────────────
    draw_mark(draw, cx=W//2 - 40, cy=420, scale=2.8)

    # ── Horizontal rule ────────────────────────────────────────────────────
    margin = 80
    draw.rectangle([margin, 730, W-margin, 733], fill=WHITE_SUB)

    # ── "PerFin" — massive wordmark ────────────────────────────────────────
    font_hero  = load("BricolageGrotesque-Bold.ttf", 200)
    font_sub1  = load("InstrumentSans-Regular.ttf", 42)
    font_sub2  = load("InstrumentSans-Regular.ttf", 30)
    font_mono  = load("GeistMono-Regular.ttf", 24)
    font_label = load("InstrumentSans-Bold.ttf", 28)

    hero_text = "PerFin"
    bbox = draw.textbbox((0, 0), hero_text, font=font_hero)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, 760), hero_text, font=font_hero, fill=WHITE)

    # ── Tagline ────────────────────────────────────────────────────────────
    tag = "Finanzas personales, en perspectiva."
    bbox2 = draw.textbbox((0, 0), tag, font=font_sub1)
    tw2 = bbox2[2] - bbox2[0]
    draw.text(((W - tw2) // 2, 998), tag, font=font_sub1, fill=WHITE_DIM)

    # ── Teal accent rule under tagline ─────────────────────────────────────
    draw.rectangle([(W//2)-60, 1058, (W//2)+60, 1062], fill=TEAL)

    # ── Feature cards — abstract data visualization ─────────────────────────
    card_y = 1110
    cards = [
        ("Gastos Personales",  "por categoría"),
        ("Gastos Compartidos", "proporcional"),
        ("Asistente IA",       "resumen mensual"),
    ]
    cw = 320
    gap = 40
    total_w = len(cards) * cw + (len(cards)-1) * gap
    cx_start = (W - total_w) // 2

    for i, (title, sub) in enumerate(cards):
        cx0 = cx_start + i * (cw + gap)
        cy0 = card_y
        # Card bg
        draw.rectangle([cx0, cy0, cx0+cw, cy0+130], fill=NAVY_CARD)
        # Teal top border
        draw.rectangle([cx0, cy0, cx0+cw, cy0+3], fill=TEAL)
        # Title
        draw.text((cx0+24, cy0+22), title, font=font_label, fill=WHITE)
        # Sub
        draw.text((cx0+24, cy0+62), sub, font=font_sub2, fill=WHITE_DIM)
        # Mini bar chart
        bar_colors = [TEAL, (16, 185, 129, 180), (16, 185, 129, 100)]
        bar_heights = [40, 28, 18]
        for j, (bh, bc) in enumerate(zip(bar_heights, bar_colors)):
            bx = cx0 + cw - 90 + j * 22
            by_top = cy0 + 130 - 20 - bh
            draw.rectangle([bx, by_top, bx+14, cy0+130-20], fill=bc[:3])

    # ── Abstract proportion bars — middle visual element ───────────────────
    bar_section_y = 1300
    bar_data = [
        ("Vivienda",      0.82, WHITE),
        ("Alimentación",  0.61, WHITE_DIM),
        ("Transporte",    0.38, WHITE_DIM),
        ("Suscripciones", 0.24, WHITE_DIM),
        ("Otros",         0.15, WHITE_SUB),
    ]
    bar_max_w = 700
    bx_start  = margin + 20
    for i, (label, pct, col) in enumerate(bar_data):
        by = bar_section_y + i * 52
        # Label
        draw.text((bx_start, by), label, font=font_mono, fill=WHITE_DIM)
        # Track
        draw.rectangle([bx_start+210, by+4, bx_start+210+bar_max_w, by+16],
                        fill=(22, 34, 57))
        # Fill
        filled = int(bar_max_w * pct)
        fill_col = TEAL if i == 0 else col
        draw.rectangle([bx_start+210, by+4, bx_start+210+filled, by+16],
                        fill=fill_col)
        # Percentage
        pct_str = f"{int(pct*100)}%"
        draw.text((bx_start+210+bar_max_w+16, by), pct_str,
                  font=font_mono, fill=WHITE_SUB)

    # ── Bottom separator ───────────────────────────────────────────────────
    draw.rectangle([margin, 1600, W-margin, 1602], fill=WHITE_SUB)

    # ── Footer ─────────────────────────────────────────────────────────────
    font_footer = load("GeistMono-Regular.ttf", 22)
    draw.text((margin, 1624), "PerFin  ·  Personal Finance", font=font_footer, fill=WHITE_SUB)
    ver = "v1.0"
    bbox_v = draw.textbbox((0, 0), ver, font=font_footer)
    draw.text((W - margin - (bbox_v[2]-bbox_v[0]), 1624), ver, font=font_footer, fill=WHITE_SUB)

    # ── Teal corner accent ─────────────────────────────────────────────────
    draw.rectangle([0, H-6, W, H], fill=TEAL)

    path = os.path.join(OUT, "perfin-poster.png")
    img.save(path, "PNG")
    print(f"✓  Poster saved → {path}")


if __name__ == "__main__":
    make_logo()
    make_poster()
    print("\nDone. Files in assets/brand/")
