import { useState, useEffect } from 'react';
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
import { useUpdateVehicle } from '@/hooks/useTransport';

interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type?: string;
  capacity?: number;
  status: 'active' | 'inactive' | 'maintenance';
}

interface EditVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle;
  onSuccess: () => void;
  companyId: string;
}

export function EditVehicleModal({ open, onOpenChange, vehicle, onSuccess, companyId }: EditVehicleModalProps) {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: '',
    capacity: '',
    status: 'active' as 'active' | 'inactive' | 'maintenance',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateVehicle = useUpdateVehicle();

  useEffect(() => {
    if (vehicle && open) {
      setFormData({
        vehicle_number: vehicle.vehicle_number || '',
        vehicle_type: vehicle.vehicle_type || '',
        capacity: vehicle.capacity ? vehicle.capacity.toString() : '',
        status: vehicle.status || 'active',
      });
    }
  }, [vehicle, open]);

  const handleSubmit = async () => {
    if (!formData.vehicle_number.trim()) {
      toast.error('Vehicle number is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateVehicle.update(vehicle.id, {
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        status: formData.status,
        company_id: companyId,
      });

      toast.success('Vehicle updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error('Failed to update vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update the vehicle details below
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
