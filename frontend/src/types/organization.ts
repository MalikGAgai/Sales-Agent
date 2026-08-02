export interface RoleDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  is_active: boolean;
  created_at: string;
  member_count: number;
}

export interface OrganizationMember {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  roles: RoleDetail[];
  created_at: string;
}

export interface InviteUserRequest {
  email: string;
  role_code: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  role_name: string;
  role_code: string;
  expires_at: string;
  created_at: string;
  invite_url?: string;
}

export interface AcceptInvitationRequest {
  token: string;
  first_name?: string;
  last_name?: string;
  password: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  domain?: string;
}

export interface UpdateMemberRoleRequest {
  role_code: string;
}

export interface TransferOwnershipRequest {
  new_owner_user_id: string;
}
