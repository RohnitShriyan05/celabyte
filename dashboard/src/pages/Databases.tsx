import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Database,
  Plus,
  Settings,
  Eye,
  MoreHorizontal,
  Trash2,
  TestTube,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiCall, API_BASE_URL } from "@/utils/api";

interface DatabaseConnection {
  id: string;
  name: string;
  kind: "POSTGRES" | "MYSQL" | "MONGODB" | "EXCEL";
  displayName: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  uri?: string;
  readOnly: boolean;
  status: "connected" | "disconnected" | "testing" | "error";
  lastConnected?: string;
  error?: string;
  createdAt: string;
}

interface ConnectionForm {
  name: string;
  kind: "POSTGRES" | "MYSQL" | "MONGODB" | "EXCEL";
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  uri: string;
  readOnly: boolean;
}

export function Databases() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(
    null
  );
  const { toast } = useToast();

  const [form, setForm] = useState<ConnectionForm>({
    name: "",
    kind: "POSTGRES",
    host: "",
    port: "5432",
    database: "",
    username: "",
    password: "",
    uri: "",
    readOnly: true,
  });

  // Add useEffect to load connections on component mount
  useEffect(() => {
    loadConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const data = await apiCall("/connections");
      setConnections(data);
    } catch (error) {
      console.error("Failed to fetch connections:", error);
      toast({
        title: "Error",
        description: "Failed to fetch connections",
        variant: "destructive",
      });
    }
  };

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      await fetchConnections();
    } catch (error) {
      console.error("Failed to load connections:", error);
      toast({
        title: "Error",
        description: "Failed to load database connections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build connection URI based on database type
      let connectionUri = form.uri;
      if (!connectionUri) {
        switch (form.kind) {
          case "POSTGRES":
            connectionUri = `postgresql://${form.username}:${form.password}@${form.host}:${form.port}/${form.database}`;
            break;
          case "MYSQL":
            connectionUri = `mysql://${form.username}:${form.password}@${form.host}:${form.port}/${form.database}`;
            break;
          case "MONGODB":
            connectionUri = `mongodb://${form.username}:${form.password}@${form.host}:${form.port}/${form.database}`;
            break;
          case "EXCEL":
            connectionUri = form.host; // For Excel, host field contains file path
            break;
        }
      }

      await apiCall("/connections/create", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          kind: form.kind,
          host: form.host,
          port: form.port,
          database: form.database,
          username: form.username,
          password: form.password,
          uri: connectionUri,
          readOnly: form.readOnly,
        }),
      });

      toast({
        title: "Success",
        description: "Database connection created successfully",
      });

      setIsDialogOpen(false);
      resetForm();
      loadConnections();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const testConnection = async (connectionId: string) => {
    setTestingConnection(connectionId);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Authentication required");

      const response = await fetch(
        `${API_BASE_URL}/connections/${connectionId}/test`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Connection Test",
          description: "Connection successful!",
        });

        // Update connection status
        setConnections((prev) =>
          prev.map((conn) =>
            conn.id === connectionId
              ? { ...conn, status: "connected" as const, error: undefined }
              : conn
          )
        );
      } else {
        throw new Error(result.error || "Connection test failed");
      }
    } catch (error: any) {
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });

      // Update connection status
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === connectionId
            ? { ...conn, status: "error" as const, error: error.message }
            : conn
        )
      );
    } finally {
      setTestingConnection(null);
    }
  };

  const deleteConnection = async (connectionId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Authentication required");

      const response = await fetch(
        `${API_BASE_URL}/connections/${connectionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete connection");
      }

      toast({
        title: "Success",
        description: "Database connection deleted successfully",
      });

      loadConnections();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      kind: "POSTGRES",
      host: "",
      port: "5432",
      database: "",
      username: "",
      password: "",
      uri: "",
      readOnly: true,
    });
  };

  const updatePort = (kind: string) => {
    const defaultPorts = {
      POSTGRES: "5432",
      MYSQL: "3306",
      MONGODB: "27017",
      EXCEL: "",
    };
    setForm((prev) => ({
      ...prev,
      port: defaultPorts[kind as keyof typeof defaultPorts],
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Database Connections
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your database connections and access controls
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Database
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Database Connection</DialogTitle>
                <DialogDescription>
                  Connect to PostgreSQL, MySQL, MongoDB, or Excel files
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Connection Name</Label>
                    <Input
                      id="name"
                      placeholder="My Database"
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kind">Database Type</Label>
                    <Select
                      value={form.kind}
                      onValueChange={(value: any) => {
                        setForm((prev) => ({ ...prev, kind: value }));
                        updatePort(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POSTGRES">PostgreSQL</SelectItem>
                        <SelectItem value="MYSQL">MySQL</SelectItem>
                        <SelectItem value="MONGODB">MongoDB</SelectItem>
                        <SelectItem value="EXCEL">
                          Excel/Google Sheets
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.kind !== "EXCEL" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="host">Host</Label>
                        <Input
                          id="host"
                          placeholder="localhost"
                          value={form.host}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              host: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          placeholder="5432"
                          value={form.port}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              port: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="database">Database Name</Label>
                      <Input
                        id="database"
                        placeholder="mydb"
                        value={form.database}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            database: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          placeholder="username"
                          value={form.username}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              username: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="password"
                          value={form.password}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="file-path">
                      File Path or Google Sheets URL
                    </Label>
                    <Input
                      id="file-path"
                      placeholder="/path/to/file.xlsx or https://docs.google.com/spreadsheets/..."
                      value={form.host}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, host: e.target.value }))
                      }
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="uri">Custom Connection URI (Optional)</Label>
                  <Textarea
                    id="uri"
                    placeholder="postgresql://user:pass@host:5432/db"
                    value={form.uri}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, uri: e.target.value }))
                    }
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="readonly"
                    checked={form.readOnly}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, readOnly: checked }))
                    }
                  />
                  <Label htmlFor="readonly">
                    Read-only connection (recommended)
                  </Label>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Connection
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Databases
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connections.length}</div>
              <p className="text-xs text-muted-foreground">
                Active connections
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {connections.filter((c) => c.status === "connected").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Healthy connections
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Database Types
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(connections.map((c) => c.kind)).size}
              </div>
              <p className="text-xs text-muted-foreground">Different types</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read-Only</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {connections.filter((c) => c.readOnly).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Secure connections
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Database List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Databases</CardTitle>
            <CardDescription>
              Manage database connections and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading connections...</span>
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No database connections
                </h3>
                <p className="text-muted-foreground mb-4">
                  Add your first database connection to start querying your data
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Database
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors gap-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <Database className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">
                          {connection.displayName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {connection.kind} •{" "}
                          {connection.readOnly ? "Read-only" : "Read-write"}
                        </p>
                        {connection.error && (
                          <p className="text-xs text-red-500 mt-1 break-words">
                            {connection.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center justify-between sm:block sm:text-right">
                        <Badge
                          variant={
                            connection.status === "connected"
                              ? "default"
                              : connection.status === "error"
                              ? "destructive"
                              : "secondary"
                          }
                          className="w-fit"
                        >
                          {connection.status === "connected" && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {connection.status === "error" && (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {connection.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1 sm:mt-1">
                          {connection.kind}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection(connection.id)}
                          disabled={testingConnection === connection.id}
                          className="flex-1 sm:flex-none"
                        >
                          {testingConnection === connection.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                          <span className="ml-2 sm:hidden">Test</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteConnection(connection.id)}
                          className="flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-2 sm:hidden">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default Databases;
