# Writes src/leaves.svg, the fine leaf outlines tiled behind every page (site.css, body). Run: python tools/make-leaves.py src/leaves.svg
import math, sys
def leaf(x, y, L, w, rot, vein=True):
    p = f'M0 0C{w:.1f} {-L*.28:.1f} {w*.9:.1f} {-L*.72:.1f} 0 {-L:.1f}C{-w*.9:.1f} {-L*.72:.1f} {-w:.1f} {-L*.28:.1f} 0 0Z'
    v = f'M0 6V{-L*.9:.1f}' if vein else ''
    return f'<g transform="translate({x} {y}) rotate({rot})"><path d="{p}"/>' + (f'<path d="{v}"/>' if v else '') + '</g>'
def sprig(x, y, L, rot, n=5):
    out = [f'<g transform="translate({x} {y}) rotate({rot})"><path d="M0 0C4 {-L*.4:.1f} -3 {-L*.75:.1f} 0 {-L:.1f}"/>']
    for i in range(n):
        t = (i + 1) / (n + 1); yy = -L * t; side = 1 if i % 2 else -1
        out.append(leaf(0, round(yy, 1), 22 - i * 2, 7 - i * .6, side * 52, vein=False))
    out.append(leaf(0, round(-L, 1), 16, 5.5, 0, vein=False))
    return ''.join(out) + '</g>'
items = [
    leaf(70, 120, 78, 24, -28), leaf(300, 70, 54, 17, 40), sprig(220, 330, 120, 18),
    leaf(380, 300, 66, 20, -62), sprig(60, 420, 96, 26, 4), leaf(150, 230, 40, 13, 110),
    leaf(430, 170, 46, 15, 160),
]
svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="460" height="460" viewBox="0 0 460 460">'
       '<g fill="none" stroke="#4f5b45" stroke-opacity=".06" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">'
       + ''.join(items) + '</g></svg>\n')
open(sys.argv[1], 'w').write(svg)
