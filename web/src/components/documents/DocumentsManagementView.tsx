import { useState, useCallback, useEffect } from "react";
import { Badge } from "../ui/badge";
import DocumentDetailPanel from "./DocumentDetailPanel";
import {
  listDocuments,
  verifyDocument,
  type Document,
  type DocumentType,
  type DocumentStatus,
} from "../../api/adminApi";

const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  ID: "National ID",
  LICENSE: "Driver License",
};

const STATUS_LABEL: Record<DocumentStatus, string> = {
  PENDING: "Pending",
  UPLOADING: "Uploading",
  UPLOADED: "Uploaded",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  DELETED: "Deleted",
};

function statusVariant(s: DocumentStatus) {
  if (s === "VERIFIED") return "default" as const;
  if (s === "REJECTED" || s === "DELETED") return "destructive" as const;
  if (s === "UPLOADED" || s === "PENDING") return "secondary" as const;
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

type TypeFilter = DocumentType | "";

export default function DocumentsManagementView() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchDocs = useCallback(() => {
    setLoading(true);
    setError(null);
    listDocuments().then((res) => {
      setLoading(false);
      if (res.ok) {
        setDocuments(res.data);
      } else {
        setError(res.message);
        setDocuments([]);
      }
    });
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const filtered = documents.filter((d) => {
    if (typeFilter && d.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const userName = d.user?.name?.toLowerCase() ?? "";
      const userEmail = d.user?.email?.toLowerCase() ?? "";
      if (!userName.includes(q) && !userEmail.includes(q) && !d.id.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleVerify = useCallback(async (docId: string) => {
    setVerifyingId(docId);
    const res = await verifyDocument(docId);
    setVerifyingId(null);
    if (res.ok) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: "VERIFIED" as DocumentStatus, verifiedAt: new Date().toISOString() } : d))
      );
      setSelectedDoc((d) =>
        d && d.id === docId ? { ...d, status: "VERIFIED" as DocumentStatus, verifiedAt: new Date().toISOString() } : d
      );
    }
    return res;
  }, []);

  const needsReview = (s: DocumentStatus) => s === "UPLOADED" || s === "PENDING";

  const counts = {
    total: documents.length,
    pendingReview: documents.filter((d) => needsReview(d.status)).length,
    verified: documents.filter((d) => d.status === "VERIFIED").length,
  };

  return (
    <>
      <div className="dash-heading">
        <h1 className="dash-title">Document Verification</h1>
        <p className="dash-desc">
          Review and verify user-uploaded identity documents and driver licenses.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Pending Review</p>
          <p className="font-display font-bold text-2xl mt-1 text-amber-600 dark:text-amber-400">{counts.pendingReview}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Verified</p>
          <p className="font-display font-bold text-2xl mt-1 text-emerald-600 dark:text-emerald-400">{counts.verified}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Documents</p>
          <p className="font-display font-bold text-2xl mt-1 text-slate-900 dark:text-white">{counts.total}</p>
        </div>
      </div>

      <div className="um-toolbar">
        <input
          type="search"
          placeholder="Search by user name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="um-search"
          aria-label="Search documents"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="um-filter"
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          <option value="ID">National ID</option>
          <option value="LICENSE">Driver License</option>
        </select>
        <button
          type="button"
          onClick={fetchDocs}
          className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {error && <p className="um-panel__error" role="alert">{error}</p>}

      <div className="dash-card">
        <div className="dash-card__body um-table-wrap">
          {loading ? (
            <p className="um-table__empty">Loading documents…</p>
          ) : filtered.length === 0 ? (
            <p className="um-table__empty">
              {documents.length === 0 ? "No documents awaiting review." : "No documents match your filters."}
            </p>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Document Type</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {doc.user?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-slate-400">{doc.user?.email ?? "—"}</p>
                      </div>
                    </td>
                    <td>
                      <Badge variant="secondary">{DOC_TYPE_LABEL[doc.type]}</Badge>
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 text-sm">
                      {formatSize(doc.size)}
                    </td>
                    <td>
                      <Badge variant={statusVariant(doc.status)}>
                        {STATUS_LABEL[doc.status]}
                      </Badge>
                    </td>
                    <td className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(doc.uploadedAt ?? doc.createdAt)}
                    </td>
                    <td className="um-actions-cell">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        Review
                      </button>
                      {needsReview(doc.status) && (
                        <button
                          type="button"
                          disabled={verifyingId === doc.id}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white cursor-pointer disabled:opacity-50"
                          onClick={() => handleVerify(doc.id)}
                        >
                          {verifyingId === doc.id ? "…" : "Verify"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedDoc && (
        <DocumentDetailPanel
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onVerify={handleVerify}
          verifying={verifyingId === selectedDoc.id}
        />
      )}
    </>
  );
}
