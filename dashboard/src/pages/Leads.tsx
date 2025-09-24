import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Mail,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiCall } from "@/utils/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import * as XLSX from "xlsx";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  state?: string;
  city?: string;
  industry?: string;
  jobTitle?: string;
  leadSource?: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED";
  createdAt: string;
  emailsSent?: Array<{ createdAt: string; status: string }>;
}

interface LeadStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  countryCounts: Array<{ country: string; _count: number }>;
  industryStats: Array<{ industry: string; _count: number }>;
}

interface UploadStatus {
  id: string;
  fileName: string;
  totalLeads: number;
  processedLeads: number;
  failedLeads: number;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();

  // File upload with react-dropzone
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/leads/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error);
        }

        toast({
          title: "Upload Started",
          description: "Your file is being processed in the background.",
        });

        // Poll for upload status
        pollUploadStatus(result.uploadId);
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload Failed",
          description:
            error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const pollUploadStatus = async (uploadId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/leads/upload/${uploadId}/status`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const status = await response.json();
        setUploadStatus(status);

        if (status.status === "COMPLETED") {
          clearInterval(interval);
          toast({
            title: "Upload Completed",
            description: `Successfully processed ${status.processedLeads} leads. ${status.failedLeads} failed.`,
          });
          fetchLeads();
          fetchStats();
        } else if (status.status === "FAILED") {
          clearInterval(interval);
          toast({
            title: "Upload Failed",
            description: "There was an error processing your file.",
            variant: "destructive",
          });
        }
      } catch (error) {
        clearInterval(interval);
        console.error("Error polling status:", error);
      }
    }, 2000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(filterCountry && { country: filterCountry }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterIndustry && { industry: filterIndustry }),
      });

      const response = await fetch(`/api/leads?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      setLeads(data.leads);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/leads/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const exportLeads = async () => {
    try {
      const response = await fetch("/api/leads/export", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: {
            ...(filterCountry && { country: filterCountry }),
            ...(filterStatus && { status: filterStatus }),
            ...(filterIndustry && { industry: filterIndustry }),
          },
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-export-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Export Successful",
          description: "Leads have been exported to Excel file",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export leads",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "CONTACTED":
        return "bg-yellow-100 text-yellow-800";
      case "QUALIFIED":
        return "bg-green-100 text-green-800";
      case "UNQUALIFIED":
        return "bg-gray-100 text-gray-800";
      case "CONVERTED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  React.useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [currentPage, searchTerm, filterCountry, filterStatus, filterIndustry]);

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Lead Management</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Upload, manage, and analyze your leads
            </p>
          </div>
          <Button
            onClick={exportLeads}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Leads
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Leads
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalLeads.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.newLeads.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contacted</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.contactedLeads.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Converted</CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.convertedLeads.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads">All Leads</TabsTrigger>
            <TabsTrigger value="upload">Upload Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Leads</CardTitle>
                <CardDescription>
                  Upload your leads from an Excel or CSV file. Supported
                  columns: Name, Email, Phone, Company, Country, State, City,
                  Industry, Job Title, Lead Source.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  {isDragActive ? (
                    <p>Drop the file here...</p>
                  ) : (
                    <div>
                      <p className="text-lg mb-2">
                        Drag & drop your leads file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports .xlsx, .xls, and .csv files (max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {uploadStatus && (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Processing: {uploadStatus.fileName}</span>
                          <Badge
                            variant={
                              uploadStatus.status === "COMPLETED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {uploadStatus.status}
                          </Badge>
                        </div>
                        {uploadStatus.status === "PROCESSING" && (
                          <Progress
                            value={
                              (uploadStatus.processedLeads /
                                Math.max(uploadStatus.totalLeads, 1)) *
                              100
                            }
                          />
                        )}
                        {uploadStatus.status === "COMPLETED" && (
                          <p className="text-sm">
                            Successfully processed {uploadStatus.processedLeads}{" "}
                            leads.
                            {uploadStatus.failedLeads > 0 &&
                              ` ${uploadStatus.failedLeads} failed.`}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                      <SelectItem value="QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="UNQUALIFIED">Unqualified</SelectItem>
                      <SelectItem value="CONVERTED">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Country"
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="w-[150px]"
                  />
                  <Input
                    placeholder="Industry"
                    value={filterIndustry}
                    onChange={(e) => setFilterIndustry(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Leads Table */}
            <Card>
              <CardHeader>
                <CardTitle>Leads ({leads.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Contact</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            Loading leads...
                          </TableCell>
                        </TableRow>
                      ) : leads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            No leads found. Try uploading some leads or
                            adjusting your filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        leads.map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">
                              {lead.name}
                            </TableCell>
                            <TableCell>{lead.email}</TableCell>
                            <TableCell>{lead.company || "-"}</TableCell>
                            <TableCell>{lead.country || "-"}</TableCell>
                            <TableCell>{lead.industry || "-"}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(lead.status)}>
                                {lead.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {lead.emailsSent?.[0]?.createdAt
                                ? new Date(
                                    lead.emailsSent[0].createdAt
                                  ).toLocaleDateString()
                                : "Never"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
