"""
Raw Data Normalizer Module

Handles the second phase of file processing: converting raw data stored
in human-readable format to normalized trial balance structure.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import re

from .models import ProcessedTrialBalanceRow, ValidationResult, QualityReport
from .pandas_analyzer import PandasAnalyzer
from .utils.validator import DataValidator
from .utils.normalizer import DataNormalizer


class RawDataNormalizer:
    """Handles normalization of raw data to trial balance format."""
    
    def __init__(self, pandas_analyzer: PandasAnalyzer, validator: DataValidator, normalizer: DataNormalizer):
        self.pandas_analyzer = pandas_analyzer
        self.validator = validator
        self.normalizer = normalizer
        self.logger = logging.getLogger(__name__)
        
    def normalize_raw_file_data(
        self, 
        file_uuid: str,
        entity_uuid: str,
        force_normalization: bool = False,
        custom_mapping: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Phase 2: Convert raw data to normalized trial balance format.
        """
        try:
            self.logger.info(f"Starting normalization for file: {file_uuid}")
            
            # 1. Retrieve raw data from database
            raw_file_data = self._get_raw_file_data(file_uuid)
            
            if not raw_file_data:
                raise ValueError(f"No raw data found for file: {file_uuid}")
            
            # 2. Convert raw rows back to DataFrame-like structure for processing
            structured_data = self._reconstruct_structured_data(raw_file_data)
            
            # 3. Apply GPT-5 analysis hints if available
            processing_hints = self._extract_processing_hints(raw_file_data.get("file_metadata", {}))
            
            # 4. Use existing PandasAnalyzer with hints
            analysis_result = self.pandas_analyzer.analyze_with_hints(
                structured_data, 
                processing_hints,
                raw_file_data["file_metadata"].get("filename", "unknown")
            )
            
            # 5. Normalize the processed data
            normalized_rows = []
            normalization_errors = []
            
            for row_idx, raw_row_data in enumerate(analysis_result.get("processed_data", [])):
                try:
                    # Apply custom mapping if provided
                    if custom_mapping:
                        raw_row_data = self._apply_custom_mapping(raw_row_data, custom_mapping)
                    
                    # Normalize individual row
                    normalized_row = self.normalizer.normalize_trial_balance_row(
                        raw_row_data, 
                        entity_uuid,
                        source_file_uuid=file_uuid,
                        source_row_number=row_idx + 1
                    )
                    
                    if normalized_row:
                        normalized_rows.append(normalized_row)
                        # Update row status to 'success'
                        self._update_row_normalization_status(
                            raw_file_data["raw_rows"][row_idx]["row_uuid"],
                            "success",
                            normalized_trial_balance_uuid=normalized_row.get("uuid")
                        )
                    else:
                        error_msg = "Normalization returned None - likely invalid data"
                        normalization_errors.append({
                            "row_number": row_idx + 1,
                            "error": error_msg,
                            "raw_data": raw_row_data
                        })
                        self._update_row_normalization_status(
                            raw_file_data["raw_rows"][row_idx]["row_uuid"],
                            "failed",
                            error_message=error_msg
                        )
                        
                except Exception as e:
                    error_msg = f"Normalization failed: {str(e)}"
                    normalization_errors.append({
                        "row_number": row_idx + 1,
                        "error": error_msg,
                        "raw_data": raw_row_data
                    })
                    self.logger.error(f"Row {row_idx + 1} normalization failed: {str(e)}")
                    self._update_row_normalization_status(
                        raw_file_data["raw_rows"][row_idx]["row_uuid"],
                        "failed", 
                        error_message=error_msg
                    )
            
            # 6. Validate normalized data
            validation_result = self.validator.validate_trial_balance_data(normalized_rows)
            
            # 7. Generate quality report
            quality_report = self._generate_quality_report(
                raw_file_data, 
                normalized_rows, 
                normalization_errors, 
                validation_result
            )
            
            # 8. Persist to database if requested and validation passes
            persisted_count = 0
            if validation_result.is_valid or force_normalization:
                persisted_count = self._persist_normalized_data(normalized_rows, entity_uuid)
            
            normalization_summary = {
                "file_uuid": file_uuid,
                "filename": raw_file_data["file_metadata"].get("filename", "unknown"),
                "total_raw_rows": len(raw_file_data["raw_rows"]),
                "normalized_rows": len(normalized_rows),
                "failed_rows": len(normalization_errors),
                "persisted_rows": persisted_count,
                "validation_result": validation_result.__dict__ if hasattr(validation_result, '__dict__') else validation_result,
                "quality_report": quality_report.__dict__ if hasattr(quality_report, '__dict__') else quality_report,
                "normalization_errors": normalization_errors[:10],  # Limit to first 10 for response size
                "processing_timestamp": datetime.utcnow().isoformat(),
                "force_normalization": force_normalization
            }
            
            self.logger.info(f"Normalization complete: {len(normalized_rows)} rows processed, {len(normalization_errors)} errors")
            return normalization_summary
            
        except Exception as e:
            self.logger.error(f"Raw data normalization failed: {str(e)}")
            raise
    
    def _get_raw_file_data(self, file_uuid: str) -> Dict[str, Any]:
        """Retrieve raw file data and rows from database."""
        # This would query:
        # 1. data.raw_data_upload_file for metadata and JSON columns
        # 2. data.raw_data_upload_file_rows for human-readable row data
        
        # Placeholder implementation
        return {
            "file_metadata": {
                "filename": "sample.xlsx",
                "file_size": 1024,
                "raw_data": {"sheets": {}},
                "parsing_metadata": {"total_rows": 100},
                "gpt5_analysis": {"structure": {"recommended_sheet": "Sheet1"}}
            },
            "raw_rows": [
                {
                    "row_uuid": "sample-row-1",
                    "sheet_name": "Sheet1",
                    "row_number": 1,
                    "col_01": "Account",
                    "col_02": "Description",
                    "col_03": "Amount"
                }
            ]
        }
    
    def _reconstruct_structured_data(self, raw_file_data: Dict[str, Any]) -> List[List[str]]:
        """Convert raw database rows back to structured data for processing."""
        structured_data = []
        
        # Group rows by sheet and sort by row_number
        sheets = {}
        for row in raw_file_data["raw_rows"]:
            sheet_name = row.get("sheet_name", "Sheet1")
            if sheet_name not in sheets:
                sheets[sheet_name] = []
            
            # Extract column values (col_01, col_02, etc.)
            row_values = []
            for col_idx in range(1, 51):  # Check col_01 to col_50
                col_name = f"col_{col_idx:02d}"
                value = row.get(col_name, "")
                if value:  # Only include non-empty values
                    row_values.append(str(value))
                elif len(row_values) > 0:  # Include empty cells within data range
                    row_values.append("")
                else:  # Stop at first empty cell if no data yet
                    break
            
            sheets[sheet_name].append((row["row_number"], row_values))
        
        # Sort by row number and extract values
        for sheet_name, rows in sheets.items():
            sorted_rows = sorted(rows, key=lambda x: x[0])
            sheet_data = [row_values for _, row_values in sorted_rows]
            structured_data.extend(sheet_data)
        
        return structured_data
    
    def _extract_processing_hints(self, file_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Extract processing hints from GPT-5 analysis and parsing metadata."""
        hints = {}
        
        # From GPT-5 analysis
        gpt5_analysis = file_metadata.get("gpt5_analysis", {})
        if gpt5_analysis and "error" not in gpt5_analysis:
            structure = gpt5_analysis.get("structure", {})
            hints.update({
                "recommended_sheet": structure.get("recommended_sheet"),
                "header_row": structure.get("header_row", 1),
                "data_start_row": structure.get("data_start_row", 2),
                "column_hints": structure.get("column_mapping", {})
            })
        
        # From parsing metadata
        parsing_metadata = file_metadata.get("parsing_metadata", {})
        hints.update({
            "delimiter": parsing_metadata.get("delimiter"),
            "encoding": parsing_metadata.get("encoding"),
            "total_rows": parsing_metadata.get("total_rows"),
            "max_columns": parsing_metadata.get("max_columns")
        })
        
        return hints
    
    def _apply_custom_mapping(self, raw_row_data: Dict[str, Any], custom_mapping: Dict[str, Any]) -> Dict[str, Any]:
        """Apply user-provided custom field mapping."""
        mapped_data = {}
        
        for target_field, source_field in custom_mapping.items():
            if source_field in raw_row_data:
                mapped_data[target_field] = raw_row_data[source_field]
        
        # Include unmapped fields
        for key, value in raw_row_data.items():
            if key not in custom_mapping.values():
                mapped_data[key] = value
        
        return mapped_data
    
    def _update_row_normalization_status(
        self, 
        row_uuid: str, 
        status: str, 
        error_message: Optional[str] = None,
        normalized_trial_balance_uuid: Optional[str] = None
    ):
        """Update normalization status for individual row."""
        # This would update data.raw_data_upload_file_rows
        self.logger.debug(f"Updated row {row_uuid} normalization status to: {status}")
    
    def _generate_quality_report(
        self, 
        raw_file_data: Dict[str, Any], 
        normalized_rows: List[Dict[str, Any]], 
        errors: List[Dict[str, Any]],
        validation_result: ValidationResult
    ) -> QualityReport:
        """Generate comprehensive quality report for normalization."""
        total_rows = len(raw_file_data["raw_rows"])
        success_rows = len(normalized_rows)
        error_rows = len(errors)
        
        completeness_score = (success_rows / total_rows * 100) if total_rows > 0 else 0
        accuracy_score = max(0, 100 - (validation_result.error_count * 10))  # Rough calculation
        consistency_score = 85  # Placeholder
        
        return QualityReport(
            completeness_score=completeness_score,
            accuracy_score=accuracy_score,
            consistency_score=consistency_score,
            data_quality_issues=[
                f"{error_rows} rows failed normalization",
                f"{validation_result.error_count} validation errors",
                f"{validation_result.warning_count} validation warnings"
            ]
        )
    
    def _persist_normalized_data(self, normalized_rows: List[Dict[str, Any]], entity_uuid: str) -> int:
        """Persist normalized data to trial balance table."""
        # This would call the existing insert_trial_balance_data function
        # or insert directly into data.trial_balance_uploads
        
        persisted_count = 0
        for row_data in normalized_rows:
            try:
                # Insert normalized row
                self.logger.debug(f"Persisting normalized row for entity {entity_uuid}")
                persisted_count += 1
            except Exception as e:
                self.logger.error(f"Failed to persist row: {str(e)}")
        
        self.logger.info(f"Persisted {persisted_count} normalized rows")
        return persisted_count
    
    def get_normalization_status(self, file_uuid: str) -> Dict[str, Any]:
        """Get detailed normalization status for a file."""
        # This would query data.raw_data_upload_file_rows grouped by normalization_status
        return {
            "file_uuid": file_uuid,
            "total_rows": 0,
            "pending": 0,
            "processing": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0,
            "errors": []
        }
    
    def retry_failed_normalizations(self, file_uuid: str) -> Dict[str, Any]:
        """Retry normalization for rows that previously failed."""
        # Reset failed rows to pending and reprocess
        return self.normalize_raw_file_data(file_uuid, force_normalization=True)