import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreateMaterial } from '@/hooks/useTransport';

interface CreateMaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  companyId: string;
}

export function CreateMaterialModal({ open, onOpenChange, onSuccess, companyId }: CreateMaterialModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMaterial = useCreateMaterial();

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Material name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await createMaterial.mutateAsync({
        ...formData,
        description: formData.description || undefined,
        unit: formData.unit || undefined,
        company_id: companyId,
      });
      
      toast.success('Material created successfully');
      setFormData({
        name: '',
        description: '',
        unit: '',
        status: 'active',
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error('Failed to create material');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
          <DialogDescription>
            Enter the material details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Material Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Rockland, Transport, Hardware"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter material description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="unit">Unit of Measurement</Label>
            <Input
              id="unit"
              placeholder="e.g., kg, tons, liters, pieces"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Material'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
