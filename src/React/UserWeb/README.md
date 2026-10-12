# CommerceHub - User Web Application

E-commerce customer-facing web application built with React, TypeScript, and Vite.

## Features

- 🏠 Home page with hero section and featured products
- 🛍️ Product catalog with search and filtering
- 🛒 Shopping cart management
- 💳 Checkout process
- 📦 Order tracking
- 👤 User authentication (login/register)
- 📱 Responsive design
- 🎨 Modern UI with production-ready design system

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Header.tsx
│   └── Footer.tsx
├── layouts/          # Layout components
│   └── MainLayout.tsx
├── pages/            # Page components
│   ├── HomePage.tsx
│   ├── ProductListPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CartPage.tsx
│   ├── CheckoutPage.tsx
│   ├── OrderConfirmationPage.tsx
│   ├── MyOrdersPage.tsx
│   ├── OrderDetailPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── MyAccountPage.tsx
│   └── NotFoundPage.tsx
├── services/         # API service layer
│   ├── api.service.ts
│   ├── auth.service.ts
│   ├── product.service.ts
│   ├── cart.service.ts
│   ├── order.service.ts
│   └── review.service.ts
├── hooks/            # Custom React hooks
│   ├── useAuth.ts
│   └── useCart.ts
├── utils/            # Utility functions
│   └── helpers.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── App.tsx           # Main app component with routes
├── App.css           # Global styles
└── main.tsx          # Entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd src/React/UserWeb
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Design System

The application uses a modern design system with:

- **Colors**: Deep navy primary (#0F172A), cyan accent (#22D3EE), orange CTA (#F97316)
- **Typography**: Inter font family
- **Spacing**: Consistent spacing scale (4px - 64px)
- **Components**: Reusable styled components with hover states and transitions

## API Integration

The app connects to the backend microservices via a REST API:

- **Product Catalog Service** - Product data, categories, variants
- **User Service** - Authentication, user profiles, addresses
- **Cart Service** - Shopping cart operations
- **Order Service** - Order creation and tracking
- **Payment Service** - Payment processing
- **Review Service** - Product reviews and ratings

## Features Implementation Status

- ✅ Project setup and structure
- ✅ Routing configuration
- ✅ Layout components (Header, Footer)
- ✅ Home page with hero and featured products
- ✅ Authentication pages (Login, Register)
- ✅ Service layer with API integration
- ✅ Custom hooks (useAuth, useCart)
- ✅ Utility functions
- ⏳ Product listing with filters (placeholder)
- ⏳ Product detail page (placeholder)
- ⏳ Shopping cart (placeholder)
- ⏳ Checkout flow (placeholder)
- ⏳ Order management (placeholder)
- ⏳ User account pages (placeholder)

## Next Steps

1. Implement product listing page with filters and search
2. Build product detail page with image gallery and variants
3. Create shopping cart functionality
4. Implement checkout process
5. Add order tracking and history
6. Complete user account management
7. Add product reviews and ratings
8. Implement promotional banners and deals
9. Add loading states and error handling
10. Implement responsive design improvements

## Contributing

This is part of the CommerceHub microservices e-commerce platform.

## License

MIT
