import { useQuery } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";
import type { AuditLogDto } from "@/shared/api/dtos/admin-portal";

export type AuditLogFilters = {
  from?: string;
  to?: string;
  actorId?: string;
  actionType?: string;
  entityType?: string;
};

export const auditLogKeys = {
  list: (filters: AuditLogFilters) => ["admin", "audit-logs", filters] as const,
};

function buildParams(filters: AuditLogFilters): Record<string, string> {
  const p: Record<string, string> = {};
  if (filters.from?.trim()) p.from = filters.from.trim();
  if (filters.to?.trim()) p.to = filters.to.trim();
  if (filters.actorId?.trim()) p.actorId = filters.actorId.trim();
  if (filters.actionType?.trim()) p.actionType = filters.actionType.trim();
  if (filters.entityType?.trim()) p.entityType = filters.entityType.trim();
  return p;
}

export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: async () => {
      const { data } = await browserApi.get<AuditLogDto[]>(
        "/v1/admin/audit-logs",
        { params: buildParams(filters) },
      );
      return data ?? [];
    },
  });
}
