import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Copy, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export function ManualFunctionSetupGuide() {
  const [copied, setCopied] = useState(false);

  const functionSQL = `CREATE OR REPLACE FUNCTION record_payment_with_allocation(
    p_company_id UUID,
    p_customer_id UUID,
    p_invoice_id UUID,
    p_payment_number VARCHAR(50),
    p_payment_date DATE,
    p_amount DECIMAL(15,2),
    p_payment_method payment_method,
    p_reference_number VARCHAR(100),
    p_notes TEXT
)
RETURNS JSON AS $$
DECLARE
    v_payment_id UUID;
    v_invoice_record RECORD;
BEGIN
    -- Validate invoice exists and get details
    SELECT id, total_amount, paid_amount, balance_due 
    INTO v_invoice_record 
    FROM invoices 
    WHERE id = p_invoice_id AND company_id = p_company_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    -- Insert payment
    INSERT INTO payments (
        company_id, customer_id, payment_number, payment_date, 
        amount, payment_method, reference_number, notes
    ) VALUES (
        p_company_id, p_customer_id, p_payment_number, p_payment_date,
        p_amount, p_payment_method, p_reference_number, p_notes
    ) RETURNING id INTO v_payment_id;

    -- Insert payment allocation
    INSERT INTO payment_allocations (payment_id, invoice_id, amount_allocated)
    VALUES (v_payment_id, p_invoice_id, p_amount);

    -- Update invoice payment status
    UPDATE invoices 
    SET 
        paid_amount = COALESCE(paid_amount, 0) + p_amount,
        balance_due = total_amount - (COALESCE(paid_amount, 0) + p_amount),
        status = CASE 
            WHEN (COALESCE(paid_amount, 0) + p_amount) >= total_amount THEN 'paid'
            WHEN (COALESCE(paid_amount, 0) + p_amount) > 0 THEN 'partial'
            ELSE status 
        END,
        updated_at = NOW()
    WHERE id = p_invoice_id;

    RETURN json_build_object(
        'success', true, 
        'payment_id', v_payment_id,
        'amount_allocated', p_amount,
        'invoice_balance', v_invoice_record.total_amount - (COALESCE(v_invoice_record.paid_amount, 0) + p_amount)
    );
END;
$$ LANGUAGE plpgsql;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(functionSQL);
    setCopied(true);
    toast.success('SQL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-success">
          <CheckCircle className="h-5 w-5" />
          Database Function Setup No Longer Required
        </CardTitle>
        <CardDescription>
          Payment processing now uses the built-in client-side method and no longer requires the database function
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-success/30 bg-success/5">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            The payment system now uses a built-in client-side processing method. The database function is no longer required for payment creation to work.
          </AlertDescription>
        </Alert>

        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">What Changed?</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Payments are now created directly without requiring the database function</li>
            <li>All payment processing, allocation creation, and invoice balance updates work automatically</li>
            <li>If you previously created the database function, it is safe to leave it in place but is no longer used</li>
            <li>No additional setup or configuration is needed</li>
          </ul>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="p-3 bg-slate-100 rounded-lg text-sm cursor-pointer">
            <summary className="font-semibold text-slate-900">
              Legacy SQL Code (for reference only)
            </summary>
            <div className="mt-3 relative">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs border border-slate-700 max-h-96">
                <code>{functionSQL}</code>
              </pre>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
