'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PDFUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export const PDFUpload = ({
  onFileSelect,
  selectedFile,
  maxSize = 1,
  disabled = false,
}: PDFUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return false;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    setError(null);
    return true;
  }, [maxSize]);

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const removeFile = () => {
    onFileSelect(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <CardContent className="p-8">
          <div
            className="text-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">{selectedFile.name}</p>
                  <p className="text-sm text-green-600">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeFile}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove PDF
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Upload a PDF (Optional)
                  </p>
                  <p className="text-sm text-gray-500">
                    Your companion will teach from this document
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    onClick={() => document.getElementById('pdf-upload')?.click()}
                  >
                    Choose PDF File
                  </Button>
                  <p className="text-xs text-gray-400">
                    or drag and drop • Max {maxSize}MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        id="pdf-upload"
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info message */}
      {!selectedFile && !error && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Upload a PDF to create a companion that teaches specifically from your document. 
            Leave empty for a general subject companion.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
