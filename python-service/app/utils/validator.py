import pandas as pd
import numpy as np
import logging
from typing import List, Dict, Any, Optional
from ..models import ValidationResult, ProcessedTrialBalanceRow

logger = logging.getLogger(__name__)

class DataValidator:
    def __init__(self):
        """Initialize data validator with trial balance specific rules"""
        self.validation_rules = {
            'account_number': {
                'required': True,
                'min_length': 2,
                'max_length': 20,
                'pattern': r'^[0-9A-Za-z\-_]{2,20}$'
            },
            'amount': {
                'required': False,
                'min_value': -1e12,
                'max_value': 1e12
            },
            'currency_code': {
                'required': True,
                'valid_values': ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD']
            }
        }
        logger.info("Data validator initialized with trial balance validation rules")

    async def validate_trial_balance_data(self, data: List[ProcessedTrialBalanceRow]) -> ValidationResult:
        """Comprehensive validation of trial balance data"""
        errors = []
        warnings = []
        
        if not data:
            return ValidationResult(
                is_valid=False,
                error_count=1,
                warning_count=0,
                errors=[{"type": "no_data", "message": "No data provided for validation"}],
                warnings=[],
                summary={"total_records": 0}
            )
        
        # Convert to DataFrame for pandas operations
        df = pd.DataFrame([row.dict() if hasattr(row, 'dict') else row for row in data])
        
        # 1. Field-level validations
        field_errors, field_warnings = self._validate_fields(df)
        errors.extend(field_errors)
        warnings.extend(field_warnings)
        
        # 2. Business logic validations
        business_errors, business_warnings = self._validate_business_rules(df)
        errors.extend(business_errors)
        warnings.extend(business_warnings)
        
        # 3. Data consistency validations
        consistency_errors, consistency_warnings = self._validate_consistency(df)
        errors.extend(consistency_errors)
        warnings.extend(consistency_warnings)
        
        # 4. Trial balance specific validations
        tb_errors, tb_warnings = self._validate_trial_balance_rules(df)
        errors.extend(tb_errors)
        warnings.extend(tb_warnings)
        
        # Generate summary
        summary = self._generate_validation_summary(df, errors, warnings)
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            error_count=len(errors),
            warning_count=len(warnings),
            errors=errors,
            warnings=warnings,
            summary=summary
        )

    def _validate_fields(self, df: pd.DataFrame) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Validate individual field values"""
        errors = []
        warnings = []
        
        # Validate account numbers
        if 'account_number' in df.columns:
            invalid_accounts = df[
                df['account_number'].isna() | 
                (df['account_number'].str.len() < 2) |
                (df['account_number'].str.len() > 20)
            ]
            
            for idx, row in invalid_accounts.iterrows():
                errors.append({
                    "type": "invalid_account_number",
                    "row": int(idx) + 1,
                    "message": f"Invalid account number: '{row.get('account_number', 'N/A')}'",
                    "field": "account_number",
                    "value": row.get('account_number')
                })
        
        # Validate amounts
        if 'amount' in df.columns:
            # Check for extreme values
            extreme_amounts = df[
                (df['amount'].abs() > 1e10) | 
                (df['amount'].isna() & df['account_number'].notna())
            ]
            
            for idx, row in extreme_amounts.iterrows():
                if pd.isna(row['amount']):
                    warnings.append({
                        "type": "missing_amount",
                        "row": int(idx) + 1,
                        "message": f"Missing amount for account {row.get('account_number', 'N/A')}",
                        "field": "amount",
                        "value": row.get('amount')
                    })
                else:
                    warnings.append({
                        "type": "extreme_amount",
                        "row": int(idx) + 1,
                        "message": f"Extreme amount value: {row['amount']:,.2f}",
                        "field": "amount",
                        "value": row.get('amount')
                    })
        
        # Validate currency codes
        if 'currency_code' in df.columns:
            valid_currencies = self.validation_rules['currency_code']['valid_values']
            invalid_currencies = df[~df['currency_code'].isin(valid_currencies)]
            
            for idx, row in invalid_currencies.iterrows():
                warnings.append({
                    "type": "invalid_currency",
                    "row": int(idx) + 1,
                    "message": f"Unusual currency code: '{row.get('currency_code', 'N/A')}'",
                    "field": "currency_code",
                    "value": row.get('currency_code')
                })
        
        return errors, warnings

    def _validate_business_rules(self, df: pd.DataFrame) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Validate business logic rules"""
        errors = []
        warnings = []
        
        # Check for duplicate account numbers within same entity and period
        if all(col in df.columns for col in ['account_number', 'entity_uuid', 'period_key_yyyymm']):
            duplicates = df.groupby(['entity_uuid', 'account_number', 'period_key_yyyymm']).size()
            duplicate_groups = duplicates[duplicates > 1]
            
            if len(duplicate_groups) > 0:
                for (entity, account, period), count in duplicate_groups.items():
                    warnings.append({
                        "type": "duplicate_account",
                        "message": f"Account {account} appears {count} times for entity {entity} in period {period}",
                        "details": {
                            "entity_uuid": entity,
                            "account_number": account,
                            "period_key_yyyymm": period,
                            "occurrence_count": int(count)
                        }
                    })
        
        # Check for accounts without descriptions
        if all(col in df.columns for col in ['account_number', 'account_description']):
            missing_descriptions = df[
                df['account_number'].notna() & 
                (df['account_description'].isna() | (df['account_description'].str.strip() == ''))
            ]
            
            if len(missing_descriptions) > 0:
                warnings.append({
                    "type": "missing_descriptions",
                    "message": f"{len(missing_descriptions)} accounts are missing descriptions",
                    "count": len(missing_descriptions)
                })
        
        return errors, warnings

    def _validate_consistency(self, df: pd.DataFrame) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Validate data consistency"""
        errors = []
        warnings = []
        
        # Check date consistency
        if all(col in df.columns for col in ['period_start_date', 'period_end_date', 'as_of_date']):
            try:
                df['period_start_pd'] = pd.to_datetime(df['period_start_date'])
                df['period_end_pd'] = pd.to_datetime(df['period_end_date'])
                df['as_of_pd'] = pd.to_datetime(df['as_of_date'])
                
                # Check if period_start <= period_end
                invalid_periods = df[df['period_start_pd'] > df['period_end_pd']]
                for idx, row in invalid_periods.iterrows():
                    errors.append({
                        "type": "invalid_period_range",
                        "row": int(idx) + 1,
                        "message": f"Period start date {row['period_start_date']} is after end date {row['period_end_date']}",
                        "details": {
                            "period_start_date": row['period_start_date'],
                            "period_end_date": row['period_end_date']
                        }
                    })
                
                # Check if as_of_date is reasonable
                future_dates = df[df['as_of_pd'] > pd.Timestamp.now() + pd.Timedelta(days=30)]
                for idx, row in future_dates.iterrows():
                    warnings.append({
                        "type": "future_as_of_date",
                        "row": int(idx) + 1,
                        "message": f"As-of date {row['as_of_date']} is more than 30 days in the future",
                        "value": row['as_of_date']
                    })
                    
            except Exception as e:
                warnings.append({
                    "type": "date_parsing_error",
                    "message": f"Error parsing dates: {str(e)}"
                })
        
        # Check currency consistency within entity
        if all(col in df.columns for col in ['entity_uuid', 'currency_code']):
            entity_currencies = df.groupby('entity_uuid')['currency_code'].nunique()
            mixed_currency_entities = entity_currencies[entity_currencies > 1]
            
            for entity_uuid, currency_count in mixed_currency_entities.items():
                warnings.append({
                    "type": "mixed_currencies",
                    "message": f"Entity {entity_uuid} has {currency_count} different currencies",
                    "entity_uuid": entity_uuid,
                    "currency_count": int(currency_count)
                })
        
        return errors, warnings

    def _validate_trial_balance_rules(self, df: pd.DataFrame) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Validate trial balance specific rules"""
        errors = []
        warnings = []
        
        # Check for minimum number of accounts
        if 'account_number' in df.columns:
            unique_accounts = df['account_number'].nunique()
            if unique_accounts < 5:
                warnings.append({
                    "type": "few_accounts",
                    "message": f"Only {unique_accounts} unique accounts found - may not be a complete trial balance",
                    "count": unique_accounts
                })
        
        # Validate account type distribution
        if 'account_type' in df.columns:
            account_type_dist = df['account_type'].value_counts()
            
            # Check if we have both P&L and BS accounts
            pl_accounts = account_type_dist.get('pl', 0)
            bs_accounts = account_type_dist.get('bs', 0)
            
            if pl_accounts == 0:
                warnings.append({
                    "type": "no_pl_accounts",
                    "message": "No P&L accounts found - trial balance may be incomplete"
                })
            
            if bs_accounts == 0:
                warnings.append({
                    "type": "no_bs_accounts", 
                    "message": "No balance sheet accounts found - trial balance may be incomplete"
                })
        
        # Check for reasonable amount distribution
        if 'amount' in df.columns:
            non_zero_amounts = df[df['amount'] != 0]['amount']
            
            if len(non_zero_amounts) == 0:
                warnings.append({
                    "type": "all_zero_amounts",
                    "message": "All amounts are zero - may indicate data extraction issue"
                })
            else:
                # Check for potential balance
                total_amount = non_zero_amounts.sum()
                avg_amount = non_zero_amounts.abs().mean()
                
                # If total is much smaller than average, might be balanced
                if abs(total_amount) < avg_amount * 0.1:
                    warnings.append({
                        "type": "potentially_balanced",
                        "message": f"Total amount ({total_amount:,.2f}) is close to zero - may indicate a balanced trial balance",
                        "total_amount": float(total_amount)
                    })
        
        return errors, warnings

    def _generate_validation_summary(self, df: pd.DataFrame, errors: List[Dict], warnings: List[Dict]) -> Dict[str, Any]:
        """Generate validation summary statistics"""
        summary = {
            "total_records": len(df),
            "validation_status": "passed" if len(errors) == 0 else "failed",
            "error_count": len(errors),
            "warning_count": len(warnings)
        }
        
        # Add data statistics
        if 'account_number' in df.columns:
            summary["unique_accounts"] = int(df['account_number'].nunique())
            summary["accounts_with_descriptions"] = int(
                df[df['account_description'].notna() & (df['account_description'].str.strip() != '')].shape[0]
            )
        
        if 'amount' in df.columns:
            amounts = df['amount'].dropna()
            if len(amounts) > 0:
                summary["amount_statistics"] = {
                    "total_amount": float(amounts.sum()),
                    "average_amount": float(amounts.mean()),
                    "min_amount": float(amounts.min()),
                    "max_amount": float(amounts.max()),
                    "non_zero_amounts": int((amounts != 0).sum())
                }
        
        if 'currency_code' in df.columns:
            summary["currencies"] = df['currency_code'].value_counts().to_dict()
        
        if 'entity_uuid' in df.columns:
            summary["entities_count"] = int(df['entity_uuid'].nunique())
        
        # Validation score (0-100)
        max_possible_score = 100
        error_penalty = min(len(errors) * 10, 50)  # Cap at 50 points
        warning_penalty = min(len(warnings) * 2, 30)  # Cap at 30 points
        summary["validation_score"] = max(0, max_possible_score - error_penalty - warning_penalty)
        
        return summary

    def validate_file_requirements(self, df: pd.DataFrame, file_type: str) -> Dict[str, Any]:
        """Validate file meets minimum requirements for processing"""
        requirements = {
            "meets_requirements": True,
            "missing_requirements": [],
            "recommendations": []
        }
        
        # Basic requirements
        if len(df) == 0:
            requirements["meets_requirements"] = False
            requirements["missing_requirements"].append("File contains no data rows")
        
        if len(df.columns) < 2:
            requirements["meets_requirements"] = False
            requirements["missing_requirements"].append("File must have at least 2 columns")
        
        # Look for essential column types
        has_account_column = any(
            any(term in str(col).lower() for term in ['account', 'konto', 'number'])
            for col in df.columns
        )
        
        has_description_column = any(
            any(term in str(col).lower() for term in ['description', 'bezeichnung', 'name'])
            for col in df.columns
        )
        
        has_amount_column = any(
            any(term in str(col).lower() for term in ['amount', 'betrag', 'saldo', 'balance'])
            for col in df.columns
        )
        
        if not has_account_column:
            requirements["recommendations"].append(
                "No clear account number column detected - please ensure file contains account numbers"
            )
        
        if not has_description_column:
            requirements["recommendations"].append(
                "No clear description column detected - account descriptions help with mapping"
            )
        
        if not has_amount_column and file_type != 'pdf':
            requirements["recommendations"].append(
                "No clear amount column detected - amounts are needed for trial balance validation"
            )
        
        return requirements