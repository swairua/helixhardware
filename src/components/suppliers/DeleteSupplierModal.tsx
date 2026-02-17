import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useDeleteSupplier } from '@/hooks/useDatabase';
import { useState } from 'react';

interface DeleteSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  supplier?: any;
}

export function DeleteSupplierModal({ open, onOpenChange, onSuccess, supplier }: DeleteSupplierModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteSupplier = useDeleteSupplier();

  if (!supplier) return null;

  const handleDelete = async () => {
    if (!supplier?.id) {
      toast.error('Supplier ID is missing');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSupplier.mutateAsync(supplier.id);
      toast.success(`Supplier ${supplier.name} deleted successfully!`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      const errorMessage = error?.message || 'Failed to delete supplier';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-destructive/10 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Supplier</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this supplier?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <p className="font-semibold text-foreground">{supplier?.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            This action cannot be undone. If this supplier is referenced in any purchase orders or other documents, those references may be affected.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Supplier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
