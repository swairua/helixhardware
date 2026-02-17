import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
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
  Filter,
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  Trash2
} from 'lucide-react';
import { useSuppliers } from '@/hooks/useDatabase';
import { useCurrentCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { EditSupplierModal } from '@/components/suppliers/EditSupplierModal';
import { ViewSupplierModal } from '@/components/suppliers/ViewSupplierModal';
import { CreateSupplierModal } from '@/components/suppliers/CreateSupplierModal';
import { DeleteSupplierModal } from '@/components/suppliers/DeleteSupplierModal';

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  payment_terms?: string;
  status?: string;
  created_at?: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-success-light text-success border-success/20';
    case 'inactive':
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
    default:
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
  }
}

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');

  const { currentCompany, isLoading: isCompanyLoading } = useCurrentCompany();
  const DEFAULT_COMPANY_ID = '550e8400-e29b-41d4-a716-446655440000';
  const activeCompanyId = currentCompany?.id || DEFAULT_COMPANY_ID;

  const { data: suppliers, isLoading: isSuppliersLoading, error, retry: retrySuppliers } = useSuppliers(activeCompanyId);

  const isLoading = isCompanyLoading || isSuppliersLoading;

  // Filter and search logic
  const filteredSuppliers = suppliers?.filter(supplier => {
    // Search filter
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' ||
      supplier.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  const handleCreateSupplier = () => {
    setShowCreateModal(true);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowViewModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  const handleSendEmail = (email: string) => {
    if (email && email !== 'supplier@example.com') {
      try {
        window.open(`mailto:${email}`, '_blank');
        toast.success(`Opening email client to send to ${email}`);
      } catch (error) {
        toast.error('Failed to open email client');
      }
    } else {
      toast.error('No valid email address available');
    }
  };

  const handleCall = (phone: string) => {
    if (phone && phone !== '+254 700 000000') {
      try {
        window.open(`tel:${phone}`, '_blank');
        toast.success(`Initiating call to ${phone}`);
      } catch (error) {
        toast.error('Failed to initiate call');
      }
    } else {
      toast.error('No valid phone number available');
    }
  };

  const [showFilters, setShowFilters] = useState(false);

  const handleFilter = () => {
    setShowFilters(!showFilters);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    toast.success('Filters cleared');
  };

  const handleEditSuccess = () => {
    setSelectedSupplier(null);
    retrySuppliers();
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    retrySuppliers();
  };

  const handleDeleteSuccess = () => {
    setSelectedSupplier(null);
    retrySuppliers();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
            <p className="text-muted-foreground">Manage your supplier database</p>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive">Error loading suppliers: {error.message}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your supplier database and relationships
          </p>
        </div>
        <Button
          className="gradient-primary text-primary-foreground hover:opacity-90 shadow-card"
          size="lg"
          onClick={handleCreateSupplier}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Supplier
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-4 space-y-4">
                <div className="space-y-3">
                  <Label className="font-semibold">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </PopoverContent>
            </Popover>

            <div className="text-sm text-muted-foreground">
              {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Supplier List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No suppliers found</p>
              <Button
                className="mt-4 gradient-primary text-primary-foreground"
                onClick={handleCreateSupplier}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Supplier
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact_person || '-'}</TableCell>
                      <TableCell>
                        {supplier.email ? (
                          <button
                            onClick={() => handleSendEmail(supplier.email!)}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Mail className="h-4 w-4" />
                            {supplier.email}
                          </button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.phone ? (
                          <button
                            onClick={() => handleCall(supplier.phone!)}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Phone className="h-4 w-4" />
                            {supplier.phone}
                          </button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{supplier.payment_terms || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(supplier.status || 'active')}>
                          {(supplier.status || 'active').charAt(0).toUpperCase() + (supplier.status || 'active').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSupplier(supplier)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSupplier(supplier)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSupplier(supplier)}
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

      {/* Modals */}
      <CreateSupplierModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
        companyId={activeCompanyId}
      />
      <ViewSupplierModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        supplier={selectedSupplier}
      />
      <EditSupplierModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={handleEditSuccess}
        supplier={selectedSupplier}
      />
      <DeleteSupplierModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onSuccess={handleDeleteSuccess}
        supplier={selectedSupplier}
      />
    </div>
  );
}
