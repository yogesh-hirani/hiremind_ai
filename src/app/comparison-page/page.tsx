import React from 'react';
import AppLayout from '@/components/AppLayout';
import ComparisonHeader from './components/ComparisonHeader';
import ComparisonContent from './components/ComparisonContent';

export default function ComparisonPage() {
  return (
    <AppLayout currentPath="/comparison-page">
      <ComparisonHeader />
      <ComparisonContent />
    </AppLayout>
  );
}