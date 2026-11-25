# The three little shop windows at the top of Dani's Shop page: a DIY kit made up, the Terrarium Bar and the
# Plant Bar, each standing on the shelf behind the plant marker that carries its name and price.
#   python3 tools/make-shop-picks.py src/shop-picks
# Writes kit.svg, tbar.svg and pbar.svg into that folder; build.mjs puts them in the page inline,
# so site.css can grow the plants in (every .pk__grow grows from its own foot).
# Drawn with the footer scene's own pots, plants and glass, so both pictures stay in one hand: this file
# borrows the drawing kit from the top of make-shop-scene.py and never changes it.
import os
import sys

OUT = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 200, 216          # one window; site.css gives .pick__win the same shape
TOP = 215                # the shelf top everything stands on
PAPER = '#f7f4ee'        # her page colour: the footer scene cuts its leaf slits in the footer's dark instead


def load_kit():
    """The drawing kit of make-shop-scene.py (everything above its scene), set up for one window on light paper."""
    src = open(os.path.join(HERE, 'make-shop-scene.py'), encoding='utf8').read()
    kit = src[:src.index('# ---------- the scene ----------')]
    can = src[src.index('CAN = ('):src.index('# The water falls')]
    for old, new in (('OUT = sys.argv[1]', 'OUT = None'),
                     ('W, H, TOP = 2400, 214, 200', f'W, H, TOP = {W}, {H}, {TOP}'),
                     ("BG = '#2f342b'", f"BG = '{PAPER}'")):
        assert kit.count(old) == 1, 'make-shop-scene.py changed: ' + old
        kit = kit.replace(old, new)
    ns = {}
    exec(kit + can, ns)
    ns['C']['glass'] = ns['C']['olive']      # glass is drawn in cream on the dark footer, in her olive on paper
    return ns


K = load_kit()
C, n, pts = K['C'], K['n'], K['pts']


def shadow(x, w):
    """The soft shadow where a thing meets the shelf."""
    return f'<ellipse cx="{n(x)}" cy="{TOP - .4}" rx="{n(w / 2 + 4)}" ry="2.4" fill="#2c3027" opacity=".14"/>'


K['shadow'] = shadow          # the kit's pot_stack draws its own shadow


def grow(markup, foot):
    """A plant that grows in when the page opens. `foot` is where it grows from."""
    return f'<g class="pk__grow" data-o="{pts(*foot)}">{markup}</g>'


def glass_parts(glass, tint):
    """A vessel's glass for light paper: a backing in the window's colour (so the marker's stick behind it
    doesn't show through), and the glass itself with firmer lines."""
    body = glass[:glass.index('/>') + 2]
    backing = body.replace(f'fill="{C["glass"]}" fill-opacity=".07"', f'fill="{tint}"')
    assert backing != body
    front = glass.replace('stroke-opacity=".6"', 'stroke-opacity=".75"').replace('stroke-opacity=".55"', 'stroke-opacity=".7"').replace('fill-opacity=".07"', 'fill-opacity=".05"')
    return backing, front


def bag(x, w, h):
    """One of the kit's bags, standing up, with what is in it showing at the bottom."""
    y0 = TOP - h
    return (shadow(x, w - 6)
            + f'<path fill="{C["cream_l"]}" stroke="{C["cream_d"]}" stroke-width="1" d="M{pts(x - w / 2 + 2, y0 + 5)}Q{pts(x, y0 + 1, x + w / 2 - 2, y0 + 5)}L{pts(x + w / 2, TOP - 2)}Q{pts(x, TOP + 1, x - w / 2, TOP - 2)}Z"/>'
            f'<rect x="{n(x - w / 2 + 1.5)}" y="{n(y0 + 1)}" width="{n(w - 3)}" height="5" rx="1.5" fill="{C["cream_d"]}"/>'
            f'<path fill="{C["soil"]}" opacity=".45" d="M{pts(x - w / 2 + 1, TOP - h * .22)}Q{pts(x, TOP - h * .3, x + w / 2 - 1, TOP - h * .22)}L{pts(x + w / 2, TOP - 2)}Q{pts(x, TOP + 1, x - w / 2, TOP - 2)}Z"/>')


def pebbles(x, colours):
    """A few loose stones on the shelf."""
    spots = ((0, 2.6), (5.4, 2), (9.6, 3), (3.4, 1.6))
    return ''.join(f'<ellipse cx="{n(x + dx)}" cy="{n(TOP - r * .8)}" rx="{n(r * 1.25)}" ry="{n(r * .85)}" fill="{C[colours[i % len(colours)]]}"/>' for i, (dx, r) in enumerate(spots))


def can(x, k):
    """Her watering can from the footer, at rest on the shelf."""
    return shadow(x, 52 * k) + f'<g transform="translate({pts(x, TOP)}) scale({k})">{K["CAN"]}</g>'


def unique(markup):
    """Clip ids of our own, so they can't meet the footer scene's on the same page."""
    return markup.replace('id="jar', 'id="pk-jar').replace('url(#jar', 'url(#pk-jar').replace('id="bowl', 'id="pk-bowl').replace('url(#bowl', 'url(#pk-bowl')


def svg(body):
    return ('<!-- Drawn by tools/make-shop-picks.py; change that and run it again rather than editing this file. -->\n'
            f'<svg class="pk__art" viewBox="0 0 {W} {H}" aria-hidden="true" focusable="false">{unique(body)}</svg>\n')


def write(name, markup):
    with open(os.path.join(OUT, name), 'w', encoding='utf8') as f:
        f.write(markup)
    print(name, len(markup), 'bytes')


# ---------- DIY Terrarium Kits: a kit made up (her Closed jar in layers) beside the bags it comes in ----------
def kit_window():
    layers, glass, s = K['jar'](84, 86, 112)
    backing, front = glass_parts(glass, '#e4e7dc')
    plants = K['fern']((s[0] + 25, s[1] + 2), .5) + K['fittonia']((s[0] + 1, s[1] + 3), 1.5) + K['sprout']((s[0] - 16, s[1] + 4), .8)
    return (backing + bag(144, 26, 40) + bag(178, 17, 23) + bag(163, 22, 31) + pebbles(20, ('pebble', 'cream_d', 'pebble_d'))
            + shadow(84, 86) + layers + grow(plants, (s[0], s[1] + 3)) + front)


# ---------- Terrarium Bar: her Open bowl with sand, stones and succulents, and her watering can ----------
def tbar_window():
    inner, glass, s = K['bowl'](84, 120, 90)
    backing, front = glass_parts(glass, '#efe4e0')
    plants = K['rosette'](s[0] - 24, s[1] + 1, 1.8) + K['rosette'](s[0] + 18, s[1] + 2, 1.35) + K['rosette'](s[0] - 2, s[1] + 3, .9) + K['sprout']((s[0] + 42, s[1] + 4), 1.05)
    return (backing + can(163, .46) + shadow(84, 72) + inner + grow(plants, s) + front)


# ---------- Plant Bar: a pot you picked with a plant in it, the pots to choose from and the plants waiting ----------
def pbar_window():
    snake_pot, s0 = K['pot_cyl'](30, 26, 24, 'cream', speckle=True)
    pot, s = K['pot_taper'](84, 56, 42, 52, 'rose')
    stack = K['pot_stack'](134, 'terra', 34, 25, 28)
    small_pot, s2 = K['pot_cyl'](168, 22, 21, 'sage')
    return (shadow(30, 26) + grow(K['snake'](s0, 58, 4), s0) + snake_pot
            + stack + shadow(168, 22) + grow(K['fittonia']((s2[0], s2[1] + 2), 1.1), s2) + small_pot
            + shadow(84, 42) + grow(K['calathea'](s, .76), s) + pot)


os.makedirs(OUT, exist_ok=True)
write('kit.svg', svg(kit_window()))
write('tbar.svg', svg(tbar_window()))
write('pbar.svg', svg(pbar_window()))
