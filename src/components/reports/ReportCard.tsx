import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

interface ReportCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  iconBgClass: string;
  gradientClass: string;
  badge: string;
  features: string[];
  preview: string;
  loading: boolean;
  disabled: boolean;
  exporting: string | null;
  exportKey: string;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export function ReportCard({
  title,
  description,
  icon,
  iconBgClass,
  gradientClass,
  badge,
  features,
  preview,
  loading,
  disabled,
  exporting,
  exportKey,
  onExportCSV,
  onExportPDF,
}: ReportCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradientClass} rounded-bl-full`} />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${iconBgClass}`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">{badge}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          {features.map((feature, idx) => (
            <p key={idx}>✓ {feature}</p>
          ))}
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium">Quick Preview</p>
            <p className="text-muted-foreground">{preview}</p>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onExportCSV}
            disabled={disabled || exporting !== null}
          >
            {exporting === `${exportKey}-csv` ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Excel
          </Button>
          <Button 
            variant="default" 
            className="flex-1"
            onClick={onExportPDF}
            disabled={disabled || exporting !== null}
          >
            {exporting === `${exportKey}-pdf` ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
