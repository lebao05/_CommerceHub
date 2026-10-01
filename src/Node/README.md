# Node.js Microservices

This folder contains all Node.js-based microservices for the CommerceHub platform.

## Technology Stack

- **Node.js 20+** (LTS version)
- **TypeScript** for type safety
- **Express.js** or **Fastify** for HTTP framework
- **Prisma** or **TypeORM** for ORM
- **npm** or **yarn** for package management
- **PostgreSQL** or **MongoDB** for data persistence
- **Redis** for caching
- **Bull** or **BullMQ** for job queues

## Structure

Each microservice follows a layered architecture:

```
service-name/
├── src/
│   ├── controllers/         # HTTP request handlers
│   ├── services/            # Business logic
│   ├── repositories/        # Data access layer
│   ├── models/              # Data models/entities
│   ├── dtos/                # Data transfer objects
│   ├── middlewares/         # Express/Fastify middleware
│   ├── routes/              # Route definitions
│   ├── config/              # Configuration
│   ├── utils/               # Utility functions
│   └── app.ts               # Application setup
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
├── prisma/                  # Prisma schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
└── README.md
```

## Planned Services

### API Services
- **user**: User management and profiles
- **cart**: Shopping cart service
- **wishlist**: User wishlist management
- **notification**: Real-time notifications (email, SMS, push)

### Integration Services
- **payment-gateway**: Payment provider integrations
- **email**: Email service with templates
- **sms**: SMS gateway integration
- **webhook**: Webhook handler and dispatcher

### Utility Services
- **logger**: Centralized logging service
- **audit**: Audit trail and activity logging
- **scheduler**: Job scheduling service

## Getting Started

### Prerequisites
- Node.js 20+ (LTS)
- npm 10+ or yarn 1.22+
- VS Code with TypeScript extension
- Docker Desktop

### Create a New Service

```bash
# Create service directory
mkdir service-name
cd service-name

# Initialize npm project
npm init -y

# Install TypeScript
npm install -D typescript @types/node ts-node nodemon
npx tsc --init

# Install Express and types
npm install express
npm install -D @types/express

# Install common dependencies
npm install dotenv cors helmet compression morgan
npm install -D @types/cors

# Create directory structure
mkdir -p src/{controllers,services,repositories,models,dtos,middlewares,routes,config,utils}
mkdir -p tests/{unit,integration,e2e}
```

### Package.json Scripts

```json
{
  "name": "service-name",
  "version": "1.0.0",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "ioredis": "^5.3.2",
    "bull": "^4.12.0",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.5",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/morgan": "^1.9.9",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2",
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "prettier": "^3.1.1"
  }
}
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Example Application Setup (src/app.ts)

```typescript
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

### Example Controller

```typescript
// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData = req.body;
      const user = await this.userService.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
```

### Environment Variables (.env.example)

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/servicename_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# External Services
EMAIL_API_KEY=
SMS_API_KEY=

# Logging
LOG_LEVEL=info
```

## Prisma Setup

### Install Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

### Example Prisma Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

## Docker Support

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres123@db:5432/servicename_db
      - REDIS_HOST=redis
      - NODE_ENV=production
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres123
      - POSTGRES_DB=servicename_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Testing

### Jest Configuration (jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
```

### Example Test

```typescript
// tests/unit/user.service.test.ts
import { UserService } from '../../src/services/user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should create a user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123'
    };

    const user = await userService.createUser(userData);
    expect(user.email).toBe(userData.email);
  });
});
```

## Coding Standards

- Use TypeScript for type safety
- Follow naming conventions (camelCase for variables/functions, PascalCase for classes)
- Use async/await over callbacks
- Implement proper error handling
- Write unit tests for business logic
- Use dependency injection
- Document complex functions with JSDoc
- Use ESLint and Prettier for code formatting

## Common Packages

### Core
- `express` - Web framework
- `fastify` - Alternative high-performance framework
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `helmet` - Security headers

### Database
- `@prisma/client` - Prisma ORM
- `typeorm` - Alternative ORM
- `mongoose` - MongoDB ODM
- `pg` - PostgreSQL client

### Caching & Queues
- `ioredis` - Redis client
- `bull` / `bullmq` - Job queues

### Validation & Security
- `joi` - Schema validation
- `class-validator` - Decorator-based validation
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing

### Logging & Monitoring
- `winston` - Logging
- `pino` - Fast JSON logger
- `morgan` - HTTP request logger

### Testing
- `jest` - Testing framework
- `supertest` - HTTP testing
- `@faker-js/faker` - Test data generation

## Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Project Documentation](../../docs/)
