import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FileSpreadsheet, Trash2, Loader2, History } from 'lucide-react';
import { toast } from 'sonner';

interface Upload {
  id: string;
  filename: string;
  marketplace: string;
  rows_imported: number | null;
  rows_skipped: number | null;
  status: string | null;
  created_at: string;
}

interface UploadHistoryProps {
  refreshTrigger?: number;
  onDeleteComplete: () => void;
}

export function UploadHistory({ refreshTrigger, onDeleteComplete }: UploadHistoryProps) {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUploads = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('csv_uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching uploads:', error);
    } else {
      setUploads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUploads();
  }, [user, refreshTrigger]);

  const deleteUpload = async (upload: Upload) => {
    setDeletingId(upload.id);
    try {
      // Delete orders linked to this upload (cascade handles this via FK, but let's be explicit for orders without csv_upload_id)
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('csv_upload_id', upload.id);

      if (ordersError) {
        console.error('Error deleting orders:', ordersError);
      }

      // Delete the upload record
      const { error: uploadError } = await supabase
        .from('csv_uploads')
        .delete()
        .eq('id', upload.id);

      if (uploadError) throw uploadError;

      toast.success(`Deleted "${upload.filename}" and its ${upload.rows_imported || 0} imported orders`);
      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
      onDeleteComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete upload');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const marketplaceColors: Record<string, string> = {
    amazon: 'bg-amazon/10 text-amazon border-amazon/30',
    flipkart: 'bg-flipkart/10 text-flipkart border-flipkart/30',
    meesho: 'bg-meesho/10 text-meesho border-meesho/30',
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (uploads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <History className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">No uploads yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload a CSV or Excel file to see your history here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5" />
          Upload History
        </CardTitle>
        <CardDescription>{uploads.length} upload(s)</CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">File</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead>Imported</TableHead>
                <TableHead>Skipped</TableHead>
                <TableHead>Uploaded On</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploads.map((upload) => (
                <TableRow key={upload.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate max-w-[200px]">{upload.filename}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${marketplaceColors[upload.marketplace] || ''}`}>
                      {upload.marketplace}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{upload.rows_imported ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{upload.rows_skipped ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDate(upload.created_at)}</span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={deletingId === upload.id}
                        >
                          {deletingId === upload.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Upload</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>"{upload.filename}"</strong> and all <strong>{upload.rows_imported ?? 0} imported orders</strong> from this upload. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUpload(upload)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Upload & Orders
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
