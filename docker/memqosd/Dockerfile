# Multi-stage build for CorridorOS memqosd daemon
FROM golang:1.21-alpine as builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy go mod files
COPY daemon/memqosd/go.mod daemon/memqosd/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY daemon/memqosd/main.go ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o memqosd .

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates curl

# Create non-root user
RUN addgroup -g 1001 corridoros && adduser -D -u 1001 -G corridoros corridoros

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/memqosd /usr/local/bin/memqosd

# Create necessary directories
RUN mkdir -p /var/lib/corridoros /etc/corridoros && \
    chown -R corridoros:corridoros /var/lib/corridoros /etc/corridoros

# Switch to non-root user
USER corridoros

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

# Run the application
CMD ["memqosd"]
