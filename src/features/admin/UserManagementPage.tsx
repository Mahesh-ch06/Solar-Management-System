import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getUsers,
  getRoleAuditLogs,
  updateUserRole,
  updateUserStatus,
} from '../../store/inMemoryDb';
import { UserAccount, RoleAuditEntry } from '../../types/auth';
import { UserRole } from '../../types/roles';
import { ROLE_CONFIGS } from '../../constants/roles';
import { emailService } from '../../services/emailService';
import { apiClient } from '../../api/apiClient';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { SearchInput } from '../../components/ui/FormControls';
import { useToast } from '../../context/ToastContext';

import {
  ShieldCheck,
  UserCheck,
  Clock,
  History,
  Mail,
  Building,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const { showToast } = useToast();

  const [userList, setUserList] = useState<UserAccount[]>(getUsers());
  const [auditLogs, setAuditLogs] = useState<RoleAuditEntry[]>(getRoleAuditLogs());

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Role Assignment Modal state
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserAccount | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<UserRole>('SALES');
  const [changeReason, setChangeReason] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // Audit History Modal state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const refreshData = async () => {
    try {
      const [usersRes, logsRes] = await Promise.all([
        apiClient.get('/admin/users'),
        apiClient.get('/admin/audit-logs'),
      ]);
      if (usersRes.data?.data && Array.isArray(usersRes.data.data)) {
        setUserList(usersRes.data.data);
      } else {
        setUserList(getUsers());
      }
      if (logsRes.data?.data && Array.isArray(logsRes.data.data)) {
        setAuditLogs(logsRes.data.data);
      } else {
        setAuditLogs(getRoleAuditLogs());
      }
    } catch {
      setUserList(getUsers());
      setAuditLogs(getRoleAuditLogs());
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredUsers = userList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingCount = userList.filter((u) => u.status === 'PENDING_APPROVAL').length;
  const activeCount = userList.filter((u) => u.status === 'ACTIVE').length;

  const handleOpenRoleModal = (targetUser: UserAccount) => {
    setSelectedUserForRole(targetUser);
    setNewSelectedRole(targetUser.role);
    setChangeReason('');
    setSendEmailNotification(true);
  };

  const handleSaveRoleChange = async () => {
    if (!selectedUserForRole || !currentAdmin) return;

    if (!changeReason.trim()) {
      showToast('Validation Error', 'Please specify a reason for this role assignment for the audit log.', 'error');
      return;
    }

    try {
      setIsSubmittingRole(true);
      const oldRole = selectedUserForRole.role;

      // 1. Update in backend REST API if active
      try {
        await apiClient.patch(`/admin/users/${selectedUserForRole.id}/role`, {
          role: newSelectedRole,
          reason: changeReason.trim(),
          activateUser: true,
        });
        if (selectedUserForRole.status === 'PENDING_APPROVAL') {
          await apiClient.patch(`/admin/users/${selectedUserForRole.id}/status`, { status: 'ACTIVE' }).catch(() => {});
        }
      } catch {
        // Fallback to local store
      }

      // 2. Update in client database
      updateUserRole(
        selectedUserForRole.id,
        newSelectedRole,
        currentAdmin.id,
        currentAdmin.name,
        changeReason.trim()
      );

      // If user was pending approval, also activate them
      if (selectedUserForRole.status === 'PENDING_APPROVAL') {
        updateUserStatus(selectedUserForRole.id, 'ACTIVE');
      }

      // 3. Dispatch Email notification if requested
      if (sendEmailNotification) {
        await emailService.notifyRoleAssigned(
          selectedUserForRole.email,
          selectedUserForRole.name,
          ROLE_CONFIGS[oldRole]?.label || oldRole,
          ROLE_CONFIGS[newSelectedRole]?.label || newSelectedRole,
          currentAdmin.name,
          changeReason.trim()
        );
      }

      await refreshData();
      showToast(
        'Role Updated',
        `${selectedUserForRole.name} assigned to ${ROLE_CONFIGS[newSelectedRole]?.label || newSelectedRole}. Audit log updated.`,
        'success'
      );
      setSelectedUserForRole(null);
    } catch {
      showToast('Operation Failed', 'Could not update role. Verify user exists.', 'error');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleStatusToggle = async (targetUser: UserAccount, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      try {
        await apiClient.patch(`/admin/users/${targetUser.id}/status`, {
          status: newStatus,
        });
      } catch {
        // Fallback
      }
      updateUserStatus(targetUser.id, newStatus);
      await refreshData();
      showToast(
        'Status Changed',
        `${targetUser.name}'s account is now ${newStatus.replace('_', ' ')}.`,
        'info'
      );
    } catch {
      showToast('Operation Failed', 'Could not update user status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Admin User Management & RBAC"
        subtitle="Manage employee accounts, assign organizational roles, review pending staff approvals, and inspect permission audit logs."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAuditModalOpen(true)}
            leftIcon={<History className="w-4 h-4 text-zinc-400" />}
          >
            Role Audit Trail ({auditLogs.length})
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-purple-500 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Accounts</p>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">{userList.length}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Staff & Enterprise Accounts</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active Authorized</p>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">{activeCount}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Authenticated staff with roles</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 shadow-xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Review</p>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">{pendingCount}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">New registrations awaiting role</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-sky-500 shadow-xs">
          <p className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Role Audits</p>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">{auditLogs.length}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Logged permission changes</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            {['ALL', 'ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st === 'PENDING_APPROVAL' ? `Pending (${pendingCount})` : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 bg-white text-slate-800 px-3 py-1.5 font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
          >
            <option value="ALL">All Roles</option>
            {Object.keys(ROLE_CONFIGS).map((rk) => (
              <option key={rk} value={rk} className="text-slate-800">
                {ROLE_CONFIGS[rk as UserRole].label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-72">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search name, email, department..."
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Assigned Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Role Authorized By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                  No users found matching your search or filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((targetUser) => {
                const roleConfig = ROLE_CONFIGS[targetUser.role] || {
                  label: targetUser.role,
                  badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
                };
                const isPending = targetUser.status === 'PENDING_APPROVAL';
                const isSuspended = targetUser.status === 'SUSPENDED';

                return (
                  <TableRow key={targetUser.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                    <TableCell>
                      <div>
                        <span className="font-semibold text-slate-900 block text-xs">{targetUser.name}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {targetUser.email}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleConfig.badgeColor}`}>
                        {roleConfig.label}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-700 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {targetUser.department || 'Operations'}
                      </span>
                    </TableCell>

                    <TableCell>
                      {targetUser.status === 'ACTIVE' && (
                        <Badge variant="emerald" size="sm" dot>
                          Active
                        </Badge>
                      )}
                      {targetUser.status === 'PENDING_APPROVAL' && (
                        <Badge variant="amber" size="sm" dot>
                          Pending Approval
                        </Badge>
                      )}
                      {targetUser.status === 'SUSPENDED' && (
                        <Badge variant="rose" size="sm" dot>
                          Suspended
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-600">
                      <div>
                        <span className="text-slate-800 font-medium">{targetUser.roleAssignedBy || 'System Provisioned'}</span>
                        {targetUser.roleAssignedAt && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {new Date(targetUser.roleAssignedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending ? (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenRoleModal(targetUser)}
                          >
                            Approve & Assign Role
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRoleModal(targetUser)}
                            >
                              Change Role
                            </Button>

                            {isSuspended ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusToggle(targetUser, 'ACTIVE')}
                                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              >
                                Activate
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusToggle(targetUser, 'SUSPENDED')}
                                className="text-rose-700 border-rose-300 hover:bg-rose-50"
                              >
                                Suspend
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Role Assignment Modal */}
      {selectedUserForRole && (
        <Modal
          isOpen={Boolean(selectedUserForRole)}
          onClose={() => setSelectedUserForRole(null)}
          title={`Assign Role: ${selectedUserForRole.name}`}
          description={`Update system permissions for ${selectedUserForRole.email}. All role changes are logged for security auditing.`}
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUserForRole(null)}
                disabled={isSubmittingRole}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveRoleChange}
                isLoading={isSubmittingRole}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Confirm Role Assignment
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p>
                <span className="text-slate-500">Current Role:</span>{' '}
                <strong className="text-slate-900 font-semibold">{ROLE_CONFIGS[selectedUserForRole.role]?.label || selectedUserForRole.role}</strong>
              </p>
              <p>
                <span className="text-slate-500">Registered Department:</span>{' '}
                <span className="text-slate-700 font-medium">{selectedUserForRole.department || 'Not specified'}</span>
              </p>
            </div>

            <Select
              label="Select Authorized Role"
              value={newSelectedRole}
              onChange={(e) => setNewSelectedRole(e.target.value as UserRole)}
              options={[
                { label: 'Sales Executive (Leads, Surveys, Quotations)', value: 'SALES' },
                { label: 'Field Technician (Surveys, Installations, Checklists)', value: 'TECHNICIAN' },
                { label: 'Warehouse Manager (Stock, Dispatches, Serial Numbers)', value: 'WAREHOUSE_MANAGER' },
                { label: 'Support Agent (Warranty Verification, Service Tickets)', value: 'SUPPORT_AGENT' },
                { label: 'Managing Director (Executive Finance & Reports)', value: 'DIRECTOR' },
                { label: 'System Administrator (Full System Operations)', value: 'ADMIN' },
              ]}
            />

            <Textarea
              label="Reason for Role Assignment (Required for Audit Trail)"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="e.g. Employee completed certification and transferred to Lead Field Engineer..."
              rows={3}
              required
            />

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                checked={sendEmailNotification}
                onChange={(e) => setSendEmailNotification(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-500"
              />
              <span>
                Dispatch notification to <strong>{selectedUserForRole.email}</strong> informing them of this role assignment.
              </span>
            </label>
          </div>
        </Modal>
      )}

      {/* Role Audit Trail Modal */}
      {isAuditModalOpen && (
        <Modal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          title="Role & Permission Change Audit History"
          description="Chronological ledger of all administrative role grants, modifications, and revocations."
          size="lg"
          footer={
            <Button variant="primary" size="sm" onClick={() => setIsAuditModalOpen(false)}>
              Close Audit Trail
            </Button>
          }
        >
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">No role changes recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{log.userName}</span>
                      <span className="text-slate-500 font-mono text-[11px]">({log.userEmail})</span>
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs pt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-medium">
                      {ROLE_CONFIGS[log.oldRole]?.label || log.oldRole}
                    </span>
                    <span className="text-slate-400">➔</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                      {ROLE_CONFIGS[log.newRole]?.label || log.newRole}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200 flex items-start justify-between gap-4 text-[11px] text-slate-600">
                    <p className="italic">"{log.reason}"</p>
                    <span className="text-slate-500 shrink-0 font-medium">By: {log.changedByAdminName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
