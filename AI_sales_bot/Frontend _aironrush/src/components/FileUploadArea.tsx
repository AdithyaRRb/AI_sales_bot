import React, { useRef } from 'react';
import { Upload, X, File } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadAreaProps {
  uploadedFile: File | null;
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  uploadedFile,
  onFileUpload,
  onFileRemove
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (allowedTypes.includes(file.type)) {
        onFileUpload(file);
      } else {
        alert('Please upload only PDF, DOCX, or TXT files.');
      }
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (allowedTypes.includes(file.type)) {
        onFileUpload(file);
      } else {
        alert('Please upload only PDF, DOCX, or TXT files.');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  if (uploadedFile) {
    return (
      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <File className="w-4 h-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-800">{uploadedFile.name}</span>
          <span className="text-xs text-orange-600">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFileRemove}
          className="text-orange-600 hover:text-orange-800 hover:bg-orange-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-orange-400 hover:bg-orange-50/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600 mb-1">
          Drag and drop a file here, or click to select
        </p>
        <p className="text-xs text-slate-500">
          Supports PDF, DOCX, and TXT files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};
