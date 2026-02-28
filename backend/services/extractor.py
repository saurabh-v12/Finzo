import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import pandas as pd
import os

class DocumentExtractor:
    def extract_text_from_pdf(self, file_path):
        """Extract text from PDF using PyMuPDF. Falls back to OCR if text is sparse."""
        text = ""
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            
            # If text is too short, it might be a scanned PDF
            if len(text.strip()) < 50:
                return self.extract_text_with_ocr(file_path)
                
            return text
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            return ""

    def extract_text_with_ocr(self, file_path):
        """Extract text from PDF by converting pages to images and running OCR."""
        text = ""
        try:
            doc = fitz.open(file_path)
            for i, page in enumerate(doc):
                # Zoom x2 for better OCR quality
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                temp_img = f"temp_page_{i}.png"
                pix.save(temp_img)
                
                # Run OCR
                text += pytesseract.image_to_string(Image.open(temp_img))
                
                # Cleanup
                if os.path.exists(temp_img):
                    os.remove(temp_img)
            return text
        except Exception as e:
            print(f"Error running OCR on PDF: {e}")
            return ""

    def extract_from_image(self, file_path):
        """Extract text from image file using Tesseract."""
        try:
            return pytesseract.image_to_string(Image.open(file_path))
        except Exception as e:
            print(f"Error extracting from image: {e}")
            return ""

    def extract_from_csv(self, file_path):
        """Extract text from CSV (convert to string representation)."""
        try:
            df = pd.read_csv(file_path)
            return df.to_string()
        except Exception as e:
            print(f"Error extracting from CSV: {e}")
            return ""

    def extract(self, file_path):
        """Main extraction method that dispatches based on file extension."""
        ext = os.path.splitext(file_path)[1].lower()
        text = ""
        method = "unknown"
        page_count = 0
        
        if ext == '.pdf':
            # Check if likely text or scanned
            doc = fitz.open(file_path)
            page_count = len(doc)
            
            # Try text extraction first
            text = self.extract_text_from_pdf(file_path)
            method = "pdf_text"
            
            # If OCR was triggered inside, method effectively becomes OCR
            # But we can't easily detect that return path here without modifying the helper.
            # However, logic in extract_text_from_pdf handles the fallback.
            
        elif ext in ['.jpg', '.jpeg', '.png', '.png']:
            text = self.extract_from_image(file_path)
            method = "image_ocr"
            page_count = 1
            
        elif ext == '.csv':
            text = self.extract_from_csv(file_path)
            method = "csv"
            page_count = 1
            
        return {
            "text": text,
            "method": method,
            "page_count": page_count,
            "char_count": len(text)
        }
