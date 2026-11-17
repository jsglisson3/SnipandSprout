# The shop scene across the top of Dani's footer: her counter and wall shelves full of plants, pots and
# terrariums, and a watering can that goes along and waters them (played by site.js, styled in site.css).
#   python3 tools/make-shop-scene.py src/shop-scene.svg
# Drawn flat in her palette with one light from the upper left: each pot and leaf has a lit side and a shaded side.
import math
import sys

OUT = sys.argv[1]
W, H, TOP = 2400, 214, 200          # scene size; TOP is the counter top every front pot stands on
BG = '#2f342b'                      # her footer colour: slits and gaps are cut in it


def n(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.') if abs(v - round(v)) > 0.05 else str(int(round(v)))


def pts(*xy):
    return ' '.join(n(v) for v in xy)


# ---------- palette ----------
C = dict(
    terra='#b98c74', terra_d='#9c7260', terra_l='#cba08a',
    cream='#e9e2d5', cream_d='#cbc1ae', cream_l='#f5f0e6',
    rose='#d4bfb9', rose_d='#b9a199', rose_l='#e4d5d0',
    sage='#a7b09a', sage_d='#8b957f', sage_l='#bcc4b0',
    olive='#5d6557', olive_d='#4b5246', olive_l='#6e7767',
    soil='#4b3b2f',
    g1='#a3b585', g2='#7f9663', g3='#62784b', g4='#4c5f3b',
    snake='#6e8a52', snake_d='#56703f', snake_edge='#d3cc8c',
    mon='#6a8a4f', mon_d='#527040', stem='#6f8456',
    lily='#5c7a49', lily_d='#476039', spathe='#f3efe4', spadix='#e2d3a0',
    cal='#5f7d4c', cal_d='#4a6239', cal_l='#9db487', cal_u='#8a6670',
    cact='#7d9a68', cact_d='#657f53', spine='#e9e2d5', bloom='#d9a3a8',
    succ='#9fb5a3', succ_d='#839b88', succ_tip='#d3a59d',
    pothos='#7a9a55', pothos_d='#5f7d42', pothos_v='#d8d39a',
    glass='#f7f4ee', cork='#c4a27c', cork_d='#a98663',
    clay_ink='#87593f',
    pebble='#8e8a7f', pebble_d='#6f6c63', charcoal='#24261f', sand='#cdbb98', moss='#7f9165',
    wood='#8c6f57', wood_d='#6b5444', wood_l='#a68a70', wood_dd='#4b3c30',
)


def path(fill, d, extra=''):
    return f'<path fill="{fill}" d="{d}"{extra}/>'


# ---------- leaves ----------
def leaf(x, y, L, w, ang, lit, shade, rib=None):
    """A pointed leaf from (x, y), L long and 2w wide, turned `ang` degrees; the upper half lit."""
    a = path(lit, f'M0 0C{pts(L * .28, -w, L * .72, -w * .9, L, 0)}Z')
    b = path(shade, f'M0 0C{pts(L * .28, w, L * .72, w * .9, L, 0)}Z')
    r = f'<path fill="none" stroke="{rib}" stroke-width=".8" d="M{pts(L * .06, 0)}H{n(L * .86)}"/>' if rib else ''
    return f'<g transform="translate({pts(x, y)}) rotate({n(ang)})">{a}{b}{r}</g>'


def bez(p0, p1, p2, t):
    x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
    y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
    dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
    dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
    return x, y, math.degrees(math.atan2(dy, dx))


def curve(p0, p1, p2, colour, width):
    return f'<path fill="none" stroke="{colour}" stroke-width="{n(width)}" stroke-linecap="round" d="M{pts(*p0)}Q{pts(*p1, *p2)}"/>'


# ---------- pots (each stands on the counter at x, `top` its rim; returns markup and the soil point) ----------
def pot_taper(x, wt, wb, h, k, base=TOP):
    """A tapered pot with a rolled rim, like her terracotta."""
    body, dark, light = C[k], C[k + '_d'], C[k + '_l']
    rim = max(6, h * .2)
    y0, y1 = base - h, base - h + rim
    s = [
        path(body, f'M{pts(x - wt / 2 + 2, y1)}L{pts(x - wb / 2 + 1.5, base - 1.5)}Q{pts(x - wb / 2 + 2, base, x - wb / 2 + 4, base)}H{n(x + wb / 2 - 4)}Q{pts(x + wb / 2 - 2, base, x + wb / 2 - 1.5, base - 1.5)}L{pts(x + wt / 2 - 2, y1)}Z'),
        path(dark, f'M{pts(x + wt * .16, y1)}L{pts(x + wb * .16, base)}H{n(x + wb / 2 - 4)}Q{pts(x + wb / 2 - 2, base, x + wb / 2 - 1.5, base - 1.5)}L{pts(x + wt / 2 - 2, y1)}Z'),
        path(light, f'M{pts(x - wt * .34, y1)}L{pts(x - wb * .34, base - 2)}h{n(wb * .06)}L{pts(x - wt * .34 + wt * .06, y1)}Z', ' opacity=".55"'),
        f'<rect x="{n(x - wt / 2)}" y="{n(y0)}" width="{n(wt)}" height="{n(rim)}" rx="2" fill="{light}"/>',
        f'<rect x="{n(x + wt * .16)}" y="{n(y0)}" width="{n(wt * .34)}" height="{n(rim)}" rx="2" fill="{body}"/>',
        f'<rect x="{n(x - wt / 2)}" y="{n(y1 - 1)}" width="{n(wt)}" height="1.4" fill="{dark}" opacity=".7"/>',
        f'<ellipse cx="{n(x)}" cy="{n(y0 + .5)}" rx="{n(wt / 2 - 3)}" ry="2.2" fill="{C["soil"]}"/>',
    ]
    return ''.join(s), (x, y0 + .5)


def pot_cyl(x, w, h, k, speckle=False, base=TOP):
    """A straight-sided modern planter."""
    body, dark, light = C[k], C[k + '_d'], C[k + '_l']
    y0 = base - h
    s = [
        path(body, f'M{pts(x - w / 2, y0)}V{n(base - 4)}Q{pts(x - w / 2, base, x - w / 2 + 4, base)}H{n(x + w / 2 - 4)}Q{pts(x + w / 2, base, x + w / 2, base - 4)}V{n(y0)}Z'),
        path(dark, f'M{pts(x + w * .18, y0)}V{n(base)}H{n(x + w / 2 - 4)}Q{pts(x + w / 2, base, x + w / 2, base - 4)}V{n(y0)}Z'),
        f'<rect x="{n(x - w * .36)}" y="{n(y0 + 4)}" width="{n(w * .07)}" height="{n(h - 9)}" rx="1" fill="{light}" opacity=".6"/>',
        f'<ellipse cx="{n(x)}" cy="{n(y0)}" rx="{n(w / 2)}" ry="2.6" fill="{light}"/>',
        f'<ellipse cx="{n(x)}" cy="{n(y0 + .4)}" rx="{n(w / 2 - 2.5)}" ry="1.9" fill="{C["soil"]}"/>',
    ]
    if speckle:
        dots = [(-.3, .3), (-.1, .55), (.12, .25), (.28, .62), (-.22, .8), (.05, .85), (.33, .4), (-.38, .58), (.2, .78)]
        s.append(''.join(f'<circle cx="{n(x + dx * w)}" cy="{n(y0 + dy * h)}" r=".9" fill="{C["olive_d"]}" opacity=".55"/>' for dx, dy in dots))
    return ''.join(s), (x, y0 + .4)


def pot_bowl(x, w, h, k, base=TOP):
    """A low round bowl on a small foot."""
    body, dark, light = C[k], C[k + '_d'], C[k + '_l']
    y0 = base - h
    s = [
        f'<rect x="{n(x - w * .2)}" y="{n(base - 4)}" width="{n(w * .4)}" height="4" rx="1" fill="{dark}"/>',
        path(body, f'M{pts(x - w / 2, y0)}C{pts(x - w / 2, base - 6, x - w * .3, base - 4, x, base - 4)}C{pts(x + w * .3, base - 4, x + w / 2, base - 6, x + w / 2, y0)}Z'),
        path(dark, f'M{pts(x + w * .14, base - 4)}C{pts(x + w * .34, base - 4.6, x + w / 2, base - 7, x + w / 2, y0)}H{n(x + w * .2)}C{pts(x + w * .24, y0 + h * .5, x + w * .2, base - 6, x + w * .14, base - 4)}Z'),
        path(light, f'M{pts(x - w * .4, y0 + 3)}C{pts(x - w * .39, y0 + h * .5, x - w * .3, base - 9, x - w * .22, base - 7)}', f' fill-opacity="0" stroke="{light}" stroke-width="2" stroke-linecap="round" opacity=".7"'),
        f'<ellipse cx="{n(x)}" cy="{n(y0)}" rx="{n(w / 2)}" ry="2.8" fill="{light}"/>',
        f'<ellipse cx="{n(x)}" cy="{n(y0 + .4)}" rx="{n(w / 2 - 2.5)}" ry="2" fill="{C["soil"]}"/>',
    ]
    return ''.join(s), (x, y0 + .4)


def stand(x, w, h):
    """A little wooden plant stand on the counter; returns its markup and the height of its top."""
    y0 = TOP - h
    s = [
        f'<rect x="{n(x - w / 2)}" y="{n(y0)}" width="{n(w)}" height="4" rx="1.2" fill="{C["wood_l"]}"/>',
        f'<rect x="{n(x - w / 2 + 3)}" y="{n(y0 + 4)}" width="3.4" height="{n(h - 4)}" fill="{C["wood"]}"/>',
        f'<rect x="{n(x + w / 2 - 6.4)}" y="{n(y0 + 4)}" width="3.4" height="{n(h - 4)}" fill="{C["wood_d"]}"/>',
        f'<rect x="{n(x - w / 2 + 3)}" y="{n(y0 + h * .62)}" width="{n(w - 6)}" height="2.6" fill="{C["wood_d"]}"/>',
    ]
    return ''.join(s), y0


# ---------- plants (each grows from the soil point s = (x, y)) ----------
def snake(s, h, blades=6, seed=0):
    x, y = s
    out = []
    spec = [(-9, .62, -7, 7), (-4, .9, -4, 8.5), (2, 1.0, 3, 9), (7, .78, 8, 7.5), (-1, .7, -1, 7), (11, .55, 13, 6)][:blades]
    for dx, k, lean, w in spec:
        bx, tx, ty, hh = x + dx, x + dx + lean, y - h * k, h * k
        left = f'M{pts(bx, y)}L{pts(bx - w / 2, y)}C{pts(bx - w * .62, y - hh * .45, tx - w * .3, ty + hh * .22, tx, ty)}Z'
        right = f'M{pts(bx, y)}L{pts(bx + w / 2, y)}C{pts(bx + w * .62, y - hh * .45, tx + w * .3, ty + hh * .22, tx, ty)}Z'
        edge = f'M{pts(bx - w / 2, y)}C{pts(bx - w * .62, y - hh * .45, tx - w * .3, ty + hh * .22, tx, ty)}C{pts(tx + w * .3, ty + hh * .22, bx + w * .62, y - hh * .45, bx + w / 2, y)}'
        bands = ''.join(f'<path fill="none" stroke="{C["snake_d"]}" stroke-width=".9" opacity=".6" d="M{pts(bx - w * .32 + lean * f, y - hh * f)}q{pts(w * .3, -1.6, w * .62, 0)}"/>' for f in (.18, .32, .46, .6))
        out.append(path(C['snake'], left) + path(C['snake_d'], right) + bands + f'<path fill="none" stroke="{C["snake_edge"]}" stroke-width="1.1" d="{edge}"/>')
    return ''.join(out)


def monstera_leaf(x, y, L, ang):
    top = f'M0 0C{pts(-L * .16, -L * .42, L * .42, -L * .62, L, 0)}Z'
    bot = f'M0 0C{pts(-L * .16, L * .42, L * .42, L * .62, L, 0)}Z'
    slits = ''
    for t, side in ((.3, -1), (.52, -1), (.74, -1), (.36, 1), (.6, 1), (.8, 1)):
        ex = L * t
        ey = side * L * (.46 - .3 * (t - .3) ** 2 * 4) * .82
        slits += f'<path fill="none" stroke="{BG}" stroke-width="{n(L * .05)}" stroke-linecap="round" d="M{pts(ex + L * .03, ey * 1.05)}L{pts(ex - L * .05, side * L * .12)}"/>'
    holes = ''.join(f'<ellipse cx="{n(L * t)}" cy="{n(side * L * .2)}" rx="{n(L * .035)}" ry="{n(L * .022)}" fill="{BG}"/>' for t, side in ((.45, -1), (.62, 1)))
    rib = f'<path fill="none" stroke="{C["g1"]}" stroke-width="1" opacity=".55" d="M{pts(L * .04, 0)}H{n(L * .9)}"/>'
    return f'<g transform="translate({pts(x, y)}) rotate({n(ang)})">{path(C["mon"], top)}{path(C["mon_d"], bot)}{slits}{holes}{rib}</g>'


def monstera(s, size=1):
    x, y = s
    leaves = [(-48, -62, 44, -150), (40, -74, 46, -30), (-16, -104, 42, -110), (22, -112, 40, -62), (-56, -26, 34, -175), (54, -32, 36, -8)]
    out = []
    for dx, dy, L, ang in leaves:
        ex, ey = x + dx * size, y + dy * size
        out.append(curve((x + dx * .06, y), (x + dx * .35, y + dy * .55), (ex, ey), C['stem'], 2.2))
    for dx, dy, L, ang in leaves:
        out.append(monstera_leaf(x + dx * size, y + dy * size, L * size, ang))
    return ''.join(out)


def frond(p0, p1, p2, size, flip=1):
    out = [curve(p0, p1, p2, C['g3'], 1.3)]
    i = 0
    t = .12
    while t < .97:
        x, y, a = bez(p0, p1, p2, t)
        Ln = size * (1 - t * .62)
        side = 1 if i % 2 else -1
        out.append(leaf(x, y, Ln, Ln * .3, a + side * 58, C['g1'], C['g2']))
        t += .075
        i += 1
    return ''.join(out)


def fern(s, size=1):
    x, y = s
    fr = [(-62, 4, -34, -30), (-50, -26, -18, -52), (-20, -52, -4, -58), (12, -56, 6, -60), (44, -30, 20, -54), (62, 2, 34, -32), (-34, 18, -40, -6), (36, 18, 42, -4)]
    return ''.join(frond((x + ex * .05, y), (x + cx * size, y + cy * size), (x + ex * size, y + ey * size), 11 * size)
                   for ex, ey, cx, cy in fr)


def lily(s, size=1):
    x, y = s
    out = []
    for ang, L in ((-152, 44), (-128, 52), (-104, 58), (-82, 60), (-60, 54), (-36, 46), (-20, 40), (-164, 36)):
        out.append(leaf(x, y - 2, L * size, 8 * size, ang, C['lily'], C['lily_d'], C['g2']))
    for dx, h in ((-8, 74), (10, 84)):
        tx, ty = x + dx * size, y - h * size
        out.append(curve((x + dx * .2, y - 2), (x + dx * .6, y - h * .5 * size), (tx, ty + 10), C['stem'], 1.4))
        out.append(path(C['spathe'], f'M{pts(tx, ty + 12)}C{pts(tx - 8 * size, ty + 6, tx - 6 * size, ty - 8 * size, tx + 1, ty - 14 * size)}C{pts(tx + 6 * size, ty - 6 * size, tx + 7 * size, ty + 6, tx, ty + 12)}Z'))
        out.append(f'<rect x="{n(tx - 1.6)}" y="{n(ty - 4 * size)}" width="3.2" height="{n(10 * size)}" rx="1.6" fill="{C["spadix"]}"/>')
    return ''.join(out)


def zz(s, size=1):
    x, y = s
    out = []
    for dx, h, lean in ((-12, 74, -18), (-3, 96, -4), (7, 88, 10), (15, 64, 22)):
        p0, p1, p2 = (x + dx * .3, y), (x + dx, y - h * .5 * size), (x + dx + lean * size, y - h * size)
        out.append(curve(p0, p1, p2, C['g3'], 1.8))
        for i, t in enumerate((.3, .42, .54, .66, .78, .9)):
            bx, by, a = bez(p0, p1, p2, t)
            L = 13 * size * (1.1 - t * .45)
            out.append(leaf(bx, by, L, L * .42, a + (-60 if i % 2 else 60), C['g2'], C['g3']))
        tx, ty, a = bez(p0, p1, p2, 1)
        out.append(leaf(tx, ty, 9 * size, 4 * size, a, C['g2'], C['g3']))
    return ''.join(out)


def calathea(s, size=1):
    x, y = s
    out = []
    for dx, h, ang, L, under in ((-24, 40, -150, 34, False), (24, 46, -32, 34, True), (-14, 62, -118, 36, False), (14, 66, -66, 36, False), (0, 76, -92, 34, True), (-30, 22, -170, 28, True), (30, 24, -10, 28, False)):
        ex, ey = x + dx * size, y - h * size
        out.append(curve((x, y), (x + dx * .3, y - h * .6 * size), (ex, ey), C['stem'], 1.3))
        if under:
            out.append(leaf(ex, ey, L * size, L * .38 * size, ang, C['cal_u'], C['cal_u'], C['rose_l']))
        else:
            g = leaf(ex, ey, L * size, L * .38 * size, ang, C['cal'], C['cal_d'], C['cal_l'])
            marks = ''.join(f'<path fill="none" stroke="{C["cal_l"]}" stroke-width="1.6" stroke-linecap="round" opacity=".75" d="M{pts(L * size * t, 0)}l{pts(L * size * .06, side * L * size * .2)}"/>'
                            for t in (.25, .42, .58, .74) for side in (-1, 1))
            out.append(g[:-4] + marks + '</g>')
    return ''.join(out)


def cactus(s, h, flower=True, arm=True):
    x, y = s
    w = h * .32
    body = f'M{pts(x - w / 2, y)}V{n(y - h + w / 2)}A{pts(w / 2, w / 2, 0, 0, 1, x + w / 2, y - h + w / 2)}V{n(y)}Z'
    shade = f'M{pts(x + w * .12, y)}V{n(y - h + w * .2)}A{pts(w / 2, w / 2, 0, 0, 1, x + w / 2, y - h + w / 2)}V{n(y)}Z'
    out = []
    if arm:
        ax, ay = x - w / 2, y - h * .45
        out.append(f'<path fill="none" stroke="{C["cact_d"]}" stroke-width="{n(w * .55)}" stroke-linecap="round" stroke-linejoin="round" d="M{pts(ax + 2, ay)}H{n(ax - w * .45)}V{n(ay - h * .26)}"/>')
    out.append(path(C['cact'], body) + path(C['cact_d'], shade))
    for f in (-.22, .22):
        out.append(f'<path fill="none" stroke="{C["g1"]}" stroke-width=".9" opacity=".7" d="M{pts(x + f * w, y - 2)}V{n(y - h + w * .45)}"/>')
    for i in range(int(h / 9)):
        for f in (-.42, 0, .4):
            out.append(f'<circle cx="{n(x + f * w)}" cy="{n(y - 6 - i * 9 - (4 if f == 0 else 0))}" r=".7" fill="{C["spine"]}" opacity=".85"/>')
    if flower:
        fx, fy = x + w * .1, y - h - 1
        out.append(''.join(leaf(fx, fy + 2, 7, 2.6, a, C['bloom'], C['rose_d']) for a in (-150, -115, -90, -65, -30)))
        out.append(f'<circle cx="{n(fx)}" cy="{n(fy + 1)}" r="1.6" fill="{C["spadix"]}"/>')
    return ''.join(out)


def fittonia(s, size=1):
    """A little nerve plant, the kind she tucks into closed terrariums: round leaves with pink veins."""
    x, y = s
    out = []
    for dx, dy, ang, L in ((-6, -2, -160, 10), (6, -2, -20, 10), (-4, -8, -125, 11), (4, -9, -60, 11), (0, -13, -92, 10), (-9, -1, -178, 8), (9, -1, -4, 8)):
        out.append(curve((x, y), (x + dx * .4, y + dy * .6), (x + dx * size, y + dy * size), C['stem'], .9))
        g = leaf(x + dx * size, y + dy * size, L * size, L * .45 * size, ang, C['g2'], C['g3'], C['bloom'])
        out.append(g)
    return ''.join(out)


def rosette(x, y, size=1):
    """An echeveria seen from the side: a back row standing up, a front row spreading, pink tips."""
    out = []
    for ang, L, lit, shade in (
            (-120, 12, 'succ_d', 'succ_d'), (-90, 13, 'succ_d', 'succ_d'), (-60, 12, 'succ_d', 'succ_d'),
            (-150, 13, 'succ', 'succ_d'), (-30, 13, 'succ', 'succ_d'), (-105, 11, 'succ', 'succ_d'), (-75, 11, 'succ', 'succ_d'),
            (-172, 12, 'succ', 'succ_d'), (-8, 12, 'succ', 'succ_d'), (-135, 9, 'succ', 'succ_d'), (-45, 9, 'succ', 'succ_d')):
        Ls = L * size
        out.append(leaf(x, y, Ls, Ls * .36, ang, C[lit], C[shade]))
        tx, ty = x + math.cos(math.radians(ang)) * Ls * .9, y + math.sin(math.radians(ang)) * Ls * .9
        out.append(f'<circle cx="{n(tx)}" cy="{n(ty)}" r="{n(1.3 * size)}" fill="{C["succ_tip"]}"/>')
    return ''.join(out)


def pothos_trail(x, y, length, lean, size=1):
    """A trailing vine of heart-shaped leaves hanging from (x, y)."""
    p0, p1, p2 = (x, y), (x + lean * .7, y + length * .45), (x + lean, y + length)
    out = [curve(p0, p1, p2, C['stem'], 1.1)]
    for i, t in enumerate((.12, .26, .4, .54, .68, .82, .95)):
        bx, by, a = bez(p0, p1, p2, t)
        L = 9 * size * (1 - t * .3)
        side = 1 if i % 2 else -1
        g = leaf(bx, by, L, L * .55, a + side * 70, C['pothos'], C['pothos_d'])
        out.append(g[:-4] + f'<path fill="none" stroke="{C["pothos_v"]}" stroke-width=".8" opacity=".7" d="M{pts(L * .2, -L * .12)}q{pts(L * .25, -L * .1, L * .5, 0)}"/></g>')
    return ''.join(out)


def pothos(s, size=1):
    x, y = s
    out = []
    for dx, dy, ang in ((-10, -6, -140), (-2, -12, -100), (8, -10, -60), (14, -4, -25)):
        out.append(leaf(x + dx * .4, y, 11 * size, 6 * size, ang, C['pothos'], C['pothos_d']))
    for dx, length, lean in ((-14, 58, -14), (-6, 44, -4), (12, 52, 10), (18, 34, 16)):
        out.append(pothos_trail(x + dx * size, y + 1, length * size, lean * size, size))
    return ''.join(out)


def pearls(s, size=1):
    x, y = s
    out = []
    for dx, length, lean in ((-12, 50, -10), (-4, 62, -2), (6, 56, 6), (13, 40, 12)):
        p0, p1, p2 = (x + dx, y), (x + dx + lean * .6, y + length * .5), (x + dx + lean, y + length * size)
        out.append(curve(p0, p1, p2, C['stem'], .8))
        for t in (i / 11 for i in range(1, 12)):
            bx, by, _ = bez(p0, p1, p2, t)
            out.append(f'<circle cx="{n(bx)}" cy="{n(by)}" r="2.2" fill="{C["g1"]}"/><circle cx="{n(bx - .6)}" cy="{n(by - .6)}" r=".7" fill="{C["cream_l"]}" opacity=".7"/>')
    return ''.join(out)


def sprout(s, size=1):
    x, y = s
    return curve((x, y), (x - 1, y - 9 * size), (x + 1, y - 18 * size), C['g2'], 1.6) + \
        leaf(x + 1, y - 17 * size, 10 * size, 4 * size, -150, C['g1'], C['g2']) + leaf(x + 1, y - 17 * size, 10 * size, 4 * size, -30, C['g1'], C['g2'])


def stake(x, y, h=34):
    """One of her plant markers: a little sign on a stick, with two lines of writing."""
    return (f'<rect x="{n(x - .8)}" y="{n(y - h)}" width="1.6" height="{n(h)}" fill="{C["wood_l"]}"/>'
            f'<rect x="{n(x - 10)}" y="{n(y - h - 9)}" width="20" height="12" rx="2" fill="{C["cream_l"]}"/>'
            f'<path stroke="{C["clay_ink"]}" stroke-width=".9" stroke-linecap="round" d="M{pts(x - 6, y - h - 5)}h11M{pts(x - 4.5, y - h - 1.6)}h8"/>')


# ---------- glass ----------
def jar(x, w, h):
    """Her Closed vessel: a glass jar with a cork, laid in layers, a little plant inside."""
    y0 = TOP - h
    neck = w * .36
    sh = y0 + 14
    outline = (f'M{pts(x - neck / 2, y0 + 4)}V{n(sh - 4)}C{pts(x - neck / 2, sh, x - w / 2, sh - 2, x - w / 2, sh + 10)}'
               f'V{n(TOP - 7)}Q{pts(x - w / 2, TOP, x - w / 2 + 7, TOP)}H{n(x + w / 2 - 7)}Q{pts(x + w / 2, TOP, x + w / 2, TOP - 7)}'
               f'V{n(sh + 10)}C{pts(x + w / 2, sh - 2, x + neck / 2, sh, x + neck / 2, sh - 4)}V{n(y0 + 4)}')
    cid = f'jar{int(x)}'
    layers = (f'<clipPath id="{cid}"><path d="{outline}Z"/></clipPath><g clip-path="url(#{cid})">'
              f'<rect x="{n(x - w / 2)}" y="{n(TOP - 15)}" width="{n(w)}" height="15" fill="{C["pebble_d"]}"/>'
              + ''.join(f'<circle cx="{n(x - w / 2 + 5 + i * 6.3)}" cy="{n(TOP - 8 + (i % 3) * 2.2)}" r="2.4" fill="{C["pebble"]}"/>' for i in range(int(w / 6.3)))
              + f'<rect x="{n(x - w / 2)}" y="{n(TOP - 18)}" width="{n(w)}" height="3" fill="{C["charcoal"]}"/>'
              f'<path fill="{C["soil"]}" d="M{pts(x - w / 2, TOP - 18)}V{n(TOP - 30)}Q{pts(x, TOP - 35, x + w / 2, TOP - 29)}V{n(TOP - 18)}Z"/>'
              f'<path fill="{C["moss"]}" d="M{pts(x - w / 2, TOP - 27)}' + ''.join(f'q{pts(3, -4.5 + (i % 2), 6.5, 0)}' for i in range(int(w / 6.5) + 1)) + f'V{n(TOP - 25)}H{n(x - w / 2)}Z"/>'
              f'</g>')
    glass = (f'<path d="{outline}Z" fill="{C["glass"]}" fill-opacity=".07"/>'
             f'<path d="{outline}" fill="none" stroke="{C["glass"]}" stroke-opacity=".6" stroke-width="1.5" stroke-linejoin="round"/>'
             f'<path fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.2" stroke-linecap="round" d="M{pts(x - w / 2 + 5, sh + 14)}V{n(TOP - 22)}"/>'
             f'<path fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.4" stroke-linecap="round" d="M{pts(x - w / 2 + 5, TOP - 16)}v4"/>')
    cork = (f'<rect x="{n(x - neck / 2 - 2)}" y="{n(y0 - 7)}" width="{n(neck + 4)}" height="12" rx="2.5" fill="{C["cork"]}"/>'
            f'<rect x="{n(x + neck * .08)}" y="{n(y0 - 7)}" width="{n(neck * .42 + 2)}" height="12" rx="2.5" fill="{C["cork_d"]}"/>'
            + ''.join(f'<circle cx="{n(x - neck * .3 + i * 5)}" cy="{n(y0 - 1 + (i % 2) * 2)}" r=".7" fill="{C["cork_d"]}"/>' for i in range(3)))
    return layers, glass + cork, (x - w * .12, TOP - 31)


def bowl(x, w, h):
    """Her Open vessel: a round glass bowl with a wide mouth, sand, stones and succulents."""
    rx, top = w / 2, TOP - h
    mouth = rx * .62
    outline = (f'M{pts(x - mouth, top)}C{pts(x - rx * 1.02, top + h * .12, x - rx * 1.08, TOP - h * .2, x - rx * .55, TOP - 1)}'
               f'Q{pts(x, TOP + 1.5, x + rx * .55, TOP - 1)}C{pts(x + rx * 1.08, TOP - h * .2, x + rx * 1.02, top + h * .12, x + mouth, top)}')
    cid = f'bowl{int(x)}'
    inner = (f'<clipPath id="{cid}"><path d="{outline}Z"/></clipPath><g clip-path="url(#{cid})">'
             f'<rect x="{n(x - rx)}" y="{n(TOP - 13)}" width="{n(w)}" height="14" fill="{C["sand"]}"/>'
             f'<path fill="{C["pebble_d"]}" d="M{pts(x - rx, TOP - 13)}Q{pts(x, TOP - 17, x + rx, TOP - 13)}V{n(TOP - 10)}Q{pts(x, TOP - 14, x - rx, TOP - 10)}Z"/>'
             f'<path fill="{C["soil"]}" d="M{pts(x - rx, TOP - 15)}Q{pts(x, TOP - 25, x + rx, TOP - 16)}V{n(TOP - 13)}Q{pts(x, TOP - 17, x - rx, TOP - 13)}Z"/>'
             f'<ellipse cx="{n(x + rx * .42)}" cy="{n(TOP - 21)}" rx="5" ry="3.2" fill="{C["pebble"]}"/>'
             f'<ellipse cx="{n(x - rx * .48)}" cy="{n(TOP - 20)}" rx="3" ry="2" fill="{C["cream_d"]}"/>'
             f'</g>')
    glass = (f'<path d="{outline}Z" fill="{C["glass"]}" fill-opacity=".07"/>'
             f'<path d="{outline}" fill="none" stroke="{C["glass"]}" stroke-opacity=".6" stroke-width="1.5" stroke-linejoin="round"/>'
             f'<ellipse cx="{n(x)}" cy="{n(top)}" rx="{n(mouth)}" ry="2.6" fill="none" stroke="{C["glass"]}" stroke-opacity=".55" stroke-width="1.3"/>'
             f'<path fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.2" stroke-linecap="round" d="M{pts(x - rx * .82, top + h * .3)}Q{pts(x - rx * .9, TOP - h * .3, x - rx * .62, TOP - 7)}"/>')
    return inner, glass, (x, TOP - 21)


def pot_stack(x, k, wt, wb, h, count=3):
    """A stack of empty pots, nested, ready at the Plant Bar for someone to pick."""
    out = []
    for i in range(count - 1, -1, -1):          # the top pot first, so each one below covers the body of the one above
        pot, _ = pot_taper(x, wt, wb, h, k, base=TOP - i * 6)
        if i == count - 1:
            pot = pot.replace(f'fill="{C["soil"]}"', f'fill="{C[k + "_d"]}"')   # the top one is empty
        else:
            pot = pot[:pot.index('<ellipse')]
        out.append(pot)
    return shadow(x, wb) + ''.join(out)


# ---------- the scene ----------
def shadow(x, w):
    return f'<ellipse cx="{n(x)}" cy="{TOP + .6}" rx="{n(w / 2 + 3)}" ry="2.2" fill="#000" opacity=".28"/>'


FRONT = []   # (x, top of the foliage, markup)
STATIC = []  # things on the counter that don't grow


def front(x, top, pot_markup, grow_markup, s, behind='', over=''):
    """One plant on the counter: what grows (from soil point s) and what stays (the pot, the glass)."""
    FRONT.append((x, top, f'<g class="sp" data-x="{n(x)}" data-top="{n(top)}">{behind}'
                          f'<g class="sp__grow" data-o="{pts(*s)}">{grow_markup}</g>{pot_markup}{over}</g>'))


def add_taper(x, k, wt, wb, h, plant, top):
    pot, s = pot_taper(x, wt, wb, h, k)
    front(x, top, shadow(x, wb) + pot, plant(s), s)


def add_cyl(x, k, w, h, plant, top, speckle=False):
    pot, s = pot_cyl(x, w, h, k, speckle)
    front(x, top, shadow(x, w) + pot, plant(s), s)


def add_bowl(x, k, w, h, plant, top):
    pot, s = pot_bowl(x, w, h, k)
    front(x, top, shadow(x, w * .5) + pot, plant(s), s)


# Left to right. The middle (about 950 to 1450) is what a phone shows, so her own things sit there.
add_cyl(70, 'olive', 34, 40, lambda s: zz(s, .95), 64)
add_cyl(190, 'cream', 30, 46, lambda s: snake(s, 98), 52, speckle=True)
add_bowl(296, 'rose', 44, 18, lambda s: rosette(s[0], s[1] - 1, 1.1), 166)
add_taper(372, 'terra', 30, 22, 30, lambda s: cactus(s, 50), 118)
add_taper(492, 'sage', 40, 30, 38, lambda s: lily(s, 1), 72)
inner, glass, s = bowl(630, 76, 62)
front(630, 150, shadow(630, 34) + inner + glass, rosette(s[0] - 14, s[1], .8) + rosette(s[0] + 10, s[1] + 1, .62), s)
STATIC.append(pot_stack(560, 'terra', 26, 19, 22))
add_taper(770, 'terra', 42, 32, 40, lambda s: calathea(s, 1), 82)
add_cyl(900, 'cream', 32, 50, lambda s: snake(s, 104, 5), 46)
layers, glass, s = jar(1034, 58, 92)
front(1034, 100, shadow(1034, 58), fittonia((s[0] + 6, s[1]), 1), (s[0] + 6, s[1]), behind=layers, over=glass)
add_taper(1200, 'terra', 58, 44, 52, lambda s: monstera(s, 1), 34)
add_bowl(1352, 'rose', 66, 32, lambda s: fern(s, 1), 106)
add_taper(1468, 'terra', 26, 20, 26, lambda s: sprout(s, 1.2) + stake(s[0] + 9, s[1] + 2, 26), 140)
st, sy = stand(1580, 46, 44)
pot, s = pot_cyl(1580, 34, 30, 'sage', base=sy)
front(1580, 120, shadow(1580, 46) + st + pot, pothos(s, 1), s)
add_taper(1710, 'rose', 28, 21, 28, lambda s: cactus(s, 44, flower=True, arm=False), 126)
add_bowl(1775, 'cream', 40, 16, lambda s: rosette(s[0], s[1] - 1, .95), 168)
inner, glass, s = bowl(1890, 70, 58)
front(1890, 152, shadow(1890, 30) + inner + glass, rosette(s[0] - 8, s[1] + 1, .75) + cactus((s[0] + 14, s[1] + 2), 22, flower=False, arm=False), s)
STATIC.append(pot_stack(1964, 'rose', 24, 18, 20))
add_cyl(2030, 'cream', 34, 42, lambda s: zz(s, 1), 62, speckle=True)
st, sy = stand(2150, 40, 40)
pot, s = pot_cyl(2150, 30, 26, 'terra', base=sy)
front(2150, 132, shadow(2150, 40) + st + pot, pearls(s, 1), s)
add_taper(2270, 'sage', 40, 30, 38, lambda s: calathea(s, .95), 86)
add_cyl(2360, 'olive', 28, 44, lambda s: snake(s, 90, 4), 64)


# The back wall: shelves and hanging planters as soft silhouettes, so the counter reads in front of them.
def wall():
    out = []
    shelves = [(140, 420, 104), (700, 980, 92), (1270, 1560, 98), (1830, 2120, 90)]
    for x0, x1, y in shelves:
        out.append(f'<rect x="{x0}" y="{y}" width="{x1 - x0}" height="5" rx="1.5"/>')
        for bx in (x0 + 24, x1 - 30):
            out.append(f'<path d="M{pts(bx, y + 5)}h6v14z"/>')
    # small pots on the shelves (silhouettes)
    things = [(170, 104, 'cyl'), (220, 104, 'taper'), (276, 104, 'trail'), (338, 104, 'bowl'), (392, 104, 'cyl'),
              (730, 92, 'trail'), (790, 92, 'taper'), (846, 92, 'cyl'), (902, 92, 'bowl'), (956, 92, 'taper'),
              (1300, 98, 'cyl'), (1356, 98, 'bowl'), (1420, 98, 'trail'), (1486, 98, 'taper'), (1536, 98, 'cyl'),
              (1860, 90, 'taper'), (1918, 90, 'trail'), (1980, 90, 'cyl'), (2040, 90, 'bowl'), (2096, 90, 'taper')]
    for x, y, kind in things:
        if kind == 'cyl':
            out.append(f'<rect x="{x - 9}" y="{y - 20}" width="18" height="20" rx="2"/>')
            out.append(''.join(f'<path d="M{pts(x, y - 19)}l{pts(dx, -h)}l{pts(2.5, h)}z"/>' for dx, h in ((-5, 22), (0, 28), (4, 20))))
        elif kind == 'taper':
            out.append(f'<path d="M{pts(x - 10, y - 18)}h20l-3 18h-14z"/>')
            out.append(''.join(f'<ellipse cx="{n(x + dx)}" cy="{n(y - 24 + abs(dx) * .3)}" rx="7" ry="4.5" transform="rotate({dx * 4} {pts(x + dx, y - 24)})"/>' for dx in (-7, 0, 7)))
        elif kind == 'bowl':
            out.append(f'<path d="M{pts(x - 13, y - 11)}h26q-2 11-13 11t-13-11z"/>')
            out.append(''.join(f'<path d="M{pts(x, y - 11)}l{pts(dx, -10)}l{pts(3, 10)}z"/>' for dx in (-10, -5, -1, 3, 8)))
        else:  # a pot with vines spilling over the shelf edge
            out.append(f'<rect x="{x - 9}" y="{y - 16}" width="18" height="16" rx="2"/>')
            for dx, L in ((-6, 46), (1, 60), (7, 36)):
                out.append(f'<path fill="none" stroke-width="1.2" stroke="currentColor" d="M{pts(x + dx, y - 14)}q{pts(dx * .8, L * .5, dx * 1.2, L)}"/>')
                out.append(''.join(f'<ellipse cx="{n(x + dx + dx * 1.2 * t * t)}" cy="{n(y - 14 + L * t)}" rx="3.4" ry="2.2"/>' for t in (.3, .5, .7, .9)))
    # hanging planters on cords from the ceiling
    for x, drop in ((590, 46), (1120, 30), (1690, 50), (2230, 34)):
        out.append(f'<path fill="none" stroke="currentColor" stroke-width="1" d="M{pts(x, 0)}V{n(drop - 6)}M{pts(x, drop - 22)}L{pts(x - 12, drop)}M{pts(x, drop - 22)}L{pts(x + 12, drop)}"/>')
        out.append(f'<path d="M{pts(x - 14, drop)}h28q-2 14-14 14t-14-14z"/>')
        for dx, L in ((-9, 40), (-2, 56), (6, 48), (12, 30)):
            out.append(f'<path fill="none" stroke-width="1" stroke="currentColor" d="M{pts(x + dx, drop + 2)}q{pts(dx * .4, L * .5, dx * .7, L)}"/>')
            out.append(''.join(f'<ellipse cx="{n(x + dx + dx * .7 * t * t)}" cy="{n(drop + 2 + L * t)}" rx="3" ry="2"/>' for t in (.35, .6, .85)))
    return f'<g class="sc-wall" fill="{C["glass"]}" color="{C["glass"]}" opacity=".085">{"".join(out)}</g>'


def counter():
    grain = ''.join(f'<path fill="none" stroke="{C["wood_dd"]}" stroke-opacity=".5" stroke-width=".8" d="M{x0} {y}h{L}"/>'
                    for x0, y, L in ((40, 206, 260), (420, 209, 340), (900, 205.5, 220), (1300, 208.5, 300), (1760, 206, 240), (2120, 209, 230)))
    return (f'<rect y="{TOP}" width="{W}" height="3.4" fill="{C["wood_l"]}"/>'
            f'<rect y="{TOP + 3.4}" width="{W}" height="{H - TOP - 3.4}" fill="{C["wood"]}"/>'
            f'{grain}<rect y="{H - 1.6}" width="{W}" height="1.6" fill="{C["wood_dd"]}"/>')


# The watering can, facing right; (0, 0) is the middle of its base. Dusty rose, with a brass rose on the spout.
CAN = (
    '<g class="sc-can__tilt">'
    f'<path fill="none" stroke="{C["rose_d"]}" stroke-width="5" stroke-linecap="round" d="M-21-40C-44-40-46-12-24-9"/>'
    f'<path fill="{C["rose"]}" d="M22-9 52-40 56-36 27-3Z"/>'
    f'<path fill="{C["rose_d"]}" d="M24-5 54-38 56-36 27-3Z"/>'
    f'<path fill="{C["rose"]}" d="M-24-42Q-24-46-20-46H18Q22-46 22-42L25-4Q25 0 21 0H-23Q-27 0-27-4Z"/>'
    f'<path fill="{C["rose_d"]}" d="M8-46H18Q22-46 22-42L25-4Q25 0 21 0H10Z"/>'
    f'<path fill="{C["rose_l"]}" d="M-20-38h4.5l1 32h-4.5Z" opacity=".75"/>'
    f'<rect x="-27" y="-17" width="52" height="3" fill="{C["rose_d"]}" opacity=".8"/>'
    f'<ellipse cx="-4" cy="-46" rx="15" ry="3.2" fill="{C["rose_l"]}"/><ellipse cx="-4" cy="-46" rx="11" ry="2" fill="#8c736c"/>'
    f'<path fill="none" stroke="{C["rose_d"]}" stroke-width="4.4" stroke-linecap="round" d="M-15-48Q-6-68 12-48"/>'
    f'<g transform="rotate(-44 55 -38)"><path fill="#c9a068" d="M52-41h6l3 9h-12Z"/><ellipse cx="55" cy="-32" rx="6.6" ry="1.9" fill="#ad8650"/></g>'
    '</g>'
)
# The water falls from just under the rose; site.js turns the can 26 degrees to pour, which puts the rose here.
RAIN_AT = (64, -22)
RAIN = (f'<g class="sc-rain" opacity="0" fill="#cfe4ea" transform="translate({pts(*RAIN_AT)})">'
        + ''.join(f'<path class="sc-drop" d="M{n(dx)} 0c1.1 1.8 1.7 2.8 1.7 3.6a1.7 1.7 0 0 1-3.4 0c0-.8.6-1.8 1.7-3.6Z"/>' for dx in (-4, -1.5, 1, 3.5, -3, 0, 2.5, -2, 4.5, .5))
        + '</g>')
PARK = (1636, TOP)   # where the can rests in the still picture: on the counter, by the pothos stand


def build():
    FRONT.sort(key=lambda f: f[0])
    plants = ''.join(m for _, _, m in FRONT)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice">'
           f'{wall()}{counter()}{"".join(STATIC)}<g class="sc-plants">{plants}</g>'
           f'<g class="sc-can" data-park="{pts(*PARK)}" transform="translate({pts(*PARK)})">{CAN}{RAIN}</g>'
           f'</svg>')
    return svg


svg = build()
head = ('<!-- Dani\'s shop, across the top of her footer: the counter and the wall shelves with her plants, pots and\n'
        '     terrariums, and her watering can. The footer shows this file as a still picture; site.js swaps in the\n'
        '     same drawing inline and moves it: the can waters each plant on screen and each one grows. Each plant is a\n'
        '     .sp with data-x (where it stands) and data-top (how tall it is); its .sp__grow grows from data-o.\n'
        '     Drawn by tools/make-shop-scene.py; change that and run it again rather than editing this file. -->\n')
open(OUT, 'w').write(head + svg + '\n')
print(len(svg), 'bytes,', len(FRONT), 'plants')
