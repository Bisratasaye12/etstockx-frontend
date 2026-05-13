import { browserApi } from "@/shared/api/browser-api";

export async function downloadInvestorMessageAttachment(
  attachmentId: string,
  fileName: string,
): Promise<void> {
  const { data } = await browserApi.get<Blob>(
    `/v1/messages/attachments/${attachmentId}`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.trim() || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
