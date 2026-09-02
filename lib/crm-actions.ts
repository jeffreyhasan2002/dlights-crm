"use server";

import { revalidatePath } from "next/cache";
import {
  createLeadAction,
  updateLeadStatusAction,
  updateContactStatusAction,
  updateNextActionAction,
  completeFollowUpAction,
  createQuotationAction,
  sendQuotationAction,
  acceptQuotationAction,
  rejectQuotationAction,
  startNegotiationAction,
  recordPaymentAction,
  createEventAction,
  addNoteAction,
  logCommunicationAction,
  scheduleFollowUpAction,
  updateProfileAction,
  deleteLeadAction,
  deleteClientAction,
  deleteQuotationAction,
  deletePaymentAction,
  deleteFollowUpAction,
  deleteEventAction,
} from "./crm-service";
import { EventType, LeadStatus, ContactStatus, RejectionReason } from "@/types/crm";

export async function createLeadServerAction(formData: {
  clientName: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  eventType: EventType;
  eventDate?: string;
  location?: string;
  budget?: number;
  source?: string;
  enquiryMessage?: string;
}) {
  const res = await createLeadAction(formData);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  revalidatePath("/clients");
  return res;
}

export async function updateLeadStatusServerAction(leadId: string, status: LeadStatus) {
  const res = await updateLeadStatusAction(leadId, status);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  revalidatePath(`/crm/${leadId}`);
  return res;
}

export async function updateContactStatusServerAction(leadId: string, status: ContactStatus) {
  const res = await updateContactStatusAction(leadId, status);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  revalidatePath(`/crm/${leadId}`);
  return res;
}

export async function updateNextActionServerAction(leadId: string, nextAction: string, dueAt?: string) {
  const res = await updateNextActionAction(leadId, nextAction, dueAt);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  revalidatePath(`/crm/${leadId}`);
  return res;
}

export async function completeFollowUpServerAction(
  followUpId: string,
  clientResponse?: string,
  notes?: string
) {
  const res = await completeFollowUpAction(followUpId, clientResponse, notes);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  return res;
}

export async function scheduleFollowUpServerAction(data: {
  leadId: string;
  scheduledAt: string;
  contactMethod: any;
  notes?: string;
}) {
  const res = await scheduleFollowUpAction(data);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  revalidatePath(`/crm/${data.leadId}`);
  return res;
}

export async function createQuotationServerAction(data: {
  leadId: string;
  amount: number;
  validUntil?: string;
  notes?: string;
}) {
  const res = await createQuotationAction(data);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  revalidatePath(`/crm/${data.leadId}`);
  return res;
}

export async function sendQuotationServerAction(quotationId: string, leadId?: string) {
  const res = await sendQuotationAction(quotationId);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  if (leadId) revalidatePath(`/crm/${leadId}`);
  return res;
}

export async function acceptQuotationServerAction(quotationId: string, leadId?: string) {
  const res = await acceptQuotationAction(quotationId);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  revalidatePath("/payments");
  if (leadId) revalidatePath(`/crm/${leadId}`);
  return res;
}

export async function rejectQuotationServerAction(
  quotationId: string,
  reason: RejectionReason,
  otherReason?: string,
  leadId?: string
) {
  const res = await rejectQuotationAction(quotationId, reason, otherReason);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  if (leadId) revalidatePath(`/crm/${leadId}`);
  return res;
}

export async function startNegotiationServerAction(
  quotationId: string,
  notes?: string,
  leadId?: string
) {
  const res = await startNegotiationAction(quotationId, notes);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  if (leadId) revalidatePath(`/crm/${leadId}`);
  return res;
}

export async function recordPaymentServerAction(data: {
  bookingId?: string;
  amount: number;
  paymentType: "Advance" | "Partial Payment" | "Final Payment" | "Other";
  paymentMethod: "UPI" | "Bank Transfer" | "Cash" | "Card" | "Cheque" | "Other";
  paymentDate?: string;
  reference?: string;
  notes?: string;
  leadId?: string;
}) {
  const res = await recordPaymentAction(data);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  revalidatePath("/payments");
  if (data.leadId) revalidatePath(`/crm/${data.leadId}`);
  return res;
}

export async function addNoteServerAction(leadId: string, content: string) {
  const res = await addNoteAction(leadId, content);
  revalidatePath(`/crm/${leadId}`);
  return res;
}

export async function logCommunicationServerAction(data: {
  leadId: string;
  contactMethod: any;
  direction: "Outgoing" | "Incoming";
  message?: string;
  messageContent?: string;
  clientResponse?: string;
}) {
  const res = await logCommunicationAction({
    leadId: data.leadId,
    contactMethod: data.contactMethod,
    direction: data.direction,
    messageContent: data.messageContent || data.message || "",
    clientResponse: data.clientResponse,
  });
  revalidatePath(`/crm/${data.leadId}`);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  return res;
}

export async function createEventServerAction(data: {
  clientId: string;
  leadId?: string;
  bookingId?: string;
  eventName: string;
  eventType: any;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  notes?: string;
}) {
  const res = await createEventAction(data);
  revalidatePath("/dashboard");
  revalidatePath("/events");
  if (data.leadId) revalidatePath(`/crm/${data.leadId}`);
  return res;
}

export async function updateProfileServerAction(profileData: any) {
  const res = await updateProfileAction(profileData);
  revalidatePath("/settings");
  return res;
}

export async function deleteLeadServerAction(leadId: string) {
  const res = await deleteLeadAction(leadId);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  revalidatePath("/clients");
  revalidatePath("/events");
  revalidatePath("/payments");
  return res;
}

export async function deleteClientServerAction(clientId: string) {
  const res = await deleteClientAction(clientId);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  revalidatePath("/clients");
  revalidatePath("/events");
  revalidatePath("/payments");
  return res;
}

export async function deleteQuotationServerAction(quotationId: string, leadId?: string) {
  const res = await deleteQuotationAction(quotationId);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  if (leadId) revalidatePath(`/crm/${leadId}`);
  return res;
}

export async function deletePaymentServerAction(paymentId: string, leadId?: string) {
  const res = await deletePaymentAction(paymentId);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  revalidatePath("/payments");
  if (leadId) revalidatePath(`/crm/${leadId}`);
  return res;
}

export async function deleteFollowUpServerAction(followUpId: string, leadId?: string) {
  const res = await deleteFollowUpAction(followUpId);
  revalidatePath("/dashboard");
  revalidatePath("/crm");
  if (leadId) revalidatePath(`/crm/${leadId}`);
  return res;
}

export async function deleteEventServerAction(eventId: string, leadId?: string) {
  const res = await deleteEventAction(eventId);
  revalidatePath("/dashboard");
  revalidatePath("/events");
  if (leadId) revalidatePath(`/crm/${leadId}`);
  return res;
}
