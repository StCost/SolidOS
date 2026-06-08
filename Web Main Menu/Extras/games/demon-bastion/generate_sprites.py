import os
import struct
import zlib
from PIL import Image


SPRITE_DIR = os.path.join(os.path.dirname(__file__), "sprites")
TILE_SIZE = 32


def write_png(path, width, height, rgba_rows):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + bytes(row) for row in rgba_rows)
    compressed = zlib.compress(raw, 9)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")
    with open(path, "wb") as handle:
        handle.write(png)


def clamp(value, low, high):
    if value < low:
        return low
    if value > high:
        return high
    return value


def tile_hash(cell_x, cell_y, seed):
    value = cell_x * 374761393 + cell_y * 668265263 + seed
    value = (value ^ (value >> 13)) & 0xFFFFFFFF
    value = (value * 1274126177) & 0xFFFFFFFF
    return value & 255


def mix_color(base, accent, ratio):
    return (
        clamp(int(base[0] + (accent[0] - base[0]) * ratio), 0, 255),
        clamp(int(base[1] + (accent[1] - base[1]) * ratio), 0, 255),
        clamp(int(base[2] + (accent[2] - base[2]) * ratio), 0, 255),
        255,
    )


def make_tile_rows(pixel_fn):
    rows = []
    for y in range(TILE_SIZE):
        row = []
        for x in range(TILE_SIZE):
            row.extend(pixel_fn(x, y))
        rows.append(row)
    return rows


def make_ground_tile():
    base = (58, 80, 56)
    dark = (42, 62, 40)
    light = (72, 98, 68)

    def pixel(x, y):
        noise = tile_hash(x, y, 11) / 255.0
        if ((x + y) & 3) == 0:
            noise += 0.12
        if (x & 7) == 0 or (y & 7) == 0:
            noise -= 0.08
        if noise < 0.35:
            color = mix_color(base, dark, 0.55)
        elif noise > 0.72:
            color = mix_color(base, light, 0.45)
        else:
            color = base + (255,)
        return color

    return make_tile_rows(pixel)


def make_mountain_tile():
    base = (74, 64, 56)
    dark = (54, 46, 40)
    light = (92, 80, 70)

    def pixel(x, y):
        ridge = abs((x * 5 + y * 3) % 17 - 8) / 8.0
        noise = tile_hash(x, y, 29) / 255.0
        blend = noise * 0.65 + ridge * 0.35
        if blend < 0.34:
            color = mix_color(base, dark, 0.7)
        elif blend > 0.68:
            color = mix_color(base, light, 0.55)
        else:
            color = base + (255,)
        if (x + y * 2) % 11 == 0:
            color = mix_color(color[:3], dark, 0.35)
        return color

    return make_tile_rows(pixel)


def make_ore_tile():
    base = (90, 64, 48)
    dark = (70, 48, 36)
    gold = (196, 148, 52)
    gold_bright = (236, 188, 72)

    def pixel(x, y):
        noise = tile_hash(x, y, 47) / 255.0
        if noise < 0.38:
            color = mix_color(base, dark, 0.5)
        else:
            color = base + (255,)
        vein = tile_hash(x * 3 + 5, y * 2 + 1, 83) / 255.0
        spot = tile_hash(x, y, 101) / 255.0
        if vein > 0.82 and spot > 0.55:
            color = mix_color(color[:3], gold_bright if spot > 0.78 else gold, 0.85)
        elif vein > 0.72:
            color = mix_color(color[:3], gold, 0.55)
        return color

    return make_tile_rows(pixel)


def make_wall_tile():
    base = (122, 104, 88)
    dark = (84, 72, 62)
    light = (150, 132, 114)
    edge = (68, 58, 48)
    block_size = 4

    def pixel(x, y):
        block_x = x // block_size
        block_y = y // block_size
        local_x = x % block_size
        local_y = y % block_size
        block_noise = tile_hash(block_x, block_y, 151) / 255.0
        pixel_noise = tile_hash(x, y, 173) / 255.0
        if block_noise < 0.32:
            color = mix_color(base, dark, 0.5)
        elif block_noise > 0.7:
            color = mix_color(base, light, 0.38)
        else:
            color = base + (255,)
        if pixel_noise < 0.16:
            color = mix_color(color[:3], dark, 0.35)
        elif pixel_noise > 0.86:
            color = mix_color(color[:3], light, 0.28)
        if local_x == 0 or local_y == 0:
            color = mix_color(color[:3], edge, 0.42)
        elif local_x == block_size - 1 or local_y == block_size - 1:
            color = mix_color(color[:3], edge, 0.22)
        return color

    return make_tile_rows(pixel)


def save_tile(name, rows):
    path = os.path.join(SPRITE_DIR, name)
    image = Image.new("RGBA", (TILE_SIZE, TILE_SIZE))
    pixels = image.load()
    for y in range(TILE_SIZE):
        row = rows[y]
        for x in range(TILE_SIZE):
            offset = x * 4
            pixels[x, y] = (row[offset], row[offset + 1], row[offset + 2], row[offset + 3])
    image.save(path, "PNG")
    print("wrote tile", path)


def is_keyed_background(red, green, blue, alpha, background, tolerance):
    if alpha < 16:
        return True
    if (
        abs(red - background[0]) <= tolerance
        and abs(green - background[1]) <= tolerance
        and abs(blue - background[2]) <= tolerance
    ):
        return True
    return False


def mark_exterior_background(pixels, width, height, background, tolerance):
    exterior = [[False] * width for _ in range(height)]
    queue = []
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))
    head = 0
    while head < len(queue):
        x, y = queue[head]
        head += 1
        if x < 0 or y < 0 or x >= width or y >= height:
            continue
        if exterior[y][x]:
            continue
        red, green, blue, alpha = pixels[x, y]
        if not is_keyed_background(red, green, blue, alpha, background, tolerance):
            continue
        exterior[y][x] = True
        queue.append((x + 1, y))
        queue.append((x - 1, y))
        queue.append((x, y + 1))
        queue.append((x, y - 1))
    return exterior


def apply_background_key(image, background=(26, 20, 16), tolerance=42):
    pixels = image.load()
    width, height = image.size
    exterior = mark_exterior_background(pixels, width, height, background, tolerance)
    for y in range(height):
        for x in range(width):
            if exterior[y][x]:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            red, green, blue, alpha = pixels[x, y]
            if alpha < 16 or is_keyed_background(red, green, blue, alpha, background, tolerance):
                pixels[x, y] = (0, 0, 0, 255)


def crop_to_opaque_bounds(image):
    pixels = image.load()
    width, height = image.size
    min_x = width
    min_y = height
    max_x = -1
    max_y = -1
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] < 16:
                continue
            if x < min_x:
                min_x = x
            if y < min_y:
                min_y = y
            if x > max_x:
                max_x = x
            if y > max_y:
                max_y = y
    if max_x < min_x or max_y < min_y:
        return image
    return image.crop((min_x, min_y, max_x + 1, max_y + 1))


def trim_sprite(path, output_max=64):
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    if width < 2 or height < 2:
        return
    background = (26, 20, 16, 255)
    bordered = Image.new("RGBA", (width + 2, height + 2), background)
    bordered.paste(image, (1, 1))
    apply_background_key(bordered)
    cropped = crop_to_opaque_bounds(bordered)
    crop_width, crop_height = cropped.size
    scale = min(1.0, float(output_max) / float(max(crop_width, crop_height)))
    if scale < 1.0:
        new_width = max(1, int(crop_width * scale))
        new_height = max(1, int(crop_height * scale))
        cropped = cropped.resize((new_width, new_height), Image.NEAREST)
        apply_background_key(cropped)
        cropped = crop_to_opaque_bounds(cropped)
    cropped.save(path)
    print("trimmed", path, "->", cropped.size[0], "x", cropped.size[1])


def repair_sprite_holes(path, background=(26, 20, 16), tolerance=42):
    image = Image.open(path).convert("RGBA")
    apply_background_key(image, background, tolerance)
    image.save(path)
    print("repaired", path)


def set_black_on_transparent_pixels(image, alpha_threshold=16):
    pixels = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha < alpha_threshold:
                pixels[x, y] = (0, 0, 0, 255)


def process_sprite_black_transparency(path):
    image = Image.open(path).convert("RGBA")
    set_black_on_transparent_pixels(image)
    image.save(path)
    print("black transparency", path)


def main():
    os.makedirs(SPRITE_DIR, exist_ok=True)
    save_tile("sprite-ground.png", make_ground_tile())
    save_tile("sprite-mountain.png", make_mountain_tile())
    save_tile("sprite-ore.png", make_ore_tile())
    save_tile("sprite-wall.png", make_wall_tile())

    trim_names = [
        "sprite-turret.png",
        "sprite-laser.png",
        "sprite-mine.png",
        "sprite-dog-house.png",
        "sprite-workshop.png",
        "sprite-rocket.png",
        "sprite-mine-shaft.png",
        "sprite-worker.png",
        "sprite-dog.png",
        "sprite-demon.png",
        "sprite-projectile.png",
    ]
    for name in trim_names:
        repair_sprite_holes(os.path.join(SPRITE_DIR, name))

    for name in sorted(os.listdir(SPRITE_DIR)):
        if not name.endswith(".png"):
            continue
        process_sprite_black_transparency(os.path.join(SPRITE_DIR, name))


if __name__ == "__main__":
    main()
