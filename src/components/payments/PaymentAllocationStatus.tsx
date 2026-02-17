import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export function PaymentAllocationStatus() {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Payment Allocation Active
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">
          Payment allocation is configured and ready to use. All payments are automatically allocated to the selected invoices.
        </p>
      </CardContent>
    </Card>
  );
}
