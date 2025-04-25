import cv2
import numpy as np
import argparse
from pathlib import Path
import math

def extract_color(image_path, color_lower, color_upper, blur=5):
    """
    Extract a specific color range from an image.
    
    Args:
        image_path: Path to the image file
        color_lower: Lower bound of the color range in HSV
        color_upper: Upper bound of the color range in HSV
        blur: Amount of blur to apply
        
    Returns:
        Binary image with the color extracted
    """
    # Read the image
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")
    
    # Apply blur to reduce noise
    blurred = cv2.GaussianBlur(img, (blur, blur), 0)
    
    # Convert to HSV
    hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)
    
    # Create a mask for the specified color range
    mask = cv2.inRange(hsv, np.array(color_lower), np.array(color_upper))
    
    # Apply morphological operations to clean up the mask
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    return mask

def contours_to_path(binary_image, min_contour_length=50, simplify=True, use_bezier=True, bezier_smoothing=0.25):
    """
    Convert contours from a binary image to SVG path data.
    
    Args:
        binary_image: Binary image with the contours
        min_contour_length: Minimum length of contours to include
        simplify: Whether to simplify the contours
        use_bezier: Whether to use bezier curves
        bezier_smoothing: Smoothing factor for bezier curves
        
    Returns:
        SVG path data string
    """
    # Find contours
    contours, _ = cv2.findContours(binary_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter out small contours
    contours = [c for c in contours if cv2.arcLength(c, False) > min_contour_length]
    
    # Sort contours by area (largest first)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    if not contours:
        print("No significant contours found.")
        return ""
    
    # Create SVG path data
    svg_path_data = ""
    
    for contour in contours:
        # Simplify contour if requested
        if simplify:
            epsilon = 0.0025 * cv2.arcLength(contour, True)
            contour = cv2.approxPolyDP(contour, epsilon, True)
        
        # Extract points from contour
        points = [point[0] for point in contour]
        
        if use_bezier and len(points) > 2:
            # Convert to bezier curves
            svg_path_data += points_to_bezier(points, bezier_smoothing)
        else:
            # Start a new subpath
            svg_path_data += f"M{points[0][0]},{points[0][1]}"
            
            # Add line segments
            for point in points[1:]:
                svg_path_data += f" L{point[0]},{point[1]}"
    
    return svg_path_data

def points_to_bezier(points, smoothing=0.25):
    """
    Convert a series of points to a smooth bezier path.
    
    Args:
        points: List of (x, y) coordinates
        smoothing: Smoothing factor (0-1)
        
    Returns:
        SVG path string with bezier curves
    """
    if len(points) < 2:
        return ""
    
    # Start path
    path = f"M{points[0][0]},{points[0][1]}"
    
    if len(points) == 2:
        # Just a straight line
        return path + f" L{points[1][0]},{points[1][1]}"
    
    # Calculate control points for each segment
    for i in range(1, len(points) - 1):
        p0 = points[i - 1]
        p1 = points[i]
        p2 = points[i + 1]
        
        # Calculate distance between points
        d1 = math.sqrt((p1[0] - p0[0]) ** 2 + (p1[1] - p0[1]) ** 2)
        d2 = math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)
        
        # Determine control point length (smoothing factor applied)
        d1_smooth = d1 * smoothing
        d2_smooth = d2 * smoothing
        
        # Calculate unit vectors
        if d1 > 0:
            v1x = (p1[0] - p0[0]) / d1
            v1y = (p1[1] - p0[1]) / d1
        else:
            v1x, v1y = 0, 0
            
        if d2 > 0:
            v2x = (p2[0] - p1[0]) / d2
            v2y = (p2[1] - p1[1]) / d2
        else:
            v2x, v2y = 0, 0
        
        # Control points
        c1x = p1[0] - v1x * d1_smooth
        c1y = p1[1] - v1y * d1_smooth
        c2x = p1[0] + v2x * d2_smooth
        c2y = p1[1] + v2y * d2_smooth
        
        # Add curve segment
        if i == 1:
            # First segment - include the first point
            path += f" C{c1x},{c1y} {c2x},{c2y} {p2[0]},{p2[1]}"
        else:
            # Subsequent segments - use shorthand for first control point
            path += f" S{c2x},{c2y} {p2[0]},{p2[1]}"
            
    return path

def save_svg(path_data, output_path, width=600, height=420, color="navy", stroke_width=3):
    """
    Save path data as an SVG file.
    
    Args:
        path_data: SVG path data string
        output_path: Path to save the SVG file
        width: Width of the SVG viewBox
        height: Height of the SVG viewBox
        color: Stroke color
        stroke_width: Width of the stroke
    """
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
    <path d="{path_data}" fill="none" stroke="{color}" stroke-width="{stroke_width}"/>
</svg>"""
    
    with open(output_path, 'w') as f:
        f.write(svg_content)
    
    print(f"SVG saved to {output_path}")

def color_name_to_hsv_range(color_name):
    """
    Convert a color name to an HSV range for filtering.
    
    Args:
        color_name: Name of the color
        
    Returns:
        Tuple of (lower_bound, upper_bound) for HSV filtering
    """
    # Common color ranges in HSV
    color_ranges = {
        'blue': ([90, 50, 50], [130, 255, 255]),
        'dark_blue': ([100, 100, 50], [140, 255, 255]),
        'light_blue': ([80, 50, 50], [110, 255, 255]),
        'navy': ([100, 150, 0], [140, 255, 180]),
        'red': ([0, 100, 100], [10, 255, 255]),  # Red is tricky in HSV as it wraps around
        'red2': ([160, 100, 100], [179, 255, 255]),  # Second range for red
        'green': ([40, 50, 50], [80, 255, 255]),
        'yellow': ([20, 100, 100], [40, 255, 255]),
        'orange': ([10, 100, 100], [25, 255, 255]),
        'purple': ([125, 50, 50], [155, 255, 255]),
        'pink': ([140, 50, 100], [170, 255, 255]),
        'black': ([0, 0, 0], [180, 255, 50]),
        'white': ([0, 0, 200], [180, 30, 255]),
        'gray': ([0, 0, 100], [180, 30, 200])
    }
    
    if color_name == 'red':
        return [(0, 100, 100), (10, 255, 255), (160, 100, 100), (179, 255, 255)]
    
    if color_name not in color_ranges:
        raise ValueError(f"Color '{color_name}' not recognized. Available colors: {', '.join(color_ranges.keys())}")
    
    return color_ranges[color_name]

def extract_colored_path(image_path, color_name, output_path=None, min_contour_length=50, simplify=True, use_bezier=True, bezier_smoothing=0.25, show_extracted=False):
    """
    Extract a colored path from an image.
    
    Args:
        image_path: Path to the image file
        color_name: Name of the color to extract
        output_path: Path to save the output SVG
        min_contour_length: Minimum length of contours to include
        simplify: Whether to simplify the contours
        use_bezier: Whether to use bezier curves
        bezier_smoothing: Smoothing factor for bezier curves
        show_extracted: Whether to show the extracted color mask
        
    Returns:
        SVG path data string
    """
    # Get the HSV range for the color
    color_range = color_name_to_hsv_range(color_name)
    
    # If it's red (which needs two ranges), handle separately
    if len(color_range) == 4:
        lower1, upper1, lower2, upper2 = color_range
        
        # Extract both ranges and combine
        mask1 = extract_color(image_path, lower1, upper1)
        mask2 = extract_color(image_path, lower2, upper2)
        color_mask = cv2.bitwise_or(mask1, mask2)
    else:
        lower, upper = color_range
        color_mask = extract_color(image_path, lower, upper)
    
    # Save or show the extracted color mask if requested
    if show_extracted:
        mask_path = Path(image_path).with_suffix('.mask.png')
        cv2.imwrite(str(mask_path), color_mask)
        print(f"Extracted color mask saved to {mask_path}")
    
    # Convert to SVG path
    svg_path = contours_to_path(
        color_mask,
        min_contour_length=min_contour_length,
        simplify=simplify,
        use_bezier=use_bezier,
        bezier_smoothing=bezier_smoothing
    )
    
    # Determine output path if not provided
    if output_path is None:
        output_path = Path(image_path).with_suffix('.svg')
    
    # Save the SVG
    if svg_path:
        save_svg(svg_path, output_path, color=color_name)
    
    return svg_path

def main():
    parser = argparse.ArgumentParser(description='Extract a colored path from an image and convert to SVG')
    parser.add_argument('image_path', type=str, help='Path to the input image')
    parser.add_argument('--color', type=str, default='blue', help='Color to extract (blue, red, green, etc.)')
    parser.add_argument('--output', type=str, help='Path to save the output SVG', default=None)
    parser.add_argument('--min-length', type=int, default=50, help='Minimum length of contours to include')
    parser.add_argument('--no-simplify', action='store_true', help='Disable contour simplification')
    parser.add_argument('--no-bezier', action='store_true', help='Disable bezier curves')
    parser.add_argument('--bezier-smoothing', type=float, default=0.25, help='Bezier curve smoothing factor (0-1)')
    parser.add_argument('--show-extracted', action='store_true', help='Save the extracted color mask')
    parser.add_argument('--width', type=int, default=600, help='Width of the SVG viewBox')
    parser.add_argument('--height', type=int, default=420, help='Height of the SVG viewBox')
    parser.add_argument('--stroke-color', type=str, default=None, help='Stroke color for the SVG path (defaults to extraction color)')
    parser.add_argument('--stroke-width', type=int, default=3, help='Stroke width for the SVG path')
    
    args = parser.parse_args()
    
    # Determine output path
    if args.output is None:
        output_path = Path(args.image_path).with_suffix('.svg')
    else:
        output_path = Path(args.output)
    
    # Extract the colored path
    svg_path = extract_colored_path(
        args.image_path,
        args.color,
        output_path,
        min_contour_length=args.min_length,
        simplify=not args.no_simplify,
        use_bezier=not args.no_bezier,
        bezier_smoothing=args.bezier_smoothing,
        show_extracted=args.show_extracted
    )
    
    if svg_path:
        # Determine stroke color
        stroke_color = args.stroke_color or args.color
        
        # Save the SVG
        save_svg(svg_path, output_path, args.width, args.height, stroke_color, args.stroke_width)
        print(f"Path data: {svg_path[:100]}..." if len(svg_path) > 100 else svg_path)

if __name__ == "__main__":
    main() 