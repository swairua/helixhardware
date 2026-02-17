import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * StorageSetup Component (DISABLED)
 * File uploads now use direct API at helixgeneralhardware.com/api.php?action=upload
 * See: src/utils/directFileUpload.ts
 */
export default function StorageSetup() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Direct File Upload Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            File uploads are now configured for direct API integration at helixgeneralhardware.com
          </AlertDescription>
        </Alert>

        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-700">
            Upload Capabilities Enabled:
          </p>
          <ul className="list-inside list-disc space-y-1 text-gray-600">
            <li>Image uploads (JPEG, PNG, GIF, WebP) - up to 5MB</li>
            <li>Document uploads (PDF, DOC, XLS, TXT, CSV) - up to 10MB</li>
            <li>General file uploads - up to 10MB</li>
          </ul>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-700">
            Implementation:
          </p>
          <code className="block rounded bg-gray-100 p-2 font-mono text-xs">
            import {'{ uploadImage, uploadDocument }'} from '@/utils/directFileUpload'
          </code>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Supabase storage is disabled. Use directFileUpload.ts utilities for all file operations.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
