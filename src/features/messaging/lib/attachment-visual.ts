import {
  FileText,
  Image as ImageIcon,
  Sheet,
  type LucideIcon,
} from "lucide-react";

export type AttachmentVisual = {
  Icon: LucideIcon;
  /** Tailwind classes for the tinted icon box (bg + foreground). */
  iconBoxClass: string;
  /** Coarse kind for previews ("image" → renders <img>, others → file card). */
  kind: "image" | "pdf" | "spreadsheet" | "document" | "other";
};

function extOf(fileName: string | null | undefined): string {
  const name = (fileName ?? "").toLowerCase();
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1);
}

/**
 * Resolves the icon + tint for an attachment based on its file type/extension.
 * Matches the Figma palette: red for PDF, green for spreadsheets, indigo for
 * documents, sky for images.
 */
export function resolveAttachmentVisual(
  fileType: string | null | undefined,
  fileName: string | null | undefined,
): AttachmentVisual {
  const mime = (fileType ?? "").toLowerCase();
  const ext = extOf(fileName);

  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)
  ) {
    return {
      Icon: ImageIcon,
      iconBoxClass: "bg-sky-100 text-sky-700",
      kind: "image",
    };
  }

  if (mime === "application/pdf" || ext === "pdf") {
    return {
      Icon: FileText,
      iconBoxClass: "bg-red-100 text-red-700",
      kind: "pdf",
    };
  }

  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    ["xlsx", "xls", "csv"].includes(ext)
  ) {
    return {
      Icon: Sheet,
      iconBoxClass: "bg-emerald-100 text-emerald-700",
      kind: "spreadsheet",
    };
  }

  if (
    mime.includes("word") ||
    mime.includes("document") ||
    ["docx", "doc"].includes(ext)
  ) {
    return {
      Icon: FileText,
      iconBoxClass: "bg-indigo-100 text-indigo-700",
      kind: "document",
    };
  }

  return {
    Icon: FileText,
    iconBoxClass: "bg-muted text-muted-foreground",
    kind: "other",
  };
}
