# Deployment Guide: Docling + pandas Enhanced Processing

## 🚀 Quick Start

### 1. Local Development

```bash
# Start Python service
cd python-service
chmod +x scripts/*.sh
./scripts/start-dev.sh

# The service will be available at http://localhost:8000
```

### 2. Configure Supabase

Add environment variable in Supabase Dashboard:
- Go to Project Settings → Functions → Environment Variables
- Add: `PYTHON_SERVICE_URL` = `http://your-python-service-url:8000`

### 3. Test Integration

Upload a trial balance file through the UI - you should see "Enhanced Processing Used" indicator.

## 🐳 Docker Deployment

### Development
```bash
docker-compose -f docker-compose.yml -f python-service/docker-compose.dev.yml up
```

### Production
```bash
docker-compose up -d
```

## ☁️ Cloud Deployment Options

### 1. Railway
```bash
# Deploy Python service to Railway
railway login
railway new
railway up
```

### 2. Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/docling-pandas
gcloud run deploy --image gcr.io/PROJECT-ID/docling-pandas --platform managed
```

### 3. AWS ECS/Fargate
```bash
# Build and push to ECR
aws ecr create-repository --repository-name docling-pandas
docker build -t docling-pandas python-service/
docker tag docling-pandas:latest AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/docling-pandas:latest
docker push AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/docling-pandas:latest
```

## 🔧 Environment Variables

### Required
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key with storage access

### Optional
- `PYTHON_SERVICE_URL`: URL of Python service (for Supabase functions)
- `MAX_FILE_SIZE_MB`: Maximum file size (default: 20)
- `DEFAULT_CURRENCY`: Default currency code (default: EUR)
- `PANDAS_BACKEND`: pandas backend (default: pyarrow)

## 📊 Monitoring

### Health Checks
```bash
curl http://your-service/health
```

### Logs
```bash
# Docker logs
docker logs python-service

# Service logs
tail -f python-service/logs/app.log
```

## 🔒 Security

- Service runs as non-root user
- File size limits enforced
- Input validation on all endpoints
- Secure temporary file handling

## 🎯 Performance Tuning

### For Large Files
```bash
# Increase workers
WORKERS=8

# Enable parallel processing
DOCLING_PARALLEL_PROCESSING=true

# Use fast pandas backend
PANDAS_BACKEND=pyarrow
```

### For High Throughput
```bash
# Add Redis caching
REDIS_URL=redis://localhost:6379

# Increase file size limit
MAX_FILE_SIZE_MB=50
```