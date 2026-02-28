"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Repositories from '@/components/Repositories';

export default function RepositoriesPage() {
  const router = useRouter();

  return (
    <Repositories 
      onSelectRepo={(id) => router.push(`/repositories/${id}`)} 
    />
  );
}
