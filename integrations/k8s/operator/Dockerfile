FROM python:3.11-slim
WORKDIR /app
COPY controller.py /app/controller.py
ENV PYTHONUNBUFFERED=1
EXPOSE 8099
CMD ["python", "/app/controller.py"]

