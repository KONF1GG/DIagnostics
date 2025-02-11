
FROM python:3.10-slim

WORKDIR /app
COPY FastAPI/req.txt ./
RUN pip install --no-cache-dir -r req.txt
COPY FastAPI/app/ ./

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
