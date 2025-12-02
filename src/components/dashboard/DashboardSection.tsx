// src/components/dashboard/DashboardSection.tsx
'use client';

import React from 'react';

type DashboardSectionProps = {
  title: string;
  size?: 'lg' | 'sm';
  children: React.ReactNode;
};

export default function DashboardSection({
  title,
  size = 'lg',
  children,
}: DashboardSectionProps) {
  const headingClass =
    size === 'lg'
      ? 'h5 mb-3 text-white'
      : 'h6 mb-3 text-white';

  return (
    <section className="mb-4">
      <h2 className={headingClass}>{title}</h2>
      {children}
    </section>
  );
}
