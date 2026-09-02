"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BreadcrumbItem } from "@/types";
import { Link, router } from "@inertiajs/react";
import axios from "axios";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Sparkles,
  Info,
  Check,
} from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Items", href: "/items" },
  { title: "Bulk Upload", href: "/items/bulk-upload" },
];

interface Category {
  id: number;
  name: string;
}

interface Company {
  id: number;
  title: string;
}

interface Props {
  categories: Category[];
  companies: Company[];
}

interface ParsedRow {
  row_number: number;
  title: string;
  code: string;
  short_name: string;
  category_id: number | null;
  category_name: string;
  company_id: number | null;
  company_name: string;
  trade_price: number;
  retail: number;
  retail_tp_diff?: number;
  packing_qty: number;
  packing_size: string;
  reorder_level: number;
  formation?: string;
  type?: string;
  shelf?: string;
  pcs?: number | null;
  limit_pcs?: number | null;
  order_qty?: number | null;
  weight?: number | null;
  stock_1: number;
  stock_2: number;
  pt2?: number | null;
  pt3?: number | null;
  pt4?: number | null;
  pt5?: number | null;
  pt6?: number | null;
  pt7?: number | null;
  scheme?: string;
  scheme2?: string;
  discount: number;
  gst_percent?: number | null;
  gst_amount?: number | null;
  adv_tax_filer?: number | null;
  adv_tax_non_filer?: number | null;
  adv_tax_manufacturer?: number | null;
  is_import: number;
  is_fridge: number;
  is_recipe: number;
  is_active: number;
  status: "valid" | "error";
  errors: string[];
}

interface PreviewResult {
  total_rows: number;
  valid_count: number;
  error_count: number;
  rows: ParsedRow[];
  file_error?: string;
}

export default function BulkUploadPage({ categories, companies }: Props) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [previewResult, setPreviewResult] = React.useState<PreviewResult | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "valid" | "error">("all");
  const [importSuccess, setImportSuccess] = React.useState<{ message: string; count: number } | null>(null);
  const [generalError, setGeneralError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewResult(null);
      setImportSuccess(null);
      setGeneralError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (["xlsx", "xls", "csv"].includes(ext || "")) {
        setSelectedFile(file);
        setPreviewResult(null);
        setImportSuccess(null);
        setGeneralError(null);
      } else {
        setGeneralError("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
      }
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setIsPreviewing(true);
    setGeneralError(null);
    setImportSuccess(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post<PreviewResult>("/items/bulk-upload/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreviewResult(response.data);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.file_error || "Failed to parse file. Please check file formatting.";
      setGeneralError(message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!previewResult) return;
    const validRows = previewResult.rows.filter((r) => r.status === "valid");

    if (validRows.length === 0) {
      setGeneralError("No valid rows to import. Please resolve validation errors and upload again.");
      return;
    }

    setIsImporting(true);
    setGeneralError(null);

    try {
      const response = await axios.post("/items/bulk-upload/import", { rows: validRows });
      setImportSuccess({
        message: response.data.message || `Successfully imported ${validRows.length} items!`,
        count: validRows.length,
      });
      setPreviewResult(null);
      setSelectedFile(null);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to import items. Please try again.";
      setGeneralError(message);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredRows = React.useMemo(() => {
    if (!previewResult) return [];
    if (activeFilter === "valid") return previewResult.rows.filter((r) => r.status === "valid");
    if (activeFilter === "error") return previewResult.rows.filter((r) => r.status === "error");
    return previewResult.rows;
  }, [previewResult, activeFilter]);

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

        <div className="mt-6 px-6 pb-12">
          {/* Top Bar Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/items">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Bulk Upload Items</h1>
                <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium">
                  <Sparkles className="mr-1 h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Full Module Coverage
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                Upload items in bulk with full support for Financial Matrix, Logistics, Limits, Tiers, and Tax Compliance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a href="/items/bulk-upload/sample?format=xlsx" download>
                <Button variant="outline" className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Download Excel Sample
                </Button>
              </a>
              <a href="/items/bulk-upload/sample?format=csv" download>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4 text-sky-600 dark:text-sky-400" /> Download CSV Sample
                </Button>
              </a>
            </div>
          </div>

          {/* Success Banner */}
          {importSuccess && (
            <Alert className="mb-6 border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle className="font-semibold text-lg">Bulk Import Completed!</AlertTitle>
              <AlertDescription className="mt-1 flex items-center justify-between">
                <span>{importSuccess.message}</span>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button size="sm" onClick={() => router.visit("/items")}>
                    View All Items
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setImportSuccess(null)}>
                    Upload Another File
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* General Error Banner */}
          {generalError && (
            <Alert className="mb-6 border-rose-500/40 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              <AlertTitle className="font-semibold">Import Notice</AlertTitle>
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {/* Main Grid Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1 & 2 Card */}
            <Card className="lg:col-span-1 shadow-xs border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-primary" /> Upload Spreadsheet File
                </CardTitle>
                <CardDescription>Select or drag your filled template file to begin parsing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag and drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragOver
                      ? "border-primary bg-primary/5 scale-[0.99]"
                      : selectedFile
                      ? "border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center space-y-2">
                    {selectedFile ? (
                      <>
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-950 rounded-full text-emerald-600 dark:text-emerald-400">
                          <FileSpreadsheet className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground max-w-[220px] truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs">
                          Ready to parse
                        </Badge>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-muted rounded-full text-muted-foreground">
                          <UploadCloud className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Click to browse or drag file here</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Supports .xlsx, .xls, and .csv files</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Parse Button */}
                <Button
                  onClick={handlePreview}
                  disabled={!selectedFile || isPreviewing}
                  className="w-full font-medium"
                >
                  {isPreviewing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Analyzing File...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Analyze & Preview File
                    </>
                  )}
                </Button>

                {/* Guidelines Card */}
                <div className="rounded-lg bg-muted/40 p-4 border border-border text-xs space-y-2.5">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Info className="h-4 w-4 text-sky-500" /> Spreadsheet Guidelines
                  </div>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><span className="font-medium text-foreground">Required Headers:</span> Title*, Category Name*, Company Name*, Trade Price*, Retail Price*, Packing Qty*, Packing Size*, Reorder Level*.</li>
                    <li><span className="font-medium text-foreground">Financial Matrix & Tiers:</span> Trade Price, Retail, Discount %, TP 2 to TP 7, Scheme 1 & 2.</li>
                    <li><span className="font-medium text-foreground">Logistics & Limits:</span> Carton Size, Packing Qty, Reorder Level, Pcs, Limit Pcs, Order Qty, Weight (kg), Stock 1 (Full), Stock 2 (Loose).</li>
                    <li><span className="font-medium text-foreground">Tax & Compliance:</span> GST %, GST Amount, Adv Tax Filer %, Adv Tax Non-Filer %, Adv Tax Manufacturer %.</li>
                    <li><span className="font-medium text-foreground">Flags & Identity:</span> Formation, Type, Shelf, Is Import (1/0), Is Fridge (1/0), Is Recipe (1/0), Is Active (1/0).</li>
                    <li>If <span className="font-medium text-foreground">Code</span> is empty, it is auto-generated using Category prefix.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Preview Table Section */}
            <Card className="lg:col-span-2 shadow-xs border-muted flex flex-col justify-between">
              <CardHeader className="pb-3 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Data Validation & Preview
                    </CardTitle>
                    <CardDescription>
                      Review validation status for each row before committing items to database.
                    </CardDescription>
                  </div>

                  {previewResult && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={activeFilter === "all" ? "default" : "outline"}
                        onClick={() => setActiveFilter("all")}
                      >
                        All ({previewResult.total_rows})
                      </Button>
                      <Button
                        size="sm"
                        variant={activeFilter === "valid" ? "default" : "outline"}
                        className={activeFilter === "valid" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-emerald-600 dark:text-emerald-400"}
                        onClick={() => setActiveFilter("valid")}
                      >
                        Valid ({previewResult.valid_count})
                      </Button>
                      <Button
                        size="sm"
                        variant={activeFilter === "error" ? "default" : "outline"}
                        className={activeFilter === "error" ? "bg-rose-600 hover:bg-rose-700 text-white" : "text-rose-600 dark:text-rose-400"}
                        onClick={() => setActiveFilter("error")}
                      >
                        Errors ({previewResult.error_count})
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 flex flex-col">
                {!previewResult ? (
                  <div className="flex-1 min-h-[340px] flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-foreground">No file analyzed yet</p>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1">
                      Upload your Excel or CSV spreadsheet on the left and click "Analyze & Preview File" to view rows here.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Summary bar */}
                    <div className="bg-muted/30 px-6 py-3 border-b flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          Total Rows: <Badge variant="secondary">{previewResult.total_rows}</Badge>
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                          Valid: <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">{previewResult.valid_count}</Badge>
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-rose-700 dark:text-rose-400">
                          Errors: <Badge className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">{previewResult.error_count}</Badge>
                        </span>
                      </div>

                      {previewResult.valid_count > 0 && (
                        <Button
                          onClick={handleImport}
                          disabled={isImporting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          {isImporting ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Importing...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" /> Import {previewResult.valid_count} Valid Item(s)
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto flex-1 max-h-[480px]">
                      <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-12 text-center">Row</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead className="text-right">TP / Retail</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead>Validation Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                                No rows match the selected filter criteria.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredRows.map((row, idx) => (
                              <TableRow
                                key={idx}
                                className={row.status === "error" ? "bg-rose-50/40 dark:bg-rose-950/20" : "hover:bg-muted/30"}
                              >
                                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                  #{row.row_number}
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                  {row.title || <span className="text-rose-500 italic">Empty</span>}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.code ? (
                                    <Badge variant="outline" className="font-mono text-[11px]">
                                      {row.code}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground italic text-xs">Auto-gen</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.category_name ? (
                                    <Badge variant="secondary" className="text-[11px]">
                                      {row.category_name}
                                    </Badge>
                                  ) : (
                                    <span className="text-rose-500 italic">Missing</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.company_name ? (
                                    <span className="text-foreground">{row.company_name}</span>
                                  ) : (
                                    <span className="text-rose-500 italic">Missing</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-xs font-mono">
                                  Rs. {row.trade_price} / Rs. {row.retail}
                                </TableCell>
                                <TableCell className="text-center">
                                  {row.status === "valid" ? (
                                    <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100">
                                      <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Valid
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 hover:bg-rose-100">
                                      <XCircle className="mr-1 h-3 w-3 text-rose-600 dark:text-rose-400" /> Error
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.errors.length > 0 ? (
                                    <ul className="list-disc list-inside text-rose-600 dark:text-rose-400 space-y-0.5">
                                      {row.errors.map((err, eIdx) => (
                                        <li key={eIdx}>{err}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready for import</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
