import cv2
import numpy as np
import argparse
from pathlib import Path

def image_to_svg_path(image_path, threshold_value=127, min_contour_length=100, smoothing=True):
    """
    Convert an image to an SVG path.
    
    Args:
        image_path: Path to the image file
        threshold_value: Value for binary thresholding (0-255)
        min_contour_length: Minimum length of contours to include
        smoothing: Whether to apply smoothing to the contours
        
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
        # Start a new subpath
        svg_path_data += f"M{contour[0][0][0]},{contour[0][0][1]}"
        
        # Add line segments
        for point in contour[1:]:
            x, y = point[0]
            svg_path_data += f" L{x},{y}"
    
    return svg_path_data

def save_svg(path_data, output_path, width=600, height=420):
    """
    Save path data as an SVG file.
    
    Args:
        path_data: SVG path data string
        output_path: Path to save the SVG file
        width: Width of the SVG viewBox
        height: Height of the SVG viewBox
    """
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
    <path d="{path_data}" fill="none" stroke="navy" stroke-width="3"/>
</svg>"""
    
    with open(output_path, 'w') as f:
        f.write(svg_content)
    
    print(f"SVG saved to {output_path}")

def main():
    parser = argparse.ArgumentParser(description='Convert an image to an SVG path')
    parser.add_argument('image_path', type=str, help='Path to the input image')
    parser.add_argument('--output', type=str, help='Path to save the output SVG', default=None)
    parser.add_argument('--threshold', type=int, default=127, help='Threshold value for binary conversion (0-255)')
    parser.add_argument('--min_length', type=int, default=100, help='Minimum length of contours to include')
    parser.add_argument('--width', type=int, default=600, help='Width of the SVG viewBox')
    parser.add_argument('--height', type=int, default=420, help='Height of the SVG viewBox')
    parser.add_argument('--no_smooth', action='store_true', help='Disable smoothing')
    
    args = parser.parse_args()
    
    # Determine output path
    if args.output is None:
        input_path = Path(args.image_path)
        output_path = input_path.with_suffix('.svg')
    else:
        output_path = Path(args.output)
    
    # Convert image to SVG path
    path_data = image_to_svg_path(
        args.image_path, 
        threshold_value=args.threshold,
        min_contour_length=args.min_length,
        smoothing=not args.no_smooth
    )
    
    if path_data:
        save_svg(path_data, output_path, args.width, args.height)
        print(f"Path data: {path_data[:100]}..." if len(path_data) > 100 else path_data)

if __name__ == "__main__":
    main() 