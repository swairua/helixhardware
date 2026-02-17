import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FileText, 
  Receipt, 
  Users, 
  Package,
  DollarSign 
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'success' | 'primary-gradient' | 'warning';
  href: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'New Quotation',
    description: 'Create a new quotation for a customer',
    icon: FileText,
    variant: 'primary-gradient',
    href: '/app/quotations'
  },
  {
    title: 'New Invoice',
    description: 'Generate an invoice from quotation',
    icon: Receipt,
    variant: 'success',
    href: '/app/invoices'
  },
  {
    title: 'Add Customer',
    description: 'Register a new customer',
    icon: Users,
    variant: 'default',
    href: '/app/customers'
  },
  {
    title: 'Stock Entry',
    description: 'Add new inventory items',
    icon: Package,
    variant: 'warning',
    href: '/app/inventory'
  },
  {
    title: 'Record Payment',
    description: 'Log customer payment',
    icon: DollarSign,
    variant: 'success',
    href: '/app/payments'
  }
];

export function QuickActions() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
        {quickActions.map((action) => (
          <Button
            key={action.title}
            variant={action.variant}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-start space-y-2 sm:space-y-0 sm:space-x-3 h-auto p-3 sm:p-4 text-left text-sm sm:text-base"
            asChild
          >
            <a href={action.href}>
              <action.icon className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs opacity-90 line-clamp-1">{action.description}</div>
              </div>
              <Plus className="h-4 w-4 flex-shrink-0 hidden sm:inline" />
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
