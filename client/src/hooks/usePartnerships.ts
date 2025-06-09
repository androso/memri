import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface Partner {
  id: number;
  username: string;
  displayName: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnershipInvitation {
  id: number;
  fromUser: Partner;
  createdAt: string;
  expiresAt: string;
}

export interface InvitationResponse {
  inviteToken: string;
  inviteUrl: string;
  message: string;
}

// Get current user's partner
export function usePartner() {
  return useQuery<{ partner: Partner | null }>({
    queryKey: ["/api/partnerships/partner"],
    refetchInterval: false,
  });
}

// Get pending invitations sent by current user
export function usePendingInvitations() {
  return useQuery<{ invitations: PartnershipInvitation[] }>({
    queryKey: ["/api/partnerships/invitations"],
    refetchInterval: false,
  });
}

// Create partnership invitation
export function useCreateInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation<InvitationResponse, Error>({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/partnerships/invite");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate partner query in case this affects partnership status
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/partner"] });
      // Also invalidate pending invitations to show the new invitation
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/invitations"] });
    },
  });
}

// Get invitation details by token (for invitation page)
export function useInvitationDetails(token: string | null) {
  return useQuery<{ invitation: PartnershipInvitation }>({
    queryKey: ["/api/partnerships/invite", token],
    queryFn: async () => {
      if (!token) throw new Error("No token provided");
      
      const response = await fetch(`/api/partnerships/invite/${token}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    enabled: !!token,
    refetchInterval: false,
    retry: false, // Don't retry on 404s
  });
}

// Accept partnership invitation
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", `/api/partnerships/invite/${token}/accept`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/partner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
  });
}

// Reject partnership invitation
export function useRejectInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", `/api/partnerships/invite/${token}/reject`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate pending invitations in case the rejector was also the sender
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/invitations"] });
    },
  });
}

// Remove partnership
export function useRemovePartnership() {
  const queryClient = useQueryClient();
  
  return useMutation<{ message: string }, Error>({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/partnerships/partnership");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/partner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
  });
}

// Cancel pending invitation
export function useCancelInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (token: string) => {
      const response = await apiRequest("DELETE", `/api/partnerships/invite/${token}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate pending invitations query
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/invitations"] });
    },
  });
} 