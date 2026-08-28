'use client';

import { useState } from 'react';

const STORAGE_KEY = 'indesy:erp-sidebar-collapsed';

export function useCollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === 'true'
  );
  const toggle = () => setCollapsed((current) => {
    const next = !current;
    window.localStorage.setItem(STORAGE_KEY, String(next));
    return next;
  });

  return { collapsed, toggle };
}
