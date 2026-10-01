# Go Microservices

This folder contains all Go-based microservices for the CommerceHub platform.

## Technology Stack

- **Go 1.21+** (or latest stable version)
- **Gin** or **Echo** for HTTP framework
- **GORM** for ORM
- **Go Modules** for dependency management
- **PostgreSQL** for data persistence
- **Redis** for caching
- **NATS** or **RabbitMQ** for messaging

## Structure

Each microservice follows a clean architecture pattern:

```
service-name/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── internal/
│   ├── handler/                 # HTTP handlers
│   ├── service/                 # Business logic
│   ├── repository/              # Data access layer
│   ├── model/                   # Domain models
│   ├── dto/                     # Data transfer objects
│   ├── middleware/              # HTTP middleware
│   └── config/                  # Configuration
├── pkg/                         # Reusable packages
│   ├── logger/
│   ├── database/
│   └── validator/
├── migrations/                  # Database migrations
├── tests/                       # Integration tests
├── go.mod
├── go.sum
├── Dockerfile
├── Makefile
└── README.md
```

## Planned Services

### High-Performance Services
- **api-gateway**: High-performance API Gateway
- **rate-limiter**: Rate limiting service
- **caching-proxy**: Distributed caching proxy
- **message-broker**: Custom message broker/router

### Real-time Services
- **websocket-server**: WebSocket connection manager
- **event-stream**: Server-sent events service
- **notification-dispatcher**: Real-time notification dispatcher

### Utility Services
- **file-upload**: High-performance file upload service
- **image-processor**: Image optimization and processing
- **metrics-collector**: Custom metrics collection

## Getting Started

### Prerequisites
- Go 1.21 or later
- VS Code with Go extension or GoLand
- Docker Desktop
- Make (optional but recommended)

### Create a New Service

```bash
# Create service directory
mkdir service-name
cd service-name

# Initialize Go module
go mod init github.com/commercehub/service-name

# Create directory structure
mkdir -p cmd/api
mkdir -p internal/{handler,service,repository,model,dto,middleware,config}
mkdir -p pkg/{logger,database,validator}
mkdir -p migrations
mkdir -p tests

# Create main.go
cat > cmd/api/main.go << 'EOF'
package main

import (
    "log"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "status": "ok",
        })
    })
    
    if err := r.Run(":8080"); err != nil {
        log.Fatal(err)
    }
}
EOF
```

### Install Common Dependencies

```bash
# Web framework
go get -u github.com/gin-gonic/gin

# Database
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres

# Configuration
go get -u github.com/spf13/viper

# Validation
go get -u github.com/go-playground/validator/v10

# Redis
go get -u github.com/go-redis/redis/v8

# JWT
go get -u github.com/golang-jwt/jwt/v5

# Logging
go get -u go.uber.org/zap

# Testing
go get -u github.com/stretchr/testify
```

### Build and Run

```bash
# Build
go build -o bin/service-name cmd/api/main.go

# Run
./bin/service-name

# Run with hot reload (using air)
go install github.com/cosmtrek/air@latest
air

# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run tests with verbose output
go test -v ./...
```

## Makefile Example

```makefile
.PHONY: build run test clean docker-build docker-run

# Variables
APP_NAME=service-name
DOCKER_IMAGE=commercehub/$(APP_NAME)
VERSION?=latest

# Build the application
build:
	@echo "Building $(APP_NAME)..."
	@go build -o bin/$(APP_NAME) cmd/api/main.go

# Run the application
run:
	@echo "Running $(APP_NAME)..."
	@go run cmd/api/main.go

# Run tests
test:
	@echo "Running tests..."
	@go test -v -cover ./...

# Run tests with coverage report
test-coverage:
	@echo "Running tests with coverage..."
	@go test -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf bin/
	@rm -f coverage.out coverage.html

# Format code
fmt:
	@echo "Formatting code..."
	@go fmt ./...

# Lint code
lint:
	@echo "Linting code..."
	@golangci-lint run

# Tidy dependencies
tidy:
	@echo "Tidying dependencies..."
	@go mod tidy

# Build Docker image
docker-build:
	@echo "Building Docker image..."
	@docker build -t $(DOCKER_IMAGE):$(VERSION) .

# Run Docker container
docker-run:
	@echo "Running Docker container..."
	@docker run -p 8080:8080 $(DOCKER_IMAGE):$(VERSION)

# Start development environment
dev:
	@echo "Starting development environment..."
	@air
```

## Configuration Example

### config.yaml

```yaml
server:
  port: 8080
  mode: debug  # debug, release

database:
  host: localhost
  port: 5432
  user: postgres
  password: postgres123
  dbname: servicename_db
  sslmode: disable
  max_idle_conns: 10
  max_open_conns: 100

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0

jwt:
  secret: your-secret-key
  expiration: 24h

logging:
  level: info  # debug, info, warn, error
  format: json  # json, text
```

### Config Loader (internal/config/config.go)

```go
package config

import (
    "github.com/spf13/viper"
)

type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
    JWT      JWTConfig
    Logging  LoggingConfig
}

type ServerConfig struct {
    Port string
    Mode string
}

type DatabaseConfig struct {
    Host         string
    Port         int
    User         string
    Password     string
    DBName       string
    SSLMode      string
    MaxIdleConns int
    MaxOpenConns int
}

type RedisConfig struct {
    Host     string
    Port     int
    Password string
    DB       int
}

type JWTConfig struct {
    Secret     string
    Expiration string
}

type LoggingConfig struct {
    Level  string
    Format string
}

func Load() (*Config, error) {
    viper.SetConfigName("config")
    viper.SetConfigType("yaml")
    viper.AddConfigPath(".")
    viper.AddConfigPath("./configs")
    
    // Environment variables
    viper.AutomaticEnv()
    
    if err := viper.ReadInConfig(); err != nil {
        return nil, err
    }
    
    var config Config
    if err := viper.Unmarshal(&config); err != nil {
        return nil, err
    }
    
    return &config, nil
}
```

## Example Service Implementation

### Handler (internal/handler/product_handler.go)

```go
package handler

import (
    "net/http"
    "strconv"
    
    "github.com/gin-gonic/gin"
    "github.com/commercehub/service-name/internal/service"
    "github.com/commercehub/service-name/internal/dto"
)

type ProductHandler struct {
    productService service.ProductService
}

func NewProductHandler(productService service.ProductService) *ProductHandler {
    return &ProductHandler{
        productService: productService,
    }
}

func (h *ProductHandler) GetProduct(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
        return
    }
    
    product, err := h.productService.GetByID(c.Request.Context(), id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, product)
}

func (h *ProductHandler) CreateProduct(c *gin.Context) {
    var req dto.CreateProductRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    product, err := h.productService.Create(c.Request.Context(), &req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, product)
}

func (h *ProductHandler) ListProducts(c *gin.Context) {
    products, err := h.productService.List(c.Request.Context())
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, products)
}
```

## Docker Support

### Dockerfile (Multi-stage build)

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/api/main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/main .
COPY --from=builder /app/config.yaml .

EXPOSE 8080

CMD ["./main"]
```

## Testing Example

### Unit Test (internal/service/product_service_test.go)

```go
package service

import (
    "context"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "github.com/commercehub/service-name/internal/model"
)

type MockProductRepository struct {
    mock.Mock
}

func (m *MockProductRepository) FindByID(ctx context.Context, id uint64) (*model.Product, error) {
    args := m.Called(ctx, id)
    return args.Get(0).(*model.Product), args.Error(1)
}

func TestGetProductByID(t *testing.T) {
    mockRepo := new(MockProductRepository)
    service := NewProductService(mockRepo)
    
    expectedProduct := &model.Product{
        ID:   1,
        Name: "Test Product",
    }
    
    mockRepo.On("FindByID", mock.Anything, uint64(1)).Return(expectedProduct, nil)
    
    product, err := service.GetByID(context.Background(), 1)
    
    assert.NoError(t, err)
    assert.Equal(t, expectedProduct.Name, product.Name)
    mockRepo.AssertExpectations(t)
}
```

## Coding Standards

- Follow Go naming conventions (PascalCase for exported, camelCase for unexported)
- Use `gofmt` and `goimports` for formatting
- Write idiomatic Go code
- Handle errors explicitly
- Use context for cancellation and timeouts
- Write table-driven tests
- Use interfaces for dependency injection
- Document exported functions and types
- Keep packages small and focused

## Common Patterns

### Error Handling

```go
if err != nil {
    return fmt.Errorf("failed to fetch product: %w", err)
}
```

### Context Usage

```go
func (s *ProductService) GetByID(ctx context.Context, id uint64) (*model.Product, error) {
    // Use context for database queries
    return s.repo.FindByID(ctx, id)
}
```

### Dependency Injection

```go
type Server struct {
    router         *gin.Engine
    productHandler *handler.ProductHandler
    // other dependencies
}

func NewServer(productHandler *handler.ProductHandler) *Server {
    return &Server{
        router:         gin.Default(),
        productHandler: productHandler,
    }
}
```

## Resources

- [Go Documentation](https://go.dev/doc/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go by Example](https://gobyexample.com/)
- [Gin Web Framework](https://gin-gonic.com/)
- [GORM Documentation](https://gorm.io/)
- [Project Documentation](../../docs/)
