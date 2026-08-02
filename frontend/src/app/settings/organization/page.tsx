"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { organizationService } from "@/services/organization";
import { InvitationResponse, Organization, OrganizationMember, RoleDetail } from "@/types/organization";

export default function OrganizationSettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [roles, setRoles] = useState<RoleDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [orgName, setOrgName] = useState("");
  const [orgDomain, setOrgDomain] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<InvitationResponse | null>(null);

  // Transfer Ownership modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetOwnerId, setTargetOwnerId] = useState("");
  const [transferring, setTransferring] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orgData, memberList, roleList] = await Promise.all([
        organizationService.getCurrentOrganization(),
        organizationService.listMembers(),
        organizationService.listRoles(),
      ]);
      setOrg(orgData);
      setOrgName(orgData.name);
      setOrgDomain(orgData.domain || "");
      setMembers(memberList);
      setRoles(roleList);
    } catch (err: any) {
      setError(err.message || "Failed to load organization settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      const updated = await organizationService.updateOrganization({
        name: orgName,
        domain: orgDomain,
      });
      setOrg(updated);
      alert("Organization settings updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update organization.");
    } finally {
      setSavingOrg(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await organizationService.inviteUser({
        email: inviteEmail,
        role_code: inviteRole,
      });
      setInviteSuccess(res);
      setInviteEmail("");
    } catch (err: any) {
      alert(err.message || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRoleCode: string) => {
    try {
      await organizationService.updateMemberRole(userId, newRoleCode);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update member role.");
    }
  };

  const handleRemoveMember = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the organization?`)) return;
    try {
      await organizationService.removeMember(userId);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to remove member.");
    }
  };

  const handleTransferOwnership = async () => {
    if (!targetOwnerId) return;
    setTransferring(true);
    try {
      await organizationService.transferOwnership(targetOwnerId);
      setShowTransferModal(false);
      await loadData();
      alert("Organization ownership transferred successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to transfer ownership.");
    } finally {
      setTransferring(false);
    }
  };

  const getRoleBadgeVariant = (roleCode: string) => {
    switch (roleCode.toLowerCase()) {
      case "owner":
        return "destructive";
      case "admin":
        return "default";
      case "manager":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-muted-foreground animate-pulse">
        Loading organization architecture & team data...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Organization & Team Management</h1>
          <p className="text-muted-foreground text-sm">
            Manage multi-tenant workspace settings, member roles, invitations, and access permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowTransferModal(true)}>
            Transfer Ownership
          </Button>
          <Button onClick={() => setShowInviteModal(true)}>
            + Invite Member
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Organization Profile Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Configure workspace metadata and domain settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateOrg} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Organization Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Custom Domain (Optional)
              </label>
              <input
                type="text"
                placeholder="acme.com"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={orgDomain}
                onChange={(e) => setOrgDomain(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={savingOrg}>
                {savingOrg ? "Saving..." : "Save Changes"}
              </Button>
              {org && (
                <span className="text-xs text-muted-foreground">
                  Slug: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{org.slug}</code>
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members ({members.length})</CardTitle>
            <CardDescription>Active members with assigned Role-Based Access Control (RBAC).</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground font-semibold text-xs">
                  <th className="pb-3 px-2">Member</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {members.map((member) => {
                  const mainRole = member.roles[0]?.code || "viewer";
                  const isOwner = mainRole === "owner";
                  return (
                    <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground">
                          {member.first_name || member.last_name
                            ? `${member.first_name || ""} ${member.last_name || ""}`
                            : member.email}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">{member.email}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(mainRole)} className="capitalize">
                            {mainRole}
                          </Badge>
                          {!isOwner && (
                            <select
                              className="text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none"
                              value={mainRole}
                              onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="developer">Developer</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {!isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveMember(member.id, member.email)}
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold">Invite Team Member</h3>
            <p className="text-xs text-muted-foreground">
              Send an invitation to join your workspace with a pre-configured RBAC role.
            </p>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Assign Role
                </label>
                <select
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="admin">Admin - Full team management</option>
                  <option value="manager">Manager - Manage team resources</option>
                  <option value="developer">Developer - Technical workspace write access</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>

              {inviteSuccess && (
                <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 space-y-1">
                  <div className="font-semibold">Invitation Created!</div>
                  <div>Share Link: <code className="bg-background px-1 py-0.5 rounded font-mono text-[10px] select-all">{inviteSuccess.invite_url}</code></div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteSuccess(null);
                  }}
                >
                  Close
                </Button>
                <Button type="submit" disabled={inviting}>
                  {inviting ? "Inviting..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-destructive">Transfer Workspace Ownership</h3>
            <p className="text-xs text-muted-foreground">
              Select a team member to become the new primary Organization Owner. Your role will be changed to Admin.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  New Owner
                </label>
                <select
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={targetOwnerId}
                  onChange={(e) => setTargetOwnerId(e.target.value)}
                >
                  <option value="">Select a team member...</option>
                  {members
                    .filter((m) => !m.roles.some((r) => r.code === "owner"))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.email} ({m.first_name || "User"})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={!targetOwnerId || transferring}
                  onClick={handleTransferOwnership}
                >
                  {transferring ? "Transferring..." : "Confirm Transfer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
