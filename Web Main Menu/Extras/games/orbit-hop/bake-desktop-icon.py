from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ICON_SIZE = 264
ICON_MARGIN = 1
GLOW_BLUR_RADIUS = 12
OUTPUT_PATH = Path(__file__).with_name("orbit-hop-desktop-icon.png")

PLANET_CORE = (61, 126, 200)
PLANET_RIM = (142, 200, 255)
PLANET_GLOW = (26, 64, 128)
PLANET_DARK = (10, 16, 32)
PLANET_SPIN_ANGLE = 0.85
PLANET_RING_RADIUS_FACTOR = 1.58
PLANET_RING_INNER_FACTOR = 0.9
PLANET_RING_TILT = 0.55
PLANET_RING_ANGLE = 0.32

TERRAIN_SPOTS = [
    (0.2, -0.35, 0.14, 0.22),
    (-0.42, 0.18, 0.11, 0.35),
    (0.35, 0.28, 0.09, 0.18),
    (-0.15, -0.12, 0.12, 0.42),
    (0.48, -0.08, 0.08, 0.28),
]


def blend_color(
    first: tuple[int, int, int],
    second: tuple[int, int, int],
    amount: float,
) -> tuple[int, int, int]:
    return (
        int(first[0] + (second[0] - first[0]) * amount),
        int(first[1] + (second[1] - first[1]) * amount),
        int(first[2] + (second[2] - first[2]) * amount),
    )


def get_planet_extent_at_radius(planet_radius: float) -> float:
    ring_radius = planet_radius * PLANET_RING_RADIUS_FACTOR
    ring_vertical = ring_radius * PLANET_RING_TILT
    atmosphere_radius = planet_radius * 1.18
    return max(atmosphere_radius, ring_radius, ring_vertical)


def draw_planet_sphere(image: Image.Image, center_x: float, center_y: float, radius: float) -> None:
    pixels = image.load()
    min_x = max(0, int(center_x - radius * 1.2))
    max_x = min(ICON_SIZE - 1, int(center_x + radius * 1.2))
    min_y = max(0, int(center_y - radius * 1.2))
    max_y = min(ICON_SIZE - 1, int(center_y + radius * 1.2))
    light_x = center_x - radius * 0.32
    light_y = center_y - radius * 0.36
    pixel_y = min_y
    while pixel_y <= max_y:
        pixel_x = min_x
        while pixel_x <= max_x:
            delta_x = pixel_x - center_x
            delta_y = pixel_y - center_y
            distance = math.hypot(delta_x, delta_y)
            if distance <= radius:
                normalized = distance / radius
                light_distance = math.hypot(pixel_x - light_x, pixel_y - light_y) / radius
                color = blend_color(PLANET_RIM, PLANET_CORE, min(1.0, normalized * 1.35 + light_distance * 0.18))
                color = blend_color(color, PLANET_GLOW, max(0.0, normalized - 0.45) * 1.4)
                color = blend_color(color, PLANET_DARK, max(0.0, normalized - 0.82) * 2.8)
                pixels[pixel_x, pixel_y] = color + (255,)
            elif distance <= radius * 1.18:
                atmosphere_strength = (distance - radius * 0.82) / (radius * 0.36)
                atmosphere_strength = max(0.0, min(1.0, atmosphere_strength))
                alpha = int(30 * atmosphere_strength)
                if alpha > 0:
                    existing = pixels[pixel_x, pixel_y]
                    pixels[pixel_x, pixel_y] = (120, 180, 255, max(existing[3], alpha))
            pixel_x += 1
        pixel_y += 1


def draw_planet_terrain(image: Image.Image, center_x: float, center_y: float, radius: float) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    for spot_angle, spot_distance, spot_size, spot_shade in TERRAIN_SPOTS:
        angle = spot_angle + PLANET_SPIN_ANGLE
        spot_x = center_x + math.cos(angle) * spot_distance * radius
        spot_y = center_y + math.sin(angle) * spot_distance * radius
        spot_radius = spot_size * radius
        if spot_shade > 0.55:
            fill_color = (255, 255, 255, int(40 + spot_shade * 35))
        else:
            fill_color = (0, 0, 0, int(30 + spot_shade * 70))
        draw.ellipse(
            (
                spot_x - spot_radius,
                spot_y - spot_radius,
                spot_x + spot_radius,
                spot_y + spot_radius,
            ),
            fill=fill_color,
        )


def draw_planet_highlights(image: Image.Image, center_x: float, center_y: float, radius: float) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    draw.arc(
        (
            center_x - radius,
            center_y - radius,
            center_x + radius,
            center_y + radius,
        ),
        int(math.degrees(PLANET_SPIN_ANGLE)),
        int(math.degrees(PLANET_SPIN_ANGLE + 1.4)),
        fill=(255, 255, 255, 26),
        width=max(1, int(radius * 0.05)),
    )
    draw.arc(
        (
            center_x - radius * 0.92,
            center_y - radius * 0.92,
            center_x + radius * 0.92,
            center_y + radius * 0.92,
        ),
        int(math.degrees(PLANET_SPIN_ANGLE + 0.8)),
        int(math.degrees(PLANET_SPIN_ANGLE + 2.1)),
        fill=(255, 255, 255, 26),
        width=max(1, int(radius * 0.04)),
    )


def draw_ring_half(
    image: Image.Image,
    center_x: float,
    center_y: float,
    planet_radius: float,
    is_front_half: bool,
) -> None:
    ring_layer = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(ring_layer, "RGBA")
    ring_radius = planet_radius * PLANET_RING_RADIUS_FACTOR
    inner_radius = ring_radius * PLANET_RING_INNER_FACTOR
    ring_line_width = max(2, int(planet_radius * 0.1))
    inner_line_width = max(1, int(ring_line_width * 0.55))
    bbox_outer = (
        center_x - ring_radius,
        center_y - ring_radius * PLANET_RING_TILT,
        center_x + ring_radius,
        center_y + ring_radius * PLANET_RING_TILT,
    )
    bbox_inner = (
        center_x - inner_radius,
        center_y - inner_radius * PLANET_RING_TILT,
        center_x + inner_radius,
        center_y + inner_radius * PLANET_RING_TILT,
    )
    if is_front_half:
        start_angle = 0
        end_angle = 180
    else:
        start_angle = 180
        end_angle = 360
    draw.arc(
        bbox_outer,
        start_angle,
        end_angle,
        fill=PLANET_RIM + (230,),
        width=ring_line_width,
    )
    draw.arc(
        bbox_inner,
        start_angle,
        end_angle,
        fill=PLANET_RIM + (115,),
        width=inner_line_width,
    )
    ring_layer = ring_layer.rotate(
        math.degrees(PLANET_RING_ANGLE),
        center=(center_x, center_y),
        resample=Image.Resampling.BICUBIC,
    )
    image.alpha_composite(ring_layer)


def draw_planet_mask(planet_radius: float) -> Image.Image:
    center = ICON_SIZE * 0.5
    mask = Image.new("L", (ICON_SIZE, ICON_SIZE), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse(
        (
            center - planet_radius,
            center - planet_radius,
            center + planet_radius,
            center + planet_radius,
        ),
        fill=255,
    )
    return mask


def render_icon(planet_radius: float) -> Image.Image:
    center = ICON_SIZE * 0.5
    icon = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    glow_source = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_source, "RGBA")
    glow_draw.ellipse(
        (
            center - planet_radius * 1.05,
            center - planet_radius * 1.05,
            center + planet_radius * 1.05,
            center + planet_radius * 1.05,
        ),
        fill=PLANET_GLOW + (180,),
    )
    glow_layer = glow_source.filter(ImageFilter.GaussianBlur(radius=GLOW_BLUR_RADIUS))
    glow_pixels = glow_layer.load()
    pixel_y = 0
    while pixel_y < ICON_SIZE:
        pixel_x = 0
        while pixel_x < ICON_SIZE:
            red, green, blue, alpha = glow_pixels[pixel_x, pixel_y]
            if alpha > 0:
                glow_pixels[pixel_x, pixel_y] = (PLANET_GLOW[0], PLANET_GLOW[1], PLANET_GLOW[2], min(90, alpha))
            pixel_x += 1
        pixel_y += 1
    icon.alpha_composite(glow_layer)

    draw_ring_half(icon, center, center, planet_radius, False)

    planet_layer = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    draw_planet_sphere(planet_layer, center, center, planet_radius)
    planet_mask = draw_planet_mask(planet_radius)
    terrain_layer = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    draw_planet_terrain(terrain_layer, center, center, planet_radius)
    terrain_layer.putalpha(Image.composite(terrain_layer.split()[3], Image.new("L", terrain_layer.size, 0), planet_mask))
    planet_layer = Image.alpha_composite(planet_layer, terrain_layer)
    draw_planet_highlights(planet_layer, center, center, planet_radius)
    icon.alpha_composite(planet_layer)

    draw_ring_half(icon, center, center, planet_radius, True)
    return icon


def get_alpha_margin(icon: Image.Image) -> int:
    alpha = icon.split()[3]
    bbox = alpha.getbbox()
    if not bbox:
        return ICON_SIZE
    left, top, right, bottom = bbox
    return min(left, top, ICON_SIZE - right, ICON_SIZE - bottom)


def get_planet_radius_for_icon() -> float:
    low_radius = 1.0
    high_radius = ICON_SIZE * 0.5
    fine_step = max(0.02, ICON_SIZE / 64 * 0.02)
    best_radius = low_radius
    search_index = 0
    while search_index < 28:
        mid_radius = (low_radius + high_radius) * 0.5
        icon = render_icon(mid_radius)
        margin = get_alpha_margin(icon)
        if margin >= ICON_MARGIN:
            best_radius = mid_radius
            low_radius = mid_radius
        else:
            high_radius = mid_radius
        search_index += 1
    fine_radius = best_radius
    while fine_radius < high_radius:
        fine_radius += fine_step
        icon = render_icon(fine_radius)
        if get_alpha_margin(icon) < ICON_MARGIN:
            fine_radius -= fine_step
            break
        best_radius = fine_radius
    return best_radius


def bake_icon() -> None:
    planet_radius = get_planet_radius_for_icon()
    icon = render_icon(planet_radius)
    icon.save(OUTPUT_PATH, format="PNG")
    print(f"planet_radius={planet_radius:.3f}")
    print(f"alpha_margin={get_alpha_margin(icon)}")


if __name__ == "__main__":
    bake_icon()
    print(f"Wrote {OUTPUT_PATH}")
