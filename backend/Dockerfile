FROM python:3.12-slim

WORKDIR /workspace

# Install system dependencies for EasyOCR (disabled to prevent Render mirror package resolution errors)
# RUN apt-get update || true && apt-get install -y --no-install-recommends \
#     libgl1-mesa-glx \
#     libglib2.0-0 \
#     libsm6 \
#     libxext6 \
#     libxrender-dev \
#     libgomp1 \
#     && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create storage directories
RUN mkdir -p /workspace/storage/uploads /workspace/storage/chromadb

# Set PYTHONPATH to ensure python finds the local app package first
ENV PYTHONPATH=/workspace

# Expose port
EXPOSE 8000

# Start server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
