import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
import httpx
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ColumnAnalysis:
    """GPT-5 analysis result for column mapping"""
    mapping: Dict[str, str]
    confidence: float
    alternatives: Dict[str, List[str]]
    description_inference: Dict[str, str]
    quality_score: float
    recommendations: List[str]

class GPT5ColumnAnalyzer:
    """GPT-5 powered intelligent column mapping and German accounting expertise"""
    
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        # Enhanced German accounting patterns from sample data
        self.german_patterns = {
            'account_number': [
                'konto', 'kontonummer', 'sachkonto', 'account', 'zeile', 'line'
            ],
            'account_description': [
                'beschriftung', 'bezeichnung', 'beschreibung', 'kontobezeichnung',
                'zeilen-/kontobezeichnung', 'line_description', 'account_description',
                'description', 'name', 'text'
            ],
            'amounts': [
                'betrag', 'saldo', 'balance', 'eb-wert', 'wert', 'amount',
                'opening_balance', 'ending_balance', 'total', 'summe'
            ],
            'debit_credit': [
                's', 'h', 'soll', 'haben', 'debit', 'credit',
                's.1', 'h.1', 'sollsaldo', 'habensaldo'
            ],
            'periods': [
                r'(jan|feb|mar|apr|mai|jun|jul|aug|sep|okt|nov|dez)/?(\d{4})',
                r'(jan|feb|mar|apr|mai|jun|jul|aug|sep|okt|nov|dez)/?(\d{4})\s*[sh]?'
            ]
        }
        
        logger.info("GPT-5 Column Analyzer initialized with German accounting expertise")
    
    async def analyze_raw_excel_structure(
        self, 
        sheet_names: List[str], 
        sheet_previews: Dict[str, str], 
        filename: str
    ) -> 'RawAnalysisResult':
        """Analyze raw Excel structure before processing"""
        from .models import RawAnalysisResult, RawFileStructure
        
        prompt = self._build_raw_excel_analysis_prompt(sheet_names, sheet_previews, filename)
        
        try:
            gpt_response = await self._call_gpt5_api(prompt)
            return self._parse_raw_analysis_response(gpt_response, sheet_previews)
        except Exception as e:
            logger.error(f"GPT-5 raw Excel analysis failed: {str(e)}")
            return self._fallback_raw_analysis("excel", sheet_names, sheet_previews)
    
    async def analyze_raw_csv_structure(
        self, 
        lines: List[str], 
        preview_text: str, 
        filename: str, 
        delimiter: str
    ) -> 'RawAnalysisResult':
        """Analyze raw CSV structure before processing"""
        from .models import RawAnalysisResult, RawFileStructure
        
        prompt = self._build_raw_csv_analysis_prompt(lines, preview_text, filename, delimiter)
        
        try:
            gpt_response = await self._call_gpt5_api(prompt)
            return self._parse_raw_analysis_response(gpt_response, [preview_text])
        except Exception as e:
            logger.error(f"GPT-5 raw CSV analysis failed: {str(e)}")
            return self._fallback_raw_analysis("csv", [filename], [preview_text])
    
    def _build_raw_excel_analysis_prompt(self, sheet_names: List[str], sheet_previews: Dict[str, str], filename: str) -> str:
        """Build GPT-5 prompt for raw Excel analysis"""
        return f"""
You are a German accounting expert analyzing raw Excel file structure BEFORE processing.

FILENAME: {filename}
AVAILABLE SHEETS: {', '.join(sheet_names)}

SHEET PREVIEWS:
{chr(10).join([f"Sheet: {name}{chr(10)}{preview[:2000]}" for name, preview in sheet_previews.items()])}

ANALYSIS TASKS:
1. SELECT BEST SHEET: Which sheet contains the main accounting data?
2. DETECT HEADERS: What row number contains the column headers?
3. FIND DATA START: What row number does the actual data start?
4. COLUMN MAPPING: Map columns to these types:
   - account_number (Konto/Sachkonto)
   - account_description (Bezeichnung/Beschreibung)
   - amounts (Beträge/Saldo)
   - periods (Monate/Perioden)
5. PATTERN DETECTION: Identify German accounting patterns (SKR03, SKR04, BWA)

GERMAN ACCOUNTING CONTEXT:
- Trial Balance (Saldenliste/Summen- und Saldenliste)
- P&L (BWA/Gewinn- und Verlustrechnung)
- Balance Sheet (Bilanz)
- Common account ranges: 1000-1999 (Assets), 2000-2999 (Liabilities), 4000-7999 (P&L)

Return JSON:
{{
  "recommended_sheet": "sheet_name",
  "header_row": row_number,
  "data_start_row": row_number,
  "column_hints": {{"column_name": "type"}},
  "detected_patterns": ["pattern1", "pattern2"],
  "confidence": 0.0-1.0,
  "recommendations": ["recommendation1", "recommendation2"]
}}
"""
    
    def _build_raw_csv_analysis_prompt(self, lines: List[str], preview_text: str, filename: str, delimiter: str) -> str:
        """Build GPT-5 prompt for raw CSV analysis"""
        first_10_lines = '\n'.join(lines[:10])
        return f"""
You are a German accounting expert analyzing raw CSV file structure BEFORE processing.

FILENAME: {filename}
DELIMITER: "{delimiter}"

FIRST 10 LINES:
{first_10_lines}

FULL PREVIEW:
{preview_text[:2000]}

ANALYSIS TASKS:
1. DETECT HEADERS: What row number (0-based) contains the column headers?
2. FIND DATA START: What row number does the actual data start?
3. COLUMN MAPPING: Map columns to these types:
   - account_number (Konto/Sachkonto)
   - account_description (Bezeichnung/Beschreibung)
   - amounts (Beträge/Saldo)
   - periods (Monate/Perioden)
4. PATTERN DETECTION: Identify German accounting patterns

GERMAN ACCOUNTING KEYWORDS:
- Account: Konto, Sachkonto, Kontonummer
- Description: Bezeichnung, Beschreibung, Kontobezeichnung
- Amount: Betrag, Saldo, Balance, Wert
- Debit/Credit: Soll, Haben, S, H

Return JSON:
{{
  "header_row": row_number,
  "data_start_row": row_number,
  "column_hints": {{"column_name": "type"}},
  "detected_patterns": ["pattern1", "pattern2"],
  "confidence": 0.0-1.0,
  "recommendations": ["recommendation1", "recommendation2"]
}}
"""
    
    def _parse_raw_analysis_response(self, gpt_response: str, content_preview: List[str]) -> 'RawAnalysisResult':
        """Parse GPT-5 response for raw analysis"""
        from .models import RawAnalysisResult, RawFileStructure
        
        try:
            analysis_data = json.loads(gpt_response)
            
            structure = RawFileStructure(
                recommended_sheet=analysis_data.get('recommended_sheet'),
                header_row=analysis_data.get('header_row'),
                data_start_row=analysis_data.get('data_start_row'),
                column_hints=analysis_data.get('column_hints', {}),
                detected_patterns=analysis_data.get('detected_patterns', []),
                confidence=analysis_data.get('confidence', 0.8),
                recommendations=analysis_data.get('recommendations', [])
            )
            
            return RawAnalysisResult(
                file_structure=structure,
                content_preview=content_preview,
                processing_hints={
                    "gpt5_analysis": True,
                    "analysis_timestamp": datetime.now().isoformat()
                },
                analysis_confidence=structure.confidence
            )
            
        except Exception as e:
            logger.error(f"Failed to parse GPT-5 raw analysis response: {str(e)}")
            return self._fallback_raw_analysis("unknown", [], content_preview)
    
    def _fallback_raw_analysis(self, file_type: str, identifiers: List[str], content_preview: List[str]) -> 'RawAnalysisResult':
        """Fallback raw analysis when GPT-5 fails"""
        from .models import RawAnalysisResult, RawFileStructure
        
        return RawAnalysisResult(
            file_structure=RawFileStructure(
                header_row=0 if file_type == "csv" else 1,
                data_start_row=1 if file_type == "csv" else 2,
                column_hints={},
                detected_patterns=[f'fallback_{file_type}'],
                confidence=0.5,
                recommendations=["Fallback analysis used - manual verification recommended"]
            ),
            content_preview=content_preview[:5],
            processing_hints={"fallback_mode": True},
            analysis_confidence=0.5
        )
    
    async def analyze_columns(
        self, 
        headers: List[str], 
        sample_data: List[Dict[str, Any]], 
        document_type: Optional[str] = None
    ) -> ColumnAnalysis:
        """Analyze column headers and sample data using GPT-5"""
        try:
            logger.info(f"Analyzing {len(headers)} columns with GPT-5 for document type: {document_type}")
            
            # Prepare prompt with sample data and German context
            prompt = self._build_analysis_prompt(headers, sample_data, document_type)
            
            # Call GPT-5 API
            response = await self._call_gpt5_api(prompt)
            
            # Parse and validate response
            analysis = self._parse_gpt5_response(response, headers)
            
            logger.info(f"GPT-5 analysis complete - confidence: {analysis.confidence:.2f}")
            return analysis
            
        except Exception as e:
            logger.error(f"GPT-5 column analysis failed: {str(e)}")
            # Fallback to enhanced pattern matching
            return self._fallback_analysis(headers, sample_data)
    
    async def infer_missing_descriptions(
        self, 
        account_numbers: List[str], 
        context: Optional[str] = None
    ) -> Dict[str, str]:
        """Use GPT-5 to infer account descriptions from account numbers"""
        try:
            prompt = f"""You are a German accounting expert. Based on these German account numbers, provide the most likely German account descriptions following SKR03/SKR04 standards.

Account Numbers: {account_numbers[:10]}  # Limit to avoid token limits
Context: {context or 'German chart of accounts'}

Return a JSON object mapping account numbers to descriptions:
{{"27": "EDV-Software, entgeltl. erworben", "650": "Büroeinrichtung"}}

Focus on German accounting terminology and standard chart of accounts."""
            
            response = await self._call_gpt5_api(prompt, max_tokens=800)
            
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                logger.warning("GPT-5 description inference returned invalid JSON")
                return {}
                
        except Exception as e:
            logger.error(f"GPT-5 description inference failed: {str(e)}")
            return {}
    
    def _build_analysis_prompt(
        self, 
        headers: List[str], 
        sample_data: List[Dict[str, Any]], 
        document_type: Optional[str]
    ) -> str:
        """Build comprehensive analysis prompt for GPT-5"""
        sample_preview = json.dumps(sample_data[:3], indent=2, ensure_ascii=False)
        
        return f"""You are a German accounting expert specializing in trial balance and financial document analysis. Analyze these column headers and sample data to create an optimal mapping for a German accounting system.

DOCUMENT TYPE: {document_type or 'Unknown German accounting document'}
COLUMN HEADERS: {headers}

SAMPLE DATA:
{sample_preview}

GERMAN ACCOUNTING CONTEXT:
- Document types: Entwicklungsübersicht, BWA (Jahresübersicht), Summen und Salden, Wertenachweis
- Common German headers: Beschriftung, Bezeichnung, Zeilen-/Kontobezeichnung, Konto, EB-Wert, Saldo
- Amount formats: 7.216,28 (German), with S/H indicators for Soll/Haben
- Account numbers: Typically 2-4 digits (27, 650, 8337)

REQUIRED MAPPING TYPES:
- account_number: Account codes/numbers
- account_description: Account names/descriptions  
- amount: Monetary values
- debit_credit_indicator: S/H, Soll/Haben markers
- period: Date/period columns

Return JSON response:
{{
    "mapping": {{"original_header": "mapped_type"}},
    "confidence": 0.95,
    "alternatives": {{"mapped_type": ["alternative_header1", "alternative_header2"]}},
    "description_inference": {{"account_number": "inferred_description"}},
    "quality_score": 0.90,
    "recommendations": ["Human review suggested for...", "..."]
}}

CRITICAL: Focus on German terminology. "Beschriftung" = account_description, "Konto" = account_number."""
    
    async def _call_gpt5_api(self, prompt: str, max_tokens: int = 1500) -> str:
        """Call GPT-5 API with error handling"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-5-2025-08-07",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a German accounting expert with deep knowledge of trial balance formats, chart of accounts (SKR03/SKR04), and German financial reporting standards. Always provide accurate, structured JSON responses."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "max_completion_tokens": max_tokens
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"GPT-5 API error {response.status_code}: {response.text}")
                
                result = response.json()
                return result["choices"][0]["message"]["content"]
                
        except Exception as e:
            logger.error(f"GPT-5 API call failed: {str(e)}")
            raise
    
    def _parse_gpt5_response(self, response: str, headers: List[str]) -> ColumnAnalysis:
        """Parse and validate GPT-5 response"""
        try:
            # Extract JSON from response (GPT-5 might include explanation text)
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No JSON found in GPT-5 response")
            
            json_str = response[json_start:json_end]
            data = json.loads(json_str)
            
            return ColumnAnalysis(
                mapping=data.get('mapping', {}),
                confidence=min(1.0, max(0.0, data.get('confidence', 0.5))),
                alternatives=data.get('alternatives', {}),
                description_inference=data.get('description_inference', {}),
                quality_score=min(1.0, max(0.0, data.get('quality_score', 0.5))),
                recommendations=data.get('recommendations', [])
            )
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.warning(f"Failed to parse GPT-5 response: {str(e)}")
            return self._fallback_analysis(headers, [])
    
    def _fallback_analysis(self, headers: List[str], sample_data: List[Dict[str, Any]]) -> ColumnAnalysis:
        """Enhanced fallback analysis using pattern matching"""
        logger.info("Using enhanced pattern matching fallback")
        
        mapping = {}
        confidence_scores = {}
        
        for header in headers:
            header_lower = header.lower().strip()
            best_match = None
            best_score = 0
            
            # Enhanced pattern matching for German headers
            for field_type, patterns in self.german_patterns.items():
                if field_type == 'periods':
                    continue  # Skip regex patterns for simple matching
                    
                for pattern in patterns:
                    if pattern in header_lower:
                        score = len(pattern) / len(header_lower)  # Prefer exact matches
                        if score > best_score:
                            best_score = score
                            best_match = field_type
            
            if best_match and best_score > 0.3:
                mapping[header] = best_match
                confidence_scores[header] = best_score
        
        overall_confidence = sum(confidence_scores.values()) / len(headers) if headers else 0
        
        return ColumnAnalysis(
            mapping=mapping,
            confidence=overall_confidence,
            alternatives={},
            description_inference={},
            quality_score=overall_confidence * 0.8,  # Slightly lower for fallback
            recommendations=["GPT-5 analysis failed, using pattern matching fallback"]
        )