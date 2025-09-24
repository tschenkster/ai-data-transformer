import logging
from typing import List, Dict, Any, Optional
import hashlib
from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import PdfFormatOption
import tempfile
import os

logger = logging.getLogger(__name__)

class DoclingProcessor:
    def __init__(self):
        """Initialize Docling processor with optimized settings"""
        # Configure pipeline options for table extraction
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = True  # Enable OCR for scanned PDFs
        pipeline_options.do_table_structure = True  # Enable table structure detection
        
        # Initialize DocumentConverter with PDF-specific options
        self.converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
        logger.info("Docling processor initialized with table extraction enabled")

    async def process_pdf(self, file_content: bytes) -> List[Dict[str, Any]]:
        """
        Process PDF file using Docling's advanced table detection
        """
        try:
            logger.info("Starting PDF processing with Docling")
            
            # Write content to temporary file (Docling requires file path)
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                tmp_file.write(file_content)
                tmp_file_path = tmp_file.name
            
            try:
                # Convert PDF using Docling
                result = self.converter.convert(tmp_file_path)
                logger.info(f"Docling conversion completed, document has {len(result.document.pages)} pages")
                
                # Extract tables from all pages
                all_tables_data = []
                
                for page_num, page in enumerate(result.document.pages):
                    logger.info(f"Processing page {page_num + 1}")
                    
                    # Extract tables from this page
                    page_tables = self._extract_tables_from_page(page, page_num + 1)
                    all_tables_data.extend(page_tables)
                
                logger.info(f"Extracted {len(all_tables_data)} total rows from all tables")
                
                # If no tables found, try text-based extraction as fallback
                if not all_tables_data:
                    logger.warning("No tables detected, falling back to text extraction")
                    all_tables_data = self._extract_from_text(result.document)
                
                return all_tables_data
                
            finally:
                # Clean up temporary file
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
                    
        except Exception as e:
            logger.error(f"Error processing PDF with Docling: {str(e)}")
            raise Exception(f"PDF processing failed: {str(e)}")

    def _extract_tables_from_page(self, page, page_number: int) -> List[Dict[str, Any]]:
        """Extract structured data from tables on a page"""
        page_data = []
        
        # Get table elements from the page
        tables = [item for item in page.elements if item.category == "Table"]
        logger.info(f"Found {len(tables)} tables on page {page_number}")
        
        for table_idx, table in enumerate(tables):
            try:
                # Get table data - Docling provides structured table representation
                table_data = self._process_docling_table(table, page_number, table_idx + 1)
                page_data.extend(table_data)
                
            except Exception as e:
                logger.warning(f"Failed to process table {table_idx + 1} on page {page_number}: {str(e)}")
                continue
        
        return page_data

    def _process_docling_table(self, table, page_number: int, table_number: int) -> List[Dict[str, Any]]:
        """Process a Docling table structure into normalized data"""
        table_data = []
        
        try:
            # Extract table as pandas DataFrame if possible
            if hasattr(table, 'export_to_dataframe'):
                df = table.export_to_dataframe()
                
                # Convert DataFrame to list of dictionaries
                for idx, row in df.iterrows():
                    row_data = {
                        '_source_page': page_number,
                        '_source_table': table_number,
                        '_source_row': idx + 1,
                        '_extraction_method': 'docling_table_structure'
                    }
                    
                    # Add column data
                    for col_name, value in row.items():
                        if value is not None and str(value).strip():
                            row_data[str(col_name).strip()] = str(value).strip()
                    
                    # Only add rows with meaningful content
                    if len([k for k in row_data.keys() if not k.startswith('_')]) >= 2:
                        table_data.append(row_data)
            
            else:
                # Fallback to text-based table extraction
                logger.info(f"Using text-based extraction for table {table_number} on page {page_number}")
                text_content = getattr(table, 'text', '') or str(table)
                text_rows = self._parse_table_text(text_content, page_number, table_number)
                table_data.extend(text_rows)
                
        except Exception as e:
            logger.warning(f"Error processing table structure: {str(e)}")
            # Fallback to text extraction
            text_content = getattr(table, 'text', '') or str(table)
            text_rows = self._parse_table_text(text_content, page_number, table_number)
            table_data.extend(text_rows)
        
        logger.info(f"Extracted {len(table_data)} rows from table {table_number} on page {page_number}")
        return table_data

    def _parse_table_text(self, text_content: str, page_number: int, table_number: int) -> List[Dict[str, Any]]:
        """Parse table text content when structured extraction isn't available"""
        rows = []
        lines = text_content.strip().split('\n')
        
        # Simple table parsing - look for rows with multiple columns
        for line_idx, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            # Split by multiple spaces or tabs (common table separators)
            parts = [p.strip() for p in line.replace('\t', '  ').split('  ') if p.strip()]
            
            if len(parts) >= 2:  # Need at least 2 columns for account number + description
                row_data = {
                    '_source_page': page_number,
                    '_source_table': table_number,
                    '_source_row': line_idx + 1,
                    '_extraction_method': 'docling_text_parsing'
                }
                
                # Map columns based on position
                for i, part in enumerate(parts):
                    row_data[f'Column_{i + 1}'] = part
                
                rows.append(row_data)
        
        return rows

    def _extract_from_text(self, document) -> List[Dict[str, Any]]:
        """Fallback text extraction when no tables are detected"""
        text_data = []
        
        for page_num, page in enumerate(document.pages):
            page_text = page.text if hasattr(page, 'text') else str(page)
            lines = page_text.strip().split('\n')
            
            for line_idx, line in enumerate(lines):
                line = line.strip()
                if not line:
                    continue
                
                # Look for patterns that might be account data
                parts = line.split()
                if len(parts) >= 2 and any(char.isdigit() for char in parts[0]):
                    text_data.append({
                        '_source_page': page_num + 1,
                        '_source_table': 0,  # No table detected
                        '_source_row': line_idx + 1,
                        '_extraction_method': 'docling_text_fallback',
                        'Column_1': parts[0],  # Likely account number
                        'Column_2': ' '.join(parts[1:])  # Likely description
                    })
        
        logger.info(f"Text fallback extraction found {len(text_data)} potential rows")
        return text_data

    async def analyze_pdf_structure(self, file_content: bytes) -> Dict[str, Any]:
        """Analyze PDF structure without full processing"""
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                tmp_file.write(file_content)
                tmp_file_path = tmp_file.name
            
            try:
                result = self.converter.convert(tmp_file_path)
                
                analysis = {
                    'page_count': len(result.document.pages),
                    'table_count': 0,
                    'text_elements_count': 0,
                    'confidence_score': 1.0,
                    'has_images': False,
                    'extraction_method': 'docling'
                }
                
                for page in result.document.pages:
                    tables = [item for item in page.elements if item.category == "Table"]
                    analysis['table_count'] += len(tables)
                    
                    text_elements = [item for item in page.elements if item.category == "Text"]
                    analysis['text_elements_count'] += len(text_elements)
                    
                    images = [item for item in page.elements if item.category == "Picture"]
                    if images:
                        analysis['has_images'] = True
                
                return analysis
                
            finally:
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
                    
        except Exception as e:
            logger.error(f"Error analyzing PDF structure: {str(e)}")
            return {
                'error': str(e),
                'confidence_score': 0.0,
                'extraction_method': 'failed'
            }