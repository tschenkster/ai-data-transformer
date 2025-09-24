import pandas as pd
import numpy as np
import logging
from typing import List, Dict, Any, Optional, Tuple
import io
import hashlib
from datetime import datetime, date
import re
from .models import FileCharacteristics, ContentType, ReportingFrequency, ValidationResult, QualityReport, ProcessedTrialBalanceRow
from .gpt5_column_analyzer import GPT5ColumnAnalyzer, ColumnAnalysis

logger = logging.getLogger(__name__)

class PandasAnalyzer:
    def __init__(self):
        """Initialize pandas analyzer with GPT-5 enhanced German accounting support"""
        # Configure pandas for German accounting formats
        self.decimal_separators = ['.', ',']
        self.thousand_separators = [',', '.', ' ', "'"]
        self.negative_patterns = [r'\((.*?)\)', r'-(.*)', r'(.*)CR$']
        
        # Initialize GPT-5 analyzer for intelligent column mapping
        try:
            self.gpt5_analyzer = GPT5ColumnAnalyzer()
            logger.info("GPT-5 Column Analyzer initialized successfully")
        except Exception as e:
            logger.warning(f"GPT-5 initialization failed: {str(e)}, using fallback mode")
            self.gpt5_analyzer = None
        
        # Enhanced German keyword patterns from sample data
        self.enhanced_german_patterns = {
            'account_description': [
                'beschriftung', 'bezeichnung', 'beschreibung', 'kontobezeichnung',
                'zeilen-/kontobezeichnung', 'line_description', 'account_description',
                'description', 'name', 'text'
            ],
            'account_number': [
                'konto', 'kontonummer', 'sachkonto', 'account', 'zeile', 'line'
            ],
            'amounts': [
                'betrag', 'saldo', 'balance', 'eb-wert', 'wert', 'amount',
                'opening_balance', 'ending_balance', 'total', 'summe'
            ]
        }
        
        logger.info("Pandas analyzer initialized with GPT-5 enhanced German accounting support")

    async def process_tabular_data(self, file_content: bytes, file_type: str, filename: str) -> List[Dict[str, Any]]:
        """Process XLSX/CSV files using pandas with enhanced German accounting support"""
        try:
            logger.info(f"Processing {file_type} file: {filename}")
            
            if file_type == "xlsx":
                df = await self._read_excel_with_options(file_content, filename)
            elif file_type == "csv":
                df = await self._read_csv_with_options(file_content, filename)
            else:
                raise ValueError(f"Unsupported file type for pandas processing: {file_type}")
            
            logger.info(f"Loaded DataFrame with {len(df)} rows and {len(df.columns)} columns")
            
            # Convert to list of dictionaries with row numbers
            data_list = []
            for idx, row in df.iterrows():
                row_dict = {
                    '_source_row': idx + 2,  # +2 for header row and 1-based indexing
                    '_extraction_method': f'pandas_{file_type}'
                }
                
                for col_name, value in row.items():
                    if pd.notna(value) and str(value).strip():
                        row_dict[str(col_name)] = str(value).strip()
                
                # Only include rows with meaningful data
                if len([k for k in row_dict.keys() if not k.startswith('_')]) >= 2:
                    data_list.append(row_dict)
            
            logger.info(f"Converted to {len(data_list)} valid data rows")
            return data_list
            
        except Exception as e:
            logger.error(f"Error processing tabular data: {str(e)}")
            raise Exception(f"Tabular data processing failed: {str(e)}")

    async def _read_excel_with_options(self, file_content: bytes, filename: str) -> pd.DataFrame:
        """Read Excel file with enhanced options for German accounting data"""
        try:
            # Try reading with different options to find the best approach
            excel_file = pd.ExcelFile(io.BytesIO(file_content))
            
            # Get the best sheet (prioritize sheets with accounting keywords)
            sheet_name = self._select_best_sheet(excel_file.sheet_names)
            logger.info(f"Selected sheet: {sheet_name}")
            
            # Read with pandas optimizations
            df = pd.read_excel(
                io.BytesIO(file_content),
                sheet_name=sheet_name,
                dtype_backend="pyarrow",  # Use Arrow backend for better performance
                header=None,  # We'll detect header row ourselves
                engine='openpyxl'
            )
            
            # Clean and find header row
            df = self._clean_and_find_header(df)
            
            return df
            
        except Exception as e:
            logger.error(f"Error reading Excel file: {str(e)}")
            raise

    async def _read_csv_with_options(self, file_content: bytes, filename: str) -> pd.DataFrame:
        """Read CSV file with enhanced encoding and delimiter detection"""
        try:
            # Detect encoding
            import charset_normalizer
            encoding_result = charset_normalizer.from_bytes(file_content)
            encoding = encoding_result.best().encoding if encoding_result.best() else 'utf-8'
            logger.info(f"Detected CSV encoding: {encoding}")
            
            # Convert to string
            csv_content = file_content.decode(encoding)
            
            # Detect delimiter
            delimiter = self._detect_csv_delimiter(csv_content)
            logger.info(f"Detected CSV delimiter: '{delimiter}'")
            
            # Read with pandas
            df = pd.read_csv(
                io.StringIO(csv_content),
                delimiter=delimiter,
                dtype_backend="pyarrow",
                header=None,  # We'll detect header row ourselves
                encoding=encoding,
                skip_blank_lines=True
            )
            
            # Clean and find header row
            df = self._clean_and_find_header(df)
            
            return df
            
        except Exception as e:
            logger.error(f"Error reading CSV file: {str(e)}")
            raise

    def _select_best_sheet(self, sheet_names: List[str]) -> str:
        """Select the most likely sheet containing trial balance data"""
        # Priority keywords for German accounting
        priority_keywords = [
            'summen', 'saldi', 'trial', 'balance', 'tb', 'guv', 'bwa', 
            'bilanz', 'konto', 'saldo', 'soll', 'haben'
        ]
        
        for keyword in priority_keywords:
            for sheet in sheet_names:
                if keyword.lower() in sheet.lower():
                    return sheet
        
        # Return first sheet if no match
        return sheet_names[0]

    def _clean_and_find_header(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean DataFrame and detect header row"""
        # Remove completely empty rows
        df = df.dropna(how='all').reset_index(drop=True)
        
        # Find header row using German accounting keywords
        header_keywords = [
            'konto', 'account', 'bezeichnung', 'description', 'saldo', 'balance',
            'soll', 'haben', 'debit', 'credit', 'betrag', 'amount'
        ]
        
        header_row_idx = 0
        best_score = 0
        
        for idx in range(min(10, len(df))):  # Check first 10 rows
            row = df.iloc[idx]
            score = 0
            non_empty_cols = 0
            
            for cell in row:
                if pd.notna(cell) and str(cell).strip():
                    non_empty_cols += 1
                    cell_str = str(cell).lower().strip()
                    
                    # Exact matches get higher score
                    if any(keyword == cell_str for keyword in header_keywords):
                        score += 5
                    # Partial matches get lower score
                    elif any(keyword in cell_str for keyword in header_keywords):
                        score += 2
            
            # Need at least 2 non-empty columns and some keyword matches
            if non_empty_cols >= 2 and score > best_score:
                best_score = score
                header_row_idx = idx
        
        # Set header and clean up
        if header_row_idx > 0:
            # Skip rows before header
            df = df.iloc[header_row_idx:].reset_index(drop=True)
        
        # Set first row as header
        df.columns = df.iloc[0]
        df = df.drop(df.index[0]).reset_index(drop=True)
        
        # Clean column names
        df.columns = [self._normalize_column_name(col) for col in df.columns]
        
        logger.info(f"Found header at row {header_row_idx + 1}, columns: {list(df.columns)}")
        return df

    def _normalize_column_name(self, col_name: str) -> str:
        """Normalize column names to standard English accounting terms"""
        if pd.isna(col_name) or not str(col_name).strip():
            return "Unknown_Column"
        
        normalized = str(col_name).strip().lower()
        
        # German to English mappings for accounting terms
        mappings = {
            'konto': 'Account_Number',
            'kontonummer': 'Account_Number',
            'sachkonto': 'Account_Number',
            'bezeichnung': 'Account_Description',
            'kontobezeichnung': 'Account_Description',
            'beschreibung': 'Account_Description',
            'saldo': 'Balance',
            'endsaldo': 'Ending_Balance',
            'anfangssaldo': 'Opening_Balance',
            'soll': 'Debit',
            'sollsaldo': 'Debit_Balance',
            'haben': 'Credit',
            'habensaldo': 'Credit_Balance',
            'betrag': 'Amount',
            'summe': 'Total',
            'periode': 'Period',
            'monat': 'Month',
            'jahr': 'Year'
        }
        
        # Check for exact matches
        for german, english in mappings.items():
            if german in normalized:
                return english
        
        # Return cleaned original name
        return str(col_name).strip().replace(' ', '_')

    def _detect_csv_delimiter(self, csv_content: str) -> str:
        """Detect CSV delimiter from content"""
        # Common delimiters in order of preference
        delimiters = [';', ',', '\t', '|']
        
        # Sample first few lines for detection
        sample_lines = csv_content.split('\n')[:5]
        sample = '\n'.join(sample_lines)
        
        delimiter_scores = {}
        for delim in delimiters:
            # Count occurrences and consistency across lines
            line_counts = [line.count(delim) for line in sample_lines if line.strip()]
            if line_counts:
                avg_count = sum(line_counts) / len(line_counts)
                consistency = 1 - (np.std(line_counts) / (avg_count + 1))  # Avoid division by zero
                delimiter_scores[delim] = avg_count * consistency
        
        # Return delimiter with highest score
        if delimiter_scores:
            best_delimiter = max(delimiter_scores, key=delimiter_scores.get)
            return best_delimiter
        
        return ','  # Default fallback

    async def normalize_data(self, parsed_data: List[Dict[str, Any]], entity_uuid: str, filename: str) -> List[ProcessedTrialBalanceRow]:
        """Normalize parsed data using pandas for advanced data cleaning and validation"""
        try:
            logger.info(f"Starting data normalization for {len(parsed_data)} rows")
            
            # Convert to DataFrame for pandas operations
            df = pd.DataFrame(parsed_data)
            
            if df.empty:
                return []
            
            # Identify key columns using GPT-5 enhanced analysis
            column_mapping = await self._identify_columns(df.columns.tolist(), parsed_data[:3])
            logger.info(f"Enhanced column mapping: {column_mapping}")
            
            normalized_rows = []
            
            for idx, row in df.iterrows():
                try:
                    # Extract and clean core fields
                    account_number = self._extract_account_number(row, column_mapping)
                    account_description = await self._extract_account_description(row, column_mapping, account_number)
                    amount = self._extract_amount(row, column_mapping)
                    
                    if not account_number:
                        continue
                    
                    # Generate source hash for deduplication
                    source_hash = hashlib.sha256(
                        f"{entity_uuid}_{account_number}_{account_description}_{filename}".encode()
                    ).hexdigest()[:16]
                    
                    # Create normalized record
                    normalized_row = ProcessedTrialBalanceRow(
                        entity_uuid=entity_uuid,
                        account_number=account_number,
                        account_description=account_description,
                        amount=amount or 0.0,
                        currency_code="EUR",  # Default, will be detected later
                        source_system="Unknown",  # Will be classified later
                        source_file_name=filename,
                        source_row_number=row.get('_source_row', idx + 1),
                        source_hash=source_hash,
                        period_key_yyyymm=self._extract_period_key(),
                        period_start_date=self._generate_period_dates()[0],
                        period_end_date=self._generate_period_dates()[1],
                        as_of_date=datetime.now().date().isoformat(),
                        parser_version="docling-pandas-1.0",
                        extraction_confidence=self._calculate_extraction_confidence(row, column_mapping),
                        processing_metadata={
                            'extraction_method': row.get('_extraction_method', 'pandas'),
                            'source_page': row.get('_source_page'),
                            'source_table': row.get('_source_table'),
                            'columns_found': list(column_mapping.keys())
                        }
                    )
                    
                    normalized_rows.append(normalized_row)
                    
                except Exception as e:
                    logger.warning(f"Failed to normalize row {idx}: {str(e)}")
                    continue
            
            logger.info(f"Successfully normalized {len(normalized_rows)} rows")
            return normalized_rows
            
        except Exception as e:
            logger.error(f"Error in data normalization: {str(e)}")
            raise

    async def _identify_columns(self, column_names: List[str], sample_data: List[Dict[str, Any]] = None) -> Dict[str, str]:
        """GPT-5 enhanced column identification with German accounting expertise"""
        
        # Try GPT-5 enhanced analysis first
        if self.gpt5_analyzer and sample_data:
            try:
                logger.info("Using GPT-5 for intelligent column mapping")
                analysis = await self.gpt5_analyzer.analyze_columns(
                    column_names, 
                    sample_data[:3],  # Send first 3 rows as sample
                    document_type="German accounting document"
                )
                
                if analysis.confidence > 0.7:
                    logger.info(f"GPT-5 mapping successful with {analysis.confidence:.2f} confidence")
                    return analysis.mapping
                else:
                    logger.info(f"GPT-5 confidence too low ({analysis.confidence:.2f}), using enhanced fallback")
                    
            except Exception as e:
                logger.warning(f"GPT-5 column analysis failed: {str(e)}, using enhanced fallback")
        
        # Enhanced fallback with German patterns from sample data
        return self._enhanced_pattern_matching(column_names)
    
    def _enhanced_pattern_matching(self, column_names: List[str]) -> Dict[str, str]:
        """Enhanced pattern matching with German accounting expertise"""
        mapping = {}
        
        for col in column_names:
            col_lower = str(col).lower().strip()
            
            # Enhanced account description patterns (CRITICAL FIX)
            if any(pattern in col_lower for pattern in self.enhanced_german_patterns['account_description']):
                if 'description' not in mapping:
                    mapping['description'] = col
                    logger.info(f"Mapped '{col}' to account_description")
            
            # Account number patterns
            elif any(pattern in col_lower for pattern in self.enhanced_german_patterns['account_number']):
                if 'account_number' not in mapping:
                    mapping['account_number'] = col
                    logger.info(f"Mapped '{col}' to account_number")
            
            # Amount patterns
            elif any(pattern in col_lower for pattern in self.enhanced_german_patterns['amounts']):
                if 'amount' not in mapping:
                    mapping['amount'] = col
                    logger.info(f"Mapped '{col}' to amount")
            
            # Period patterns
            elif any(pattern in col_lower for pattern in ['period', 'periode', 'month', 'monat', 'date', 'datum']):
                if 'period' not in mapping:
                    mapping['period'] = col
                    logger.info(f"Mapped '{col}' to period")
        
        logger.info(f"Enhanced pattern matching result: {mapping}")
        return mapping

    def _extract_account_number(self, row: pd.Series, column_mapping: Dict[str, str]) -> Optional[str]:
        """Extract and clean account number"""
        account_col = column_mapping.get('account_number')
        if not account_col or account_col not in row:
            # Try to find in first few columns
            for col in row.index[:3]:
                value = str(row[col]).strip()
                if value and re.match(r'^[0-9A-Za-z]{2,15}$', value):
                    return value
            return None
        
        value = str(row[account_col]).strip()
        if not value or value.lower() in ['nan', 'null', '']:
            return None
        
        # Clean account number (remove special characters, keep alphanumeric)
        cleaned = re.sub(r'[^0-9A-Za-z]', '', value)
        return cleaned if cleaned else None

    async def _extract_account_description(self, row: pd.Series, column_mapping: Dict[str, str], account_number: Optional[str] = None) -> Optional[str]:
        """Extract and clean account description with GPT-5 enhancement"""
        desc_col = column_mapping.get('description')
        
        # Primary extraction from mapped column
        if desc_col and desc_col in row:
            value = str(row[desc_col]).strip()
            if value and value.lower() not in ['nan', 'null', '', 'n/a', 'none']:
                return value[:255]
        
        # Secondary: Search in text columns using enhanced patterns
        for col in row.index:
            col_lower = str(col).lower()
            # Check if column name matches German description patterns
            if any(pattern in col_lower for pattern in self.enhanced_german_patterns['account_description']):
                value = str(row[col]).strip()
                if value and len(value) > 2 and not re.match(r'^[0-9.,-]+$', value):
                    logger.info(f"Found description '{value}' in unmapped column '{col}'")
                    return value[:255]
        
        # Tertiary: GPT-5 inference from account number
        if self.gpt5_analyzer and account_number:
            try:
                inferences = await self.gpt5_analyzer.infer_missing_descriptions(
                    [account_number], 
                    context="German trial balance"
                )
                if account_number in inferences:
                    inferred_desc = inferences[account_number]
                    logger.info(f"GPT-5 inferred description for {account_number}: {inferred_desc}")
                    return inferred_desc[:255]
            except Exception as e:
                logger.warning(f"GPT-5 description inference failed: {str(e)}")
        
        # Fallback: Use any meaningful text in the row
        for col in row.index:
            value = str(row[col]).strip()
            if (value and len(value) > 5 and 
                not re.match(r'^[0-9.,-]+$', value) and 
                not re.match(r'^[0-9A-Za-z]{1,4}$', value)):  # Exclude account numbers
                logger.info(f"Using fallback description '{value}' from column '{col}'")
                return value[:255]
        
        return None

    def _extract_amount(self, row: pd.Series, column_mapping: Dict[str, str]) -> Optional[float]:
        """Extract and normalize amount with German accounting format support"""
        amount_col = column_mapping.get('amount')
        if not amount_col or amount_col not in row:
            # Try to find numeric columns
            for col in row.index:
                value = str(row[col]).strip()
                if self._looks_like_amount(value):
                    return self._parse_german_amount(value)
            return None
        
        value = str(row[amount_col]).strip()
        if not value or value.lower() in ['nan', 'null', '']:
            return None
        
        return self._parse_german_amount(value)

    def _looks_like_amount(self, value: str) -> bool:
        """Check if a value looks like a monetary amount"""
        # Remove whitespace
        value = value.strip()
        if not value:
            return False
        
        # Check for numeric patterns including German formats
        patterns = [
            r'^-?[\d.,\s]+$',  # Numbers with dots, commas, spaces
            r'^\([\d.,\s]+\)$',  # Parentheses for negative
            r'^[\d.,\s]+CR$',  # Credit notation
            r'^[\d.,\s]+DR$'   # Debit notation
        ]
        
        return any(re.match(pattern, value, re.IGNORECASE) for pattern in patterns)

    def _parse_german_amount(self, value: str) -> Optional[float]:
        """Parse German accounting amount formats"""
        if not value or not isinstance(value, str):
            return None
        
        original_value = value.strip()
        
        # Handle negative indicators
        is_negative = False
        
        # Check for parentheses (negative)
        if value.startswith('(') and value.endswith(')'):
            is_negative = True
            value = value[1:-1].strip()
        
        # Check for CR/DR suffixes
        if value.upper().endswith(' CR'):
            is_negative = True
            value = value[:-3].strip()
        elif value.upper().endswith(' DR'):
            value = value[:-3].strip()
        
        # Check for minus sign
        if value.startswith('-'):
            is_negative = True
            value = value[1:].strip()
        
        # Remove currency symbols and extra spaces
        value = re.sub(r'[€$£¥₹]', '', value).strip()
        
        # Handle German number format (1.234,56 or 1 234,56)
        if ',' in value and '.' in value:
            # Both comma and dot present
            last_comma = value.rfind(',')
            last_dot = value.rfind('.')
            
            if last_comma > last_dot:
                # Comma is decimal separator (1.234,56)
                value = value.replace('.', '').replace(',', '.')
            else:
                # Dot is decimal separator (1,234.56)
                value = value.replace(',', '')
        
        elif ',' in value:
            # Only comma - could be thousands or decimal separator
            comma_pos = value.rfind(',')
            after_comma = value[comma_pos + 1:]
            
            if len(after_comma) <= 2 and after_comma.isdigit():
                # Decimal separator (1234,56)
                value = value.replace(',', '.')
            else:
                # Thousands separator (1,234)
                value = value.replace(',', '')
        
        # Remove any remaining spaces
        value = value.replace(' ', '')
        
        try:
            amount = float(value)
            return -amount if is_negative else amount
        except ValueError:
            logger.warning(f"Could not parse amount: {original_value}")
            return None

    def _extract_period_key(self) -> int:
        """Extract or generate period key (YYYYMM format)"""
        # For now, use current period - this should be enhanced to detect from data
        now = datetime.now()
        return now.year * 100 + now.month

    def _generate_period_dates(self) -> Tuple[str, str]:
        """Generate period start and end dates"""
        now = datetime.now()
        # For now, use current month - should be enhanced to detect from data
        start_date = date(now.year, now.month, 1)
        
        # Calculate last day of month
        if now.month == 12:
            end_date = date(now.year + 1, 1, 1) - pd.Timedelta(days=1)
        else:
            end_date = date(now.year, now.month + 1, 1) - pd.Timedelta(days=1)
        
        return start_date.isoformat(), end_date.isoformat()

    def _calculate_extraction_confidence(self, row: pd.Series, column_mapping: Dict[str, str]) -> float:
        """Calculate confidence score for data extraction"""
        score = 0.0
        total_checks = 0
        
        # Check if we found account number
        if column_mapping.get('account_number') and self._extract_account_number(row, column_mapping):
            score += 0.4
        total_checks += 0.4
        
        # Check if we found description
        if column_mapping.get('description') and self._extract_account_description(row, column_mapping):
            score += 0.3
        total_checks += 0.3
        
        # Check if we found amount
        if column_mapping.get('amount') and self._extract_amount(row, column_mapping) is not None:
            score += 0.3
        total_checks += 0.3
        
        return score / total_checks if total_checks > 0 else 0.0

    async def detect_file_characteristics(self, normalized_data: List[ProcessedTrialBalanceRow], filename: str, file_type: str) -> FileCharacteristics:
        """Detect file characteristics using pandas analysis"""
        # This is a simplified implementation - would be enhanced with AI analysis
        return FileCharacteristics(
            file_type=file_type,
            content_type=ContentType.TRIAL_BALANCE,
            reporting_frequency=ReportingFrequency.MONTHLY,
            reporting_period={
                "start_date": datetime.now().replace(day=1).date().isoformat(),
                "end_date": datetime.now().date().isoformat(),
                "period_key_yyyymm": datetime.now().year * 100 + datetime.now().month
            },
            origin_system="Unknown",
            currency_code="EUR",
            confidence_score=0.8
        )

    async def generate_quality_report(self, normalized_data: List[ProcessedTrialBalanceRow]) -> QualityReport:
        """Generate comprehensive data quality report using pandas"""
        if not normalized_data:
            return QualityReport(
                completeness_score=0.0,
                consistency_score=0.0,
                accuracy_score=0.0,
                overall_score=0.0,
                metrics={},
                recommendations=["No data to analyze"]
            )
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame([row.dict() for row in normalized_data])
        
        # Calculate completeness
        completeness_scores = {}
        for col in df.columns:
            non_null_count = df[col].notna().sum()
            completeness_scores[col] = non_null_count / len(df)
        
        completeness_score = np.mean(list(completeness_scores.values()))
        
        # Calculate consistency (simplified)
        consistency_score = 0.9  # Placeholder - would implement actual consistency checks
        
        # Calculate accuracy (simplified)
        accuracy_score = 0.85  # Placeholder - would implement actual accuracy checks
        
        overall_score = (completeness_score + consistency_score + accuracy_score) / 3
        
        recommendations = []
        if completeness_score < 0.8:
            recommendations.append("Some records have missing data - consider data cleaning")
        if len(df) < 10:
            recommendations.append("Small dataset - results may not be representative")
        
        return QualityReport(
            completeness_score=completeness_score,
            consistency_score=consistency_score,
            accuracy_score=accuracy_score,
            overall_score=overall_score,
            metrics={
                "total_records": len(df),
                "unique_accounts": df['account_number'].nunique(),
                "completeness_by_field": completeness_scores
            },
            recommendations=recommendations
        )

    async def analyze_tabular_structure(self, file_content: bytes, file_type: str, filename: str) -> Dict[str, Any]:
        """Analyze tabular file structure without full processing"""
        try:
            if file_type == "xlsx":
                df = await self._read_excel_with_options(file_content, filename)
            else:
                df = await self._read_csv_with_options(file_content, filename)
            
            return {
                'row_count': len(df),
                'column_count': len(df.columns),
                'columns': df.columns.tolist(),
                'data_types': df.dtypes.to_dict(),
                'missing_data_percent': df.isnull().sum() / len(df) * 100,
                'data_quality_score': 1.0 - (df.isnull().sum().sum() / (len(df) * len(df.columns))),
                'header_detection_confidence': 0.9  # Placeholder
            }
            
        except Exception as e:
            logger.error(f"Error analyzing tabular structure: {str(e)}")
            return {'error': str(e)}