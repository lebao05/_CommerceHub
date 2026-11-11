export const metrics = [
  { id: 'users', label: 'Total Users', value: '24,318', delta: '+3.2% this week', tone: 'info' },
  { id: 'orders', label: 'Total Orders (month)', value: '8,412', delta: '+12.4% vs last month', tone: 'success' },
  { id: 'revenue', label: 'Total Revenue', value: '$482,900', delta: '+8.1% vs last month', tone: 'success' },
  { id: 'products', label: 'Active Products', value: '3,204', delta: '128 pending approval', tone: 'warning' },
];

export const revenueSeries = [
  { month: 'Jun', revenue: 32000 },
  { month: 'Jul', revenue: 41000 },
  { month: 'Aug', revenue: 38000 },
  { month: 'Sep', revenue: 52000 },
  { month: 'Oct', revenue: 61000 },
  { month: 'Nov', revenue: 74000 },
];

export const ordersByStatus = [
  { label: 'Delivered', value: 4210, color: '#10B981' },
  { label: 'Shipped', value: 1820, color: '#3B82F6' },
  { label: 'Processing', value: 940, color: '#F59E0B' },
  { label: 'Pending', value: 610, color: '#38BDF8' },
  { label: 'Cancelled', value: 320, color: '#EF4444' },
];

export const topProducts = [
  { name: 'Aurora Wireless Headphones', sold: 1240, revenue: '$148,800' },
  { name: 'Terra Trail Backpack 35L', sold: 980, revenue: '$88,200' },
  { name: 'Lumen Desk Lamp Pro', sold: 870, revenue: '$60,900' },
  { name: 'Pulse Smart Watch S2', sold: 760, revenue: '$152,000' },
  { name: 'Drift Ceramic Vase Set', sold: 640, revenue: '$25,600' },
];

export const activityFeed = [
  { id: 1, text: 'Order #ORD-90412 placed by Amara Chen — $212.40', time: '2 min ago', tone: 'info' },
  { id: 2, text: 'New seller registered: Northwind Supply Co.', time: '18 min ago', tone: 'success' },
  { id: 4, text: 'Payment.Service error rate 1.8% (threshold 1%)', time: '1 hr ago', tone: 'danger' },
  { id: 5, text: 'Promotion “FALL20” reached 80% of usage limit', time: '3 hr ago', tone: 'warning' },
];

export const categories = [
  {
    id: 'cat-electronics', name: 'Electronics', slug: 'electronics', count: 1240, active: true,
    children: [
      { id: 'cat-audio', name: 'Audio', slug: 'audio', count: 420, active: true, children: [] },
      { id: 'cat-headphones', name: 'Headphones', slug: 'headphones', count: 180, active: true, children: [] },
      { id: 'cat-speakers', name: 'Speakers', slug: 'speakers', count: 240, active: true, children: [] },
      { id: 'cat-wearables', name: 'Wearables', slug: 'wearables', count: 310, active: true, children: [] },
      { id: 'cat-smartwatches', name: 'Smartwatches', slug: 'smartwatches', count: 190, active: true, children: [] },
    ],
  },
  {
    id: 'cat-home', name: 'Home & Living', slug: 'home-living', count: 860, active: true,
    children: [
      { id: 'cat-lighting', name: 'Lighting', slug: 'lighting', count: 300, active: false, children: [] },
      { id: 'cat-lamps', name: 'Lamps', slug: 'lamps', count: 140, active: true, children: [] },
    ],
  },
  {
    id: 'cat-outdoor', name: 'Outdoor', slug: 'outdoor', count: 410, active: true, children: [],
  },
];

export const products = [
  { id: 'p1', name: 'Aurora Wireless Headphones', sku: 'AUR-WH-001', category: 'Electronics / Audio', price: 129.99, stock: 240, status: 'Active', featured: true, seller: 'SoundLab' },
  { id: 'p2', name: 'Pulse Smart Watch S2', sku: 'PLS-SW-S2', category: 'Electronics / Wearables', price: 199.0, stock: 0, status: 'Active', featured: true, seller: 'PulseTech' },
  { id: 'p3', name: 'Terra Trail Backpack 35L', sku: 'TER-BP-35', category: 'Outdoor', price: 89.5, stock: 18, status: 'Active', featured: false, seller: 'Northwind' },
  { id: 'p4', name: 'Lumen Desk Lamp Pro', sku: 'LUM-DL-PRO', category: 'Home & Living / Lighting', price: 69.99, stock: 320, status: 'Draft', featured: false, seller: 'BrightNest' },
  { id: 'p5', name: 'Drift Ceramic Vase Set', sku: 'DRF-VS-03', category: 'Home & Living', price: 39.99, stock: 12, status: 'Pending', featured: false, seller: 'KilnWorks' },
  { id: 'p6', name: 'Nimbus Mechanical Keyboard', sku: 'NIM-KB-75', category: 'Electronics', price: 149.0, stock: 64, status: 'Inactive', featured: false, seller: 'KeyForge' },
];

export const orders = [
  { id: 'ORD-90412', userId: 'u1', date: '2026-11-11', customer: 'Amara Chen', items: 3, total: 212.4, status: 'Processing', payment: 'Card' },
  { id: 'ORD-90411', userId: 'u6', date: '2026-11-11', customer: 'Liam Ortiz', items: 1, total: 199.0, status: 'Pending', payment: 'PayPal' },
  { id: 'ORD-90402', userId: 'u7', date: '2026-11-10', customer: 'Sofia Reyes', items: 2, total: 98.5, status: 'Shipped', payment: 'Card' },
  { id: 'ORD-90388', userId: 'u8', date: '2026-11-09', customer: 'Noah Kim', items: 4, total: 342.2, status: 'Delivered', payment: 'Bank Transfer' },
  { id: 'ORD-90377', userId: 'u9', date: '2026-11-08', customer: 'Mia Patel', items: 1, total: 69.99, status: 'Cancelled', payment: 'Card' },
  { id: 'ORD-90365', userId: 'u10', date: '2026-11-07', customer: 'Ethan Wright', items: 2, total: 178.0, status: 'Delivered', payment: 'Card' },
  { id: 'ORD-90359', userId: 'u1', date: '2026-11-05', customer: 'Amara Chen', items: 2, total: 129.99, status: 'Delivered', payment: 'Card' },
  { id: 'ORD-90351', userId: 'u3', date: '2026-11-03', customer: 'Priya Nair', items: 1, total: 89.5, status: 'Delivered', payment: 'PayPal' },
];

export const users = [
  { id: 'u1', name: 'Amara Chen', email: 'amara@example.com', phone: '+1 415-555-0132', location: 'San Francisco, US', role: 'Customer', status: 'Active', joined: '2026-02-14', lastLogin: '2026-11-11 08:42', addresses: [{ label: 'Home', line: '428 Market St, Apt 12', city: 'San Francisco, CA 94105', isDefault: true }, { label: 'Office', line: '1 Hacker Way', city: 'Menlo Park, CA 94025', isDefault: false }] },
  { id: 'u3', name: 'Priya Nair', email: 'priya@example.com', phone: '+91 98200 11223', location: 'Mumbai, IN', role: 'Customer', status: 'Inactive', joined: '2025-12-20', lastLogin: '2026-10-28 14:05', addresses: [{ label: 'Home', line: '14 Linking Rd, Bandra West', city: 'Mumbai 400050', isDefault: true }] },
  { id: 'u6', name: 'Liam Ortiz', email: 'liam@example.com', phone: '+1 212-555-0176', location: 'New York, US', role: 'Customer', status: 'Active', joined: '2026-03-02', lastLogin: '2026-11-11 07:15', addresses: [{ label: 'Home', line: '88 Grand St', city: 'New York, NY 10013', isDefault: true }] },
  { id: 'u7', name: 'Sofia Reyes', email: 'sofia@example.com', phone: '+34 600 123 456', location: 'Madrid, ES', role: 'Customer', status: 'Active', joined: '2026-04-19', lastLogin: '2026-11-10 19:31', addresses: [{ label: 'Home', line: 'Calle Mayor 24, 2B', city: '28013 Madrid', isDefault: true }] },
  { id: 'u8', name: 'Noah Kim', email: 'noah@example.com', phone: '+82 10-5555-8899', location: 'Seoul, KR', role: 'Customer', status: 'Active', joined: '2026-01-11', lastLogin: '2026-11-09 22:02', addresses: [{ label: 'Home', line: '12 Teheran-ro, Gangnam-gu', city: 'Seoul', isDefault: true }] },
  { id: 'u9', name: 'Mia Patel', email: 'mia@example.com', phone: '+44 7700 900123', location: 'London, UK', role: 'Customer', status: 'Active', joined: '2026-06-30', lastLogin: '2026-11-08 11:47', addresses: [{ label: 'Home', line: '21 Baker Street', city: 'London NW1', isDefault: true }] },
  { id: 'u10', name: 'Ethan Wright', email: 'ethan@example.com', phone: '+1 312-555-0148', location: 'Chicago, US', role: 'Customer', status: 'Active', joined: '2025-11-05', lastLogin: '2026-11-07 16:20', addresses: [{ label: 'Home', line: '500 W Madison St', city: 'Chicago, IL 60661', isDefault: true }] },
  { id: 'u2', name: 'Northwind Supply Co.', email: 'hello@northwind.co', phone: '+1 503-555-0190', location: 'Portland, US', role: 'Seller', status: 'Active', joined: '2026-05-01', lastLogin: '2026-11-10 09:12', addresses: [{ label: 'Warehouse', line: '900 NW Hoyt St', city: 'Portland, OR 97209', isDefault: true }] },
  { id: 'u5', name: 'KeyForge Store', email: 'sales@keyforge.gg', phone: '+1 206-555-0164', location: 'Seattle, US', role: 'Seller', status: 'Suspended', joined: '2026-09-11', lastLogin: '2026-11-09 10:02', addresses: [{ label: 'Warehouse', line: '410 Terry Ave N', city: 'Seattle, WA 98109', isDefault: true }] },
  { id: 'u4', name: 'Ops Admin', email: 'ops@commercehub.com', phone: '+1 415-555-0100', location: 'San Francisco, US', role: 'Admin', status: 'Active', joined: '2025-08-02', lastLogin: '2026-11-11 09:00', addresses: [] },
];

export const promotions = [
  { id: 'promo1', name: 'Fall Sale', code: 'FALL20', type: 'Percentage', value: '20%', min: '$50', usage: '8,012 / 10,000', dates: 'Nov 1 – Nov 30', status: 'Active' },
  { id: 'promo2', name: 'Free Ship Weekend', code: 'SHIPFREE', type: 'Free Shipping', value: '—', min: '$25', usage: '3,120 / 5,000', dates: 'Nov 8 – Nov 10', status: 'Active' },
  { id: 'promo3', name: 'Welcome 10', code: 'WELCOME10', type: 'Fixed Amount', value: '$10', min: '$40', usage: '21,400 / 25,000', dates: 'Oct 1 – Dec 31', status: 'Inactive' },
];

export const auditLogs = [
  { id: 'a1', actor: 'ops@commercehub.com', action: 'promotion.update', target: 'FALL20', at: '2026-11-11 09:12', result: 'Success' },
  { id: 'a2', actor: 'system', action: 'order.status', target: 'ORD-90402 → Shipped', at: '2026-11-10 17:40', result: 'Success' },
  { id: 'a3', actor: 'seller@keyforge.gg', action: 'product.update', target: 'NIM-KB-75 price', at: '2026-11-10 11:02', result: 'Denied' },
  { id: 'a4', actor: 'ops@commercehub.com', action: 'user.suspend', target: 'sales@keyforge.gg', at: '2026-11-09 15:22', result: 'Success' },
];

export const banners = [
  { id: 'b1', title: 'Fall Sale — Up to 20% Off', subtitle: 'Sitewide deals through Nov 30', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=60', link: '/promotions', position: 'Homepage Hero', order: 1, start: '2026-11-01', end: '2026-11-30', status: 'Active' },
  { id: 'b2', title: 'Free Shipping Weekend', subtitle: 'Orders over $25 ship free', image: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1200&q=60', link: '/products', position: 'Homepage Hero', order: 2, start: '2026-11-08', end: '2026-11-10', status: 'Active' },
  { id: 'b3', title: 'New: Pulse Smart Watch S2', subtitle: 'Now in stock — shop wearables', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=60', link: '/products', position: 'Category Top', order: 1, start: '2026-11-05', end: '2026-12-15', status: 'Scheduled' },
  { id: 'b4', title: 'Clearance — Outdoor Gear', subtitle: 'Last chance deals', image: 'https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=1200&q=60', link: '/products', position: 'Homepage Strip', order: 3, start: '2026-10-01', end: '2026-10-31', status: 'Inactive' },
];

export const services = [
  { name: 'API Gateway', port: 5000, status: 'Healthy', latency: '42ms', errors: '0.1%' },
  { name: 'Identity Service', port: 5001, status: 'Healthy', latency: '68ms', errors: '0.0%' },
  { name: 'ProductCatalog Service', port: 5010, status: 'Healthy', latency: '55ms', errors: '0.2%' },
  { name: 'Order Service', port: 5020, status: 'Degraded', latency: '310ms', errors: '1.1%' },
  { name: 'Payment Service', port: 5040, status: 'Healthy', latency: '120ms', errors: '1.8%' },
  { name: 'Inventory Service', port: 5050, status: 'Healthy', latency: '48ms', errors: '0.0%' },
];
