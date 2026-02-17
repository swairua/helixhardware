import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import { enableResizeObserverErrorSuppression } from "@/utils/resizeObserverErrorHandler";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CompanyProvider } from "@/contexts/CompanyContext";
import Index from "./pages/Index";
import Quotations from "./pages/Quotations";
import Invoices from "./pages/Invoices";
import DirectReceipts from "./pages/DirectReceipts";
import Payments from "./pages/Payments";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import DeliveryNotes from "./pages/DeliveryNotes";
import Proforma from "./pages/Proforma";
import SalesReports from "./pages/reports/SalesReports";
import InventoryReports from "./pages/reports/InventoryReports";
import StatementOfAccounts from "./pages/reports/StatementOfAccounts";
import TradingPLReport from "./pages/reports/TradingPLReport";
import TransportPLReport from "./pages/reports/TransportPLReport";
import ConsolidatedPLReport from "./pages/reports/ConsolidatedPLReport";
import CompanySettings from "./pages/settings/CompanySettings";
import UserManagement from "./pages/settings/UserManagement";
import DatabaseRolesSettings from "./pages/settings/DatabaseRolesSettings";
import RemittanceAdvice from "./pages/RemittanceAdvice";
import AuditLogs from "./pages/AuditLogs";
import LPOs from "./pages/LPOs";
import CreditNotes from "./pages/CreditNotes";
import Suppliers from "./pages/Suppliers";
import StockMovements from "./pages/StockMovements";
import WebManager from "./pages/WebManager";
import Transport from "./pages/Transport";
import NotFound from "./pages/NotFound";
import PaymentSynchronizationPage from "./pages/PaymentSynchronization";
import OptimizedInventory from "./pages/OptimizedInventory";
import PerformanceOptimizerPage from "./pages/PerformanceOptimizerPage";
import OptimizedCustomers from "./pages/OptimizedCustomers";
import CustomerPerformanceOptimizerPage from "./pages/CustomerPerformanceOptimizerPage";
import SetupAndTest from "./components/SetupAndTest";
import AuthTest from "./components/AuthTest";
import DatabaseDebug from "./pages/DatabaseDebug";
import AdminInit from "./pages/AdminInit";
import AdminInitExternal from "./pages/AdminInitExternal";
import DatabaseManagementAdmin from "./pages/DatabaseManagementAdmin";
import { APIDiagnosticsPage } from "./pages/APIDiagnosticsPage";
import PaymentMethods from "./pages/settings/PaymentMethods";
import Login from "./pages/Login";
import ImageManagement from "./pages/admin/ImageManagement";
import NetworkDiagnosticsPage from "./pages/NetworkDiagnostics";

const App = () => {

  useEffect(() => {
    // Suppress ResizeObserver loop errors
    enableResizeObserverErrorSuppression();
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        {/* Admin initialization route - Accessible without authentication */}
        <Route path="/admin-init" element={<AdminInit />} />

        {/* External API admin initialization route */}
        <Route path="/admin-init-external" element={<AdminInitExternal />} />

        {/* Debug routes - Accessible without authentication */}
        <Route path="/debug/database" element={<DatabaseDebug />} />
        <Route path="/debug/api" element={<APIDiagnosticsPage />} />
        <Route path="/debug/network" element={<NetworkDiagnosticsPage />} />

        {/* Login route - Accessible without authentication */}
        <Route path="/login" element={<Login />} />

        {/* All other routes wrapped in Layout */}
        <Route
          path="*"
          element={
            <CompanyProvider>
              <Layout>
              <Routes>
                {/* Redirect root to app dashboard */}
                <Route path="/" element={<Navigate to="/app" replace />} />

                {/* App Routes - Protected */}
                {/* Dashboard */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Index />
                    </ProtectedRoute>
                  }
                />

                {/* Sales & Customer Management */}
                <Route
                  path="/app/quotations"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Quotations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/quotations/new"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Quotations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/customers"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/customers/new"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Customers />
                    </ProtectedRoute>
                  }
                />

                {/* Financial Management */}
                <Route
                  path="/app/invoices"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Invoices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/invoices/new"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Invoices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/direct-receipts"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <DirectReceipts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/direct-receipts/new"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <DirectReceipts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/payments"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Payments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/payments/new"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Payments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/credit-notes"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <CreditNotes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/credit-notes/new"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <CreditNotes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/proforma"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Proforma />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/app/admin/audit-logs"
                  element={
                    <ProtectedRoute requireAuth={true} requiredRole="admin">
                      <AuditLogs />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/app/admin/database"
                  element={
                    <ProtectedRoute requireAuth={true} requiredRole="admin">
                      <DatabaseManagementAdmin />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/app/admin/images"
                  element={
                    <ProtectedRoute requireAuth={true} requiredRole="admin">
                      <ImageManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Procurement & Inventory */}
                <Route
                  path="/app/lpos"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <LPOs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/lpos/new"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <LPOs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/suppliers"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Suppliers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/inventory"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Inventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/inventory/new"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Inventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/stock-movements"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <StockMovements />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/delivery-notes"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <DeliveryNotes />
                    </ProtectedRoute>
                  }
                />

                {/* Transport Management */}
                <Route
                  path="/app/transport"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Transport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/transport/drivers"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Transport initialTab="drivers" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/transport/vehicles"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Transport initialTab="vehicles" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/transport/materials"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Transport initialTab="materials" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/transport/finance"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Transport initialTab="finance" />
                    </ProtectedRoute>
                  }
                />

                {/* Additional Features */}
                <Route
                  path="/app/remittance"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <RemittanceAdvice />
                    </ProtectedRoute>
                  }
                />

                {/* Reports */}
                <Route
                  path="/app/reports/sales"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <SalesReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/reports/inventory"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <InventoryReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/reports/statements"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <StatementOfAccounts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/reports/trading-pl"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <TradingPLReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/reports/transport-pl"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <TransportPLReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/reports/consolidated-pl"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <ConsolidatedPLReport />
                    </ProtectedRoute>
                  }
                />

                {/* Web Manager */}
                <Route
                  path="/app/web-manager"
                  element={
                    <ProtectedRoute requireAuth={true} requiredRole="admin">
                      <WebManager />
                    </ProtectedRoute>
                  }
                />

                {/* Settings */}
                <Route
                  path="/app/settings/company"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <CompanySettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/settings/users"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/settings/payment-methods"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <PaymentMethods />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/settings/database-roles"
                  element={
                    <ProtectedRoute requireAuth={true} requiredRole="admin">
                      <DatabaseRolesSettings />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/app/setup-test"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <SetupAndTest />
                    </ProtectedRoute>
                  }
                />

                {/* Authentication Test - No protection needed */}
                <Route path="/auth-test" element={<AuthTest />} />

                {/* Payment Synchronization - No protection needed for setup */}
                <Route path="/payment-sync" element={<PaymentSynchronizationPage />} />

                {/* Optimized Inventory - Performance-optimized inventory page */}
                <Route
                  path="/app/optimized-inventory"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <OptimizedInventory />
                    </ProtectedRoute>
                  }
                />

                {/* Performance Optimizer - Database and inventory performance optimization */}
                <Route path="/app/performance-optimizer" element={<PerformanceOptimizerPage />} />

                {/* Optimized Customers - Performance-optimized customers page */}
                <Route
                  path="/app/optimized-customers"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <OptimizedCustomers />
                    </ProtectedRoute>
                  }
                />

                {/* Customer Performance Optimizer - Database and customer performance optimization */}
                <Route path="/app/customer-performance-optimizer" element={<CustomerPerformanceOptimizerPage />} />

                {/* 404 Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Layout>
            </CompanyProvider>
          }
        />
      </Routes>
    </TooltipProvider>
  );
};

export default App;
