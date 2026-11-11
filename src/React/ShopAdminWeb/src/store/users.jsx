import { createContext, useContext, useMemo, useState } from 'react';
import { users as seedUsers, orders as seedOrders, products as seedProducts, auditLogs as seedLogs } from '../data/mock.js';

const UsersContext = createContext(null);

function sellerMatchesProduct(userName, productSeller) {
  const first = userName.split(' ')[0].toLowerCase();
  const seller = productSeller.toLowerCase();
  return seller.includes(first) || first.includes(seller);
}

export function UsersProvider({ children }) {
  const [users, setUsers] = useState(seedUsers);

  const getUser = (id) => users.find((u) => u.id === id);

  const updateUser = (id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const toggleActive = (id) => {
    setUsers((prev) => prev.map((u) =>
      u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
  };

  const userOrders = (userId) => seedOrders.filter((o) => o.userId === userId);

  const userStats = (user) => {
    const list = userOrders(user.id);
    const totalSpent = list
      .filter((o) => o.status !== 'Cancelled')
      .reduce((n, o) => n + o.total, 0);
    return {
      orders: list,
      orderCount: list.length,
      totalSpent,
      avgOrder: list.length ? totalSpent / list.length : 0,
      lastOrder: list.length ? list.map((o) => o.date).sort().reverse()[0] : null,
    };
  };

  const sellerProducts = (user) => {
    if (user.role !== 'Seller') return [];
    return seedProducts.filter((p) => sellerMatchesProduct(user.name, p.seller));
  };

  const userActivity = (user) =>
    seedLogs.filter((a) => a.actor === user.email || a.target.includes(user.email));

  const value = useMemo(() => ({
    users, getUser, updateUser, toggleActive, userOrders, userStats, sellerProducts, userActivity,
  }), [users]);

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers must be used inside UsersProvider');
  return ctx;
}
