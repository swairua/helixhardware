import { apiClient } from '@/integrations/api';
import { executeSQL } from '@/utils/execSQL';

export type AuditedEntity = 'quotation' | 'proforma' | 'invoice' | 'credit_note' | 'user_invitation' | 'user_creation' | 'role' | 'permission' | 'product';

interface AuditLogEntry {
  action: 'DELETE' | 'CREATE' | 'UPDATE' | 'APPROVE' | 'INVITE';
  entity_type: AuditedEntity;
  record_id: string | null;
  company_id?: string | null;
  actor_user_id?: string | null;
  actor_email?: string | null;
  details?: any; // JSON snapshot
}

async function tableExists(table: string): Promise<boolean> {
  try {
    const result = await apiClient.select(table);
    return !result.error;
  } catch (error) {
    // Log network errors for diagnostics
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.warn('❌ Network error: Cannot reach API. Backend may be unreachable or blocked by firewall/proxy.');
    }
    return false;
  }
}

export async function ensureAuditLogSchema(): Promise<void> {
  try {
    const exists = await tableExists('audit_logs');
    if (exists) return;

    const sql = `
    create table if not exists audit_logs (
      id uuid primary key default gen_random_uuid(),
      created_at timestamptz not null default now(),
      action text not null,
      entity_type text not null,
      record_id uuid,
      company_id uuid,
      actor_user_id uuid,
      actor_email text,
      details jsonb
    );
    create index if not exists idx_audit_logs_entity on audit_logs(entity_type, record_id);
    create index if not exists idx_audit_logs_company on audit_logs(company_id);
    create index if not exists idx_audit_logs_action on audit_logs(action);
    `;

    await executeSQL(sql);
  } catch (error) {
    // Silently fail - audit logs are non-critical
    // Log only for debugging purposes
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.debug('⚠️ Audit log schema check skipped: API unreachable');
    } else {
      console.debug('⚠️ Audit log schema ensure failed:', error);
    }
    // Don't throw - allow app to continue
  }
}

async function getActorInfo(): Promise<{ user_id: string | null; email: string | null }> {
  let actor_user_id: string | null = null;
  let actor_email: string | null = null;

  try {
    actor_user_id = localStorage.getItem('med_api_user_id') ?? null;
    actor_email = localStorage.getItem('med_api_user_email') ?? null;
  } catch {
    // ignore
  }

  return { user_id: actor_user_id, email: actor_email };
}

async function insertAuditLog(entry: AuditLogEntry): Promise<void> {
  const insertAttempt = await apiClient.insert('audit_logs', entry);

  if (insertAttempt.error) {
    // Try once more after ensuring schema
    try {
      await ensureAuditLogSchema();
      const retry = await apiClient.insert('audit_logs', entry);
      if (retry.error) {
        // Swallow to not block operations; surface in console for diagnostics
        // eslint-disable-next-line no-console
        console.warn('Audit log insert failed:', retry.error?.message || retry.error);
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.warn('Audit log ensure+insert failed:', e?.message || e);
    }
  }
}

export async function logDeletion(
  entity: AuditedEntity,
  recordId: string | null,
  snapshot?: any,
  companyId?: string | null
): Promise<void> {
  // Ensure table exists (best-effort)
  try {
    await ensureAuditLogSchema();
  } catch {
    // ignore, we'll still try insert which will fail if table truly missing
  }

  const { user_id: actor_user_id, email: actor_email } = await getActorInfo();

  const entry: AuditLogEntry = {
    action: 'DELETE',
    entity_type: entity,
    record_id: recordId ?? null,
    company_id: companyId ?? null,
    actor_user_id,
    actor_email,
    details: snapshot ?? null,
  };

  await insertAuditLog(entry);
}

export async function logUserCreation(
  invitationId: string,
  email: string,
  role: string,
  companyId: string
): Promise<void> {
  // Ensure table exists (best-effort)
  try {
    await ensureAuditLogSchema();
  } catch {
    // ignore
  }

  const { user_id: actor_user_id, email: actor_email } = await getActorInfo();

  const entry: AuditLogEntry = {
    action: 'CREATE',
    entity_type: 'user_creation',
    record_id: invitationId,
    company_id: companyId,
    actor_user_id,
    actor_email,
    details: {
      invited_email: email,
      invited_role: role,
      timestamp: new Date().toISOString(),
    },
  };

  await insertAuditLog(entry);
}

export async function logUserApproval(
  invitationId: string,
  email: string,
  companyId: string,
  approvalStatus: string
): Promise<void> {
  // Ensure table exists (best-effort)
  try {
    await ensureAuditLogSchema();
  } catch {
    // ignore
  }

  const { user_id: actor_user_id, email: actor_email } = await getActorInfo();

  const entry: AuditLogEntry = {
    action: 'APPROVE',
    entity_type: 'user_invitation',
    record_id: invitationId,
    company_id: companyId,
    actor_user_id,
    actor_email,
    details: {
      user_email: email,
      approval_status: approvalStatus,
      timestamp: new Date().toISOString(),
    },
  };

  await insertAuditLog(entry);
}

export async function logProductAction(
  action: 'CREATE' | 'UPDATE' | 'RESTOCK',
  productId: string,
  details: any,
  companyId: string
): Promise<void> {
  // Ensure table exists (best-effort)
  try {
    await ensureAuditLogSchema();
  } catch {
    // ignore
  }

  const { user_id: actor_user_id, email: actor_email } = await getActorInfo();

  const entry: AuditLogEntry = {
    action: action === 'RESTOCK' ? 'APPROVE' : action as any,
    entity_type: 'product',
    record_id: productId,
    company_id: companyId,
    actor_user_id,
    actor_email,
    details: {
      ...details,
      timestamp: new Date().toISOString(),
    },
  };

  await insertAuditLog(entry);
}

export async function logRoleChange(
  action: 'create' | 'update' | 'delete',
  roleId: string,
  roleName: string,
  companyId: string,
  details?: any
): Promise<void> {
  // Ensure table exists (best-effort)
  try {
    await ensureAuditLogSchema();
  } catch {
    // ignore
  }

  const { user_id: actor_user_id, email: actor_email } = await getActorInfo();

  const actionMap: Record<'create' | 'update' | 'delete', 'CREATE' | 'APPROVE' | 'DELETE'> = {
    create: 'CREATE',
    update: 'APPROVE',
    delete: 'DELETE',
  };

  const entry: AuditLogEntry = {
    action: actionMap[action],
    entity_type: 'role',
    record_id: roleId,
    company_id: companyId,
    actor_user_id,
    actor_email,
    details: {
      role_name: roleName,
      action_type: action,
      timestamp: new Date().toISOString(),
      ...details,
    },
  };

  await insertAuditLog(entry);
}
