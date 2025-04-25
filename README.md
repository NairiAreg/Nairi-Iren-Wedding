# Image to SVG Path Converter

This repository contains three Python scripts for converting images to SVG paths, with a focus on extracting line drawings and contours:

1. `image_to_svg.py` - Basic image to SVG path converter
2. `image_to_svg_advanced.py` - Advanced image to SVG path converter with more options
3. `extract_colored_path.py` - Specialized script for extracting paths of specific colors

These scripts are particularly useful for converting hand-drawn sketches, diagrams, or designs (like the wavy blue line in your example) into scalable vector graphics that can be used in web design, illustrations, or other digital artwork.

## Prerequisites

Before using these scripts, you need to install the required Python packages:

```bash
pip install opencv-python numpy
```

## Basic Usage

### Basic Image to SVG Conversion

For simple conversions:

```bash
python image_to_svg.py path/to/your/image.jpg
```

This will create an SVG file in the same location as your image with a `.svg` extension.

### Advanced Image to SVG Conversion

For more control over the conversion process:

```bash
python image_to_svg_advanced.py path/to/your/image.jpg --edge-detection --no-simplify
```

### Extract Colored Paths

To extract paths of a specific color (like the blue wavy line in your example):

```bash
python extract_colored_path.py path/to/your/image.jpg --color blue
```

## Detailed Options

### `image_to_svg.py` Options

```
--output OUTPUT         Path to save the output SVG
--threshold THRESHOLD   Threshold value for binary conversion (0-255)
--min_length MIN_LENGTH Minimum length of contours to include
--width WIDTH           Width of the SVG viewBox
--height HEIGHT         Height of the SVG viewBox
--no_smooth             Disable smoothing
```

### `image_to_svg_advanced.py` Options

```
--output OUTPUT         Path to save the output SVG
--enhanced-output OUTPUT Path to save the enhanced image
--threshold THRESHOLD   Threshold value for binary conversion (0-255)
--min-length MIN_LENGTH Minimum length of contours to include
--width WIDTH           Width of the SVG viewBox
--height HEIGHT         Height of the SVG viewBox
--no-smooth             Disable image smoothing
--no-bezier             Disable bezier curves
--bezier-smoothing SMOOTHING Bezier curve smoothing factor (0-1)
--no-simplify           Disable contour simplification
--edge-detection        Use edge detection preprocessing
--color COLOR           Stroke color for the SVG path
--stroke-width WIDTH    Stroke width for the SVG path
```

### `extract_colored_path.py` Options

```
--color COLOR           Color to extract (blue, red, green, etc.)
--output OUTPUT         Path to save the output SVG
--min-length MIN_LENGTH Minimum length of contours to include
--no-simplify           Disable contour simplification
--no-bezier             Disable bezier curves
--bezier-smoothing SMOOTHING Bezier curve smoothing factor (0-1)
--show-extracted        Save the extracted color mask
--width WIDTH           Width of the SVG viewBox
--height HEIGHT         Height of the SVG viewBox
--stroke-color COLOR    Stroke color for the SVG path
--stroke-width WIDTH    Stroke width for the SVG path
```

## Tips for Best Results

1. **For line drawings or sketches**:
   - Use `image_to_svg_advanced.py` with `--edge-detection`
   - Adjust `--threshold` if needed (higher values for thinner lines)

2. **For colored paths** (like your blue wavy line):
   - Use `extract_colored_path.py` with the appropriate color
   - Try different values for `--bezier-smoothing` (0.1-0.5) for smoother or more accurate curves

3. **For complex images**:
   - You may need to pre-process the image in an image editor to enhance contrast
   - Experiment with different threshold values

4. **Adjusting contour quality**:
   - Use `--min-length` to filter out small/noisy contours
   - Use `--no-simplify` to keep all points in the contours (more accurate but larger file size)

## Examples

### Basic Conversion
```bash
python image_to_svg.py wavy_line.jpg
```

### Extract a Blue Path with Smooth Bezier Curves
```bash
python extract_colored_path.py wavy_line.jpg --color blue --bezier-smoothing 0.3
```

### Advanced Conversion with Edge Detection
```bash
python image_to_svg_advanced.py wavy_line.jpg --edge-detection --threshold 150 --stroke-width 2
```

### Custom Output
```bash
python extract_colored_path.py wavy_line.jpg --color navy --output my_vector_path.svg --stroke-color "#003366" --stroke-width 4
```

## Troubleshooting

If you're not getting expected results:

- Try adjusting the threshold value (lower for darker images, higher for lighter ones)
- For color extraction, you might need to adjust the HSV ranges in the code for your specific image
- If contours are broken, try disabling simplification with `--no-simplify`
- Save the extracted mask with `--show-extracted` to see what's being detected