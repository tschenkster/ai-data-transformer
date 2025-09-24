import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test basic health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_docling_processor_init():
    """Test Docling processor initialization"""
    from app.docling_processor import DoclingProcessor
    
    processor = DoclingProcessor()
    assert processor is not None
    assert processor.converter is not None

def test_pandas_analyzer_init():
    """Test pandas analyzer initialization"""
    from app.pandas_analyzer import PandasAnalyzer
    
    analyzer = PandasAnalyzer()
    assert analyzer is not None
    assert analyzer.decimal_separators == ['.', ',']

def test_file_detector_init():
    """Test file detector initialization"""
    from app.utils.file_detector import FileDetector
    
    detector = FileDetector()
    assert detector is not None
    assert 'application/pdf' in detector.mime_type_mapping

@pytest.mark.asyncio
async def test_file_type_detection():
    """Test file type detection with sample data"""
    from app.utils.file_detector import FileDetector
    
    detector = FileDetector()
    
    # Test PDF detection
    pdf_content = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog'
    file_type = await detector.detect_file_type(pdf_content, 'test.pdf')
    assert file_type == 'pdf'
    
    # Test CSV detection
    csv_content = b'Account,Description\n1000,Cash\n2000,Accounts Receivable'
    file_type = await detector.detect_file_type(csv_content, 'test.csv')
    assert file_type == 'csv'

def test_german_amount_parsing():
    """Test German accounting amount format parsing"""
    from app.utils.normalizer import DataNormalizer
    
    normalizer = DataNormalizer()
    
    # Test German format: 1.234,56
    assert normalizer.normalize_amount("1.234,56") == 1234.56
    
    # Test negative in parentheses: (1.234,56)
    assert normalizer.normalize_amount("(1.234,56)") == -1234.56
    
    # Test standard format: 1234.56
    assert normalizer.normalize_amount("1234.56") == 1234.56

def test_account_number_validation():
    """Test account number normalization"""
    from app.utils.normalizer import DataNormalizer
    
    normalizer = DataNormalizer()
    
    # Valid account numbers
    assert normalizer.normalize_account_number("1000") == "1000"
    assert normalizer.normalize_account_number("1000A") == "1000A"
    assert normalizer.normalize_account_number("A1000") == "A1000"
    
    # Invalid account numbers
    assert normalizer.normalize_account_number("") is None
    assert normalizer.normalize_account_number("x") is None
    assert normalizer.normalize_account_number("12345678901234567890123") is None

if __name__ == "__main__":
    pytest.main([__file__])