import pandas as pd
import numpy as np
import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, date

logger = logging.getLogger(__name__)

class DataNormalizer:
    def __init__(self):
        """Initialize data normalizer with German accounting format support"""
        # German accounting patterns
        self.german_decimal_patterns = [
            r'(\d{1,3}(?:\.\d{3})*),(\d{1,2})$',  # 1.234.567,89
            r'(\d{1,3}(?:\s\d{3})*),(\d{1,2})$',  # 1 234 567,89
            r'(\d+),(\d{1,2})$'                   # 123456,89
        ]
        
        self.negative_patterns = [
            r'^\((.+)\)$',          # (123.45)
            r'^(.+)\s*CR$',         # 123.45 CR
            r'^-(.+)$',             # -123.45
            r'^(.+)-$'              # 123.45-
        ]
        
        # Account number patterns
        self.account_patterns = [
            r'^[0-9]{3,8}$',                    # Pure numeric: 1000, 12345
            r'^[0-9]{1,4}[A-Za-z]{1,3}$',      # Mixed: 1000A, 123AB
            r'^[A-Za-z]{1,3}[0-9]{1,6}$'       # Letter prefix: A1000, AB123
        ]
        
        logger.info("Data normalizer initialized with German accounting format support")

    def normalize_account_number(self, value: Any) -> Optional[str]:
        """Normalize account number to standard format"""
        if pd.isna(value) or value is None:
            return None
        
        # Convert to string and clean
        account_str = str(value).strip().upper()
        
        # Remove common separators
        account_str = re.sub(r'[-\s\.]', '', account_str)
        
        # Validate against patterns
        for pattern in self.account_patterns:
            if re.match(pattern, account_str):
                return account_str
        
        # If no pattern matches but looks like it could be an account, try to clean it
        if re.match(r'^[0-9A-Za-z]{2,15}$', account_str):
            return account_str
        
        logger.debug(f"Invalid account number format: {value}")
        return None

    def normalize_account_description(self, value: Any) -> Optional[str]:
        """Normalize account description"""
        if pd.isna(value) or value is None:
            return None
        
        # Convert to string and clean
        desc_str = str(value).strip()
        
        # Skip if too short or looks like a number
        if len(desc_str) < 2 or re.match(r'^[0-9\s\.,\-]+$', desc_str):
            return None
        
        # Clean up common issues
        desc_str = re.sub(r'\s+', ' ', desc_str)  # Collapse whitespace
        desc_str = desc_str.title()  # Title case for consistency
        
        # Limit length
        return desc_str[:255] if desc_str else None

    def normalize_amount(self, value: Any) -> Optional[float]:
        """Normalize amount with German accounting format support"""
        if pd.isna(value) or value is None:
            return None
        
        # If already a number, return it
        if isinstance(value, (int, float)):
            return float(value)
        
        # Convert to string for processing
        amount_str = str(value).strip()
        
        if not amount_str or amount_str.lower() in ['', 'nan', 'null', '-', '0']:
            return None
        
        # Detect and handle negative indicators
        is_negative = False
        for pattern in self.negative_patterns:
            match = re.match(pattern, amount_str, re.IGNORECASE)
            if match:
                is_negative = True
                amount_str = match.group(1).strip()
                break
        
        # Remove currency symbols
        amount_str = re.sub(r'[€$£¥₹]', '', amount_str).strip()
        
        # Parse German decimal formats
        parsed_amount = self._parse_german_decimal(amount_str)
        
        if parsed_amount is None:
            logger.debug(f"Could not parse amount: {value}")
            return None
        
        return -parsed_amount if is_negative else parsed_amount

    def _parse_german_decimal(self, amount_str: str) -> Optional[float]:
        """Parse German decimal format (1.234.567,89)"""
        try:
            # Remove any remaining spaces
            amount_str = amount_str.replace(' ', '')
            
            # Try German patterns first
            for pattern in self.german_decimal_patterns:
                match = re.match(pattern, amount_str)
                if match:
                    integer_part = match.group(1).replace('.', '').replace(' ', '')
                    decimal_part = match.group(2)
                    return float(f"{integer_part}.{decimal_part}")
            
            # Try standard formats
            if ',' in amount_str and '.' in amount_str:
                # Determine which is decimal separator
                last_comma = amount_str.rfind(',')
                last_dot = amount_str.rfind('.')
                
                if last_comma > last_dot:
                    # Comma is decimal (1.234,56)
                    amount_str = amount_str.replace('.', '').replace(',', '.')
                else:
                    # Dot is decimal (1,234.56)
                    amount_str = amount_str.replace(',', '')
            
            elif ',' in amount_str:
                # Only comma - could be thousands or decimal
                parts = amount_str.split(',')
                if len(parts) == 2 and len(parts[1]) <= 2:
                    # Decimal separator
                    amount_str = amount_str.replace(',', '.')
                else:
                    # Thousands separator
                    amount_str = amount_str.replace(',', '')
            
            # Final parsing attempt
            return float(amount_str)
            
        except (ValueError, AttributeError):
            return None

    def normalize_period(self, value: Any) -> Optional[str]:
        """Normalize period to YYYY-MM format"""
        if pd.isna(value) or value is None:
            return None
        
        period_str = str(value).strip()
        
        # Try to parse various period formats
        period_patterns = [
            r'^(\d{4})-(\d{1,2})$',         # 2023-12
            r'^(\d{4})\.(\d{1,2})$',        # 2023.12
            r'^(\d{1,2})/(\d{4})$',         # 12/2023
            r'^(\d{1,2})-(\d{4})$',         # 12-2023
            r'^(\d{4})(\d{2})$'             # 202312
        ]
        
        for pattern in period_patterns:
            match = re.match(pattern, period_str)
            if match:
                if len(match.group(1)) == 4:  # Year first
                    year, month = match.group(1), match.group(2)
                else:  # Month first
                    month, year = match.group(1), match.group(2)
                
                try:
                    year_int = int(year)
                    month_int = int(month)
                    
                    if 1 <= month_int <= 12 and 2000 <= year_int <= 2030:
                        return f"{year_int:04d}-{month_int:02d}"
                except ValueError:
                    continue
        
        return None

    def normalize_currency_code(self, value: Any) -> str:
        """Normalize currency code"""
        if pd.isna(value) or value is None:
            return "EUR"  # Default to EUR for German accounting
        
        currency_str = str(value).strip().upper()
        
        # Common currency mappings
        currency_mappings = {
            '€': 'EUR',
            'EURO': 'EUR',
            '$': 'USD',
            'DOLLAR': 'USD',
            '£': 'GBP',
            'POUND': 'GBP',
            '¥': 'JPY',
            'YEN': 'JPY'
        }
        
        # Direct mapping
        if currency_str in currency_mappings:
            return currency_mappings[currency_str]
        
        # Standard 3-letter codes
        if len(currency_str) == 3 and currency_str.isalpha():
            return currency_str
        
        return "EUR"  # Default fallback

    def detect_and_normalize_columns(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
        """Detect and normalize column names and data types"""
        column_mapping = {}
        normalized_df = df.copy()
        
        # Normalize column names
        new_columns = []
        for col in df.columns:
            normalized_col = self._normalize_column_name(col)
            new_columns.append(normalized_col)
            column_mapping[col] = normalized_col
        
        normalized_df.columns = new_columns
        
        # Apply data type optimizations
        for col in normalized_df.columns:
            if 'account_number' in col.lower():
                normalized_df[col] = normalized_df[col].apply(self.normalize_account_number)
            elif 'description' in col.lower() or 'name' in col.lower():
                normalized_df[col] = normalized_df[col].apply(self.normalize_account_description)
            elif any(term in col.lower() for term in ['amount', 'balance', 'saldo', 'betrag']):
                normalized_df[col] = normalized_df[col].apply(self.normalize_amount)
            elif 'period' in col.lower() or 'date' in col.lower():
                normalized_df[col] = normalized_df[col].apply(self.normalize_period)
            elif 'currency' in col.lower():
                normalized_df[col] = normalized_df[col].apply(self.normalize_currency_code)
        
        return normalized_df, column_mapping

    def _normalize_column_name(self, col_name: str) -> str:
        """Normalize column name to standard format"""
        if pd.isna(col_name) or not col_name:
            return "Unknown_Column"
        
        # Convert to string and clean
        normalized = str(col_name).strip().lower()
        
        # German to English mappings
        mappings = {
            'konto': 'Account_Number',
            'kontonummer': 'Account_Number',
            'sachkonto': 'Account_Number',
            'kontobezeichnung': 'Account_Description',
            'bezeichnung': 'Account_Description',
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
            'jahr': 'Year',
            'währung': 'Currency',
            'datum': 'Date'
        }
        
        # Check for exact matches
        for german, english in mappings.items():
            if german in normalized:
                return english
        
        # Clean and format original name
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', str(col_name))
        cleaned = re.sub(r'\s+', '_', cleaned.strip())
        
        return cleaned.title() if cleaned else "Unknown_Column"

    def validate_normalized_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Validate normalized data quality"""
        validation_result = {
            'is_valid': True,
            'warnings': [],
            'errors': [],
            'statistics': {}
        }
        
        # Check for required columns
        required_patterns = ['account', 'number', 'description']
        found_columns = []
        
        for pattern in required_patterns:
            pattern_found = any(pattern.lower() in col.lower() for col in df.columns)
            found_columns.append(pattern_found)
            if not pattern_found:
                validation_result['warnings'].append(f"No column found matching pattern: {pattern}")
        
        # Data quality checks
        if len(df) == 0:
            validation_result['errors'].append("No data rows found")
            validation_result['is_valid'] = False
        
        # Calculate statistics
        validation_result['statistics'] = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'missing_data_percentage': (df.isnull().sum().sum() / (len(df) * len(df.columns)) * 100) if len(df) > 0 else 0,
            'columns_with_data': sum(df[col].notna().any() for col in df.columns)
        }
        
        return validation_result