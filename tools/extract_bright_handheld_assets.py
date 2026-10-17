"""Extract approved Bright Handheld sprites from the selected direction board.

The direction board is the immutable visual reference. This script keeps the
first Scene 1 prototype assets reproducible while dedicated animation sheets
are produced later.
"""

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "ai-workflow/mockups/pixel-art-asset-directions/B-bright-handheld.png"
OUTPUT = ROOT / "game/public/assets/bright-handheld"

# Boxes are (left, top, right, bottom) in the approved 1672 × 941 board.
SPRITES = {
    "hero-A.png": (998, 12, 1142, 174),
    "hero-B.png": (1155, 12, 1312, 174),
    "hero-C.png": (1322, 12, 1488, 174),
    "hero-D.png": (1490, 12, 1640, 174),
    "npc-smith.png": (980, 360, 1138, 490),
    "npc-healer.png": (1210, 360, 1385, 490),
    "npc-teacher.png": (1440, 360, 1625, 490),
}


def is_background(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, _ = pixel
    return min(r, g, b) > 205 and max(r, g, b) - min(r, g, b) < 55


def remove_connected_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    queue: deque[tuple[int, int]] = deque()
    visited: set[tuple[int, int]] = set()

    for x in range(width):
        queue.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        queue.extend(((0, y), (width - 1, y)))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or not (0 <= x < width and 0 <= y < height):
            continue
        visited.add((x, y))
        if not is_background(pixels[x, y]):
            continue
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))

    alpha_box = rgba.getchannel("A").getbbox()
    if alpha_box:
        rgba = rgba.crop(alpha_box)
    padded = Image.new("RGBA", (rgba.width + 16, rgba.height + 16), (0, 0, 0, 0))
    padded.alpha_composite(rgba, (8, 8))
    return padded


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    board = Image.open(SOURCE).convert("RGBA")
    if board.size != (1672, 941):
        raise RuntimeError(f"Unexpected reference size: {board.size}")
    for filename, box in SPRITES.items():
        remove_connected_background(board.crop(box)).save(OUTPUT / filename)


if __name__ == "__main__":
    main()
