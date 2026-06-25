from PIL import Image

def resize_for_whatsapp(input_path, output_path):
    # Open the existing square image
    img = Image.open(input_path)
    
    # Resize to exactly 600x600 (the safest WhatsApp sweet spot)
    # Using LANCZOS for high quality downsampling
    img = img.resize((600, 600), Image.Resampling.LANCZOS)
    
    # Save with decent quality but ensuring small file size
    img.save(output_path, "JPEG", quality=85)

if __name__ == "__main__":
    resize_for_whatsapp("link_preview_square.jpg", "whatsapp_preview.jpg")
