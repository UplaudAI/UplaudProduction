# Lightweight Python base
FROM python:3.10-slim

# Install system deps: chromium + chromedriver + fonts
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       chromium chromium-driver fonts-liberation wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set display env for chromium
ENV DISPLAY=:99 \
    CHROMIUM_FLAGS="--headless --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-software-rasterizer"

WORKDIR /app

# Install Python deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source
COPY . .

# Expose port for Cloud Run
ENV PORT=8000
EXPOSE 8000

# Entrypoint for FastAPI app in scripts/gmaps_scraper_all_in_one.py
CMD ["uvicorn", "scripts.gmaps_scraper_all_in_one:app", "--host", "0.0.0.0", "--port", "8000"]
