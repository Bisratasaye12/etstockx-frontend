import { useMutation } from "@tanstack/react-query";
import { browserApi } from "@/shared/api/browser-api";

interface DownloadInput {
  agreementId: string;
  fileNameHint?: string;
}

export function useDownloadAgreementPdf() {
  return useMutation({
    mutationFn: async (input: DownloadInput) => {
      const response = await browserApi.get<Blob>(
        `/v1/documents/trade-agreements/${input.agreementId}/pdf`,
        { responseType: "blob" },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      // Open in a new tab; user can save from there. Falls back to download if blocked.
      const win = window.open(url, "_blank", "noopener");
      if (!win) {
        const link = document.createElement("a");
        link.href = url;
        link.download = input.fileNameHint ?? `${input.agreementId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      // Revoke after some time so the new tab can finish rendering.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return true;
    },
  });
}
