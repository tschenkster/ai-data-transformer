# Docling + pandas Integration for Enhanced Trial Balance Processing

This implementation provides advanced document processing capabilities using **Docling** for PDF table extraction and **pandas** for comprehensive data analysis and normalization.

## 🚀 Features

### Enhanced Processing Capabilities
- **Advanced PDF Processing**: Docling-powered table detection and extraction with OCR support
- **Intelligent Data Normalization**: pandas-based data cleaning with German accounting format support
- **Comprehensive Validation**: Multi-layer data validation with business rule checking
- **Quality Analysis**: Detailed data quality scoring and recommendations
- **Fallback Support**: Automatic fallback to legacy processing if enhanced processing fails

### Supported File Formats
- **PDF**: Advanced table extraction with layout analysis
- **XLSX/XLS**: Enhanced Excel processing with multi-sheet support
- **CSV**: Intelligent delimiter detection and encoding handling

## 🏗️ Architecture

```
Frontend (React/TypeScript)
    ↓
Supabase Edge Functions
    ↓
Python Service (FastAPI)
    ├── Docling (PDF Processing)
    ├── pandas (Data Analysis)
    ├── Validation Engine
    └── Quality Assessment
    ↓
Supabase (Storage + Database)
```

## 📦 Installation & Setup

### 1. Python Service Setup

```bash
cd python-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration
```

### 2. Environment Configuration

Create `.env` file in `python-service/` directory:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Service Configuration
ENVIRONMENT=development
MAX_FILE_SIZE_MB=20
DEFAULT_CURRENCY=EUR
DEFAULT_LOCALE=de_DE

# Processing Options
PANDAS_BACKEND=pyarrow
DOCLING_PARALLEL_PROCESSING=true
ENABLE_OCR=true
```

### 3. Supabase Edge Function Configuration

Add the Python service URL to your Supabase environment variables:

```bash
# In Supabase Dashboard -> Settings -> Functions -> Environment Variables
PYTHON_SERVICE_URL=http://your-python-service:8000
```

## 🚀 Deployment

### Development Mode

```bash
# Start Python service
cd python-service
./scripts/start-dev.sh

# Or use Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production Mode

```bash
# Using Docker Compose
docker-compose up -d

# Or manual deployment
cd python-service
./scripts/start-prod.sh
```

## 🧪 Testing

```bash
cd python-service
./scripts/test.sh

# Or run specific test categories
pytest tests/unit/ -v
pytest tests/integration/ -v
```

## 📊 Processing Workflow

### 1. File Upload & Detection
- File uploaded to Supabase Storage
- Edge function determines processing method (enhanced vs legacy)
- Python service performs file type detection using magic bytes

### 2. Enhanced Processing Pipeline

#### PDF Processing (Docling)
```python
# Advanced table extraction
converter = DocumentConverter()
result = converter.convert(pdf_file)
tables = extract_tables_from_pages(result.document.pages)
```

#### Data Analysis (pandas)
```python
# German accounting format support
df = pd.read_excel(file, dtype_backend="pyarrow")
normalized_data = normalize_german_accounting_data(df)
quality_report = generate_quality_analysis(normalized_data)
```

### 3. Validation & Quality Assessment
- Field-level validation (account numbers, amounts, dates)
- Business rule validation (duplicates, consistency)
- Trial balance specific checks (account distribution, balance validation)
- Comprehensive quality scoring

### 4. Response & Persistence
- Structured response with processing metadata
- Optional database persistence
- Downloadable processed data
- Audit trail maintenance

## 🔧 Configuration Options

### Processing Behavior
```python
# pandas Configuration
PANDAS_BACKEND = "pyarrow"  # Use Arrow for better performance
DECIMAL_SEPARATORS = ['.', ',']  # German accounting support
NEGATIVE_PATTERNS = ['(amount)', 'amount CR', '-amount']

# Docling Configuration
ENABLE_OCR = True  # OCR for scanned PDFs
ENABLE_TABLE_STRUCTURE = True  # Advanced table detection
PARALLEL_PROCESSING = True  # Multi-threaded processing
```

### Validation Rules
```python
# Account Number Validation
ACCOUNT_PATTERNS = [
    r'^[0-9]{3,8}$',           # Pure numeric
    r'^[0-9]{1,4}[A-Za-z]{1,3}$',  # Mixed format
    r'^[A-Za-z]{1,3}[0-9]{1,6}$'   # Letter prefix
]

# Amount Validation
MAX_AMOUNT = 1e12  # Maximum reasonable amount
MIN_ACCOUNTS = 5   # Minimum accounts for trial balance
```

## 📈 Performance & Monitoring

### Metrics Tracked
- Processing time per file type
- Success/failure rates by processing method
- Data quality scores over time
- File characteristics distribution

### Health Checks
```bash
# Service health
curl http://localhost:8000/health

# Processing capability test
curl -X POST http://localhost:8000/analyze-file \
  -F "file=@sample.pdf"
```

## 🔍 Troubleshooting

### Common Issues

1. **Python Service Connection Failed**
   - Check `PYTHON_SERVICE_URL` environment variable
   - Verify service is running: `curl http://service:8000/health`
   - Review service logs: `docker logs python-service`

2. **PDF Processing Issues**
   - Ensure Docling dependencies are installed
   - Check file permissions and temporary directory access
   - Review OCR settings for scanned documents

3. **Data Quality Issues**
   - Review validation results in processing response
   - Check German accounting format settings
   - Verify column mapping detection

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Run with detailed output
uvicorn app.main:app --log-level debug
```

## 🔒 Security Considerations

- File size limits enforced (20MB default)
- File type validation using magic bytes
- Input sanitization for all user data
- Secure temporary file handling
- Service-to-service authentication via Supabase

## 📚 API Documentation

### Enhanced Processing Endpoint
```http
POST /process-file
Content-Type: multipart/form-data

Form Data:
- file: (binary) File to process
- entity_uuid: (string) Entity identifier
- persist_to_database: (boolean) Save to database flag
```

### Response Format
```json
{
  "success": true,
  "enhanced_processing": true,
  "data": [...],
  "row_count": 150,
  "characteristics": {
    "file_type": "pdf",
    "content_type": "trial_balance",
    "confidence_score": 0.95
  },
  "validation_results": {
    "is_valid": true,
    "validation_score": 87
  },
  "quality_report": {
    "overall_score": 0.89,
    "completeness_score": 0.92,
    "consistency_score": 0.88,
    "accuracy_score": 0.87
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/enhanced-validation`)
3. Add tests for new functionality
4. Ensure all tests pass (`./scripts/test.sh`)
5. Submit pull request

## 📄 License

This enhanced processing system is part of the main project and follows the same licensing terms.