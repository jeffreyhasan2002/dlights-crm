"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Plus,
  ArrowUpRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
  IndianRupee,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Client, LeadWithDetails, Booking } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NewEnquiryDialog } from "@/components/forms/new-enquiry-dialog";
import { deleteClientServerAction } from "@/lib/crm-actions";

interface ClientsDirectoryViewProps {
  clients: Client[];
  leads: LeadWithDetails[];
  bookings: Booking[];
}

export function ClientsDirectoryView({ clients: initialClients, leads, bookings }: ClientsDirectoryViewProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      setIsDeleting(true);
      const res = await deleteClientServerAction(clientToDelete.id);
      if (res.success) {
        toast.success(`${clientToDelete.name} and related records deleted.`);
        setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
        setClientToDelete(null);
        router.refresh();
      } else {
        toast.error("Failed to delete client", { description: (res as any)?.error });
      }
    } catch {
      toast.error("An error occurred while deleting client.");
    } finally {
      setIsDeleting(false);
    }
  };
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "booked" | "enquiry">("all");
  const [sortBy, setSortBy] = useState<"name" | "spend" | "leads" | "recent">("recent");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Compute stats
  const clientStats = useMemo(() => {
    return clients.map((c) => {
      const clientLeads = leads.filter((l) => l.client_id === c.id);
      const clientBookings = bookings.filter((b) => b.client_id === c.id);
      const totalSpent = clientBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const hasBooked = clientBookings.length > 0;
      const hasEnquiries = clientLeads.length > 0;

      return {
        ...c,
        leadsCount: clientLeads.length,
        bookingsCount: clientBookings.length,
        totalSpent,
        hasBooked,
        hasEnquiries,
        leadId: clientLeads[0]?.id,
      };
    });
  }, [clients, leads, bookings]);

  // Filtered and Sorted
  const filteredClients = useMemo(() => {
    return clientStats
      .filter((c) => {
        if (tabFilter === "booked" && !c.hasBooked) return false;
        if (tabFilter === "enquiry" && !c.hasEnquiries) return false;

        if (search.trim()) {
          const term = search.toLowerCase().trim();
          const matchName = c.name?.toLowerCase().includes(term);
          const matchPhone = c.phone?.includes(term);
          const matchEmail = c.email?.toLowerCase().includes(term);
          const matchLoc = c.location?.toLowerCase().includes(term);
          if (!matchName && !matchPhone && !matchEmail && !matchLoc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "spend") {
          return b.totalSpent - a.totalSpent;
        }
        if (sortBy === "leads") {
          return b.leadsCount - a.leadsCount;
        }
        // Recent
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [clientStats, search, tabFilter, sortBy]);

  // Pagination calculations
  const totalItems = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + pageSize);

  const bookedClientsCount = clientStats.filter((c) => c.hasBooked).length;
  const totalLifetimeValue = clientStats.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Clients Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total of {clients.length} couples & studio client accounts registered.
          </p>
        </div>

        <NewEnquiryDialog
          trigger={
            <Button className="gap-1.5 shadow-xs font-semibold text-xs h-9">
              <Plus className="h-4 w-4" />
              <span>Add Client / Enquiry</span>
            </Button>
          }
        />
      </div>

      {/* KPI Overview Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="shadow-xs p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">Total Registered</span>
            <span className="text-xl font-bold text-foreground">{clients.length} Clients</span>
          </div>
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card className="shadow-xs p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">Confirmed Bookings</span>
            <span className="text-xl font-bold text-emerald-600">{bookedClientsCount} Couples</span>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600">
            <Sparkles className="h-5 w-5" />
          </div>
        </Card>

        <Card className="shadow-xs p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">Total Client Value</span>
            <span className="text-xl font-bold text-foreground">{formatCurrency(totalLifetimeValue)}</span>
          </div>
          <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600">
            <IndianRupee className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Controls Bar: Search, Tabs, Sorting, View Toggle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-3 rounded-xl border bg-card shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-9 text-xs"
            />
          </div>

          {/* Filter Tabs */}
          <Tabs
            value={tabFilter}
            onValueChange={(v: any) => {
              setTabFilter(v);
              setPage(1);
            }}
          >
            <TabsList className="bg-muted/60 p-1">
              <TabsTrigger value="all" className="text-xs">
                All ({clients.length})
              </TabsTrigger>
              <TabsTrigger value="booked" className="text-xs text-emerald-700 dark:text-emerald-300">
                Booked ({bookedClientsCount})
              </TabsTrigger>
              <TabsTrigger value="enquiry" className="text-xs">
                Enquiries ({clientStats.filter((c) => c.hasEnquiries).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <Select
            value={sortBy}
            onValueChange={(v: any) => {
              setSortBy(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 h-9 text-xs">
              <ArrowUpDown className="h-3 w-3 mr-1.5 opacity-60" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="spend">Highest Value</SelectItem>
              <SelectItem value="leads">Most Enquiries</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/40">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid or Table Rendering */}
      {filteredClients.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-foreground text-base">No clients found</p>
          <p className="text-xs mt-1">Try adjusting your search query or filter settings.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedClients.map((c) => (
            <Card key={c.id} className="shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-foreground truncate">{c.name}</h3>
                    {c.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="h-3 w-3 shrink-0 text-red-500" />
                        <span className="truncate">{c.location}</span>
                      </p>
                    )}
                  </div>
                  {c.hasBooked && (
                    <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shrink-0">
                      Booked
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1 space-y-3">
                {/* Contact info */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  {c.phone && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                </div>

                {/* Account Metrics */}
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/30 p-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Deals</span>
                    <span className="font-semibold text-foreground">{c.leadsCount} enquiries</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Total Spend</span>
                    <span className="font-semibold text-foreground">{formatCurrency(c.totalSpent)}</span>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-1 border-t">
                  <div className="flex items-center gap-1.5">
                    {c.whatsapp && (
                      <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        </a>
                      </Button>
                    )}
                    {c.phone && (
                      <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <a href={`tel:${c.phone}`} title="Call">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {c.leadId && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 font-medium" asChild>
                        <Link href={`/crm/${c.leadId}`}>
                          <span>View Deal</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => setClientToDelete(c)}
                      title="Delete Client"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View for High Density */
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold">Client Name</TableHead>
                <TableHead className="text-xs font-bold">Location</TableHead>
                <TableHead className="text-xs font-bold">Phone / WhatsApp</TableHead>
                <TableHead className="text-xs font-bold">Email</TableHead>
                <TableHead className="text-xs font-bold text-center">Enquiries</TableHead>
                <TableHead className="text-xs font-bold text-right">Lifetime Spend</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30">
                  <TableCell className="font-semibold text-xs text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{c.name}</span>
                      {c.hasBooked && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-600 border-emerald-300">
                          Booked
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.location || "—"}</TableCell>
                  <TableCell className="text-xs">{c.phone || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.email || "—"}</TableCell>
                  <TableCell className="text-xs text-center font-medium">{c.leadsCount}</TableCell>
                  <TableCell className="text-xs text-right font-bold text-foreground">
                    {formatCurrency(c.totalSpent)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {c.whatsapp && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <a href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                          </a>
                        </Button>
                      )}
                      {c.leadId && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                          <Link href={`/crm/${c.leadId}`}>
                            <span>View</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => setClientToDelete(c)}
                        title="Delete Client"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Client Record?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <p>
                Are you sure you want to permanently delete{" "}
                <strong className="text-foreground">{clientToDelete?.name}</strong>?
              </p>
              <p className="text-destructive font-medium">
                This will delete the client profile, associated enquiries, booking contracts, shoot events, and transaction history.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteClient}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination Bar for 1000+ Records */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 text-xs text-muted-foreground border-t">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong>{startIndex + 1}</strong> to{" "}
              <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> of <strong>{totalItems}</strong> clients
            </span>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                  <SelectItem value="96">96</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            <span className="px-3 font-medium text-foreground">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
