"""Read alpha to locate actual gutters/bounds. Prints metadata; does not edit pixels."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
im = Image.open(root / 'assets/production/combat-actors.png')
alpha = im.getchannel('A').point(lambda v: 255 if v > 32 else 0)
w, h = im.size
ys = [0]
for i in range(1, 6):
    target = h * i // 6
    margin = h // 24
    ys.append(min((sum(v > 0 for v in alpha.crop((0, y, w, y + 1)).getdata()), abs(y-target), y) for y in range(target-margin, target+margin))[2])
ys.append(h)
rows = []
for top, bottom in zip(ys, ys[1:]):
    xs = [0]
    for i in range(1, 6):
        target = w * i // 6
        margin = w // 24
        xs.append(min((sum(v > 0 for v in alpha.crop((x, top, x+1, bottom)).getdata()), abs(x-target), x) for x in range(target-margin, target+margin))[2])
    xs.append(w)
    row = []
    for left, right in zip(xs, xs[1:]):
        x, y, r, b = alpha.crop((left, top, right, bottom)).getbbox()
        row.append([left+x, top+y, r-x, b-y])
    rows.append(row)
# Two rows overlap vertically in different columns: measured isolated foot/cap bounds.
# A single horizontal division would cut the wood sprite and include it above the mushroom.
rows[4][2] = [544, 726, 177, 159]
rows[5][2] = [591, 902, 120, 109]
pivots = []
for row in rows:
    points = []
    for x, y, width, height in row:
        foot = alpha.crop((x, y + int(height * .85), x + width, y + height)).getbbox()
        points.append(round((foot[0] + foot[2]) / 2, 1))
    pivots.append(points)
print(json.dumps({'width':w,'height':h,'groundRatio':0.688,'rowHeights':[max(r[3] for r in row) for row in rows],'pivots':pivots,'rows':rows}, indent=2))
