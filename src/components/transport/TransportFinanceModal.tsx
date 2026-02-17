import { useState, useMemo } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useCreateTransportFinance } from '@/hooks/useTransport';

interface Driver {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  vehicle_number: string;
}

interface Material {
  id: string;
  name: string;
}

interface TransportFinanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  companyId: string;
  drivers: Driver[];
  vehicles: Vehicle[];
  materials: Material[];
}

export function TransportFinanceModal({
  open,
  onOpenChange,
  onSuccess,
  companyId,
  drivers,
  vehicles,
  materials,
}: TransportFinanceModalProps) {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    material_id: '',
    buying_price: '',
    fuel_cost: '',
    driver_fees: '',
    other_expenses: '',
    selling_price: '',
    payment_status: 'unpaid' as 'paid' | 'unpaid' | 'pending',
    customer_name: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createFinance = useCreateTransportFinance();

  // Calculate profit/loss automatically
  const profitLoss = useMemo(() => {
    const buyingPrice = parseFloat(formData.buying_price) || 0;
    const fuelCost = parseFloat(formData.fuel_cost) || 0;
    const driverFees = parseFloat(formData.driver_fees) || 0;
    const otherExpenses = parseFloat(formData.other_expenses) || 0;
    const sellingPrice = parseFloat(formData.selling_price) || 0;
    
    const totalExpenses = buyingPrice + fuelCost + driverFees + otherExpenses;
    return sellingPrice - totalExpenses;
  }, [formData.buying_price, formData.fuel_cost, formData.driver_fees, formData.other_expenses, formData.selling_price]);

  const handleSubmit = async () => {
    if (!formData.vehicle_id) {
      toast.error('Vehicle is required');
      return;
    }

    if (!formData.material_id) {
      toast.error('Material is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await createFinance.mutateAsync({
        vehicle_id: formData.vehicle_id,
        material_id: formData.material_id,
        buying_price: parseFloat(formData.buying_price) || 0,
        fuel_cost: parseFloat(formData.fuel_cost) || 0,
        driver_fees: parseFloat(formData.driver_fees) || 0,
        other_expenses: parseFloat(formData.other_expenses) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        profit_loss: profitLoss,
        payment_status: formData.payment_status,
        customer_name: formData.customer_name || undefined,
        date: formData.date,
        company_id: companyId,
      });
      
      toast.success('Finance record created successfully');
      setFormData({
        vehicle_id: '',
        material_id: '',
        buying_price: '',
        fuel_cost: '',
        driver_fees: '',
        other_expenses: '',
        selling_price: '',
        payment_status: 'unpaid',
        customer_name: '',
        date: new Date().toISOString().split('T')[0],
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating finance record:', error);
      toast.error('Failed to create finance record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Transport Finance Record</DialogTitle>
          <DialogDescription>
            Enter the transport and financial details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Transport Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle">Vehicle *</Label>
              <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="material">Material *</Label>
              <Select value={formData.material_id} onValueChange={(value) => setFormData({ ...formData, material_id: value })}>
                <SelectTrigger id="material">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Customer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="customer">Customer Name</Label>
              <Input
                id="customer"
                placeholder="Enter customer name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Financial Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buying_price">Buying Price</Label>
                <Input
                  id="buying_price"
                  type="number"
                  placeholder="0.00"
                  value={formData.buying_price}
                  onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="fuel_cost">Fuel Cost</Label>
                <Input
                  id="fuel_cost"
                  type="number"
                  placeholder="0.00"
                  value={formData.fuel_cost}
                  onChange={(e) => setFormData({ ...formData, fuel_cost: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="driver_fees">Driver Fees</Label>
                <Input
                  id="driver_fees"
                  type="number"
                  placeholder="0.00"
                  value={formData.driver_fees}
                  onChange={(e) => setFormData({ ...formData, driver_fees: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="other_expenses">Other Expenses</Label>
                <Input
                  id="other_expenses"
                  type="number"
                  placeholder="0.00"
                  value={formData.other_expenses}
                  onChange={(e) => setFormData({ ...formData, other_expenses: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="selling_price">Selling Price</Label>
                <Input
                  id="selling_price"
                  type="number"
                  placeholder="0.00"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Profit/Loss Display */}
          <Card className={profitLoss >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Expenses</p>
                  <p className="font-semibold text-lg">
                    {((parseFloat(formData.buying_price) || 0) + 
                      (parseFloat(formData.fuel_cost) || 0) + 
                      (parseFloat(formData.driver_fees) || 0) + 
                      (parseFloat(formData.other_expenses) || 0)).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Selling Price</p>
                  <p className="font-semibold text-lg">
                    {(parseFloat(formData.selling_price) || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Profit/Loss</p>
                  <p className={`font-semibold text-lg ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitLoss.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <div>
            <Label htmlFor="payment_status">Payment Status</Label>
            <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value as 'paid' | 'unpaid' | 'pending' })}>
              <SelectTrigger id="payment_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
