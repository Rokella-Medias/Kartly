import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Marketplace } from '@/types/orders';
import { parseCSV, detectMarketplace, generateSampleCSV } from '@/lib/csvParser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// Convert Excel file to CSV text
async function excelToCSV(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(firstSheet);
        resolve(csv);
      } catch (err) {
        reject(new Error('Failed to parse Excel file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

interface CSVUploadProps {
  onUploadComplete: () => void;
}

type UploadStatus = 'idle' | 'selecting' | 'uploading' | 'success' | 'error';

export function CSVUpload({ onUploadComplete }: CSVUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [marketplace, setMarketplace] = useState<Marketplace | ''>('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setStatus('selecting');
      
      try {
        let csvText: string;
        const isExcel = uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls');
        
        if (isExcel) {
          csvText = await excelToCSV(uploadedFile);
        } else {
          csvText = await uploadedFile.text();
        }
        
        // Try to auto-detect marketplace from headers
        const lines = csvText.split('\n');
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
          const detected = detectMarketplace(headers);
          if (detected) {
            setMarketplace(detected);
          }
        }
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    disabled: status === 'uploading',
  });

  const handleUpload = async () => {
    if (!file || !marketplace || !user) return;

    setStatus('uploading');
    setProgress(0);

    try {
      let text: string;
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (isExcel) {
        text = await excelToCSV(file);
      } else {
        text = await file.text();
      }
      setProgress(20);

      const { orders, errors } = parseCSV(text, marketplace);
      setProgress(40);

      if (orders.length === 0) {
        setStatus('error');
        setResult({ imported: 0, skipped: 0, errors: ['No valid orders found in the CSV file'] });
        return;
      }

      // Record the upload first to get the ID
      const { data: uploadRecord, error: uploadError } = await supabase.from('csv_uploads').insert({
        user_id: user.id,
        filename: file.name,
        marketplace,
        rows_imported: 0,
        rows_skipped: 0,
      }).select().single();

      if (uploadError || !uploadRecord) {
        throw new Error('Failed to create upload record');
      }

      // Insert orders in batches with csv_upload_id
      const batchSize = 100;
      let imported = 0;
      let skipped = 0;

      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize).map(order => ({
          ...order,
          user_id: user.id,
          csv_upload_id: uploadRecord.id,
        }));

        const { data, error } = await supabase
          .from('orders')
          .upsert(batch, { 
            onConflict: 'user_id,order_id,marketplace',
            ignoreDuplicates: true 
          })
          .select();

        if (error) {
          console.error('Insert error:', error);
          skipped += batch.length;
        } else {
          imported += data?.length || 0;
          skipped += batch.length - (data?.length || 0);
        }

        setProgress(40 + Math.round((i / orders.length) * 50));
      }

      // Update the upload record with final counts
      await supabase.from('csv_uploads').update({
        rows_imported: imported,
        rows_skipped: skipped,
      }).eq('id', uploadRecord.id);

      setProgress(100);
      setStatus('success');
      setResult({ imported, skipped, errors });
      onUploadComplete();
    } catch (err) {
      setStatus('error');
      setResult({ 
        imported: 0, 
        skipped: 0, 
        errors: [err instanceof Error ? err.message : 'An unexpected error occurred'] 
      });
    }
  };

  const downloadSample = (mp: Marketplace) => {
    const csv = generateSampleCSV(mp);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${mp}_orders.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setMarketplace('');
    setStatus('idle');
    setProgress(0);
    setResult(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm">
          <Upload className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Upload CSV</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Upload Sales Data
          </DialogTitle>
          <DialogDescription>
            Upload your marketplace CSV or Excel file to import orders
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {status === 'idle' && (
            <>
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                  isDragActive 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent/50 hover:bg-muted/50'
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground font-medium mb-1">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your CSV or Excel file'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports .csv, .xlsx, and .xls files
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Download sample:</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => downloadSample('amazon')}
                  className="text-amazon hover:text-amazon"
                >
                  Amazon
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => downloadSample('flipkart')}
                  className="text-flipkart hover:text-flipkart"
                >
                  Flipkart
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => downloadSample('meesho')}
                  className="text-meesho hover:text-meesho"
                >
                  Meesho
                </Button>
              </div>
            </>
          )}

          {status === 'selecting' && file && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <FileSpreadsheet className="w-8 h-8 text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={reset}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Select Marketplace
                </label>
                <Select value={marketplace} onValueChange={(v) => setMarketplace(v as Marketplace)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose marketplace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amazon">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amazon" />
                        Amazon
                      </span>
                    </SelectItem>
                    <SelectItem value="flipkart">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-flipkart" />
                        Flipkart
                      </span>
                    </SelectItem>
                    <SelectItem value="meesho">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-meesho" />
                        Meesho
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleUpload} 
                className="w-full gradient-primary text-primary-foreground"
                disabled={!marketplace}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload & Process
              </Button>
            </div>
          )}

          {status === 'uploading' && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-foreground font-medium mb-2">Processing your CSV...</p>
                <p className="text-sm text-muted-foreground">This may take a moment for large files</p>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">{progress}%</p>
            </div>
          )}

          {status === 'success' && result && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Upload Complete!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.imported} orders imported
                  {result.skipped > 0 && `, ${result.skipped} skipped (duplicates)`}
                </p>
              </div>
              <Button onClick={() => handleOpenChange(false)} className="w-full">
                Done
              </Button>
            </div>
          )}

          {status === 'error' && result && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Upload Failed</p>
                <p className="text-sm text-destructive mt-1">
                  {result.errors[0]}
                </p>
              </div>
              <Button onClick={reset} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
