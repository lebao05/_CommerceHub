import { createContext, useContext, useMemo, useState } from 'react';
import { products as seedProducts, categories as seedCategories } from '../data/mock.js';

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function flattenCategories(nodes, prefix = '') {
  const out = [];
  for (const n of nodes) {
    const label = prefix ? `${prefix} / ${n.name}` : n.name;
    out.push({ id: n.id, label, slug: n.slug });
    if (n.children?.length) out.push(...flattenCategories(n.children, label));
  }
  return out;
}

// Enrich seed table rows into domain-shaped products with options + values.
function enrichSeeds() {
  const byCategory = {
    p1: 'cat-headphones',
    p2: 'cat-smartwatches',
    p3: 'cat-outdoor',
    p4: 'cat-lamps',
    p5: 'cat-home',
    p6: 'cat-electronics',
  };
  return seedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: slugify(p.name),
    categoryId: byCategory[p.id] ?? 'cat-electronics',
    description: `${p.name} — mockup description. Replace with full product copy.`,
    status: p.status,
    featured: p.featured,
    options: p.id === 'p1' ? [
      { id: 'opt-p1-color', name: 'Color', values: [
        { id: 'val-p1-black', value: 'Black' },
        { id: 'val-p1-white', value: 'White' },
      ]},
      { id: 'opt-p1-size', name: 'Size', values: [
        { id: 'val-p1-s', value: 'S' },
        { id: 'val-p1-m', value: 'M' },
      ]},
    ] : p.id === 'p2' ? [
      { id: 'opt-p2-strap', name: 'Strap', values: [
        { id: 'val-p2-sport', value: 'Sport' },
        { id: 'val-p2-leather', value: 'Leather' },
      ]},
    ] : [],
  }));
}

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(() => enrichSeeds());
  const flatCategories = useMemo(() => flattenCategories(seedCategories), []);

  const categoryName = (id) => flatCategories.find((c) => c.id === id)?.label ?? id;
  const slugExists = (slug, ignoreId) =>
    products.some((p) => p.slug === slug && p.id !== ignoreId);

  const addProduct = ({ name, slug, categoryId, description }) => {
    const cleanSlug = (slug || '').trim() || slugify(name);
    if (!name.trim()) throw new Error('Product name is required.');
    if (!cleanSlug) throw new Error('Product slug is required.');
    if (slugExists(cleanSlug)) throw new Error('A product with the same slug already exists.');
    if (!flatCategories.some((c) => c.id === categoryId)) throw new Error('The specified category was not found.');
    const product = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      slug: cleanSlug,
      categoryId,
      description: description?.trim() || '',
      status: 'Draft',
      featured: false,
      options: [],
    };
    setProducts((prev) => [product, ...prev]);
    return product;
  };

  const addProductWithOptions = ({ name, slug, categoryId, description, options }) => {
    const product = addProduct({ name, slug, categoryId, description });
    if (options?.length) {
      setProducts((prev) => prev.map((p) => {
        if (p.id !== product.id) return p;
        return {
          ...p,
          options: options
            .filter((o) => o.name.trim())
            .map((o) => ({
              id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: o.name.trim(),
              values: o.values
                .filter((v) => v.value.trim())
                .map((v) => ({ id: `val-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, value: v.value.trim() })),
            })),
        };
      }));
    }
    return product;
  };

  const addOption = (productId, name) => {
    if (!name.trim()) throw new Error('Option name is required.');
    const option = { id: `opt-${Date.now()}`, name: name.trim(), values: [] };
    setProducts((prev) => prev.map((p) =>
      p.id === productId ? { ...p, options: [...p.options, option] } : p));
    return option;
  };

  const removeOption = (productId, optionId) => {
    setProducts((prev) => prev.map((p) =>
      p.id === productId ? { ...p, options: p.options.filter((o) => o.id !== optionId) } : p));
  };

  const addOptionValue = (productId, optionId, value) => {
    if (!value.trim()) throw new Error('Option value is required.');
    const val = { id: `val-${Date.now()}`, value: value.trim() };
    setProducts((prev) => prev.map((p) => {
      if (p.id !== productId) return p;
      return {
        ...p,
        options: p.options.map((o) =>
          o.id === optionId ? { ...o, values: [...o.values, val] } : o),
      };
    }));
    return val;
  };

  const removeOptionValue = (productId, optionId, valueId) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id !== productId) return p;
      return {
        ...p,
        options: p.options.map((o) =>
          o.id === optionId ? { ...o, values: o.values.filter((v) => v.id !== valueId) } : o),
      };
    }));
  };

  const value = {
    products, flatCategories, categoryName, slugExists,
    addProduct, addProductWithOptions, addOption, removeOption, addOptionValue, removeOptionValue,
    getProduct: (id) => products.find((p) => p.id === id),
  };
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}

export { slugify };
