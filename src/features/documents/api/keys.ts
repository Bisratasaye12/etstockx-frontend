export const documentsKeys = {
  all: ["documents"] as const,
  byRequest: (requestId: string, requestType: string) =>
    [
      ...documentsKeys.all,
      "trade-agreement",
      "by-request",
      requestId,
      requestType,
    ] as const,
  byId: (id: string) =>
    [...documentsKeys.all, "trade-agreement", "by-id", id] as const,
  mine: (page: number, pageSize: number) =>
    [...documentsKeys.all, "trade-agreement", "mine", page, pageSize] as const,
  verify: (documentNumber: string, hash: string) =>
    [
      ...documentsKeys.all,
      "trade-agreement",
      "verify",
      documentNumber,
      hash,
    ] as const,
};
