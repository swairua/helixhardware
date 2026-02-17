import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Search,
  Trash2,
  Edit,
  Eye,
  Users,
  Truck as TruckIcon,
  Package as PackageIcon,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useCurrentCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import {
  useDrivers,
  useVehicles,
  useMaterials,
  useTransportFinance,
  useTransportPayments,
  useCreateDriver,
  useCreateVehicle,
  useCreateMaterial,
  useCreateTransportFinance,
  useDeleteDriver,
  useDeleteVehicle,
  useDeleteMaterial,
  useDeleteTransportFinance,
  useUpdateDriver,
  useUpdateVehicle,
  useUpdateMaterial,
  useUpdateTransportFinance
} from '@/hooks/useTransport';
import { CreateDriverModal } from '@/components/transport/CreateDriverModal';
import { EditDriverModal } from '@/components/transport/EditDriverModal';
import { CreateVehicleModal } from '@/components/transport/CreateVehicleModal';
import { EditVehicleModal } from '@/components/transport/EditVehicleModal';
import { CreateMaterialModal } from '@/components/transport/CreateMaterialModal';
import { EditMaterialModal } from '@/components/transport/EditMaterialModal';
import { TransportFinanceModal } from '@/components/transport/TransportFinanceModal';
import { EditTransportFinanceModal } from '@/components/transport/EditTransportFinanceModal';
import { RecordTripPaymentModal } from '@/components/transport/RecordTripPaymentModal';

interface Driver {
  id: string;
  name: string;
  phone?: string;
  license_number?: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type?: string;
  capacity?: number;
  status: 'active' | 'inactive' | 'maintenance';
  created_at?: string;
}

interface Material {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

interface TransportFinance {
  id: string;
  vehicle_id: string;
  vehicle_number?: string;
  material_id: string;
  materials?: string;
  buying_price: number;
  fuel_cost: number;
  driver_fees: number;
  other_expenses: number;
  selling_price: number;
  profit_loss: number;
  payment_status: 'paid' | 'unpaid' | 'pending';
  customer_name?: string;
  date: string;
}

interface TransportProps {
  initialTab?: 'drivers' | 'vehicles' | 'materials' | 'finance';
}

export default function Transport({ initialTab = 'drivers' }: TransportProps) {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'materials' | 'finance'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, location.pathname]);
  
  // Drivers state
  const [showCreateDriverModal, setShowCreateDriverModal] = useState(false);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  
  // Vehicles state
  const [showCreateVehicleModal, setShowCreateVehicleModal] = useState(false);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  // Materials state
  const [showCreateMaterialModal, setShowCreateMaterialModal] = useState(false);
  const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Finance state
  const [showCreateFinanceModal, setShowCreateFinanceModal] = useState(false);
  const [showEditFinanceModal, setShowEditFinanceModal] = useState(false);
  const [selectedFinance, setSelectedFinance] = useState<TransportFinance | null>(null);

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTripForPayment, setSelectedTripForPayment] = useState<TransportFinance | null>(null);

  const { currentCompany, isLoading: isCompanyLoading } = useCurrentCompany();
  const DEFAULT_COMPANY_ID = '550e8400-e29b-41d4-a716-446655440000';
  const activeCompanyId = currentCompany?.id || DEFAULT_COMPANY_ID;

  // Hooks
  const { data: drivers, isLoading: isDriversLoading, error: driversError, retry: retryDrivers } = useDrivers(activeCompanyId);
  const { data: vehicles, isLoading: isVehiclesLoading, error: vehiclesError, retry: retryVehicles } = useVehicles(activeCompanyId);
  const { data: materials, isLoading: isMaterialsLoading, error: materialsError, retry: retryMaterials } = useMaterials(activeCompanyId);
  const { data: finances, isLoading: isFinancesLoading, error: financesError, retry: retryFinances } = useTransportFinance(activeCompanyId);
  
  const deleteDriver = useDeleteDriver();
  const deleteVehicle = useDeleteVehicle();
  const deleteMaterial = useDeleteMaterial();
  const deleteFinance = useDeleteTransportFinance();

  const handleDeleteDriver = async (driverId: string) => {
    try {
      await deleteDriver.mutateAsync(driverId);
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      await deleteVehicle.mutateAsync(vehicleId);
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await deleteMaterial.mutateAsync(materialId);
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

  const handleDeleteFinance = async (financeId: string) => {
    try {
      await deleteFinance.mutateAsync(financeId);
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

  const filteredDrivers = drivers?.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone?.includes(searchTerm) ||
    driver.license_number?.includes(searchTerm)
  ) || [];

  const filteredVehicles = vehicles?.filter(vehicle =>
    vehicle.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredMaterials = materials?.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredFinances = finances?.filter(finance =>
    finance.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finance.materials?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finance.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get section title and description based on active tab
  const getSectionInfo = () => {
    switch (activeTab) {
      case 'drivers':
        return { title: 'Drivers', description: 'Manage and track all drivers' };
      case 'vehicles':
        return { title: 'Vehicles', description: 'Manage and track all vehicles' };
      case 'materials':
        return { title: 'Materials', description: 'Manage transport materials' };
      case 'finance':
        return { title: 'Finance', description: 'Track transport finance and costs' };
      default:
        return { title: 'Transport Management', description: 'Manage drivers, vehicles, materials, and transport finances' };
    }
  };

  const sectionInfo = getSectionInfo();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{sectionInfo.title}</h1>
          <p className="text-muted-foreground mt-1">{sectionInfo.description}</p>
        </div>
      </div>

      {/* Drivers Section */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search drivers by name, phone, or license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Button onClick={() => setShowCreateDriverModal(true)} className="ml-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              {driversError && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4" />
                  Failed to load drivers. <Button variant="link" size="sm" onClick={() => retryDrivers()}>Retry</Button>
                </div>
              )}
              
              {isDriversLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No drivers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDrivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell className="font-medium">{driver.name}</TableCell>
                          <TableCell>{driver.phone || '-'}</TableCell>
                          <TableCell>{driver.license_number || '-'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={driver.status === 'active' ? 'default' : 'secondary'}
                              className={driver.status === 'active' ? 'bg-green-600' : ''}
                            >
                              {driver.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedDriver(driver);
                                  setShowEditDriverModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDriver(driver.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vehicles Section */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search vehicles by number or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Button onClick={() => setShowCreateVehicleModal(true)} className="ml-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              {vehiclesError && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4" />
                  Failed to load vehicles. <Button variant="link" size="sm" onClick={() => retryVehicles()}>Retry</Button>
                </div>
              )}

              {isVehiclesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No vehicles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">{vehicle.vehicle_number}</TableCell>
                          <TableCell>{vehicle.vehicle_type || '-'}</TableCell>
                          <TableCell>{vehicle.capacity ? `${vehicle.capacity} kg` : '-'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={vehicle.status === 'active' ? 'default' : 'secondary'}
                              className={vehicle.status === 'active' ? 'bg-green-600' : vehicle.status === 'maintenance' ? 'bg-yellow-600' : ''}
                            >
                              {vehicle.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedVehicle(vehicle);
                                  setShowEditVehicleModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Materials Section */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Button onClick={() => setShowCreateMaterialModal(true)} className="ml-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Materials</CardTitle>
            </CardHeader>
            <CardContent>
              {materialsError && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4" />
                  Failed to load materials. <Button variant="link" size="sm" onClick={() => retryMaterials()}>Retry</Button>
                </div>
              )}

              {isMaterialsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No materials found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>{material.description || '-'}</TableCell>
                          <TableCell>{material.unit || '-'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={material.status === 'active' ? 'default' : 'secondary'}
                              className={material.status === 'active' ? 'bg-green-600' : ''}
                            >
                              {material.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMaterial(material);
                                  setShowEditMaterialModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMaterial(material.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Finance Section - Trips */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle, material, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Button onClick={() => setShowCreateFinanceModal(true)} className="ml-2">
              <Plus className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transport Trips & Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {financesError && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4" />
                  Failed to load trips. <Button variant="link" size="sm" onClick={() => retryFinances()}>Retry</Button>
                </div>
              )}

              {isFinancesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Vehicle ID</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Buying Price</TableHead>
                        <TableHead className="text-right">Fuel Cost</TableHead>
                        <TableHead className="text-right">Driver Fees</TableHead>
                        <TableHead className="text-right">Other Expenses</TableHead>
                        <TableHead className="text-right">Selling Price</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFinances.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-4 text-muted-foreground">
                            No trips found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFinances.map((finance) => (
                          <TableRow key={finance.id}>
                            <TableCell className="text-sm">{finance.date || '-'}</TableCell>
                            <TableCell className="font-medium">{finance.vehicle_number || '-'}</TableCell>
                            <TableCell>{finance.materials || '-'}</TableCell>
                            <TableCell className="text-right">{(finance.buying_price || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right">{(finance.fuel_cost || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right">{(finance.driver_fees || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right">{(finance.other_expenses || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">{(finance.selling_price || 0).toLocaleString()}</TableCell>
                            <TableCell className={`text-right font-medium ${(finance.profit_loss ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {finance.profit_loss?.toLocaleString() || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={finance.payment_status === 'paid' ? 'default' : 'secondary'}
                                className={finance.payment_status === 'paid' ? 'bg-green-600' : finance.payment_status === 'unpaid' ? 'bg-red-600' : 'bg-yellow-600'}
                              >
                                {finance.payment_status}
                              </Badge>
                            </TableCell>
                            <TableCell>{finance.customer_name || '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTripForPayment(finance);
                                    setShowPaymentModal(true);
                                  }}
                                  disabled={finance.payment_status === 'paid'}
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Payment
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFinance(finance);
                                    setShowEditFinanceModal(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteFinance(finance.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <CreateDriverModal 
        open={showCreateDriverModal} 
        onOpenChange={setShowCreateDriverModal}
        onSuccess={() => {
          retryDrivers();
          setShowCreateDriverModal(false);
        }}
        companyId={activeCompanyId}
      />
      
      {selectedDriver && (
        <EditDriverModal 
          open={showEditDriverModal} 
          onOpenChange={setShowEditDriverModal}
          driver={selectedDriver}
          onSuccess={() => {
            retryDrivers();
            setShowEditDriverModal(false);
            setSelectedDriver(null);
          }}
          companyId={activeCompanyId}
        />
      )}

      <CreateVehicleModal 
        open={showCreateVehicleModal} 
        onOpenChange={setShowCreateVehicleModal}
        onSuccess={() => {
          retryVehicles();
          setShowCreateVehicleModal(false);
        }}
        companyId={activeCompanyId}
      />
      
      {selectedVehicle && (
        <EditVehicleModal 
          open={showEditVehicleModal} 
          onOpenChange={setShowEditVehicleModal}
          vehicle={selectedVehicle}
          onSuccess={() => {
            retryVehicles();
            setShowEditVehicleModal(false);
            setSelectedVehicle(null);
          }}
          companyId={activeCompanyId}
        />
      )}

      <CreateMaterialModal 
        open={showCreateMaterialModal} 
        onOpenChange={setShowCreateMaterialModal}
        onSuccess={() => {
          retryMaterials();
          setShowCreateMaterialModal(false);
        }}
        companyId={activeCompanyId}
      />
      
      {selectedMaterial && (
        <EditMaterialModal 
          open={showEditMaterialModal} 
          onOpenChange={setShowEditMaterialModal}
          material={selectedMaterial}
          onSuccess={() => {
            retryMaterials();
            setShowEditMaterialModal(false);
            setSelectedMaterial(null);
          }}
          companyId={activeCompanyId}
        />
      )}

      <TransportFinanceModal 
        open={showCreateFinanceModal} 
        onOpenChange={setShowCreateFinanceModal}
        onSuccess={() => {
          retryFinances();
          setShowCreateFinanceModal(false);
        }}
        companyId={activeCompanyId}
        drivers={drivers || []}
        vehicles={vehicles || []}
        materials={materials || []}
      />
      
      {selectedFinance && (
        <EditTransportFinanceModal
          open={showEditFinanceModal}
          onOpenChange={setShowEditFinanceModal}
          finance={selectedFinance}
          onSuccess={() => {
            retryFinances();
            setShowEditFinanceModal(false);
            setSelectedFinance(null);
          }}
          companyId={activeCompanyId}
          drivers={drivers || []}
          vehicles={vehicles || []}
          materials={materials || []}
        />
      )}

      <RecordTripPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onSuccess={() => {
          retryFinances();
          setShowPaymentModal(false);
          setSelectedTripForPayment(null);
        }}
        trip={selectedTripForPayment}
        companyId={activeCompanyId}
      />
    </div>
  );
}
