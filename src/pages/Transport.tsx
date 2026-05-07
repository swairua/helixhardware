import { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Download,
  FileText,
  ChevronDown
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
  useUpdateTransportFinance,
  useCreateTransportPayment,
  useDeleteTransportPayment
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
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal';
import { CreatePaymentModal } from '@/components/transport/CreatePaymentModal';
import { EditPaymentModal } from '@/components/transport/EditPaymentModal';
import { generateAuditReport, AuditReport, AuditIssue } from '@/utils/financeAudit';

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
  initialTab?: 'drivers' | 'vehicles' | 'materials' | 'finance' | 'payments';
}

export default function Transport({ initialTab = 'drivers' }: TransportProps) {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'materials' | 'finance' | 'payments'>(initialTab);

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

  // Invoice creation state
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [selectedTripForInvoice, setSelectedTripForInvoice] = useState<TransportFinance | null>(null);

  // Payments page state
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending'>('all');
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState<any>(null);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);

  // Audit state
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [showAuditDetails, setShowAuditDetails] = useState(false);
  const [recordsWithIssues, setRecordsWithIssues] = useState<Set<string>>(new Set());

  const { currentCompany, isLoading: isCompanyLoading } = useCurrentCompany();
  const DEFAULT_COMPANY_ID = '550e8400-e29b-41d4-a716-446655440000';
  const activeCompanyId = currentCompany?.id || DEFAULT_COMPANY_ID;

  // Hooks
  const { data: drivers, isLoading: isDriversLoading, error: driversError, retry: retryDrivers } = useDrivers(activeCompanyId);
  const { data: vehicles, isLoading: isVehiclesLoading, error: vehiclesError, retry: retryVehicles } = useVehicles(activeCompanyId);
  const { data: materials, isLoading: isMaterialsLoading, error: materialsError, retry: retryMaterials } = useMaterials(activeCompanyId);
  const { data: finances, isLoading: isFinancesLoading, error: financesError, retry: retryFinances } = useTransportFinance(activeCompanyId);
  const { data: payments, isLoading: isPaymentsLoading, error: paymentsError, retry: retryPayments } = useTransportPayments();

  const deleteDriver = useDeleteDriver();
  const deleteVehicle = useDeleteVehicle();
  const deleteMaterial = useDeleteMaterial();
  const deleteFinance = useDeleteTransportFinance();
  const createPayment = useCreateTransportPayment();
  const deletePayment = useDeleteTransportPayment();

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

  const enrichedFinances = useMemo(() => {
    return finances?.map(finance => {
      const vehicle = vehicles?.find(v => v.id === finance.vehicle_id);
      const material = materials?.find(m => m.id === finance.material_id);
      return {
        ...finance,
        vehicle_number: vehicle?.vehicle_number || finance.vehicle_number,
        materials: material?.name || finance.materials
      };
    }) || [];
  }, [finances, vehicles, materials]);

  // Generate audit report
  useMemo(() => {
    if (enrichedFinances.length > 0) {
      const report = generateAuditReport(
        enrichedFinances,
        payments || [],
        vehicles || [],
        materials || []
      );
      setAuditReport(report);

      const issueRecordIds = new Set(report.issues.map(issue => issue.recordId));
      setRecordsWithIssues(issueRecordIds);
    }
  }, [enrichedFinances, payments, vehicles, materials]);

  const filteredFinances = enrichedFinances.filter(finance =>
    finance.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finance.materials?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finance.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enrichedPayments = useMemo(() => {
    return payments?.map(payment => {
      const finance = finances?.find(f => f.id === payment.trip_id);
      const vehicle = vehicles?.find(v => v.id === finance?.vehicle_id);
      return {
        ...payment,
        vehicle_number: vehicle?.vehicle_number || finance?.vehicle_number,
        finance_date: finance?.date,
        customer_name: finance?.customer_name,
        selling_price: finance?.selling_price
      };
    }) || [];
  }, [payments, finances, vehicles]);

  const filteredPayments = useMemo(() => {
    let result = enrichedPayments.filter(payment =>
      payment.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (paymentStatusFilter === 'pending') {
      const finance = finances?.find(f => f.id === result[0]?.trip_id);
      result = result.filter(payment => {
        const relatedFinance = finances?.find(f => f.id === payment.trip_id);
        return relatedFinance?.payment_status !== 'paid';
      });
    }

    return result;
  }, [enrichedPayments, searchTerm, paymentStatusFilter, finances]);

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await deletePayment.mutateAsync(paymentId);
      retryPayments();
      retryFinances();
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

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
      case 'payments':
        return { title: 'Payments', description: 'Review and manage transport payments' };
      default:
        return { title: 'Transport Management', description: 'Manage drivers, vehicles, materials, and transport finances' };
    }
  };

  const sectionInfo = getSectionInfo();

  const handleExportFinance = () => {
    if (filteredFinances.length === 0) {
      toast.error('No data to export');
      return;
    }

    const formatCSVValue = (value: number) => {
      if (!isFinite(value)) return '0.00';
      return value.toFixed(2);
    };

    const headers = [
      'Date',
      'Vehicle ID',
      'Material',
      'Buying Price',
      'Fuel Cost',
      'Driver Fees',
      'Other Expenses',
      'Selling Price',
      'Profit',
      'Payment Status',
      'Customer'
    ];

    const rows = filteredFinances.map(finance => {
      const profit = (finance.selling_price || 0) -
        ((finance.buying_price || 0) + (finance.fuel_cost || 0) +
         (finance.driver_fees || 0) + (finance.other_expenses || 0));

      return [
        finance.date || '-',
        String(finance.vehicle_number || '-'),
        String(finance.materials || '-'),
        formatCSVValue(Number(finance.buying_price) || 0),
        formatCSVValue(Number(finance.fuel_cost) || 0),
        formatCSVValue(Number(finance.driver_fees) || 0),
        formatCSVValue(Number(finance.other_expenses) || 0),
        formatCSVValue(Number(finance.selling_price) || 0),
        formatCSVValue(profit),
        String(finance.payment_status || '-'),
        String(finance.customer_name || '-')
      ];
    });

    const csvContent = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Use BOM for UTF-8 to help Excel
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transport-finance-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Finance summary exported successfully!');
  };

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
            <div className="flex gap-2 ml-2">
              {auditReport && auditReport.issuesFound > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowAuditDetails(!showAuditDetails)}
                  className="text-amber-600 hover:text-amber-700"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Audit Issues ({auditReport.issuesFound})
                </Button>
              )}
              <Button variant="outline" onClick={handleExportFinance}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowCreateFinanceModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Trip
              </Button>
            </div>
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

              {/* Data Quality Dashboard */}
              {!isFinancesLoading && auditReport && (
                <Card className="mb-4 border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-blue-900 text-base">Data Quality Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4 lg:grid-cols-5">
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-blue-600 font-bold text-lg">{auditReport.totalRecords}</p>
                        <p className="text-blue-700 text-xs mt-1">Total Records</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-green-600 font-bold text-lg">{auditReport.totalRecords - auditReport.issuesFound}</p>
                        <p className="text-blue-700 text-xs mt-1">Valid Records</p>
                      </div>
                      <div className={`p-3 rounded border ${auditReport.issuesFound > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-blue-200'}`}>
                        <p className={`${auditReport.issuesFound > 0 ? 'text-amber-600' : 'text-green-600'} font-bold text-lg`}>{auditReport.issuesFound}</p>
                        <p className="text-blue-700 text-xs mt-1">Issues Found</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-purple-600 font-bold text-lg">
                          {payments && finances ? Math.round((payments.length / finances.length) * 100) : 0}%
                        </p>
                        <p className="text-blue-700 text-xs mt-1">Payment Coverage</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className={`font-bold text-lg ${!auditReport.issuesFound ? 'text-green-600' : 'text-amber-600'}`}>
                          {!auditReport.issuesFound ? '✓ Pass' : '⚠ Review'}
                        </p>
                        <p className="text-blue-700 text-xs mt-1">Status</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Audit Results Panel */}
              {!isFinancesLoading && auditReport && auditReport.issuesFound > 0 && (
                <Card className="mb-4 border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <CardTitle className="text-amber-900">Data Audit Results</CardTitle>
                          <p className="text-sm text-amber-800 mt-1">
                            {auditReport.issuesFound} issue{auditReport.issuesFound !== 1 ? 's' : ''} found in {auditReport.totalRecords} record{auditReport.totalRecords !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAuditDetails(!showAuditDetails)}
                        className="text-amber-600 hover:text-amber-700"
                      >
                        {showAuditDetails ? 'Hide' : 'View'} Details
                      </Button>
                    </div>
                  </CardHeader>
                  {showAuditDetails && (
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
                        <div>
                          <p className="text-amber-600 font-semibold">{auditReport.summary.profitCalculationErrors}</p>
                          <p className="text-amber-800 text-xs">Calculation Errors</p>
                        </div>
                        <div>
                          <p className="text-amber-600 font-semibold">{auditReport.summary.paymentStatusMismatches}</p>
                          <p className="text-amber-800 text-xs">Payment Mismatches</p>
                        </div>
                        <div>
                          <p className="text-amber-600 font-semibold">{auditReport.summary.missingReferences}</p>
                          <p className="text-amber-800 text-xs">Missing References</p>
                        </div>
                        <div>
                          <p className="text-amber-600 font-semibold">{auditReport.summary.nullFieldErrors}</p>
                          <p className="text-amber-800 text-xs">Null Fields</p>
                        </div>
                        <div>
                          <p className="text-amber-600 font-semibold">{auditReport.summary.duplicateErrors}</p>
                          <p className="text-amber-800 text-xs">Duplicates</p>
                        </div>
                      </div>
                      {auditReport.issues.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                          <p className="text-sm font-medium text-amber-900">Issues:</p>
                          {auditReport.issues.slice(0, 5).map((issue, idx) => (
                            <div key={idx} className="text-xs p-2 bg-white rounded border border-amber-100">
                              <p className="font-medium text-amber-900">{issue.type.replace(/_/g, ' ')}</p>
                              <p className="text-amber-800">{issue.message}</p>
                            </div>
                          ))}
                          {auditReport.issues.length > 5 && (
                            <p className="text-xs text-amber-700">+ {auditReport.issues.length - 5} more issues</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
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
                        filteredFinances.map((finance) => {
                          const hasIssues = recordsWithIssues.has(finance.id);
                          return (
                          <TableRow key={finance.id} className={hasIssues ? 'bg-amber-50' : ''}>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2">
                                {hasIssues && <AlertCircle className="h-4 w-4 text-amber-600" />}
                                {finance.date || '-'}
                              </div>
                            </TableCell>
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
                                    setSelectedTripForInvoice(finance);
                                    setShowCreateInvoiceModal(true);
                                  }}
                                  title="Create an invoice from this trip"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Invoice
                                </Button>
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
                        );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transport Payments</CardTitle>
                <Button
                  onClick={() => setShowCreatePaymentModal(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="flex gap-4 items-center flex-wrap">
                <div className="relative flex-1 min-w-xs">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by vehicle, reference, or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={paymentStatusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentStatusFilter('all')}
                  >
                    All Payments
                  </Button>
                  <Button
                    variant={paymentStatusFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentStatusFilter('pending')}
                  >
                    Pending Only
                  </Button>
                </div>
              </div>

              {/* Error Banner */}
              {paymentsError && (
                <div className="flex items-center justify-between bg-red-50 border border-red-200 p-4 rounded">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>Failed to load payments. Please try again.</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => retryPayments()}
                    className="text-red-600 hover:text-red-700"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Payments Table */}
              {isPaymentsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                            No payments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayments.map((payment) => {
                          const relatedFinance = finances?.find(f => f.id === payment.trip_id);
                          return (
                            <TableRow key={payment.id}>
                              <TableCell>{new Date(payment.payment_date || payment.date || Date.now()).toLocaleDateString()}</TableCell>
                              <TableCell>{payment.vehicle_number || '-'}</TableCell>
                              <TableCell className="text-right font-medium">
                                {(payment.payment_amount !== undefined && payment.payment_amount !== null)
                                  ? payment.payment_amount.toLocaleString()
                                  : (payment.amount !== undefined && payment.amount !== null)
                                  ? payment.amount.toLocaleString()
                                  : '-'}
                              </TableCell>
                              <TableCell>{payment.payment_method || '-'}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={relatedFinance?.payment_status === 'paid' ? 'default' : 'secondary'}
                                  className={relatedFinance?.payment_status === 'paid' ? 'bg-green-600' : relatedFinance?.payment_status === 'unpaid' ? 'bg-red-600' : 'bg-yellow-600'}
                                >
                                  {relatedFinance?.payment_status || 'unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell>{payment.reference_number || '-'}</TableCell>
                              <TableCell>{payment.customer_name || '-'}</TableCell>
                              <TableCell>{payment.notes || '-'}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPaymentForEdit(payment);
                                      setShowEditPaymentModal(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePayment(payment.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
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

      {selectedTripForInvoice && (
        <CreateInvoiceModal
          open={showCreateInvoiceModal}
          onOpenChange={setShowCreateInvoiceModal}
          onSuccess={() => {
            setShowCreateInvoiceModal(false);
            setSelectedTripForInvoice(null);
            toast.success('Invoice created successfully!');
          }}
          transportFinanceData={{
            customer_name: selectedTripForInvoice.customer_name,
            date: selectedTripForInvoice.date,
            selling_price: selectedTripForInvoice.selling_price,
            vehicle_number: selectedTripForInvoice.vehicle_number,
            materials: selectedTripForInvoice.materials,
            id: selectedTripForInvoice.id
          }}
        />
      )}

      <CreatePaymentModal
        open={showCreatePaymentModal}
        onOpenChange={setShowCreatePaymentModal}
        onSuccess={() => {
          retryPayments();
          retryFinances();
          setShowCreatePaymentModal(false);
        }}
        companyId={activeCompanyId}
      />

      {selectedPaymentForEdit && (
        <EditPaymentModal
          open={showEditPaymentModal}
          onOpenChange={setShowEditPaymentModal}
          payment={selectedPaymentForEdit}
          onSuccess={() => {
            retryPayments();
            retryFinances();
            setShowEditPaymentModal(false);
            setSelectedPaymentForEdit(null);
          }}
        />
      )}
    </div>
  );
}
