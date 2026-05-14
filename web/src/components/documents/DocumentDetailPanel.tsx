import { useState } from "react";
import { Badge } from "../ui/badge";
import { X, Download, FileCheck2, Eye, FileText, IdCard } from "lucide-react";
import {
  getDocumentDownloadUrl,
  type Document,
  type DocumentStatus,
  type DocumentType,
} from "../../api/adminApi";

type Props = {
  document: Document;
  onClose: () => void;
  onVerify: (docId: string) => Promise<{ ok: boolean }>;
  verifying: boolean;
};

const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  ID: "National ID",
  LICENSE: "Driver License",
};

const STATUS_LABEL: Record<DocumentStatus, string> = {
  PENDING: "Pending",
  UPLOADING: "Uploading",
  UPLOADED: "Awaiting Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  DELETED: "Deleted",
};

function statusVariant(s: DocumentStatus) {
  if (s === "VERIFIED") return "default" as const;
  if (s === "REJECTED" || s === "DELETED") return "destructive" as const;
  if (s === "UPLOADED") return "secondary" as const;
  return "outline" as const;
}

function formatDate(s: string | null | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewable(contentType: string | null | undefined) {
  if (!contentType) return false;
  return contentType.startsWith("image/") || contentType === "application/pdf";
}

export default function DocumentDetailPanel({ document: doc, onClose, onVerify, verifying }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  async function handlePreview() {
    setPreviewLoading(true);
    setPreviewError(null);
    const res = await getDocumentDownloadUrl(doc.s3Key);
    setPreviewLoading(false);
    if (res.ok) {
      setPreviewUrl(res.data.downloadUrl);
    } else {
      setPreviewError(res.message);
    }
  }

  async function handleDownload() {
    const res = await getDocumentDownloadUrl(doc.s3Key);
    if (res.ok) {
      window.open(res.data.downloadUrl, "_blank");
    }
  }

  async function handleVerify() {
    setVerifyError(null);
    const res = await onVerify(doc.id);
    if (!res.ok) {
      setVerifyError("Failed to verify document");
    }
  }

  const DocIcon = doc.type === "LICENSE" ? FileText : IdCard;

  return (
    <div className="um-panel" role="dialog" aria-modal="true" aria-labelledby="doc-panel-title">
      <div className="um-panel__backdrop" onClick={onClose} aria-hidden />
      <div className="um-panel__content" style={{ maxWidth: 640 }}>
        <div className="um-panel__head">
          <h2 id="doc-panel-title" className="um-panel__title">Document Review</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="um-panel__body">
          {/* Document type header */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <DocIcon size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                {DOC_TYPE_LABEL[doc.type]}
              </h3>
              <p className="text-xs text-slate-400">Document ID: {doc.id.slice(0, 12)}…</p>
            </div>
            <Badge variant={statusVariant(doc.status)}>
              {STATUS_LABEL[doc.status]}
            </Badge>
          </div>

          <dl className="um-panel__meta">
            <dt>Owner</dt>
            <dd>
              <span className="font-medium text-slate-900 dark:text-white">
                {doc.user?.name ?? "Unknown"}
              </span>
              {doc.user?.email && (
                <span className="text-slate-400 ml-2 text-xs">{doc.user.email}</span>
              )}
            </dd>
            <dt>Content Type</dt>
            <dd>{doc.contentType ?? "—"}</dd>
            <dt>File Size</dt>
            <dd>{formatSize(doc.size)}</dd>
            <dt>Uploaded</dt>
            <dd>{formatDate(doc.uploadedAt)}</dd>
            <dt>Created</dt>
            <dd>{formatDate(doc.createdAt)}</dd>
            {doc.verifiedAt && (
              <>
                <dt>Verified</dt>
                <dd>{formatDate(doc.verifiedAt)}</dd>
              </>
            )}
            {doc.rejectionReason && (
              <>
                <dt>Rejection Reason</dt>
                <dd className="text-red-500">{doc.rejectionReason}</dd>
              </>
            )}
          </dl>

          {/* Preview area */}
          {previewUrl && (
            <section className="mt-4">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Preview</h4>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-slate-900">
                {doc.contentType?.startsWith("image/") ? (
                  <img
                    src={previewUrl}
                    alt={`${DOC_TYPE_LABEL[doc.type]} document`}
                    className="max-w-full max-h-96 mx-auto object-contain"
                  />
                ) : doc.contentType === "application/pdf" ? (
                  <iframe
                    src={previewUrl}
                    title="Document preview"
                    className="w-full h-96 border-0"
                  />
                ) : (
                  <p className="p-6 text-center text-sm text-slate-400">
                    Preview not available for this file type.
                  </p>
                )}
              </div>
            </section>
          )}

          {previewError && <p className="um-panel__error mt-2" role="alert">{previewError}</p>}
          {verifyError && <p className="um-panel__error mt-2" role="alert">{verifyError}</p>}

          {/* Actions */}
          <div className="um-panel__actions mt-4">
            {isPreviewable(doc.contentType) && !previewUrl && (
              <button
                type="button"
                disabled={previewLoading}
                onClick={handlePreview}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Eye size={14} />
                {previewLoading ? "Loading…" : "Preview"}
              </button>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Download size={14} />
              Download
            </button>
            {(doc.status === "UPLOADED" || doc.status === "PENDING") && (
              <button
                type="button"
                disabled={verifying}
                onClick={handleVerify}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
              >
                <FileCheck2 size={14} />
                {verifying ? "Verifying…" : "Verify Document"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
