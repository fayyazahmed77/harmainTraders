"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BreadcrumbItem } from "@/types";
import { Link, router } from "@inertiajs/react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  FileText,
  Layers,
  Filter,
  Check,
  AlertTriangle,
  UserCheck,
  Building2,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Account", href: "/account" },
  { title: "Bulk Upload", href: "/account/bulk-upload" },
];

interface ParsedRow {
  row_number: number;
  title: string;
  code: string;
  type_id?: number | null;
  type_name: string;
  category_id?: number | null;
  category_name?: string;
  opening_balance: number;
  credit_limit: number;
  aging_days: number;
  item_category?: number | null;
  saleman_id?: number | null;
  saleman_name?: string;
  booker_id?: number | null;
  booker_name?: string;
  country_id?: number | null;
  province_id?: number | null;
  city_id?: number | null;
  area_id?: number | null;
  subarea_id?: number | null;
  address1?: string;
  address2?: string;
  mobile?: string;
  telephone1?: string;
  telephone2?: string;
  fax?: string;
  gst?: string;
  ntn?: string;
  cnic?: string;
  opening_date?: string;
  fbr_date?: string;
  note_head?: string;
  remarks?: string;
  regards?: string;
  ats_percentage?: number | null;
  ats_type?: string;
  purchase: number;
  cashbank: number;
  sale: number;
  status: number;
  row_status: "valid" | "error";
  errors: string[];
}

interface PreviewData {
  total_rows: number;
  valid_count: number;
  error_count: number;
  rows: ParsedRow[];
  file_error?: string;
}

export default function AccountBulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "valid" | "error">("all");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      validateAndSetFile(droppedFiles[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      toast.error("Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }
    setFile(selectedFile);
    uploadAndPreview(selectedFile);
  };

  const uploadAndPreview = async (selectedFile: File) => {
    setIsLoadingPreview(true);
    setPreviewData(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("/account/bulk-upload/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.file_error) {
        toast.error(response.data.file_error);
      } else {
        setPreviewData(response.data);
        toast.success(`File parsed: ${response.data.valid_count} valid, ${response.data.error_count} errors.`);
      }
    } catch (error: any) {
      console.error("Preview error:", error);
      toast.error(error.response?.data?.message || "Failed to parse the uploaded file.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleImport = async () => {
    if (!previewData || previewData.valid_count === 0) {
      toast.error("No valid account rows to import.");
      return;
    }

    const validRows = previewData.rows.filter((r) => r.row_status === "valid");

    setIsImporting(true);
    try {
      const response = await axios.post("/account/bulk-upload/import", {
        rows: validRows,
      });

      toast.success(response.data.message || `Successfully imported ${validRows.length} accounts!`);
      router.visit("/account");
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.response?.data?.message || "Failed to process bulk account import.");
    } finally {
      setIsImporting(false);
    }
  };

  const filteredRows = (previewData?.rows || []).filter((r) => {
    if (statusFilter === "valid") return r.row_status === "valid";
    if (statusFilter === "error") return r.row_status === "error";
    return true;
  });

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 61)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-auto p-4 md:p-6 flex flex-col gap-6">

            {/* TOP HEADER BLOCK */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Link href="/account">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                  <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="h-7 w-7 text-orange-500" /> Bulk Account Upload
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground pl-12 font-medium">
                  Upload multiple accounts (Customers, Suppliers, Company, Bank, Cash, etc.) via Excel or CSV.
                </p>
              </div>

              <div className="flex items-center gap-3 pl-12 md:pl-0">
                <a href="/account/bulk-upload/sample?format=xlsx" download>
                  <Button variant="outline" className="border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-600/30">
                    <Download className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Excel Template
                  </Button>
                </a>
                <a href="/account/bulk-upload/sample?format=csv" download>
                  <Button variant="outline" className="border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold shadow-sm hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-600/30">
                    <Download className="mr-2 h-4 w-4 text-sky-600 dark:text-sky-400" /> CSV Template
                  </Button>
                </a>
              </div>
            </div>

            {/* UPLOAD & DROPZONE CARD */}
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardContent className="p-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4",
                    isDragging
                      ? "border-orange-500 bg-orange-500/5 scale-[1.01]"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50",
                    isLoadingPreview && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => document.getElementById("file-upload-input")?.click()}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="h-16 w-16 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center shadow-inner">
                    {isLoadingPreview ? (
                      <RefreshCw className="h-8 w-8 animate-spin" />
                    ) : (
                      <UploadCloud className="h-8 w-8" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-base font-bold text-zinc-900 dark:text-white">
                      {file ? file.name : "Click to upload or drag & drop file here"}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      Supports Excel spreadsheet format (.xlsx, .xls) and CSV format (.csv) up to 10MB
                    </p>
                  </div>

                  {file && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold">
                      <FileSpreadsheet className="h-4 w-4" /> Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PREVIEW & VALIDATION RESULTS */}
            {previewData && (
              <div className="space-y-6">

                {/* METRICS SUMMARY ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Total Processed</span>
                      <Layers className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-black text-zinc-900 dark:text-white mt-2">
                      {previewData.total_rows}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">Rows found in file</span>
                  </Card>

                  <Card className="bg-white dark:bg-zinc-900 border-emerald-500/30 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">Ready to Import</span>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                      {previewData.valid_count}
                    </div>
                    <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">Validation passed cleanly</span>
                  </Card>

                  <Card className="bg-white dark:bg-zinc-900 border-rose-500/30 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">Validation Errors</span>
                      <AlertCircle className="h-5 w-5 text-rose-500" />
                    </div>
                    <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
                      {previewData.error_count}
                    </div>
                    <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium">Rows with validation errors</span>
                  </Card>
                </div>

                {/* CONTROLS & TABLE CARD */}
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Filter className="h-5 w-5 text-orange-500" /> Pre-Import Validation Preview
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Review parsed account data and correct validation issues before executing final import.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* FILTER TABS */}
                      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <button
                          onClick={() => setStatusFilter("all")}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            statusFilter === "all"
                              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                              : "text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
                          )}
                        >
                          All ({previewData.total_rows})
                        </button>
                        <button
                          onClick={() => setStatusFilter("valid")}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            statusFilter === "valid"
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                          )}
                        >
                          Valid ({previewData.valid_count})
                        </button>
                        <button
                          onClick={() => setStatusFilter("error")}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            statusFilter === "error"
                              ? "bg-rose-500 text-white shadow-sm"
                              : "text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                          )}
                        >
                          Errors ({previewData.error_count})
                        </button>
                      </div>

                      {/* IMPORT BUTTON */}
                      <Button
                        onClick={handleImport}
                        disabled={isImporting || previewData.valid_count === 0}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 shadow-lg shadow-orange-500/20"
                      >
                        {isImporting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Importing...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4 stroke-[3px]" /> Import {previewData.valid_count} Accounts
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                          <th className="p-3 pl-6 w-16">Row #</th>
                          <th className="p-3 w-24">Status</th>
                          <th className="p-3 min-w-[200px]">Account Title</th>
                          <th className="p-3 w-28">Code</th>
                          <th className="p-3 min-w-[140px]">Account Type</th>
                          <th className="p-3 min-w-[150px]">Category</th>
                          <th className="p-3 w-28 text-right">Opening Bal</th>
                          <th className="p-3 w-28 text-right">Credit Limit</th>
                          <th className="p-3 min-w-[150px]">Salesman</th>
                          <th className="p-3 min-w-[200px]">Validation / Errors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {filteredRows.map((row) => (
                          <tr
                            key={row.row_number}
                            className={cn(
                              "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors font-medium",
                              row.row_status === "error" && "bg-rose-500/5 dark:bg-rose-500/10"
                            )}
                          >
                            <td className="p-3 pl-6 font-mono font-bold text-zinc-400">#{row.row_number}</td>

                            <td className="p-3">
                              {row.row_status === "valid" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 size={11} /> VALID
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  <AlertTriangle size={11} /> ERROR
                                </span>
                              )}
                            </td>

                            <td className="p-3">
                              <div className="font-bold text-zinc-900 dark:text-white uppercase">{row.title || "-"}</div>
                              {row.mobile && (
                                <div className="text-[10px] text-zinc-500 font-mono">📱 {row.mobile}</div>
                              )}
                            </td>

                            <td className="p-3 font-mono font-bold text-orange-600 dark:text-orange-400">{row.code}</td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                {row.type_name || "Unknown"}
                              </span>
                            </td>

                            <td className="p-3 text-zinc-600 dark:text-zinc-400">{row.category_name || "-"}</td>

                            <td className="p-3 text-right font-mono font-bold">
                              Rs. {Number(row.opening_balance).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                            </td>

                            <td className="p-3 text-right font-mono font-bold text-zinc-600 dark:text-zinc-400">
                              Rs. {Number(row.credit_limit).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                            </td>

                            <td className="p-3 text-zinc-600 dark:text-zinc-400">{row.saleman_name || "-"}</td>

                            <td className="p-3">
                              {row.errors.length > 0 ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-rose-600 dark:text-rose-400 text-xs font-semibold cursor-help flex items-center gap-1">
                                        <AlertCircle size={14} className="shrink-0" />
                                        <span>{row.errors[0]}</span>
                                        {row.errors.length > 1 && (
                                          <span className="text-[10px] bg-rose-500 text-white rounded-full px-1.5 font-bold">
                                            +{row.errors.length - 1}
                                          </span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-rose-950 text-rose-100 border-rose-800 p-3 max-w-xs space-y-1">
                                      <div className="font-bold text-xs">Validation Issues:</div>
                                      <ul className="list-disc list-inside text-[11px] space-y-0.5">
                                        {row.errors.map((err, idx) => (
                                          <li key={idx}>{err}</li>
                                        ))}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Ready for creation
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {filteredRows.length === 0 && (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-muted-foreground font-medium">
                              No rows match the selected filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
