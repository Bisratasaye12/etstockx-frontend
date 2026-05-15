/** Resolved reporting window returned with every stats response. */
export type StatsPeriodDto = {
  from: string;
  to: string;
  granularity?: string | null;
};

/** Headline platform metrics for administrators. */
export type AdminStatsKpisDto = {
  totalUsers: number;
  totalClients: number;
  totalBrokers: number;
  totalAdmins: number;
  activatedClients: number;
  totalBuyRequests: number;
  totalSellRequests: number;
  openBuyRequests: number;
  openSellRequests: number;
};

export type RoleCountDto = {
  role?: string | null;
  count: number;
};

export type StatusCountDto = {
  status?: string | null;
  count: number;
  requestType?: string | null;
};

export type TypeCountDto = {
  type?: string | null;
  count: number;
};

export type RegistrationsTimeSeriesPointDto = {
  date: string;
  count: number;
};

export type TradeRequestsTimeSeriesPointDto = {
  date: string;
  buyCount: number;
  sellCount: number;
  totalCount: number;
};

/** Full admin platform statistics payload. */
export type AdminStatsDto = {
  period: StatsPeriodDto;
  kpis: AdminStatsKpisDto;
  usersByRole?: RoleCountDto[] | null;
  requestsByStatus?: StatusCountDto[] | null;
  requestsByType?: TypeCountDto[] | null;
  registrations?: RegistrationsTimeSeriesPointDto[] | null;
  tradeRequests?: TradeRequestsTimeSeriesPointDto[] | null;
};

export type StatsGranularity = "day" | "week" | "month";

export type AdminStatsParams = {
  from?: string;
  to?: string;
  granularity?: StatsGranularity;
};
