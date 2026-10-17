"""Inspect alpha only and write source rectangles; never alter image pixels."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
result = {}
for name, rows, columns in [(f'hero-{hero}', 4, 3) for hero in 'ABCD'] + [('npcs', 3, 3), ('villagers', 4, 6)]:
    im = Image.open(root / f'assets/production/{name}.png')
    alpha = im.getchannel('A').point(lambda value: 255 if value > 32 else 0)
    width, height = im.size
    ys = [0]
    for index in range(1, rows):
        target = height * index // rows
        margin = height // rows // 4
        ys.append(min((sum(v > 0 for v in alpha.crop((0, y, width, y + 1)).getdata()), abs(y-target), y) for y in range(target-margin, target+margin))[2])
    ys.append(height)
    frames = []
    for top, bottom in zip(ys, ys[1:]):
        xs = [0]
        for index in range(1, columns):
            target = width * index // columns
            margin = width // columns // 4
            xs.append(min((sum(v > 0 for v in alpha.crop((x, top, x+1, bottom)).getdata()), abs(x-target), x) for x in range(target-margin, target+margin))[2])
        xs.append(width)
        for left, right in zip(xs, xs[1:]):
            bounds = alpha.crop((left, top, right, bottom)).getbbox()
            if not bounds: raise ValueError(f'Empty frame: {name}')
            x, y, r, b = bounds
            frames.append([left+x, top+y, r-x, b-y])
    result[name] = {'width': width, 'height': height, 'maxHeight': max(frame[3] for frame in frames), 'frames': frames}
output = root / 'assets/production/sprite-frames.json'
output.write_text(json.dumps(result, indent=2)+'\n')
(root / 'game/src/engine/sprite-frames.json').write_bytes(output.read_bytes())
print(f'Inspected {sum(len(item["frames"]) for item in result.values())} source rectangles. Image files unchanged.')
