from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum

class FileType(str, Enum):
    XLSX = "xlsx"
    CSV = "csv"
    PDF = "pdf"

class ContentType(str, Enum):
    TRIAL_BALANCE = "trial_balance"
    WORKING_TRIAL_BALANCE = "working_trial_balance"  
    PL = "pl"
    CASHFLOW = "cashflow"
    FINANCIAL_PACKAGE = "financial_package"
    OTHER = "other"

class ReportingFrequency(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"

class ProcessingRequest(BaseModel):
    entity_uuid: str = Field(..., description="Entity UUID for the processed data")
    persist_to_database: bool = Field(False, description="Whether to persist data to database")
    source_system_hint: Optional[str] = Field(None, description="Hint about source system")

class FileCharacteristics(BaseModel):
    file_type: FileType
    content_type: ContentType
    reporting_frequency: ReportingFrequency
    reporting_period: Dict[str, Any]
    origin_system: str
    currency_code: str
    entity_name: Optional[str] = None
    fiscal_year: Optional[int] = None
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    
class ValidationResult(BaseModel):
    is_valid: bool
    error_count: int
    warning_count: int
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []
    summary: Dict[str, Any]

class QualityReport(BaseModel):
    completeness_score: float = Field(..., ge=0.0, le=1.0)
    consistency_score: float = Field(..., ge=0.0, le=1.0)
    accuracy_score: float = Field(..., ge=0.0, le=1.0)
    overall_score: float = Field(..., ge=0.0, le=1.0)
    metrics: Dict[str, Any]
    recommendations: List[str]

class ProcessedTrialBalanceRow(BaseModel):
    entity_uuid: str
    account_number: str
    account_description: Optional[str] = None
    account_type: str = Field(default="pl", description="pl|bs|subledger|statistical")
    amount_periodicity: str = Field(default="monthly", description="monthly|quarterly|annual")
    amount_type: str = Field(default="ending", description="opening|movement|ending|debit_total|credit_total")
    aggregation_scope: str = Field(default="period", description="period|ytd|qtd|mtd|ltm|ltd|custom_period")
    period_key_yyyymm: int
    period_start_date: str
    period_end_date: str
    as_of_date: str
    amount: float
    currency_code: str = Field(default="EUR")
    source_system: str
    source_file_name: str
    source_row_number: int
    source_hash: str
    
    # Enhanced provenance and quality fields
    parser_version: str = Field(default="docling-pandas-1.0")
    extraction_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    data_quality_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    processing_metadata: Dict[str, Any] = Field(default_factory=dict)

class ProcessingResponse(BaseModel):
    success: bool
    data: List[ProcessedTrialBalanceRow] = []
    row_count: int = 0
    characteristics: Optional[FileCharacteristics] = None
    validation_results: Optional[ValidationResult] = None
    quality_report: Optional[QualityReport] = None
    message: str = ""
    processing_time_seconds: Optional[float] = None
    error: Optional[str] = None