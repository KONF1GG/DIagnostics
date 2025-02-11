
FROM python:3.10-slim

WORKDIR /app
COPY FastAPI/req.txt ./
RUN pip install --no-cache-dir -r req.txt
COPY FastAPI/app/ ./
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
