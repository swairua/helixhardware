import { useState, useEffect } from 'react';
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
import { useUpdateMaterial } from '@/hooks/useTransport';

interface Material {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  status: 'active' | 'inactive';
}

interface EditMaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material;
  onSuccess: () => void;
  companyId: string;
}

export function EditMaterialModal({ open, onOpenChange, material, onSuccess, companyId }: EditMaterialModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateMaterial = useUpdateMaterial();

  useEffect(() => {
    if (material && open) {
      setFormData({
        name: material.name || '',
        description: material.description || '',
        unit: material.unit || '',
        status: material.status || 'active',
      });
    }
  }, [material, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Material name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateMaterial.update(material.id, {
        ...formData,
        description: formData.description || undefined,
        unit: formData.unit || undefined,
        company_id: companyId,
      });

      toast.success('Material updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update material');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Material</DialogTitle>
          <DialogDescription>
            Update the material details below
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
