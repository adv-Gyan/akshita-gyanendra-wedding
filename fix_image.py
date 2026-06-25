from PIL import Image, ImageFilter

def create_square_preview(input_path, output_path, size=1024):
    # Open the original image
    img = Image.open(input_path)
    
    # Calculate aspect ratio
    w, h = img.size
    
    # Create the background by resizing the original to cover the square
    # and applying a heavy blur
    bg_ratio = max(size/w, size/h)
    bg_w, bg_h = int(w * bg_ratio), int(h * bg_ratio)
    bg = img.resize((bg_w, bg_h), Image.Resampling.LANCZOS)
    
    # Crop the center of the background
    left = (bg_w - size) // 2
    top = (bg_h - size) // 2
    bg = bg.crop((left, top, left + size, top + size))
    
    # Blur the background
    bg = bg.filter(ImageFilter.GaussianBlur(radius=40))
    
    # Calculate dimensions for the foreground image to fit inside the square
    # We want it to be as large as possible without cropping
    fg_ratio = min(size/w, size/h)
    fg_w, fg_h = int(w * fg_ratio), int(h * fg_ratio)
    fg = img.resize((fg_w, fg_h), Image.Resampling.LANCZOS)
    
    # Paste the foreground onto the center of the blurred background
    offset_x = (size - fg_w) // 2
    offset_y = (size - fg_h) // 2
    bg.paste(fg, (offset_x, offset_y))
    
    # Save the result with high quality
    bg.save(output_path, "JPEG", quality=95)

if __name__ == "__main__":
    create_square_preview("link_preview.jpg", "link_preview_square.jpg")
