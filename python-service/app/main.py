from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import logging
from typing import Optional, Dict, Any, List
import os
from dotenv import load_dotenv

from .models import ProcessingRequest, ProcessingResponse, FileCharacteristics
from .docling_processor import DoclingProcessor
from .pandas_analyzer import PandasAnalyzer
from .utils.file_detector import FileDetector
from .utils.normalizer import DataNormalizer
from .utils.validator import DataValidator
from .raw_file_analyzer import RawFileAnalyzer
from .raw_data_storage import RawDataStorage
from .raw_data_normalizer import RawDataNormalizer

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Docling + pandas Processing Service",
    description="Advanced document processing service for trial balance data using Docling and pandas",
    version="1.0.0"
)

# Configure CORS for Supabase Edge Functions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processors
docling_processor = DoclingProcessor()
pandas_analyzer = PandasAnalyzer()
file_detector = FileDetector()
normalizer = DataNormalizer()
validator = DataValidator()
raw_file_analyzer = RawFileAnalyzer()

# Initialize new two-phase processors
raw_data_storage = RawDataStorage(file_detector, raw_file_analyzer)
raw_data_normalizer = RawDataNormalizer(pandas_analyzer, validator, normalizer)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "docling-pandas-processor"}

@app.post("/process-raw-file")
async def process_raw_file(
    file: UploadFile = File(...),
    entity_uuid: str = Form(...),
    user_uuid: str = Form(...)
):
    """
    NEW: Phase 1 - Parse file and store raw data with complete transparency
    Returns file UUID for later normalization
    """
    try:
        logger.info(f"Phase 1: Processing raw file: {file.filename}")
        
        # Read file content
        file_content = await file.read()
        
        # Process and store raw data
        file_uuid, processing_summary = raw_data_storage.process_and_store_raw_file(
            file_content=file_content,
            filename=file.filename,
            entity_uuid=entity_uuid,
            user_uuid=user_uuid
        )
        
        return {
            "success": True,
            "phase": "raw_data_storage",
            "file_uuid": file_uuid,
            "processing_summary": processing_summary,
            "message": f"Raw data stored successfully. Use file_uuid {file_uuid} for normalization."
        }
        
    except Exception as e:
        logger.error(f"Error in raw file processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/normalize-raw-file")
async def normalize_raw_file(
    file_uuid: str = Form(...),
    entity_uuid: str = Form(...),
    persist_to_database: bool = Form(False),
    force_normalization: bool = Form(False),
    custom_mapping: Optional[str] = Form(None)  # JSON string
):
    """
    NEW: Phase 2 - Normalize raw data to trial balance format
    Operates on previously stored raw data
    """
    try:
        logger.info(f"Phase 2: Normalizing raw data for file: {file_uuid}")
        
        # Parse custom mapping if provided
        mapping_dict = None
        if custom_mapping:
            import json
            try:
                mapping_dict = json.loads(custom_mapping)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid JSON in custom_mapping")
        
        # Normalize the raw data
        normalization_result = raw_data_normalizer.normalize_raw_file_data(
            file_uuid=file_uuid,
            entity_uuid=entity_uuid,
            force_normalization=force_normalization,
            custom_mapping=mapping_dict
        )
        
        return {
            "success": True,
            "phase": "normalization",
            "normalization_result": normalization_result,
            "message": f"Normalization complete. {normalization_result['normalized_rows']} rows processed."
        }
        
    except Exception as e:
        logger.error(f"Error in raw data normalization: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/raw-file-status/{file_uuid}")
async def get_raw_file_status(file_uuid: str):
    """
    Get detailed status of raw file processing and normalization
    """
    try:
        # Get raw file data
        raw_data = raw_data_storage.get_raw_file_data(file_uuid)
        
        # Get normalization status
        normalization_status = raw_data_normalizer.get_normalization_status(file_uuid)
        
        return {
            "success": True,
            "file_uuid": file_uuid,
            "raw_data_summary": {
                "filename": raw_data.get("file_metadata", {}).get("filename", "unknown"),
                "total_raw_rows": len(raw_data.get("raw_rows", [])),
                "parsing_completed": raw_data.get("file_metadata", {}).get("upload_status") == "parsed"
            },
            "normalization_status": normalization_status
        }
        
    except Exception as e:
        logger.error(f"Error getting raw file status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retry-normalization/{file_uuid}")
async def retry_failed_normalization(file_uuid: str):
    """
    Retry normalization for rows that previously failed
    """
    try:
        logger.info(f"Retrying failed normalizations for file: {file_uuid}")
        
        result = raw_data_normalizer.retry_failed_normalizations(file_uuid)
        
        return {
            "success": True,
            "retry_result": result,
            "message": "Retry completed"
        }
        
    except Exception as e:
        logger.error(f"Error retrying normalization: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-file", response_model=ProcessingResponse)
async def process_file(
    file: UploadFile = File(...),
    entity_uuid: str = Form(...),
    persist_to_database: bool = Form(False),
    source_system_hint: Optional[str] = Form(None)
):
    """
    Main file processing endpoint
    Handles XLSX/CSV/PDF files with Docling and pandas
    """
    try:
        logger.info(f"Processing file: {file.filename}, size: {file.size}")
        
        # Step 1: File Type Detection
        file_content = await file.read()
        file_type = await file_detector.detect_file_type(file_content, file.filename)
        logger.info(f"Detected file type: {file_type}")
        
        # Step 1.5: GPT-5 Raw File Analysis (NEW)
        raw_analysis = None
        processing_hints = {}
        
        if file_type in ["xlsx", "csv"]:
            try:
                from .models import FileType
                raw_analysis = await raw_file_analyzer.analyze_raw_file_structure(
                    file_content, FileType(file_type), file.filename
                )
                processing_hints = raw_analysis.processing_hints
                logger.info(f"GPT-5 raw analysis completed with confidence: {raw_analysis.analysis_confidence}")
            except Exception as e:
                logger.warning(f"Raw file analysis failed: {str(e)}, proceeding without hints")
        
        # Step 2: Parse based on file type
        if file_type == "pdf":
            # Use Docling for PDF processing
            parsed_data = await docling_processor.process_pdf(file_content)
        elif file_type in ["xlsx", "csv"]:
            # Use pandas for tabular data with GPT-5 hints
            parsed_data = await pandas_analyzer.process_tabular_data(
                file_content, file_type, file.filename, processing_hints
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_type}"
            )
        
        logger.info(f"Parsed {len(parsed_data)} rows from file")
        
        # Step 3: Data Normalization with pandas
        normalized_data = await pandas_analyzer.normalize_data(
            parsed_data, entity_uuid, file.filename
        )
        
        # Step 4: Classification and Characteristics Detection
        characteristics = await pandas_analyzer.detect_file_characteristics(
            normalized_data, file.filename, file_type
        )
        
        # Step 5: Data Validation
        validation_results = await validator.validate_trial_balance_data(normalized_data)
        
        # Step 6: Enhanced Quality Analysis
        quality_report = await pandas_analyzer.generate_quality_report(normalized_data)
        
        logger.info(f"Successfully processed {len(normalized_data)} normalized records")
        
        return ProcessingResponse(
            success=True,
            data=normalized_data,
            row_count=len(normalized_data),
            characteristics=characteristics,
            validation_results=validation_results,
            quality_report=quality_report,
            raw_analysis=raw_analysis,
            message=f"Successfully processed {len(normalized_data)} records using Docling + pandas with GPT-5 analysis"
        )
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-file", response_model=Dict[str, Any])
async def analyze_file(file: UploadFile = File(...)):
    """
    Analyze file structure and characteristics without full processing
    """
    try:
        file_content = await file.read()
        file_type = await file_detector.detect_file_type(file_content, file.filename)
        
        if file_type == "pdf":
            analysis = await docling_processor.analyze_pdf_structure(file_content)
        else:
            analysis = await pandas_analyzer.analyze_tabular_structure(
                file_content, file_type, file.filename
            )
        
        return {
            "file_type": file_type,
            "analysis": analysis,
            "recommendations": await _generate_recommendations(analysis, file_type)
        }
        
    except Exception as e:
        logger.error(f"Error analyzing file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/validate-data")
async def validate_data(data: List[Dict[str, Any]]):
    """
    Validate normalized trial balance data
    """
    try:
        validation_results = await validator.validate_trial_balance_data(data)
        return validation_results
    except Exception as e:
        logger.error(f"Error validating data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def _generate_recommendations(analysis: Dict[str, Any], file_type: str) -> List[str]:
    """Generate processing recommendations based on file analysis"""
    recommendations = []
    
    if file_type == "pdf":
        if analysis.get("table_count", 0) > 1:
            recommendations.append("Multiple tables detected - will extract the most relevant table")
        if analysis.get("confidence_score", 1.0) < 0.8:
            recommendations.append("Low confidence in table detection - manual review recommended")
    
    elif file_type in ["xlsx", "csv"]:
        if analysis.get("data_quality_score", 1.0) < 0.7:
            recommendations.append("Data quality issues detected - cleaning will be applied")
        if analysis.get("header_detection_confidence", 1.0) < 0.9:
            recommendations.append("Header detection uncertain - verify column mappings")
    
    return recommendations

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)