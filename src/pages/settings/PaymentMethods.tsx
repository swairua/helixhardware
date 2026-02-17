import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Banknote,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from '@/hooks/useDatabase';
import { useCurrentCompany } from '@/contexts/CompanyContext';

interface PaymentMethod {
  id: string | number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
  icon_name?: string;
  created_at?: string;
}

const PAYMENT_ICONS = [
  { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
  { value: 'banknote', label: 'Cash', icon: Banknote },
  { value: 'dollar-sign', label: 'Bank Transfer', icon: DollarSign },
];

export default function PaymentMethods() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    icon_name: 'credit-card',
    is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentCompany, isLoading: isCompanyLoading } = useCurrentCompany();
  const DEFAULT_COMPANY_ID = '550e8400-e29b-41d4-a716-446655440000';
  const activeCompanyId = currentCompany?.id || DEFAULT_COMPANY_ID;

  const { data: methods, isLoading: isMethodsLoading, error, retry: retryMethods } = usePaymentMethods(activeCompanyId);
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();

  const isLoading = isCompanyLoading || isMethodsLoading;

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      icon_name: 'credit-card',
      is_active: true,
    });
  };

  const handleCreateClick = () => {
    resetForm();
    setSelectedMethod(null);
    setShowCreateModal(true);
  };

  const handleEditClick = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      description: method.description || '',
      icon_name: method.icon_name || 'credit-card',
      is_active: method.is_active !== false,
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setShowDeleteModal(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Name and Code are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createMethod.mutateAsync({
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        company_id: activeCompanyId,
      });
      setShowCreateModal(false);
      resetForm();
      retryMethods();
    } catch (error: any) {
      console.error('Error creating payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedMethod?.id) {
      toast.error('Payment method ID is missing');
      return;
    }

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Name and Code are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMethod.mutateAsync({
        id: selectedMethod.id,
        data: {
          name: formData.name,
          code: formData.code,
          description: formData.description || undefined,
          is_active: formData.is_active,
        },
      });
      setShowEditModal(false);
      retryMethods();
    } catch (error: any) {
      console.error('Error updating payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMethod?.id) {
      toast.error('Payment method ID is missing');
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteMethod.mutateAsync(selectedMethod.id);
      setShowDeleteModal(false);
      retryMethods();
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Methods</h1>
          <p className="text-muted-foreground">
            Manage payment methods available to your customers
          </p>
        </div>
        <Button
          className="gradient-primary text-primary-foreground hover:opacity-90 shadow-card"
          size="lg"
          onClick={handleCreateClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Info Card */}
      <Card className="shadow-card bg-primary-light/5 border-primary/10">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Payment methods defined here will be available when recording customer payments and invoices. Make sure to activate at least one payment method for your business.
          </p>
        </CardContent>
      </Card>

      {/* Payment Methods Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Available Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">Error loading payment methods: {error.message}</p>
              <Button
                variant="outline"
                onClick={() => retryMethods()}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : !methods || methods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No payment methods defined yet</p>
              <Button
                className="gradient-primary text-primary-foreground"
                onClick={handleCreateClick}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Payment Method
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell className="font-mono text-sm">{method.code}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {method.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={method.is_active !== false ? 'bg-success-light text-success border-success/20' : 'bg-muted text-muted-foreground border-muted-foreground/20'}
                        >
                          {method.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(method)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(method)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Create a new payment method for your customers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name" className="text-sm font-medium">Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g., Credit Card"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="create-code" className="text-sm font-medium">Code *</Label>
              <Input
                id="create-code"
                placeholder="e.g., CC"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="create-description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="create-description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
            <DialogDescription>
              Update the payment method details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-sm font-medium">Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Credit Card"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-code" className="text-sm font-medium">Code *</Label>
              <Input
                id="edit-code"
                placeholder="e.g., CC"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={handleUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment method?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <p className="font-semibold text-foreground">{selectedMethod?.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              This action cannot be undone. If this payment method is referenced in any payments or documents, those references may be affected.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
