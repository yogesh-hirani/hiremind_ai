'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, File, Eye } from 'lucide-react';
import { toast } from 'sonner';

export interface ParsedResumeFile {
  id: string;
  fileName: string;
  extractedText: string;
  parsedData?: Record<string, unknown> | null;
  resumeId?: string | null;
  storagePath?: string | null;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'queued' | 'parsing' | 'parsed' | 'error';
  progress: number;
  errorMessage?: string;
  extractedText?: string;
  parsedData?: Record<string, unknown> | null;
  resumeId?: string | null;
}

interface UploadZoneProps {
  onFilesReady?: (files: ParsedResumeFile[]) => void;
}

interface ResumePreviewModalProps {
  fileName: string;
  extractedText: string;
  parsedData?: Record<string, unknown> | null;
  onClose: () => void;
}

function ResumePreviewModal({ fileName, extractedText, parsedData, onClose }: ResumePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'parsed'>('parsed');
  const hasParsed = parsedData && Object.keys(parsedData).length > 0;

  const pd = parsedData as {
    name?: string;
    email?: string;
    phone?: string;
    totalExperience?: number;
    skills?: string[];
    workExperience?: { role: string; company: string; duration: string }[];
    education?: { degree: string; institution: string; year: number }[];
    projects?: string[];
    certifications?: string[];
  } | null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <FileText size={17} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{fileName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{extractedText.length.toLocaleString()} characters extracted</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0 ml-3"
          >
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        {hasParsed && (
          <div className="flex border-b border-slate-100 px-5">
            {(['parsed', 'text'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2.5 px-1 mr-5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600' :'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'parsed' ? 'Parsed Data' : 'Raw Text'}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'text' || !hasParsed ? (
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
              {extractedText}
            </pre>
          ) : (
            <div className="space-y-5">
              {/* Identity */}
              {(pd?.name || pd?.email || pd?.phone) && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contact</p>
                  <div className="space-y-1.5">
                    {pd?.name && <p className="text-sm font-semibold text-slate-900">{pd.name}</p>}
                    {pd?.email && <p className="text-xs text-slate-600">{pd.email}</p>}
                    {pd?.phone && <p className="text-xs text-slate-600">{pd.phone}</p>}
                    {pd?.totalExperience !== undefined && (
                      <p className="text-xs text-blue-600 font-medium">{pd.totalExperience} years total experience</p>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {pd?.skills && pd.skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pd.skills.map((skill, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {pd?.workExperience && pd.workExperience.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Work Experience</p>
                  <div className="space-y-2">
                    {pd.workExperience.map((w, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{w.role}</p>
                          <p className="text-xs text-slate-500">{w.company} · {w.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {pd?.education && pd.education.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Education</p>
                  <div className="space-y-2">
                    {pd.education.map((e, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{e.degree}</p>
                          <p className="text-xs text-slate-500">{e.institution}{e.year ? ` · ${e.year}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {pd?.certifications && pd.certifications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pd.certifications.map((cert, i) => (
                      <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-medium">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UploadZone({ onFilesReady }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parsedFilesRef = useRef<Map<string, ParsedResumeFile>>(new Map());

  const notifyParent = useCallback(
    (updatedMap: Map<string, ParsedResumeFile>) => {
      if (onFilesReady) {
        onFilesReady(Array.from(updatedMap.values()));
      }
    },
    [onFilesReady]
  );

  const parseFile = useCallback(
    async (uf: UploadedFile) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === uf.id ? { ...f, status: 'parsing', progress: 30 } : f))
      );

      try {
        const formData = new FormData();
        formData.append('file', uf.file);

        setFiles((prev) =>
          prev.map((f) => (f.id === uf.id ? { ...f, progress: 60 } : f))
        );

        const res = await fetch('/api/parse-resume', {
          method: 'POST',
          body: formData,
        });

        setFiles((prev) =>
          prev.map((f) => (f.id === uf.id ? { ...f, progress: 90 } : f))
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Parse failed' }));
          throw new Error(err.error || 'Parse failed');
        }

        const data = await res.json();
        const extractedText: string = data.text;

        const parsedEntry: ParsedResumeFile = {
          id: uf.id,
          fileName: uf.file.name,
          extractedText,
          parsedData: data.parsedData ?? null,
          resumeId: data.resumeId ?? null,
          storagePath: data.storagePath ?? null,
        };

        parsedFilesRef.current.set(uf.id, parsedEntry);
        notifyParent(new Map(parsedFilesRef.current));

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uf.id
              ? { ...f, status: 'parsed', progress: 100, extractedText, parsedData: data.parsedData ?? null, resumeId: data.resumeId ?? null }
              : f
          )
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to parse file';
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uf.id
              ? { ...f, status: 'error', progress: 100, errorMessage: message }
              : f
          )
        );
        toast.error(`Failed to parse ${uf.file.name}: ${message}`);
      }
    },
    [notifyParent]
  );

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles = fileArray.filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ext === 'pdf' || ext === 'docx' || ext === 'doc';
      });

      if (validFiles.length !== fileArray.length) {
        toast.error('Only PDF and DOCX files are accepted. Some files were skipped.');
      }

      const uploadedFiles: UploadedFile[] = validFiles.map((f, i) => ({
        id: `file-${Date.now()}-${i}`,
        file: f,
        status: 'queued',
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...uploadedFiles]);

      uploadedFiles.forEach((uf, i) => {
        setTimeout(() => parseFile(uf), i * 300);
      });
    },
    [parseFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  };

  const removeFile = (id: string) => {
    parsedFilesRef.current.delete(id);
    notifyParent(new Map(parsedFilesRef.current));
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (previewFile?.id === id) setPreviewFile(null);
  };

  const parsedCount = files.filter((f) => f.status === 'parsed').length;
  const parsingCount = files.filter((f) => f.status === 'parsing' || f.status === 'queued').length;

  return (
    <>
      {previewFile && previewFile.extractedText && (
        <ResumePreviewModal
          fileName={previewFile.file.name}
          extractedText={previewFile.extractedText}
          parsedData={previewFile.parsedData}
          onClose={() => setPreviewFile(null)}
        />
      )}

      <div className="card p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Resume Upload</h2>
            <p className="text-xs text-slate-500 mt-0.5">PDF or DOCX, up to 10MB per file</p>
          </div>
          {files.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                {parsedCount}/{files.length} parsed
              </span>
              {parsingCount > 0 && (
                <Loader2 size={14} className="text-blue-500 animate-spin" />
              )}
            </div>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3
            cursor-pointer transition-all duration-200
            ${isDragging
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200
            ${isDragging ? 'bg-blue-100' : 'bg-white border border-slate-200'}`}>
            <Upload size={22} className={isDragging ? 'text-blue-600' : 'text-slate-400'} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              {isDragging ? 'Drop files here' : 'Drag & drop resumes here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              or{' '}
              <span className="text-blue-600 font-semibold underline underline-offset-2">
                browse files
              </span>
              {' '}— PDF, DOCX supported
            </p>
          </div>
          <div className="flex items-center gap-4 mt-1">
            {['PDF', 'DOCX', 'DOC'].map((ext) => (
              <span key={`ext-${ext}`} className="text-xs font-mono font-medium text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">
                .{ext.toLowerCase()}
              </span>
            ))}
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="section-label">Uploaded Files ({files.length})</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {files.map((uf) => (
                <div
                  key={uf.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    uf.status === 'parsed' ? 'bg-emerald-50' :
                    uf.status === 'error' ? 'bg-red-50' :
                    uf.status === 'parsing' ? 'bg-blue-50' : 'bg-slate-100'
                  }`}>
                    {uf.status === 'parsed' ? (
                      <CheckCircle size={16} className="text-emerald-600" />
                    ) : uf.status === 'error' ? (
                      <AlertCircle size={16} className="text-red-500" />
                    ) : uf.status === 'parsing' ? (
                      <Loader2 size={16} className="text-blue-500 animate-spin" />
                    ) : (
                      <File size={16} className="text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800 truncate">{uf.file.name}</p>
                      <span className={`text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full ${
                        uf.status === 'parsed' ? 'bg-emerald-50 text-emerald-700' :
                        uf.status === 'error' ? 'bg-red-50 text-red-600' :
                        uf.status === 'parsing' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {uf.status === 'parsed' ? 'Parsed' :
                         uf.status === 'error' ? 'Error' :
                         uf.status === 'parsing' ? 'Parsing...' : 'Queued'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-400">
                        {(uf.file.size / 1024).toFixed(0)} KB
                        {uf.status === 'parsed' && uf.extractedText && (
                          <span className="ml-2 text-emerald-600 font-medium">
                            → {uf.extractedText.length.toLocaleString()} chars extracted
                            {uf.parsedData && <span className="ml-1">· AI parsed ✓</span>}
                          </span>
                        )}
                        {uf.status === 'error' && uf.errorMessage && (
                          <span className="ml-2 text-red-500">{uf.errorMessage}</span>
                        )}
                      </p>
                    </div>
                    {(uf.status === 'parsing' || uf.status === 'queued') && (
                      <div className="mt-1.5 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${uf.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {uf.status === 'parsed' && uf.extractedText && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewFile(uf); }}
                        className="w-7 h-7 rounded-full hover:bg-blue-50 flex items-center justify-center transition-all duration-150"
                        aria-label="View resume"
                        title="View resume"
                      >
                        <Eye size={13} className="text-blue-500" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(uf.id); }}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full hover:bg-red-50
                                 flex items-center justify-center transition-all duration-150"
                      aria-label="Remove file"
                    >
                      <X size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats row */}
        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: files.length, color: 'text-slate-700' },
              { label: 'Parsed', value: parsedCount, color: 'text-emerald-600' },
              { label: 'Errors', value: files.filter((f) => f.status === 'error').length, color: 'text-red-500' },
            ].map((stat) => (
              <div key={`stat-${stat.label}`} className="text-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className={`text-xl font-bold font-mono tabular-nums ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {files.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <FileText size={14} className="text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">
              No resumes uploaded yet. Upload at least one resume to start screening.
            </p>
          </div>
        )}
      </div>
    </>
  );
}