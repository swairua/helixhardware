import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CreditCard, TrendingDown, Calendar, Loader2 } from 'lucide-react';
import { useCustomerCreditBalances } from '@/hooks/useCustomerCreditBalances';

interface CustomerCreditBalanceViewerProps {
  customerId: string | null;
  companyId: string | null;
  showApplyOption?: boolean;
  onApplyCredit?: (balanceId: string, amount: number) => void;
  maxApplyAmount?: number;
}

export function CustomerCreditBalanceViewer({
  customerId,
  companyId,
  showApplyOption = false,
  onApplyCredit,
  maxApplyAmount
}: CustomerCreditBalanceViewerProps) {
  const { balances, totalAvailableCredit, isLoading, error } = useCustomerCreditBalances(customerId, companyId);
  const [selectedBalance, setSelectedBalance] = useState<string | null>(null);

  if (!customerId || !companyId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading credit balances...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load credit balances: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (balances.length === 0) {
    return (
      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertDescription>
          No available credit balance for this customer
        </AlertDescription>
      </Alert>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Available Credit Balance
          </CardTitle>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(totalAvailableCredit)}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {showApplyOption && maxApplyAmount && totalAvailableCredit > 0 && (
          <Alert className="mb-4 bg-success-light text-success border-success/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You can apply up to {formatCurrency(Math.min(totalAvailableCredit, maxApplyAmount))} 
              {totalAvailableCredit > maxApplyAmount ? ` (${formatCurrency(maxApplyAmount)} needed)` : ''}
              {' '}of available credit to this payment.
            </AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                {showApplyOption && <TableHead className="w-20">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((balance) => {
                const expired = isExpired(balance.expires_at);
                const canApply = showApplyOption && !expired && balance.credit_amount > 0 && totalAvailableCredit > 0;

                return (
                  <TableRow key={balance.id} className={expired ? 'opacity-50' : ''}>
                    <TableCell className="font-mono text-xs">
                      {balance.source_receipt?.receipt_number || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(balance.credit_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          expired
                            ? 'secondary'
                            : balance.status === 'applied'
                            ? 'outline'
                            : 'default'
                        }
                        className={
                          expired
                            ? 'bg-muted text-muted-foreground'
                            : balance.status === 'applied'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-success-light text-success'
                        }
                      >
                        {expired ? 'Expired' : balance.status === 'applied' ? 'Applied' : 'Available'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {balance.expires_at ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(balance.expires_at)}
                        </div>
                      ) : (
                        <span>No expiry</span>
                      )}
                    </TableCell>
                    {showApplyOption && (
                      <TableCell>
                        {canApply && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (onApplyCredit) {
                                const applyAmount = Math.min(
                                  balance.credit_amount,
                                  maxApplyAmount || balance.credit_amount
                                );
                                onApplyCredit(balance.id, applyAmount);
                              }
                            }}
                            className="h-7 text-xs"
                          >
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Apply
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {balances.some((b) => isExpired(b.expires_at)) && (
          <p className="text-xs text-muted-foreground mt-4">
            Note: Expired credit balances are shown in gray and cannot be used.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
