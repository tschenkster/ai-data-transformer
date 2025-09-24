import magic
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class FileDetector:
    def __init__(self):
        """Initialize file detector with magic library"""
        self.mime_type_mapping = {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/vnd.ms-excel': 'xls',
            'text/csv': 'csv',
            'application/pdf': 'pdf',
            'text/plain': 'csv'  # Sometimes CSV files are detected as plain text
        }

    async def detect_file_type(self, file_content: bytes, filename: str) -> str:
        """
        Detect file type using multiple methods:
        1. File extension
        2. Magic bytes (python-magic)
        3. Content heuristics
        """
        try:
            # Method 1: File extension
            extension_type = self._detect_from_extension(filename)
            
            # Method 2: Magic bytes
            magic_type = self._detect_from_magic_bytes(file_content)
            
            # Method 3: Content heuristics
            heuristic_type = await self._detect_from_content_heuristics(file_content)
            
            # Combine results with priority: magic > extension > heuristics
            detected_type = magic_type or extension_type or heuristic_type
            
            if not detected_type:
                raise ValueError("Could not determine file type")
            
            # Validate detected type
            if detected_type not in ['xlsx', 'csv', 'pdf']:
                raise ValueError(f"Unsupported file type detected: {detected_type}")
            
            logger.info(f"File type detection: extension={extension_type}, magic={magic_type}, heuristic={heuristic_type}, final={detected_type}")
            return detected_type
            
        except Exception as e:
            logger.error(f"Error detecting file type: {str(e)}")
            raise Exception(f"File type detection failed: {str(e)}")

    def _detect_from_extension(self, filename: str) -> Optional[str]:
        """Detect file type from file extension"""
        if not filename:
            return None
        
        extension = filename.lower().split('.')[-1] if '.' in filename else ''
        
        extension_mapping = {
            'xlsx': 'xlsx',
            'xls': 'xlsx',  # Treat XLS as XLSX for processing
            'csv': 'csv',
            'pdf': 'pdf'
        }
        
        return extension_mapping.get(extension)

    def _detect_from_magic_bytes(self, file_content: bytes) -> Optional[str]:
        """Detect file type using python-magic (libmagic)"""
        try:
            # Get MIME type
            mime_type = magic.from_buffer(file_content, mime=True)
            detected_type = self.mime_type_mapping.get(mime_type)
            
            logger.debug(f"Magic detected MIME type: {mime_type} -> {detected_type}")
            return detected_type
            
        except Exception as e:
            logger.warning(f"Magic byte detection failed: {str(e)}")
            return None

    async def _detect_from_content_heuristics(self, file_content: bytes) -> Optional[str]:
        """Detect file type using content heuristics"""
        try:
            # Check for PDF signature
            if file_content.startswith(b'%PDF-'):
                return 'pdf'
            
            # Check for Excel signatures
            if (file_content.startswith(b'PK\x03\x04') or  # XLSX/ZIP signature
                file_content.startswith(b'\xd0\xcf\x11\xe0')):  # XLS signature
                return 'xlsx'
            
            # Try to decode as text for CSV detection
            try:
                text_content = file_content.decode('utf-8', errors='ignore')[:1000]  # First 1KB
                
                # Look for CSV patterns
                csv_indicators = [
                    ';' in text_content and text_content.count(';') > 5,
                    ',' in text_content and text_content.count(',') > 5,
                    '\t' in text_content and text_content.count('\t') > 3,
                    '\n' in text_content and len(text_content.split('\n')) > 2
                ]
                
                if any(csv_indicators):
                    return 'csv'
                    
            except UnicodeDecodeError:
                pass
            
            return None
            
        except Exception as e:
            logger.warning(f"Content heuristic detection failed: {str(e)}")
            return None

    def validate_file_size(self, file_content: bytes, max_size_mb: int = 20) -> bool:
        """Validate file size"""
        size_mb = len(file_content) / (1024 * 1024)
        if size_mb > max_size_mb:
            raise ValueError(f"File size ({size_mb:.1f}MB) exceeds maximum allowed size ({max_size_mb}MB)")
        return True

    def validate_file_content(self, file_content: bytes, file_type: str) -> bool:
        """Perform basic content validation"""
        if not file_content:
            raise ValueError("Empty file content")
        
        # Minimum file size checks
        min_sizes = {
            'pdf': 100,    # 100 bytes minimum for PDF
            'xlsx': 500,   # 500 bytes minimum for XLSX
            'csv': 10      # 10 bytes minimum for CSV
        }
        
        min_size = min_sizes.get(file_type, 10)
        if len(file_content) < min_size:
            raise ValueError(f"File too small ({len(file_content)} bytes) for {file_type} format")
        
        return True