import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Select from '../../../components/UI/Select';
import Modal from '../../../components/UI/Modal';
import { getUsers, createUser, updateUser, deleteUser, getRoles, createRole, updateRole, deleteRole, getSystemPermissions, updateRolePermissions } from '../../../services/userService';
import { getPharmacies } from '../../../services/pharmacyService';
import { getBranches } from '../../../services/branchService';
import { useAuth } from '../../../context/AuthContext';

const Users = () => {
  const { user, pharmacy, refreshUser } = useAuth();
  const activePharmacyId = user?.pharmacy_id !== null && user?.pharmacy_id !== undefined ? user.pharmacy_id : (pharmacy?.id || null);
  const isSuperAdmin = user?.pharmacy_id === null;
  const [pharmacies, setPharmacies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // User form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    username: '', 
    phone: '', 
    role: 'Operator', 
    designation: '', 
    status: 'Active', 
    password: '', 
    pharmacy_id: activePharmacyId !== null ? String(activePharmacyId) : 'global' 
  });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Role form
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isRoleEditMode, setIsRoleEditMode] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState(null);
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '' });
  const [roleFormError, setRoleFormError] = useState(null);

  // Permissions modal
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, rolesData, permsData] = await Promise.all([
        getUsers(),
        getRoles(),
        getSystemPermissions(),
      ]);

      // Fetch pharmacies and branches separately
      let pharmaciesData = [];
      try {
        pharmaciesData = await getPharmacies();
      } catch (err) {
        console.error('Failed to load pharmacies:', err);
      }
      setPharmacies(pharmaciesData);

      let branchesData = [];
      try {
        branchesData = await getBranches();
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
      setBranches(branchesData);

      const mappedUsers = usersData.map((u) => {
        const pharm = pharmaciesData.find((p) => p.id === u.pharmacy_id);
        const branch = branchesData.find((b) => b.id === u.branch_id);
        return {
          ...u,
          pharmacy_name: pharm ? pharm.name : (u.pharmacy_id === null ? 'Global (Super Admin)' : 'Unlinked'),
          branch_name: branch ? branch.name : (u.branch_id ? `Branch ${u.branch_id}` : 'None'),
        };
      });

      setUsers(mappedUsers);
      setRoles(rolesData);
      setPermissionsList(permsData);
    } catch (err) {
      setError('Failed to fetch data. Please reload page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadBranchOptions = async () => {
      const pharmId = formData.pharmacy_id === '' || formData.pharmacy_id === 'global' ? null : Number(formData.pharmacy_id);
      if (pharmId) {
        try {
          const data = await getBranches({ pharmacy_id: pharmId });
          setBranchOptions(data);
        } catch (err) {
          console.error('Failed to load branches for pharmacy:', err);
        }
      } else {
        setBranchOptions([]);
      }
    };
    
    if (isSuperAdmin) {
      loadBranchOptions();
    } else {
      setBranchOptions(branches);
    }
  }, [formData.pharmacy_id, branches, isSuperAdmin]);

  const showToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  // ─── USER CRUD ──────────────────────────────────────────────

  const openCreate = () => {
    const defaultPharm = activePharmacyId !== null ? String(activePharmacyId) : 'global';
    const activePharmKey = activePharmacyId !== null ? activePharmacyId : null;
    const matchedRoles = roles.filter((r) => r.pharmacy_id === activePharmKey);
    const defaultBranch = !isSuperAdmin && branches.length > 0 ? String(branches[0].id) : '';

    setFormData({
      name: '', email: '', username: '', phone: '',
      role: matchedRoles.length > 0 ? matchedRoles[0]?.name || 'Operator' : 'Operator',
      designation: '', status: 'Active', password: '',
      pharmacy_id: defaultPharm,
      branch_id: defaultBranch,
    });
    setFormError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEdit = (u) => {
    setFormData({
      name: u.name, email: u.email, username: u.username || '', phone: u.phone,
      role: u.role, designation: u.designation || '',
      status: u.status, password: '',
      pharmacy_id: u.pharmacy_id !== null && u.pharmacy_id !== undefined ? String(u.pharmacy_id) : 'global',
      branch_id: u.branch_id !== null && u.branch_id !== undefined ? String(u.branch_id) : '',
    });
    setFormError(null);
    setCurrentId(u.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const nextData = { ...prev, [name]: value };
      if (name === 'pharmacy_id') {
        const nextPharm = value === 'global' || value === '' || value === undefined ? null : Number(value);
        const matchedRoles = roles.filter((r) => r.pharmacy_id === nextPharm);
        nextData.role = matchedRoles.length > 0 ? matchedRoles[0].name : '';
        nextData.branch_id = ''; // reset branch context
      }
      return nextData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const pharmId = formData.pharmacy_id === '' || formData.pharmacy_id === 'global' ? null : Number(formData.pharmacy_id);
      const branchId = formData.branch_id === '' ? null : Number(formData.branch_id);
      const payload = { ...formData, pharmacy_id: pharmId, branch_id: branchId };

      if (isEditMode) {
        const updated = await updateUser(currentId, payload);
        const mapped = {
          ...updated,
          pharmacy_name: pharmId ? (pharmacies.find((p) => p.id === pharmId)?.name || '') : 'Global (Super Admin)',
          branch_name: branchId ? (branchOptions.find((b) => b.id === branchId)?.name || '') : 'None',
        };
        setUsers((prev) => prev.map((u) => (u.id === currentId ? mapped : u)));
        showToast('User updated successfully.');
      } else {
        if (!formData.password) throw new Error('Password is required for new users.');
        const created = await createUser(payload);
        const mapped = {
          ...created,
          pharmacy_name: pharmId ? (pharmacies.find((p) => p.id === pharmId)?.name || '') : 'Global (Super Admin)',
          branch_name: branchId ? (branchOptions.find((b) => b.id === branchId)?.name || '') : 'None',
        };
        setUsers((prev) => [...prev, mapped]);
        showToast('User created successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (window.confirm(`Remove user "${u.name}"?`)) {
      setError(null);
      try {
        await deleteUser(u.id);
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
        showToast('User removed.');
      } catch (err) {
        setError(err.message || 'Failed to remove user.');
      }
    }
  };

  // ─── ROLE CRUD ──────────────────────────────────────────────

  const openCreateRole = () => {
    setRoleFormData({ name: '', description: '' });
    setRoleFormError(null);
    setIsRoleEditMode(false);
    setIsRoleModalOpen(true);
  };

  const openEditRole = (role) => {
    setRoleFormData({ name: role.name, description: role.description });
    setRoleFormError(null);
    setCurrentRoleId(role.id);
    setIsRoleEditMode(true);
    setIsRoleModalOpen(true);
  };

  const handleRoleFormChange = (e) => {
    const { name, value } = e.target;
    setRoleFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setRoleFormError(null);
    setSaving(true);
    try {
      if (isRoleEditMode) {
        const oldRole = roles.find((r) => r.id === currentRoleId);
        const updated = await updateRole(currentRoleId, roleFormData);
        setRoles((prev) => prev.map((r) => (r.id === currentRoleId ? updated : r)));
        
        // Dynamic sync: Update the role name for all users in local state
        if (oldRole && oldRole.name !== updated.name) {
          setUsers((prev) =>
            prev.map((u) => (u.role === oldRole.name ? { ...u, role: updated.name } : u))
          );
        }
        
        showToast(`Role "${updated.name}" updated.`);
      } else {
        if (!roleFormData.name.trim()) throw new Error('Role name is required.');
        const created = await createRole(roleFormData);
        setRoles((prev) => [...prev, created]);
        showToast(`Role "${created.name}" created.`);
      }
      setIsRoleModalOpen(false);
    } catch (err) {
      setRoleFormError(err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.is_system) { setError('System roles cannot be deleted.'); return; }
    if (window.confirm(`Delete role "${role.name}"?`)) {
      setError(null);
      try {
        await deleteRole(role.id);
        setRoles((prev) => prev.filter((r) => r.id !== role.id));
        
        // Reset role to 'Viewer' (default) in local state for all users that had this deleted role
        setUsers((prev) =>
          prev.map((u) => (u.role === role.name ? { ...u, role: 'Viewer' } : u))
        );
        
        showToast(`Role "${role.name}" deleted.`);
      } catch (err) {
        setError(err.message || 'Failed to delete role.');
      }
    }
  };

  // ─── PERMISSIONS ────────────────────────────────────────────

  const openPermissions = (role) => {
    setSelectedRole(role);
    setSelectedPermissions([...role.permissions]);
    setIsPermissionsModalOpen(true);
  };

  const togglePermission = (permId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      const updatedRole = await updateRolePermissions(selectedRole.id, selectedPermissions);
      setRoles((prev) => prev.map((r) => (r.id === selectedRole.id ? updatedRole : r)));
      showToast(`Permissions updated for "${selectedRole.name}".`);
      setIsPermissionsModalOpen(false);
      // Refresh the current user's permissions so the sidebar updates immediately
      await refreshUser();
    } catch (err) {
      alert(err.message || 'Failed to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  // ─── TABLE COLUMNS ─────────────────────────────────────────

  const userColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{val}</span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
            @{row.username || 'no-username'} • {row.email}
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{val || <span className="text-slate-450">—</span>}</span>,
    },
    ...(isSuperAdmin ? [{
      key: 'pharmacy_name',
      label: 'Pharmacy',
      render: (val) => val || <span className="text-slate-450 dark:text-zinc-500">Global</span>
    }] : []),
    {
      key: 'branch_name',
      label: 'Branch',
      render: (val) => <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{val || <span className="text-slate-450">—</span>}</span>
    },
    {
      key: 'role',
      label: 'Role',
      render: (val) => {
        const colors = {
          'Super Admin': 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30',
          'Admin': 'bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 border-brand-100 dark:border-brand-900/30',
          'Manager': 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
          'Pharmacy Operator': 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
          'Operator': 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
          'Viewer': 'bg-slate-50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800/30',
        };
        const fallback = 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/30';
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[val] || fallback}`}>{val}</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
          val === 'Active'
            ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
            : 'bg-red-50 dark:bg-red-950/25 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30'
        }`}>{val}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEdit(row)} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">Edit</button>
          <button onClick={() => handleDelete(row)} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  const roleColumns = [
    {
      key: 'name',
      label: 'Role Name',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{val}</span>
          {row.is_system && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-zinc-700">
              System
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{val}</span>,
    },
    {
      key: 'permissions',
      label: 'Modules',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30">
          {val.length} / {permissionsList.length}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <>
              <button onClick={() => openPermissions(row)} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">Permissions</button>
              <button onClick={() => openEditRole(row)} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
              {!row.is_system && (
                <button onClick={() => handleDeleteRole(row)} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">Delete</button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  const permissionCategories = [...new Set(permissionsList.map((p) => p.category))];

  // All roles are global, so no filtering by pharmacy_id is needed for roles
  const filteredRoles = roles;

  // ─── RENDER ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        subtitle="Manage staff accounts, software roles, and sidebar access permissions."
      >
        {activeTab === 'users' && (
          <Button onClick={openCreate} variant="primary" icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          }>Add User</Button>
        )}
        {activeTab === 'roles' && isSuperAdmin && (
          <Button onClick={openCreateRole} variant="primary" icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          }>Add Role</Button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 gap-6 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >Users</button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'roles'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >Roles & Permissions</button>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          ✓ {success}
        </div>
      )}

      {error && !isModalOpen && !isRoleModalOpen && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-700 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 text-sm">
          Loading...
        </div>
      ) : activeTab === 'users' ? (
        <DataTable columns={userColumns} data={users} searchPlaceholder="Search users..." />
      ) : (
        <DataTable columns={roleColumns} data={roles} searchPlaceholder="Search roles..." />
      )}

      {/* ─── User Create/Edit Modal ──────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit User' : 'Create New User'}
        size="xl"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
              <span>⚠️</span> <span>{formError}</span>
            </div>
          )}

          {/* Section: Profile */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800/60">
            <span className="text-sm">👤</span>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">
              Profile
            </h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Input label="Full Name" name="name" required value={formData.name} onChange={handleFormChange} placeholder="e.g. Sarah Ahmed" />
            <Input label="Username" name="username" required value={formData.username} onChange={handleFormChange} placeholder="e.g. sarah_ahmed" />
            <Input label="Email Address" name="email" type="email" required value={formData.email} onChange={handleFormChange} placeholder="e.g. cashier@pharmacy.com" />
            <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="e.g. +923000000000" />
            <Input
              label="Password"
              name="password"
              type="password"
              required={!isEditMode}
              value={formData.password}
              onChange={handleFormChange}
              placeholder="••••••••"
              helpText={isEditMode ? 'Leave blank to keep existing.' : 'Minimum 8 characters.'}
            />
          </div>

          {/* Section: Access & Assignment */}
          <div className="flex items-center gap-2 pt-3 pb-2 border-b border-slate-100 dark:border-zinc-800/60">
            <span className="text-sm">🛡️</span>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">
              Access & Assignment
            </h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Select
              label="Software Role"
              name="role"
              required
              value={formData.role}
              onChange={handleFormChange}
              options={filteredRoles.map((r) => ({
                value: r.name,
                label: `${r.name}${r.is_system ? '' : ' (Custom)'}`,
              }))}
              emptyOption={filteredRoles.length === 0 ? 'No roles created yet for the selected pharmacy' : false}
            />

            <Input
              label="Designation / Title"
              name="designation"
              value={formData.designation}
              onChange={handleFormChange}
              placeholder="e.g. Lead Pharmacist"
            />

            {isSuperAdmin && (
              <Select
                label="Assign to Pharmacy"
                name="pharmacy_id"
                value={formData.pharmacy_id}
                onChange={handleFormChange}
                options={[
                  { value: 'global', label: 'Global / Super Admin (No Pharmacy)' },
                  ...pharmacies.map((p) => ({
                    value: String(p.id),
                    label: p.name,
                  })),
                ]}
                emptyOption={false}
              />
            )}

            {(formData.pharmacy_id !== 'global' && formData.pharmacy_id !== '') && (
              <Select
                label="Assign to Branch"
                name="branch_id"
                required
                value={formData.branch_id}
                onChange={handleFormChange}
                options={branchOptions.map((b) => ({
                  value: String(b.id),
                  label: b.name + (b.is_main ? ' (Main)' : ''),
                }))}
                emptyOption={branchOptions.length === 0 ? 'No branches found for the selected pharmacy' : false}
              />
            )}

            <Select
              label="Account Status"
              name="status"
              required
              value={formData.status}
              onChange={handleFormChange}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive (Suspended)' },
              ]}
              emptyOption={false}
            />
          </div>
        </form>
      </Modal>

      {/* ─── Role Create/Edit Modal ──────────────────────────────── */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={isRoleEditMode ? 'Edit Role' : 'Create New Role'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleRoleSubmit} disabled={saving}>
              {saving ? 'Saving...' : isRoleEditMode ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRoleSubmit} className="space-y-5">
          {roleFormError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
              <span>⚠️</span> <span>{roleFormError}</span>
            </div>
          )}
          <div className="space-y-4">
            <Input label="Role Name" name="name" required value={roleFormData.name} onChange={handleRoleFormChange} placeholder="e.g. Accountant" />
            <Input label="Description" name="description" value={roleFormData.description} onChange={handleRoleFormChange} placeholder="e.g. Access to purchases only" />
          </div>
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/25 border-2 border-blue-500/30 dark:border-blue-500/40">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong className="text-blue-700 dark:text-blue-400">💡 Tip:</strong> After saving this role, click <strong>"Permissions"</strong> in the roles table to configure which sidebar modules this role can access.
            </p>
          </div>
        </form>
      </Modal>

      {/* ─── Permissions Modal ───────────────────────────────────── */}
      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title={`Module Access: ${selectedRole?.name}`}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPermissionsModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={savePermissions}>
              {saving ? 'Saving...' : 'Save Permissions'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Check modules to grant access to <strong className="text-brand-600 dark:text-brand-400">{selectedRole?.name}</strong> users.
          </p>

          <div className="flex gap-3">
            <button type="button" onClick={() => setSelectedPermissions(permissionsList.map((p) => p.id))} className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">Select All</button>
            <span className="text-slate-300 dark:text-zinc-700">|</span>
            <button type="button" onClick={() => setSelectedPermissions([])} className="text-xs font-semibold text-red-500 dark:text-red-400 hover:underline">Deselect All</button>
          </div>

          {permissionCategories.map((cat) => {
            const catPerms = permissionsList.filter((p) => p.category === cat);
            return (
              <div key={cat} className="space-y-3 border-t pt-4 border-slate-100 dark:border-zinc-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>{cat}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catPerms.map((perm) => {
                    const checked = selectedPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          checked
                            ? 'bg-brand-500/5 border-brand-500/40 text-slate-800 dark:text-slate-100'
                            : 'border-slate-200 dark:border-zinc-800/85 hover:bg-slate-50 dark:hover:bg-zinc-900/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500/30"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{perm.label}</span>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">Sidebar: {perm.sidebarPath}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default Users;
