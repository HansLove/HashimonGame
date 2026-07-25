#!/usr/bin/env python3
"""Export crypto person spritesheets (128x128, 4x4 grid of 32x32 frames)."""

import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "images", "characters", "people", "crypto")

C = {
    "outline": (26, 20, 40),
    "skin": (212, 165, 116),
    "skinLight": (232, 196, 154),
    "hair": (58, 42, 26),
    "outfitDark": (42, 36, 56),
    "outfitMid": (61, 53, 80),
    "green": (124, 255, 154),
    "greenDark": (74, 158, 98),
    "orange": (247, 147, 26),
    "purple": (155, 5, 168),
    "purpleDark": (106, 4, 117),
    "cyan": (90, 212, 232),
    "gold": (255, 215, 106),
    "grey": (138, 132, 152),
    "visor": (0, 255, 136),
    "lamp": (255, 229, 102),
}


def put(draw, ox, oy, x, y, color, w=1, h=1, flip=False):
    px = ox + (31 - x - w + 1 if flip else x)
    py = oy + y
    draw.rectangle([px, py, px + w - 1, py + h - 1], fill=color)


def draw_frame(img, ox, oy, direction, walk_frame, archetype):
    draw = ImageDraw.Draw(img)
    cy = 22
    bob = {-1: 0, 0: -1, 1: 0, 2: 0, 3: 1}.get(walk_frame, 0)
    y = cy + bob
    flip = direction == 3
    is_up = direction == 2
    is_side = direction in (1, 3)

    def m(x, yp, color, w=1, h=1):
        put(draw, ox, oy, x, yp, color, w, h, flip)

    # feet shadow
    put(draw, ox, oy, 12, 28, (30, 28, 40), 8, 2)

    # legs
    m(13, y + 4, C["outfitDark"], 2, 4)
    m(17, y + 4, C["outfitDark"], 2, 4)
    if walk_frame in (1, 3):
        m(13 + (-1 if walk_frame == 1 else 1), y + 5, C["outfitMid"], 2, 3)

    body_w = 12 if archetype == "boss" else 10
    body_x = 16 - body_w // 2
    put(draw, ox, oy, body_x, y - 2, C["outfitDark"], body_w, 8)
    put(draw, ox, oy, body_x + 1, y - 1, C["outfitMid"], body_w - 2, 6)

    if archetype == "explorer":
        put(draw, ox, oy, 14, y, C["green"], 4, 3)
        put(draw, ox, oy, 15, y + 1, C["outfitDark"], 2, 1)
        put(draw, ox, oy, 22, y - 1, C["outfitDark"], 4, 6)
        put(draw, ox, oy, 23, y, C["greenDark"], 2, 2)
    elif archetype == "miner":
        put(draw, ox, oy, 13, y, C["orange"], 6, 5)
        put(draw, ox, oy, 14, y + 1, C["outfitDark"], 4, 2)
    elif archetype == "hacker":
        put(draw, ox, oy, 13, y, C["outfitDark"], 6, 6)
        put(draw, ox, oy, 14, y + 1, C["greenDark"], 4, 3)
    elif archetype == "node":
        put(draw, ox, oy, 13, y, C["cyan"], 6, 5)
        put(draw, ox, oy, 14, y + 1, C["outfitDark"], 4, 2)
        put(draw, ox, oy, 12, y - 3, C["cyan"], 1, 4)
        put(draw, ox, oy, 19, y - 3, C["cyan"], 1, 4)
    elif archetype == "trader":
        put(draw, ox, oy, 12, y - 1, C["outfitMid"], 8, 7)
        put(draw, ox, oy, 15, y + 2, C["gold"], 2, 2)
    elif archetype == "validator":
        put(draw, ox, oy, 13, y, C["purpleDark"], 6, 6)
        put(draw, ox, oy, 14, y + 1, C["purple"], 4, 3)
        put(draw, ox, oy, 15, y + 2, C["gold"], 2, 1)
    elif archetype == "boss":
        put(draw, ox, oy, 11, y - 2, C["purpleDark"], 10, 9)
        put(draw, ox, oy, 13, y, C["purple"], 6, 5)
        put(draw, ox, oy, 15, y + 1, C["gold"], 2, 2)

    arm_swing = -1 if walk_frame == 1 else (1 if walk_frame == 3 else 0)
    m(11 + arm_swing, y, C["outfitMid"], 2, 4)
    m(19 - arm_swing, y, C["outfitMid"], 2, 4)

    if is_up:
        put(draw, ox, oy, 13, y - 10, C["hair"], 6, 4)
        if archetype == "hacker":
            put(draw, ox, oy, 12, y - 11, C["outfitDark"], 8, 5)
        if archetype == "miner":
            put(draw, ox, oy, 12, y - 12, C["orange"], 8, 3)
            put(draw, ox, oy, 14, y - 13, C["lamp"], 4, 2)
        return

    put(draw, ox, oy, 13, y - 9, C["skin"], 6, 5)
    put(draw, ox, oy, 14, y - 10, C["skinLight"], 4, 2)

    if archetype == "miner":
        put(draw, ox, oy, 12, y - 13, C["orange"], 8, 4)
        put(draw, ox, oy, 14, y - 14, C["lamp"], 4, 2)
    elif archetype == "hacker":
        put(draw, ox, oy, 12, y - 12, C["outfitDark"], 8, 4)
        put(draw, ox, oy, 13, y - 8, C["visor"], 6, 2)
    elif archetype == "node":
        put(draw, ox, oy, 13, y - 12, C["grey"], 6, 3)
        put(draw, ox, oy, 11, y - 11, C["cyan"], 2, 1)
        put(draw, ox, oy, 19, y - 11, C["cyan"], 2, 1)
    elif archetype == "trader":
        put(draw, ox, oy, 13, y - 12, C["hair"], 6, 3)
        put(draw, ox, oy, 12, y - 11, C["outfitMid"], 8, 2)
    elif archetype == "validator":
        put(draw, ox, oy, 12, y - 12, C["purpleDark"], 8, 4)
        put(draw, ox, oy, 14, y - 11, C["purple"], 4, 2)
    elif archetype == "boss":
        put(draw, ox, oy, 11, y - 13, C["purpleDark"], 10, 5)
        put(draw, ox, oy, 13, y - 12, C["purple"], 6, 3)
    else:
        put(draw, ox, oy, 13, y - 12, C["hair"], 6, 3)
        put(draw, ox, oy, 12, y - 11, C["outfitMid"], 8, 2)

    if not is_side:
        put(draw, ox, oy, 14, y - 7, C["outline"], 1, 1)
        put(draw, ox, oy, 17, y - 7, C["outline"], 1, 1)
        put(draw, ox, oy, 15, y - 5, C["skin"], 2, 1)
    else:
        m(15, y - 7, C["outline"], 1, 1)
        m(16, y - 6, C["skin"], 1, 1)


def build_sheet(archetype):
    img = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    for direction in range(4):
        for row in range(4):
            draw_frame(img, direction * 32, row * 32, direction, row, archetype)
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    for name in ["explorer", "miner", "hacker", "node", "trader", "validator", "boss"]:
        path = os.path.join(OUT, f"{name}.png")
        build_sheet(name).save(path)
        print("Wrote", path)


if __name__ == "__main__":
    main()
