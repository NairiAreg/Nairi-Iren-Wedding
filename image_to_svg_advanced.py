import cv2
import numpy as np
import argparse
from pathlib import Path
import math

def simplify_contour(contour, epsilon_factor=0.0025):
    """
    Simplify a contour using the Douglas-Peucker algorithm.
    
    Args:
        contour: The contour to simplify
        epsilon_factor: Factor to determine epsilon based on contour length
        
    Returns:
        Simplified contour
    """
    epsilon = epsilon_factor * cv2.arcLength(contour, True)
    return cv2.approxPolyDP(contour, epsilon, True)

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

def image_to_svg_path(image_path, threshold_value=127, min_contour_length=50, smoothing=True, use_bezier=True, bezier_smoothing=0.25, simplify=True):
    """
    Convert an image to an SVG path with advanced options.
    
    Args:
        image_path: Path to the image file
        threshold_value: Value for binary thresholding (0-255)
        min_contour_length: Minimum length of contours to include
        smoothing: Whether to apply smoothing to the contours
        use_bezier: Whether to use bezier curves for smoother paths
        bezier_smoothing: Smoothing factor for bezier curves (0-1)
        simplify: Whether to simplify contours
        
    Returns:
        SVG path data string
    """
    # Read the image
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur to reduce noise
    if smoothing:
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply binary threshold
    _, binary = cv2.threshold(gray, threshold_value, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter out small contours
    contours = [c for c in contours if cv2.arcLength(c, False) > min_contour_length]
    
    # Sort contours by area (largest first)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    if not contours:
        print("No significant contours found. Try adjusting the threshold value.")
        return ""
    
    # Create SVG path data
    svg_path_data = ""
    
    for contour in contours:
        # Simplify contour if requested
        if simplify:
            contour = simplify_contour(contour)
        
        # Extract points from contour
        points = [point[0] for point in contour]
        
        # Convert to path data
        if use_bezier and len(points) > 2:
            svg_path_data += points_to_bezier(points, bezier_smoothing)
        else:
            # Start a new subpath
            svg_path_data += f"M{points[0][0]},{points[0][1]}"
            
            # Add line segments
            for point in points[1:]:
                svg_path_data += f" L{point[0]},{point[1]}"
    
        # Close the path
        # svg_path_data += " Z"
    
    return svg_path_data

def enhance_image(image_path, output_path=None, edge_detection=True, blur_amount=5):
    """
    Enhance an image to better detect lines and edges.
    
    Args:
        image_path: Path to the image file
        output_path: Path to save the enhanced image (None to not save)
        edge_detection: Whether to use edge detection
        blur_amount: Amount of blur to apply (odd number)
        
    Returns:
        Enhanced image array
    """
    # Read the image
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")
    
    # Make blur amount odd if it's even
    if blur_amount % 2 == 0:
        blur_amount += 1
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(gray, (blur_amount, blur_amount), 0)
    
    if edge_detection:
        # Apply Canny edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Dilate to connect edges
        kernel = np.ones((3, 3), np.uint8)
        dilated = cv2.dilate(edges, kernel, iterations=1)
        
        # Save enhanced image if requested
        if output_path:
            cv2.imwrite(str(output_path), dilated)
        
        return dilated
    else:
        # Just return the blurred grayscale image
        if output_path:
            cv2.imwrite(str(output_path), blurred)
        
        return blurred

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
    <path d="{path_data}" fill="none" stroke="{color}" stroke-width="{stroke_width}" />
</svg>"""
    
    with open(output_path, 'w') as f:
        f.write(svg_content)
    
    print(f"SVG saved to {output_path}")

def main():
    parser = argparse.ArgumentParser(description='Convert an image to an SVG path with advanced options')
    parser.add_argument('image_path', type=str, help='Path to the input image')
    parser.add_argument('--output', type=str, help='Path to save the output SVG', default=None)
    parser.add_argument('--enhanced-output', type=str, help='Path to save the enhanced image', default=None)
    parser.add_argument('--threshold', type=int, default=127, help='Threshold value for binary conversion (0-255)')
    parser.add_argument('--min-length', type=int, default=50, help='Minimum length of contours to include')
    parser.add_argument('--width', type=int, default=600, help='Width of the SVG viewBox')
    parser.add_argument('--height', type=int, default=420, help='Height of the SVG viewBox')
    parser.add_argument('--no-smooth', action='store_true', help='Disable image smoothing')
    parser.add_argument('--no-bezier', action='store_true', help='Disable bezier curves')
    parser.add_argument('--bezier-smoothing', type=float, default=0.25, help='Bezier curve smoothing factor (0-1)')
    parser.add_argument('--no-simplify', action='store_true', help='Disable contour simplification')
    parser.add_argument('--edge-detection', action='store_true', help='Use edge detection preprocessing')
    parser.add_argument('--color', type=str, default='navy', help='Stroke color for the SVG path')
    parser.add_argument('--stroke-width', type=int, default=3, help='Stroke width for the SVG path')
    
    args = parser.parse_args()
    
    # Determine output path
    if args.output is None:
        input_path = Path(args.image_path)
        output_path = input_path.with_suffix('.svg')
    else:
        output_path = Path(args.output)
    
    # Preprocess image if edge detection is requested
    if args.edge_detection:
        enhanced_image_path = args.enhanced_output or str(Path(args.image_path).with_suffix('.enhanced.png'))
        processed_img = enhance_image(args.image_path, enhanced_image_path, True)
        
        # Write the enhanced image to a temporary file
        temp_path = Path(args.image_path).with_suffix('.temp.png')
        cv2.imwrite(str(temp_path), processed_img)
        
        # Use the enhanced image for path creation
        image_path_for_svg = str(temp_path)
    else:
        image_path_for_svg = args.image_path
    
    # Convert image to SVG path
    path_data = image_to_svg_path(
        image_path_for_svg, 
        threshold_value=args.threshold,
        min_contour_length=args.min_length,
        smoothing=not args.no_smooth,
        use_bezier=not args.no_bezier,
        bezier_smoothing=args.bezier_smoothing,
        simplify=not args.no_simplify
    )
    
    # Clean up temporary file if it was created
    if args.edge_detection:
        temp_path.unlink(missing_ok=True)
    
    if path_data:
        save_svg(path_data, output_path, args.width, args.height, args.color, args.stroke_width)
        print(f"Path data: {path_data[:100]}..." if len(path_data) > 100 else path_data)

if __name__ == "__main__":
    main() 