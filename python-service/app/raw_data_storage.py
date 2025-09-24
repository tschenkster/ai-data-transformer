"""
Raw Data Storage Module

Handles the first phase of file processing: parsing files and storing 
raw data in human-readable format with complete transparency.
"""

import logging
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import pandas as pd
from io import BytesIO

from .file_detector import FileDetector
from .models import FileType, RawAnalysisResult, ProcessingRequest


class RawDataStorage:
    """Handles raw data parsing and storage for complete transparency."""
    
    def __init__(self, file_detector: FileDetector, raw_analyzer=None):
        self.file_detector = file_detector
        self.raw_analyzer = raw_analyzer
        self.logger = logging.getLogger(__name__)
        
    def process_and_store_raw_file(
        self, 
        file_content: bytes, 
        filename: str,
        entity_uuid: str,
        user_uuid: str
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Phase 1: Parse file and store raw data with complete transparency.
        Returns (file_uuid, processing_summary)
        """
        try:
            # Detect file type and basic info
            file_type = self.file_detector.detect_file_type(filename)
            file_size = len(file_content)
            file_hash = hashlib.md5(file_content).hexdigest()
            
            self.logger.info(f"Processing raw file: {filename} ({file_type}, {file_size} bytes)")
            
            # Parse file content based on type
            if file_type == FileType.XLSX:
                raw_data, parsing_metadata = self._parse_excel_file(file_content, filename)
            elif file_type == FileType.CSV:
                raw_data, parsing_metadata = self._parse_csv_file(file_content, filename)
            elif file_type == FileType.PDF:
                raw_data, parsing_metadata = self._parse_pdf_file(file_content, filename)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            # Get GPT-5 analysis if available
            gpt5_analysis = None
            if self.raw_analyzer and file_type in [FileType.XLSX, FileType.CSV]:
                try:
                    analysis_result = self.raw_analyzer.analyze_raw_file_structure(
                        file_content, file_type, filename
                    )
                    gpt5_analysis = {
                        "structure": analysis_result.structure,
                        "confidence": analysis_result.confidence,
                        "recommendations": analysis_result.recommendations,
                        "analysis_timestamp": datetime.utcnow().isoformat()
                    }
                except Exception as e:
                    self.logger.warning(f"GPT-5 analysis failed: {str(e)}")
                    gpt5_analysis = {"error": str(e), "fallback_used": True}
            
            # Create file record (this would call Supabase function)
            file_uuid = self._store_file_metadata(
                filename=filename,
                file_size=file_size,
                file_hash=file_hash,
                entity_uuid=entity_uuid,
                user_uuid=user_uuid,
                raw_data=raw_data,
                parsing_metadata=parsing_metadata,
                gpt5_analysis=gpt5_analysis
            )
            
            # Store individual rows in human-readable format
            rows_stored = self._store_file_rows(file_uuid, raw_data, parsing_metadata)
            
            # Update file status to 'parsed'
            self._update_file_status(file_uuid, 'parsed', processing_completed_at=datetime.utcnow())
            
            processing_summary = {
                "file_uuid": file_uuid,
                "filename": filename,
                "file_type": file_type.value,
                "file_size": file_size,
                "rows_stored": rows_stored,
                "sheets_processed": len(raw_data.get("sheets", [])) if isinstance(raw_data, dict) else 1,
                "has_gpt5_analysis": gpt5_analysis is not None and "error" not in gpt5_analysis,
                "processing_timestamp": datetime.utcnow().isoformat()
            }
            
            self.logger.info(f"Raw file processing complete: {processing_summary}")
            return file_uuid, processing_summary
            
        except Exception as e:
            self.logger.error(f"Raw file processing failed: {str(e)}")
            # Store error in file record if we have a file_uuid
            if 'file_uuid' in locals():
                self._update_file_status(file_uuid, 'error', error_details={"error": str(e)})
            raise
    
    def _parse_excel_file(self, file_content: bytes, filename: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Parse Excel file and extract all sheets and data."""
        try:
            # Read all sheets
            excel_file = pd.ExcelFile(BytesIO(file_content))
            sheets_data = {}
            
            for sheet_name in excel_file.sheet_names:
                # Read with headers=None to preserve original structure
                df = pd.read_excel(excel_file, sheet_name=sheet_name, header=None)
                # Convert to list of lists, handling NaN values
                sheet_rows = []
                for _, row in df.iterrows():
                    row_data = [str(cell) if pd.notna(cell) else "" for cell in row]
                    sheet_rows.append(row_data)
                
                sheets_data[sheet_name] = {
                    "rows": sheet_rows,
                    "row_count": len(sheet_rows),
                    "max_columns": len(sheet_rows[0]) if sheet_rows else 0
                }
            
            raw_data = {
                "file_type": "xlsx",
                "sheets": sheets_data
            }
            
            parsing_metadata = {
                "sheet_names": excel_file.sheet_names,
                "total_sheets": len(excel_file.sheet_names),
                "total_rows": sum(sheet["row_count"] for sheet in sheets_data.values()),
                "max_columns_across_sheets": max((sheet["max_columns"] for sheet in sheets_data.values()), default=0),
                "parsing_timestamp": datetime.utcnow().isoformat()
            }
            
            return raw_data, parsing_metadata
            
        except Exception as e:
            self.logger.error(f"Excel parsing failed: {str(e)}")
            raise ValueError(f"Failed to parse Excel file: {str(e)}")
    
    def _parse_csv_file(self, file_content: bytes, filename: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Parse CSV file and extract all data."""
        try:
            # Try different encodings
            for encoding in ['utf-8', 'latin1', 'cp1252']:
                try:
                    content_str = file_content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise ValueError("Could not decode CSV file with any common encoding")
            
            # Detect delimiter
            import csv
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(content_str[:1024]).delimiter
            
            # Parse CSV
            df = pd.read_csv(BytesIO(file_content), delimiter=delimiter, header=None, encoding=encoding)
            
            # Convert to list of lists
            csv_rows = []
            for _, row in df.iterrows():
                row_data = [str(cell) if pd.notna(cell) else "" for cell in row]
                csv_rows.append(row_data)
            
            raw_data = {
                "file_type": "csv",
                "sheets": {
                    "Sheet1": {  # Treat CSV as single sheet
                        "rows": csv_rows,
                        "row_count": len(csv_rows),
                        "max_columns": len(csv_rows[0]) if csv_rows else 0
                    }
                }
            }
            
            parsing_metadata = {
                "delimiter": delimiter,
                "encoding": encoding,
                "total_rows": len(csv_rows),
                "max_columns": len(csv_rows[0]) if csv_rows else 0,
                "parsing_timestamp": datetime.utcnow().isoformat()
            }
            
            return raw_data, parsing_metadata
            
        except Exception as e:
            self.logger.error(f"CSV parsing failed: {str(e)}")
            raise ValueError(f"Failed to parse CSV file: {str(e)}")
    
    def _parse_pdf_file(self, file_content: bytes, filename: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Parse PDF file - placeholder for now."""
        # This would integrate with DoclingProcessor
        raise NotImplementedError("PDF parsing not yet implemented in raw storage phase")
    
    def _store_file_metadata(
        self, 
        filename: str, 
        file_size: int,
        file_hash: str,
        entity_uuid: str, 
        user_uuid: str,
        raw_data: Dict[str, Any],
        parsing_metadata: Dict[str, Any],
        gpt5_analysis: Optional[Dict[str, Any]]
    ) -> str:
        """Store file metadata in database. Returns file_uuid."""
        # This would call the Supabase function data.insert_raw_file_data()
        # For now, return a placeholder UUID
        import uuid
        file_uuid = str(uuid.uuid4())
        
        self.logger.info(f"Stored file metadata for {filename} with UUID: {file_uuid}")
        return file_uuid
    
    def _store_file_rows(
        self, 
        file_uuid: str, 
        raw_data: Dict[str, Any], 
        parsing_metadata: Dict[str, Any]
    ) -> int:
        """Store individual rows in human-readable column format."""
        total_rows_stored = 0
        
        try:
            sheets = raw_data.get("sheets", {})
            
            for sheet_name, sheet_data in sheets.items():
                rows = sheet_data.get("rows", [])
                
                for row_idx, row_values in enumerate(rows):
                    # Convert row values to col_01, col_02, etc. format
                    row_data = {
                        "raw_data_upload_file_uuid": file_uuid,
                        "sheet_name": sheet_name,
                        "row_number": row_idx + 1,
                        "is_header_row": row_idx == 0  # Basic heuristic
                    }
                    
                    # Map values to col_XX columns (up to col_50)
                    for col_idx, value in enumerate(row_values[:50]):  # Limit to 50 columns
                        col_name = f"col_{col_idx + 1:02d}"  # col_01, col_02, etc.
                        row_data[col_name] = str(value) if value else None
                    
                    # This would insert into data.raw_data_upload_file_rows
                    self.logger.debug(f"Storing row {row_idx + 1} from sheet '{sheet_name}'")
                    total_rows_stored += 1
            
            self.logger.info(f"Stored {total_rows_stored} rows for file {file_uuid}")
            return total_rows_stored
            
        except Exception as e:
            self.logger.error(f"Failed to store file rows: {str(e)}")
            raise
    
    def _update_file_status(
        self, 
        file_uuid: str, 
        status: str, 
        processing_completed_at: Optional[datetime] = None,
        error_details: Optional[Dict[str, Any]] = None
    ):
        """Update file processing status."""
        # This would update the data.raw_data_upload_file record
        self.logger.info(f"Updated file {file_uuid} status to: {status}")
        
    def get_raw_file_data(self, file_uuid: str) -> Dict[str, Any]:
        """Retrieve raw file data and metadata for inspection/debugging."""
        # This would query both tables to return complete raw data
        return {
            "file_metadata": {},  # From data.raw_data_upload_file
            "raw_rows": [],       # From data.raw_data_upload_file_rows
            "row_count": 0,
            "sheets": []
        }