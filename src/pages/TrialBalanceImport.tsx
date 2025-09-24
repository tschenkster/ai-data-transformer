import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, Upload, Database, BarChart3, Download, Trash2 } from "lucide-react";
import { TrialBalanceUpload } from "@/features/imports/trial-balance-import/components/TrialBalanceUpload";
import { useTrialBalanceData } from "@/features/imports/trial-balance-import/hooks/useTrialBalanceData";
import { DataTable } from "@/components/ui/data-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export default function TrialBalanceImport() {
  const [selectedEntityUuid, setSelectedEntityUuid] = useState<string | null>(null);
  const [entities, setEntities] = useState<Array<{ entity_uuid: string; entity_name: string }>>([]);
  const { user } = useAuth();
  
  const { 
    data: trialBalanceData, 
    loading, 
    error, 
    refetch,
    deleteRecord,
    summary 
  } = useTrialBalanceData(selectedEntityUuid || undefined);

  useEffect(() => {
    const fetchEntities = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('entities')
        .select('entity_uuid, entity_name')
        .order('entity_name');
        
      if (data && !error) {
        setEntities(data);
        if (data.length > 0 && !selectedEntityUuid) {
          setSelectedEntityUuid(data[0].entity_uuid);
        }
      }
    };
    
    fetchEntities();
  }, [user, selectedEntityUuid]);

  const columns = [
    {
      accessorKey: "account_number",
      header: "Account",
    },
    {
      accessorKey: "account_description",
      header: "Description",
    },
    {
      accessorKey: "account_type",
      header: "Type",
      cell: ({ row }: any) => (
        <Badge variant="secondary">{row.getValue("account_type")}</Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }: any) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: row.original.currency_code,
        }).format(amount);
        return <span className={amount < 0 ? "text-red-600" : ""}>{formatted}</span>;
      },
    },
    {
      accessorKey: "period_key_yyyymm",
      header: "Period",
      cell: ({ row }: any) => {
        const period = row.getValue("period_key_yyyymm");
        const year = Math.floor(period / 100);
        const month = period % 100;
        return `${year}-${month.toString().padStart(2, '0')}`;
      },
    },
    {
      accessorKey: "source_file_name",
      header: "Source File",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteRecord(row.original.trial_balance_upload_uuid)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert>
          <AlertDescription>
            Please log in to access the Trial Balance Import feature.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Trial Balance Import</h1>
          <Badge variant="default" className="ml-2">
            <Upload className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Upload and process trial balance data with intelligent validation and structured storage
        </p>
      </div>

      {/* Entity Selection */}
      {entities.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Entity</CardTitle>
            <CardDescription>Choose the entity for trial balance import</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {entities.map((entity) => (
                <Button
                  key={entity.entity_uuid}
                  variant={selectedEntityUuid === entity.entity_uuid ? "default" : "outline"}
                  onClick={() => setSelectedEntityUuid(entity.entity_uuid)}
                >
                  {entity.entity_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedEntityUuid ? (
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data View
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <TrialBalanceUpload 
              entityUuid={selectedEntityUuid}
              onUploadComplete={() => refetch()}
            />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trial Balance Data</CardTitle>
                <CardDescription>
                  View and manage uploaded trial balance records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading trial balance data...</p>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Error loading data: {error}
                    </AlertDescription>
                  </Alert>
                ) : trialBalanceData.length > 0 ? (
                  <DataTable 
                    columns={columns} 
                    data={trialBalanceData}
                    searchKey="account_description"
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No trial balance data found. Upload a file to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalRecords}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Unique Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.uniqueAccounts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Periods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.periods}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Currencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.currencies}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Account Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.accountTypes.bs}</div>
                    <div className="text-sm text-muted-foreground">Balance Sheet</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.accountTypes.pl}</div>
                    <div className="text-sm text-muted-foreground">P&L</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{summary.accountTypes.subledger}</div>
                    <div className="text-sm text-muted-foreground">Subledger</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{summary.accountTypes.statistical}</div>
                    <div className="text-sm text-muted-foreground">Statistical</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No entities found. Please contact your administrator to set up entity access.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}