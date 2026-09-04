"use client";

import * as React from "react";
import { useState } from "react";
import {
  Film,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Camera,
  Layers,
  Sparkles,
  ChevronDown,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { LeadDeliverable, DEFAULT_DELIVERABLES } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createLeadDeliverableServerAction,
  updateLeadDeliverableServerAction,
  deleteLeadDeliverableServerAction,
} from "@/lib/crm-actions";

interface DeliverablesEditorProps {
  leadId: string;
  initialDeliverables: LeadDeliverable[];
}

export function DeliverablesEditor({ leadId, initialDeliverables = [] }: DeliverablesEditorProps) {
  const router = useRouter();
  const [deliverables, setDeliverables] = useState<LeadDeliverable[]>(initialDeliverables);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add modal state
  const [selectedPreset, setSelectedPreset] = useState<string>(DEFAULT_DELIVERABLES[0].name);
  const [customName, setCustomName] = useState("");
  const [itemType, setItemType] = useState("Photography");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");

  // Edit modal state
  const [editingItem, setEditingItem] = useState<LeadDeliverable | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editNotes, setEditNotes] = useState("");

  React.useEffect(() => {
    setDeliverables(initialDeliverables);
  }, [initialDeliverables]);

  const handlePresetSelect = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName === "Other") {
      setCustomName("");
      setItemType("Custom");
      setQuantity(1);
      setNotes("");
    } else {
      const match = DEFAULT_DELIVERABLES.find((d) => d.name === presetName);
      if (match) {
        setCustomName(match.name);
        setItemType(match.type);
        setQuantity(match.defaultQty);
        setNotes(match.notes);
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = selectedPreset === "Other" ? customName.trim() : selectedPreset;
    if (!finalName) {
      toast.error("Please specify a deliverable name");
      return;
    }

    try {
      setIsSubmitting(true);
      const isCustom = selectedPreset === "Other" || !DEFAULT_DELIVERABLES.some((d) => d.name === finalName);

      // Optimistic addition
      const tempId = "del-" + Date.now();
      const optimisticItem: LeadDeliverable = {
        id: tempId,
        lead_id: leadId,
        owner_id: "owner-temp",
        name: finalName,
        type: itemType,
        quantity: Math.max(1, quantity),
        notes: notes.trim() || null,
        is_custom: isCustom,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setDeliverables((prev) => [...prev, optimisticItem]);

      const res = await createLeadDeliverableServerAction({
        leadId,
        name: finalName,
        type: itemType,
        quantity: Math.max(1, quantity),
        notes: notes.trim() || undefined,
        isCustom,
      });

      if (res.success) {
        toast.success(`Added "${finalName}" to deliverables.`);
        setIsAddModalOpen(false);
        // Reset form
        setSelectedPreset(DEFAULT_DELIVERABLES[0].name);
        setCustomName("");
        setQuantity(1);
        setNotes("");
        router.refresh();
      } else {
        toast.error("Failed to add deliverable", { description: (res as any)?.error });
        setDeliverables(initialDeliverables);
      }
    } catch {
      toast.error("An error occurred while saving deliverable.");
      setDeliverables(initialDeliverables);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: LeadDeliverable) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditType(item.type || "Deliverable");
    setEditQuantity(item.quantity || 1);
    setEditNotes(item.notes || "");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim()) return;

    try {
      setIsSubmitting(true);
      setDeliverables((prev) =>
        prev.map((d) =>
          d.id === editingItem.id
            ? {
                ...d,
                name: editName.trim(),
                type: editType,
                quantity: Math.max(1, editQuantity),
                notes: editNotes.trim() || null,
                updated_at: new Date().toISOString(),
              }
            : d
        )
      );

      const res = await updateLeadDeliverableServerAction(editingItem.id, leadId, {
        name: editName.trim(),
        type: editType,
        quantity: Math.max(1, editQuantity),
        notes: editNotes.trim() || null,
      });

      if (res.success) {
        toast.success("Deliverable updated.");
        setIsEditModalOpen(false);
        setEditingItem(null);
        router.refresh();
      } else {
        toast.error("Failed to update deliverable");
        setDeliverables(initialDeliverables);
      }
    } catch {
      toast.error("An error occurred while updating deliverable.");
      setDeliverables(initialDeliverables);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      setDeletingId(id);
      setDeliverables((prev) => prev.filter((d) => d.id !== id));
      const res = await deleteLeadDeliverableServerAction(id, leadId);
      if (res.success) {
        toast.success(`Removed "${name}" from deliverables.`);
        router.refresh();
      } else {
        toast.error("Failed to remove deliverable");
        setDeliverables(initialDeliverables);
      }
    } catch {
      toast.error("An error occurred while deleting deliverable.");
      setDeliverables(initialDeliverables);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" />
            <span>Deliverables & Production Scope</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Dynamic contracted photography, cinema, album, and production deliverables
          </CardDescription>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            handlePresetSelect(DEFAULT_DELIVERABLES[0].name);
            setIsAddModalOpen(true);
          }}
          className="gap-1.5 text-xs shadow-2xs shrink-0"
        >
          <Plus className="h-3.5 w-3.5 text-primary" />
          <span>Add Deliverable</span>
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {deliverables.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl text-center space-y-2 bg-muted/10">
            <Film className="h-8 w-8 text-muted-foreground/40" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">No Deliverables Assigned</p>
              <p className="text-[11px] text-muted-foreground">
                Add standard ceremony documentation, cinematic films, albums, or custom deliverables.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                handlePresetSelect(DEFAULT_DELIVERABLES[0].name);
                setIsAddModalOpen(true);
              }}
              className="text-xs mt-2"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add First Deliverable
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {deliverables.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 border rounded-xl bg-card hover:bg-muted/20 transition-all gap-2 group shadow-2xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {item.name}
                    </span>
                    {item.quantity > 1 && (
                      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                        Qty: {item.quantity}
                      </Badge>
                    )}
                    {item.type && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">
                        {item.type}
                      </Badge>
                    )}
                    {item.is_custom && (
                      <Badge variant="warning" className="text-[9px] px-1 py-0">
                        Custom
                      </Badge>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => openEditModal(item)}
                    title="Edit Deliverable"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(item.id, item.name)}
                    disabled={deletingId === item.id}
                    title="Delete Deliverable"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Deliverable Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <span>Add Production Deliverable</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select a preset package deliverable or specify custom client media handover.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="presetSelect">Deliverable Preset</Label>
              <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                <SelectTrigger id="presetSelect">
                  <SelectValue placeholder="Choose a deliverable" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {DEFAULT_DELIVERABLES.map((d) => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.name} {d.type ? `(${d.type})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* If Other selected, show custom name input */}
            {selectedPreset === "Other" && (
              <div className="space-y-1.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-in fade-in-50">
                <Label htmlFor="customDeliverableName" className="text-xs font-semibold">
                  Specify Other Deliverable <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customDeliverableName"
                  placeholder="e.g. 4K Drone Reel, Crane Coverage, Silk Wall Scroll..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="text-xs bg-background"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="deliverableType">Type / Category</Label>
                <Input
                  id="deliverableType"
                  placeholder="e.g. Photography / Print"
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deliverableNotes">Scope Notes / Specifications</Label>
              <Input
                id="deliverableNotes"
                placeholder="e.g. 40-page silk flush mount, 3-5 min 4K teaser..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Deliverable Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-primary" />
              <span>Edit Deliverable</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="editDeliverableName">Deliverable Name</Label>
              <Input
                id="editDeliverableName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editType">Type / Category</Label>
                <Input
                  id="editType"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editQty">Quantity</Label>
                <Input
                  id="editQty"
                  type="number"
                  min={1}
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editNotes">Notes</Label>
              <Input
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
