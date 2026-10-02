# E-Commerce Microservices Application - UI Specification

## Application Overview

This is a modern, full-featured e-commerce platform built with microservices architecture. The application enables customers to browse products, manage their shopping cart, place orders, make payments, track shipments, and leave reviews. Sellers can manage their product catalog and inventory, while administrators oversee the entire platform.

## User Roles

### 1. **Customer**
- Browse and search products
- View product details with images and videos
- Add items to shopping cart
- Apply coupons and promotions
- Checkout and make payments
- Track orders and shipments
- Leave product reviews and ratings
- Manage profile and addresses

### 2. **Seller**
- Manage product catalog
- Upload product media (images/videos)
- Create product variants (size, color, etc.)
- Manage inventory and stock levels
- Update product pricing
- View sales analytics
- Respond to customer reviews

### 3. **Admin**
- Manage categories and product catalog
- Manage users and permissions
- Create and manage promotions
- Monitor system health
- View analytics and reports
- Manage payment and shipping configurations

---

## Core Features & User Flows

### 1. Product Catalog

#### Product Listing Page
- **Layout**: Grid view with product cards
- **Product Card Components**:
  - Primary product image/video thumbnail
  - Product name and short description
  - Price (with sale price if applicable)
  - Rating stars with review count
  - "Add to Cart" button
  - "Quick View" button
  - Sale/Featured badge
  - Out of stock indicator
  
- **Filters Panel** (left sidebar):
  - Category tree (3 levels: Category → Subcategory → Sub-subcategory)
  - Price range slider
  - Tags/attributes (checkboxes)
  - Availability (In Stock, Out of Stock)
  - Rating filter (4+ stars, 3+ stars, etc.)
  
- **Sorting Options** (dropdown):
  - Relevance
  - Price: Low to High
  - Price: High to Low
  - Newest First
  - Best Selling
  - Top Rated
  
- **Search Bar** (top):
  - Auto-complete suggestions
  - Search by product name, SKU, tags

#### Product Detail Page
- **Media Gallery**:
  - Large primary image/video viewer
  - Thumbnail strip below (images and video thumbnails)
  - Zoom on hover for images
  - Video playback controls
  - Fullscreen option
  
- **Product Information**:
  - Product name (H1)
  - SKU
  - Rating stars with review count link
  - Price (base price, sale price if applicable)
  - Short description
  - Manufacturer info
  
- **Variant Selection**:
  - Dropdown/button group for each attribute (Size, Color, Material, etc.)
  - Price updates based on variant selection
  - Stock availability per variant
  
- **Actions**:
  - Quantity selector (- number +)
  - "Add to Cart" button (primary CTA)
  - "Add to Wishlist" button
  - "Share" button (social media icons)
  
- **Tabs Section**:
  - Description (full product details)
  - Specifications table
  - Reviews & Ratings (with write review form)
  - Shipping & Returns policy

---

### 2. Shopping Cart

#### Cart Page
- **Cart Items List**:
  - Each item row shows:
    - Product thumbnail
    - Product name (linked)
    - Selected variant attributes
    - Unit price
    - Quantity selector
    - Subtotal
    - Remove (X) button
    
- **Cart Summary** (right sidebar):
  - Subtotal
  - Coupon code input field with "Apply" button
  - Discount amount (if applied)
  - Estimated tax
  - Shipping estimate
  - **Total** (bold, large)
  - "Proceed to Checkout" button (primary CTA)
  - "Continue Shopping" link
  
- **Empty Cart State**:
  - Empty cart icon
  - "Your cart is empty" message
  - "Browse Products" button

---

### 3. Checkout Flow

#### Step 1: Shipping Address
- **Address Form**:
  - Full name
  - Phone number
  - Address line 1
  - Address line 2
  - City
  - State/Province dropdown
  - ZIP/Postal code
  - Country dropdown
  - "Save address" checkbox
  
- **Saved Addresses** (if user is logged in):
  - Radio button list of saved addresses
  - "Add New Address" option
  
- "Continue to Shipping Method" button

#### Step 2: Shipping Method
- **Shipping Options** (radio button list):
  - Standard Shipping (3-5 days) - $5.99
  - Express Shipping (1-2 days) - $12.99
  - Overnight Shipping (next day) - $24.99
  
- Order summary sidebar (sticky)
- "Continue to Payment" button

#### Step 3: Payment
- **Payment Method Selection** (radio buttons):
  - Credit/Debit Card
  - PayPal
  - Bank Transfer
  
- **Card Payment Form** (if card selected):
  - Card number
  - Cardholder name
  - Expiration date (MM/YY)
  - CVV
  - "Save card" checkbox
  
- **Order Summary** (sidebar):
  - Items list (collapsed)
  - Subtotal
  - Shipping
  - Tax
  - Discount
  - **Total**
  
- "Place Order" button (primary, large)

#### Order Confirmation Page
- **Success Icon** (checkmark in circle)
- "Thank you for your order!" heading
- Order number (large, bold)
- Estimated delivery date
- "View Order Details" button
- "Continue Shopping" button
- Email confirmation notice

---

### 4. Order Management

#### My Orders Page (Customer)
- **Orders List**:
  - Each order card shows:
    - Order number
    - Order date
    - Status badge (Pending, Processing, Shipped, Delivered, Cancelled)
    - Total amount
    - Item thumbnails (first 3 items)
    - "View Details" button
    - "Track Shipment" button (if shipped)
    
- **Filters**:
  - Status filter (All, Pending, Shipped, Delivered, Cancelled)
  - Date range picker
  
- **Search**: By order number

#### Order Details Page
- **Order Header**:
  - Order number
  - Order date
  - Status badge
  
- **Order Timeline**:
  - Visual stepper showing: Placed → Confirmed → Processing → Shipped → Delivered
  - Current status highlighted
  
- **Items List**:
  - Product thumbnail, name, variant, quantity, price
  
- **Shipping Address** card
- **Billing Address** card
- **Payment Information** card
- **Order Summary** (subtotal, shipping, tax, total)

- **Actions**:
  - "Track Shipment" button (if shipped)
  - "Cancel Order" button (if status allows)
  - "Download Invoice" button

---

### 5. Product Reviews

#### Reviews Section (on Product Detail Page)
- **Rating Summary**:
  - Average rating (large stars)
  - Total review count
  - Rating distribution (5 stars: 60%, 4 stars: 20%, etc.) with bar chart
  
- **Write Review Button**

- **Reviews List**:
  - Each review shows:
    - User name (or Anonymous)
    - Star rating
    - Review date
    - Review title
    - Review text
    - Helpful votes count
    - "Was this helpful?" with Yes/No buttons
  
- **Pagination** or "Load More" button

#### Write Review Modal/Form
- Product name and image
- Star rating selector (1-5 stars)
- Review title field
- Review text area
- "Submit Review" button

---

### 6. Seller Dashboard

#### Dashboard Home
- **Key Metrics Cards** (top row):
  - Total Products
  - Active Products
  - Out of Stock Items
  - Total Sales (this month)
  
- **Recent Orders Table**:
  - Order number, date, customer, items, status, total
  - Quick actions (view, process)
  
- **Low Stock Alerts**:
  - Products below threshold
  - Quick restock action

#### Product Management
- **Products Table**:
  - Columns: Image, Name, SKU, Category, Price, Stock, Status, Actions
  - Actions: Edit, Delete, Duplicate
  - Bulk actions: Activate, Deactivate, Delete
  
- **"Add New Product" Button** (primary, top right)

- **Filters**: Category, Status, Stock level

#### Add/Edit Product Form
- **Basic Information**:
  - Product name*
  - SKU*
  - Category dropdown (3 levels)*
  - Short description
  - Full description (rich text editor)
  - Manufacturer
  
- **Pricing**:
  - Base price*
  - Sale price
  - Cost price
  - Currency
  - Tax class
  
- **Media Gallery**:
  - Upload images/videos
  - Drag to reorder
  - Set primary image
  - Alt text for each media
  
- **Variants**:
  - "Add Variant" button
  - Variant attributes (size, color, etc.)
  - SKU per variant
  - Price adjustment per variant
  
- **Inventory** (per variant):
  - Stock quantity
  - Low stock threshold
  - Allow backorder checkbox
  
- **Dimensions & Weight**:
  - Weight (kg)
  - Length, Width, Height (cm)
  
- **SEO**:
  - Meta title
  - Meta description
  - Meta keywords
  - URL slug
  
- **Status**:
  - Draft / Active / Inactive (radio buttons)
  - Featured product checkbox
  - Publish date
  
- **Action Buttons**:
  - "Save Draft"
  - "Publish"
  - "Cancel"

#### Inventory Management
- **Stock Levels Table**:
  - Product name, SKU, Variant, Current Stock, Reserved, Available
  - Color coding (red for low stock, orange for medium, green for good)
  
- **Adjust Stock** action:
  - Modal with quantity adjustment (+/-)
  - Reason dropdown (Restock, Sale, Damaged, etc.)
  - Notes field

---

### 7. Admin Panel

#### Admin Dashboard
- **System Metrics** (cards):
  - Total Users (Customers, Sellers, Admins)
  - Total Orders (today, this week, this month)
  - Total Revenue
  - Active Products
  - Pending Reviews
  
- **Recent Activity Feed**:
  - Latest orders
  - New user registrations
  - New reviews
  - System alerts
  
- **Charts**:
  - Revenue over time (line chart)
  - Orders by status (pie chart)
  - Top selling products (bar chart)

#### Category Management
- **Category Tree View**:
  - Expandable tree showing 3 levels
  - Each node shows: Name, Slug, Product Count
  - Actions: Add Subcategory, Edit, Delete
  
- **Add/Edit Category Form**:
  - Name*
  - Slug (auto-generated from name)
  - Parent category (dropdown, for subcategories)
  - Description
  - Display order
  - Active checkbox

#### User Management
- **Users Table**:
  - Columns: Name, Email, Role, Status, Registration Date, Actions
  - Filters: Role, Status, Date range
  - Search: By name or email
  
- **Actions**:
  - View user details
  - Edit user
  - Activate/Deactivate
  - Change role
  - Delete

#### Promotions Management
- **Promotions List**:
  - Promo name, code, type, discount, start/end date, status
  - Actions: Edit, Activate, Deactivate, Delete
  
- **Create Promotion Form**:
  - Promotion name*
  - Promotion code*
  - Discount type (Percentage, Fixed Amount, Free Shipping)
  - Discount value*
  - Minimum order amount
  - Maximum discount cap
  - Start date & time*
  - End date & time*
  - Usage limit per customer
  - Total usage limit
  - Applicable to (All products, Specific categories, Specific products)
  - Active checkbox

---

## Design System & UI Guidelines

### Color Palette
- **Primary**: Deep navy (#0F172A) - Headers, footers, primary sections
- **Accent Cool**: Sky blue (#38BDF8) - Links, info badges
- **Accent Warm**: Orange (#F97316) - Primary CTAs, sale badges
- **Background**: Off-white (#F8FAFC) - Page background
- **Surface**: White (#FFFFFF) - Cards, modals
- **Border**: Slate (#E2E8F0) - Hairline borders
- **Text Primary**: Dark slate (#1E293B)
- **Text Secondary**: Gray (#64748B)

### Status Colors
- **Success**: Green (#10B981) - Delivered, Active, In Stock
- **Warning**: Amber (#F59E0B) - Low Stock, Processing
- **Danger**: Red (#EF4444) - Out of Stock, Cancelled, Error
- **Info**: Blue (#3B82F6) - Pending, Info messages

### Typography
- **Font Family**: Inter, Sora, or IBM Plex Sans
- **Headings**: 
  - H1: 32px, bold
  - H2: 24px, semibold
  - H3: 20px, semibold
  - H4: 18px, semibold
- **Body**: 16px, regular
- **Small**: 14px
- **Caption**: 12px
- **Monospace** (for SKU, codes): IBM Plex Mono

### Component Styles
- **Cards**: 8-12px border radius, subtle shadow, slate hairline border
- **Buttons**:
  - Primary: Orange background, white text, 8px radius
  - Secondary: White background, navy border, navy text
  - Ghost: Transparent, navy text
  - Height: 40px (medium), 48px (large)
  
- **Form Inputs**:
  - Height: 40px
  - Border: 1px slate
  - Border radius: 6px
  - Focus: Sky blue border
  
- **Badges**:
  - Border radius: 4px
  - Padding: 4px 8px
  - Uppercase text, 11px, semibold
  
- **Tables**:
  - Alternate row background
  - Sticky header
  - Hover row highlight
  - Clean borders

### Layout Principles
- **Max Content Width**: 1280px (centered)
- **Sidebar Width**: 280px (filters, navigation)
- **Grid**:
  - Product cards: 4 columns on desktop, 2 on tablet, 1 on mobile
  - Gap: 24px
- **Spacing Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- **Responsive Breakpoints**:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### Icons
- Use consistent icon library (Lucide, Heroicons, or Phosphor)
- Icon sizes: 16px, 20px, 24px
- Line style preferred over filled

---

## Navigation Structure

### Customer Header (Top Navigation)
- **Left**: Logo (linked to home)
- **Center**: Search bar (full width)
- **Right**:
  - Categories dropdown
  - Account dropdown (Profile, Orders, Wishlist, Logout)
  - Cart icon with item count badge
  
### Customer Footer
- **Column 1: About**
  - About Us
  - Contact Us
  - Careers
  
- **Column 2: Customer Service**
  - Help Center
  - Returns
  - Shipping Info
  - Track Order
  
- **Column 3: My Account**
  - Sign In
  - My Orders
  - Wishlist
  
- **Column 4: Follow Us**
  - Social media icons
  
- **Bottom Bar**: Copyright, Terms, Privacy Policy

### Seller Sidebar (Left Navigation)
- Dashboard
- Products
  - All Products
  - Add New Product
  - Categories
- Inventory
- Orders
- Analytics
- Settings

### Admin Sidebar (Left Navigation)
- Dashboard
- Catalog
  - Products
  - Categories
- Users
  - Customers
  - Sellers
  - Admins
- Orders
- Promotions
- Reviews
- Analytics
- System
  - Settings
  - Audit Logs
  - Health Monitor

---

## Key Interactions & States

### Product Card States
- **Default**: Standard appearance
- **Hover**: Slight lift shadow, "Quick View" appears
- **Out of Stock**: Grayed out, "Out of Stock" overlay
- **On Sale**: Sale badge, strikethrough original price

### Button States
- **Default**: Standard appearance
- **Hover**: Darker shade
- **Active/Pressed**: Even darker
- **Disabled**: Gray, cursor not-allowed
- **Loading**: Spinner inside button, disabled

### Form Validation
- **Real-time validation** on blur
- **Error state**: Red border, error message below field
- **Success state**: Green checkmark icon
- **Required fields**: Asterisk (*) in label

### Loading States
- **Page load**: Full-page skeleton screens
- **Component load**: Skeleton placeholders
- **Button action**: Spinner in button
- **Infinite scroll**: Loading indicator at bottom

### Empty States
- Friendly illustration or icon
- Clear message ("No items found", "Your cart is empty")
- Actionable CTA ("Browse Products", "Add Items")

---

## Mobile Considerations

### Mobile Navigation
- **Hamburger menu** for main navigation
- **Bottom tab bar** for key actions:
  - Home
  - Categories
  - Cart
  - Account

### Mobile Product Cards
- Single column layout
- Larger touch targets (min 44px)
- Simplified information

### Mobile Filters
- **Filter Button** opens bottom sheet/modal
- Sticky "Apply Filters" button at bottom

### Mobile Checkout
- One field per row
- Larger form inputs (48px height)
- Sticky "Continue" button at bottom
- Progress indicator at top

---

## Accessibility

- **Semantic HTML**: Use proper heading hierarchy, nav, main, footer, article tags
- **ARIA labels**: For icons, interactive elements without text
- **Keyboard navigation**: All interactive elements accessible via Tab
- **Focus indicators**: Visible focus states
- **Alt text**: For all images and media
- **Color contrast**: WCAG AA minimum (4.5:1 for text)
- **Screen reader friendly**: Announcements for dynamic content
- **Form labels**: Every input has associated label

---

## Performance & Best Practices

- **Image optimization**: WebP format, lazy loading, responsive images
- **Video**: Lazy load, show thumbnail first, adaptive bitrate
- **Infinite scroll** for long lists (with "Load More" fallback)
- **Skeleton screens** during data fetch
- **Optimistic UI updates**: Instant feedback before server response
- **Error boundaries**: Graceful error handling with retry options
- **Caching**: Cache product lists, categories in browser

---

## Microservices Integration Points

The UI interfaces with the following backend services:

1. **Identity Service**: Authentication, user profiles, permissions
2. **Product Catalog Service**: Products, categories, variants, media
3. **Cart Service**: Shopping cart operations
4. **Inventory Service**: Stock levels, availability
5. **Order Service**: Order creation, tracking, history
6. **Payment Service**: Payment processing, transaction status
7. **Shipping Service**: Shipping methods, tracking, delivery
8. **Notification Service**: Email/SMS notifications
9. **Review Service**: Product reviews and ratings
10. **Promotion Service**: Coupons, discounts, promotions
11. **API Gateway**: Single entry point, authentication, rate limiting

---

## Example User Flows

### Flow 1: Browse and Purchase
1. Customer lands on homepage
2. Clicks on category from mega menu
3. Views product grid, applies filters (price range, tags)
4. Clicks product card
5. Views product detail page with images/videos
6. Selects variant (size, color)
7. Clicks "Add to Cart"
8. Toast notification confirms addition
9. Continues shopping or goes to cart
10. In cart, applies coupon code
11. Proceeds to checkout
12. Enters/selects shipping address
13. Chooses shipping method
14. Enters payment details
15. Reviews order summary
16. Clicks "Place Order"
17. Sees order confirmation with order number

### Flow 2: Seller Adds Product
1. Seller logs in
2. Navigates to Products → Add New Product
3. Fills basic information (name, SKU, category, description)
4. Uploads product images and videos
5. Sets pricing (base price, sale price)
6. Adds variants (sizes: S, M, L; colors: Red, Blue)
7. Sets inventory for each variant
8. Enters dimensions and weight
9. Fills SEO fields
10. Sets status to "Active"
11. Clicks "Publish"
12. Product appears in catalog immediately

### Flow 3: Customer Leaves Review
1. Customer receives email after delivery
2. Clicks "Review Your Purchase"
3. Lands on order details page
4. Clicks "Write Review" next to product
5. Selects star rating (4 stars)
6. Enters review title and text
7. Clicks "Submit Review"
8. Review shows as "Pending" (awaits moderation)
9. After approval, review appears on product page

---

## Additional Features

### Wishlist
- Heart icon on product cards
- "My Wishlist" page showing saved products
- Move to cart action
- Share wishlist option

### Product Comparison
- "Compare" checkbox on product cards (up to 4)
- Comparison table showing specs side-by-side
- Highlighting differences

### Recently Viewed
- Horizontal carousel showing last 10 viewed products
- Appears on homepage and category pages

### Search Autocomplete
- Suggestions appear as user types
- Categories, products, popular searches
- Keyboard navigation (arrow keys, enter)

### Notifications Bell
- Icon in header with unread count badge
- Dropdown showing recent notifications
- Order updates, shipping alerts, promo announcements

### Multi-language Support (Future)
- Language selector in header
- RTL layout support for Arabic, Hebrew
- Localized content (product descriptions, UI labels)

### Multi-currency Support (Future)
- Currency selector in header
- Prices converted based on selection
- Stored in user preferences

---

## Error Handling

### Common Error Scenarios

**404 - Product Not Found**
- Page shows: "Product not found" message
- "Browse Similar Products" button
- Link to homepage

**Payment Failed**
- Error message with reason
- "Try Again" button
- "Choose Different Payment Method" option

**Out of Stock During Checkout**
- Modal: "Item X is now out of stock"
- Option to remove item or wait for restock
- "Update Cart" and "Continue" buttons

**Network Error**
- Retry automatically (3 attempts)
- Show error toast
- "Retry" button

**Form Validation Errors**
- Inline error messages
- Red border on invalid fields
- Scroll to first error
- Disable submit until resolved

---

## Success Patterns

### Toast Notifications
- **Success**: Green background, checkmark icon
  - "Product added to cart"
  - "Review submitted successfully"
  - "Order placed successfully"
  
- **Error**: Red background, X icon
  - "Failed to add item"
  - "Payment declined"
  
- **Info**: Blue background, info icon
  - "Item already in cart"
  - "Coupon applied"
  
- **Warning**: Amber background, warning icon
  - "Only 3 items left in stock"

### Confirmation Modals
- Used for destructive actions
- Clear title ("Delete Product?")
- Explanation text
- "Cancel" (secondary) and "Delete" (danger) buttons

---

## Data Display Patterns

### Tables (Admin/Seller)
- Sortable columns (click header)
- Row selection (checkboxes)
- Pagination (10, 25, 50, 100 per page)
- Export to CSV option
- Column visibility toggle

### Cards (User-facing)
- Consistent padding (16px)
- Shadow on hover
- Clear hierarchy (image → title → meta → actions)

### Lists
- Avatar/thumbnail on left
- Primary text (bold)
- Secondary text (smaller, gray)
- Action buttons on right
- Dividers between items

---

This specification provides a comprehensive foundation for UI generation. Focus on clean, modern design with excellent usability, clear visual hierarchy, and consistent patterns throughout the application.
