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
import { useUpdateDriver } from '@/hooks/useTransport';

interface Driver {
  id: string;
  name: string;
  phone?: string;
  license_number?: string;
  status: 'active' | 'inactive';
}

interface EditDriverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver;
  onSuccess: () => void;
  companyId: string;
}

export function EditDriverModal({ open, onOpenChange, driver, onSuccess, companyId }: EditDriverModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateDriver = useUpdateDriver();

  useEffect(() => {
    if (driver && open) {
      setFormData({
        name: driver.name || '',
        phone: driver.phone || '',
        license_number: driver.license_number || '',
        status: driver.status || 'active',
      });
    }
  }, [driver, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Driver name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateDriver.update(driver.id, {
        ...formData,
        company_id: companyId,
      });

      toast.success('Driver updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating driver:', error);
      toast.error('Failed to update driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Driver</DialogTitle>
          <DialogDescription>
            Update the driver details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Enter driver name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="license">License Number</Label>
            <Input
              id="license"
              placeholder="Enter license number"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
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
