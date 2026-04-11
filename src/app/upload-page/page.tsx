'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import UploadZone from './components/UploadZone';
import JobDescriptionPanel from './components/JobDescriptionPanel';
import UploadPageHeader from './components/UploadPageHeader';
import type { ParsedResumeFile } from './components/UploadZone';

export default function UploadPage() {
  const [parsedFiles, setParsedFiles] = useState<ParsedResumeFile[]>([]);

  return (
    <AppLayout currentPath="/upload-page">
      <UploadPageHeader />
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
        <UploadZone onFilesReady={setParsedFiles} />
        <JobDescriptionPanel parsedFiles={parsedFiles} />
      </div>
    </AppLayout>
  );
}