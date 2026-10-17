"""Read ground colors offline to measure effect outlines; never modify image pixels.
Navigation continues to use the independently surveyed collision polygons.
"""
import json
from pathlib import Path
from PIL import Image
from collections import defaultdict
root=Path(__file__).resolve().parent.parent
im=Image.open(root/'assets/production/forest/ground-v3.png').convert('RGB');w,h=im.size
mask={(x,y) for y in range(h) for x in range(w) if (lambda c:c[0]<35 and c[1]>145 and c[2]>205 and c[2]>c[1]+15)(im.getpixel((x,y)))}
edges=defaultdict(list)
for x,y in mask:
 for nx,ny,a,b in [(x,y-1,(x,y),(x+1,y)),(x+1,y,(x+1,y),(x+1,y+1)),(x,y+1,(x+1,y+1),(x,y+1)),(x-1,y,(x,y+1),(x,y))]:
  if (nx,ny) not in mask:edges[a].append(b)
loops=[]
while edges:
 start=next(iter(edges));p=start;loop=[]
 while True:
  loop.append(p);q=edges[p].pop()
  if not edges[p]:del edges[p]
  p=q
  if p==start:break
  if p not in edges:raise ValueError('Open water boundary')
 if len(loop)<30:continue
 # Keep turning points only. Rectilinear outline follows exact source pixel edge.
 clean=[p for i,p in enumerate(loop) if (p[0]-loop[i-1][0])*(loop[(i+1)%len(loop)][1]-p[1]) != (p[1]-loop[i-1][1])*(loop[(i+1)%len(loop)][0]-p[0])]
 area=abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(clean,clean[1:]+clean[:1])))/2
 if area>120:loops.append(clean)
data={'width':w,'height':h,'polygons':loops,'purpose':'water effect clipping only; not navigation'}
p=root/'assets/production/forest/water-v3.json';p.write_text(json.dumps(data,separators=(',',':'))+'\n');(root/'game/src/engine/forest-water.json').write_bytes(p.read_bytes());print(len(loops),'outlines',sum(map(len,loops)),'vertices')
