import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreateVehicle } from '@/hooks/useTransport';

interface CreateVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  companyId: string;
}

export function CreateVehicleModal({ open, onOpenChange, onSuccess, companyId }: CreateVehicleModalProps) {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: '',
    capacity: '',
    status: 'active' as 'active' | 'inactive' | 'maintenance',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createVehicle = useCreateVehicle();

  const handleSubmit = async () => {
    if (!formData.vehicle_number.trim()) {
      toast.error('Vehicle number is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await createVehicle.mutateAsync({
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        status: formData.status,
        company_id: companyId,
      });
      
      toast.success('Vehicle created successfully');
      setFormData({
        vehicle_number: '',
        vehicle_type: '',
        capacity: '',
        status: 'active',
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast.error('Failed to create vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>
            Enter the vehicle details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="vehicle_number">Vehicle Number *</Label>
            <Input
              id="vehicle_number"
              placeholder="e.g., KCE 2838"
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Input
              id="vehicle_type"
              placeholder="e.g., Truck, Van, Motorcycle"
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="capacity">Capacity (kg)</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="Enter capacity in kg"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' | 'maintenance' })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Vehicle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
