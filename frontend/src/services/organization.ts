import {
  AcceptInvitationRequest,
  InvitationResponse,
  InviteUserRequest,
  Organization,
  OrganizationMember,
  RoleDetail,
  TransferOwnershipRequest,
  UpdateMemberRoleRequest,
  UpdateOrganizationRequest,
} from "@/types/organization";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const organizationService = {
  async getCurrentOrganization(): Promise<Organization> {
    const res = await fetch(`${API_BASE}/organizations/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch organization settings.");
    return res.json();
  },

  async updateOrganization(data: UpdateOrganizationRequest): Promise<Organization> {
    const res = await fetch(`${API_BASE}/organizations/me`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update organization settings.");
    return res.json();
  },

  async listMembers(): Promise<OrganizationMember[]> {
    const res = await fetch(`${API_BASE}/organizations/me/members`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch organization members.");
    return res.json();
  },

  async inviteUser(data: InviteUserRequest): Promise<InvitationResponse> {
    const res = await fetch(`${API_BASE}/organizations/me/invitations`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to send invitation.");
    }
    return res.json();
  },

  async acceptInvitation(data: AcceptInvitationRequest): Promise<OrganizationMember> {
    const res = await fetch(`${API_BASE}/organizations/invitations/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to accept invitation.");
    }
    return res.json();
  },

  async removeMember(userId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/organizations/me/members/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to remove team member.");
  },

  async updateMemberRole(userId: string, roleCode: string): Promise<OrganizationMember> {
    const res = await fetch(`${API_BASE}/organizations/me/members/${userId}/role`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ role_code: roleCode } as UpdateMemberRoleRequest),
    });
    if (!res.ok) throw new Error("Failed to update member role.");
    return res.json();
  },

  async transferOwnership(newOwnerUserId: string): Promise<OrganizationMember> {
    const res = await fetch(`${API_BASE}/organizations/me/transfer-ownership`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ new_owner_user_id: newOwnerUserId } as TransferOwnershipRequest),
    });
    if (!res.ok) throw new Error("Failed to transfer organization ownership.");
    return res.json();
  },

  async listRoles(): Promise<RoleDetail[]> {
    const res = await fetch(`${API_BASE}/organizations/me/roles`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch roles.");
    return res.json();
  },
};
