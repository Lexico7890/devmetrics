"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import RepositoryDetail from '@/components/RepositoryDetail';

export default function RepositoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  return (
    <RepositoryDetail 
      repoId={id} 
      onBack={() => router.push('/repositories')} 
    />
  );
}
