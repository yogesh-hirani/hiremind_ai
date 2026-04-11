import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardHeader from './components/DashboardHeader';
import KPIBentoGrid from './components/KPIBentoGrid';
import ScoreDistributionChart from './components/ScoreDistributionChart';
import CandidateTable from './components/CandidateTable';

export default function DashboardPage() {
  return (
    <AppLayout currentPath="/dashboard-page">
      <DashboardHeader />
      <KPIBentoGrid />
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 2xl:col-span-2">
          <CandidateTable />
        </div>
        <div className="xl:col-span-1 2xl:col-span-1">
          <ScoreDistributionChart />
        </div>
      </div>
    </AppLayout>
  );
}