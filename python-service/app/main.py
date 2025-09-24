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

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "docling-pandas-processor"}

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
        
        # Step 2: Parse based on file type
        if file_type == "pdf":
            # Use Docling for PDF processing
            parsed_data = await docling_processor.process_pdf(file_content)
        elif file_type in ["xlsx", "csv"]:
            # Use pandas for tabular data
            parsed_data = await pandas_analyzer.process_tabular_data(
                file_content, file_type, file.filename
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
            message=f"Successfully processed {len(normalized_data)} records using Docling + pandas"
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