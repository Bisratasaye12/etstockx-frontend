/** GET /api/v1/profiles/users/search — paged user lookup by display name. */
export type UserSearchRole = "Client" | "Broker";

export type UserSearchItemDto = {
  userId: string;
  fullName: string | null;
  role: string;
  institution: string | null;
  isActivated: boolean;
};

export type UserSearchPagedResult = {
  items: UserSearchItemDto[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
