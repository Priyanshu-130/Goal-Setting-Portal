import { useState } from 'react';
import { mockUsers } from '../../data/mockUsers';
import StatusBadge from '../../components/shared/StatusBadge';
import RoleBadge from '../../components/shared/RoleBadge';
import { cn } from '../../lib/utils';
import { Plus, Search, Pencil, Save, X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee', department: '', designation: '' });
  const [saved, setSaved] = useState(null);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const startEdit = (user) => {
    setEditing(user.id);
    setEditData({ name: user.name, email: user.email, role: user.role, department: user.department, status: user.status });
  };

  const saveEdit = (id) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...editData } : u));
    setEditing(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 1500);
  };

  const toggleStatus = (id) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  };

  const addUser = () => {
    if (!newUser.name || !newUser.email) return;
    const id = users.length + 10;
    setUsers((prev) => [...prev, {
      ...newUser, id,
      avatar: newUser.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      joinDate: new Date().toISOString().split('T')[0],
      employeeId: `EMP-${String(id).padStart(3, '0')}`,
      status: 'active',
      managerId: 2,
    }]);
    setShowAddModal(false);
    setNewUser({ name: '', email: '', role: 'employee', department: '', designation: '' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            <UserPlus className="h-3 w-3 text-[#b388ff]" /> Administration
          </div>
          <h1 className="page-title leading-tight">User Management</h1>
          <p className="text-slate-500 font-medium tracking-wide mt-2 text-sm lg:text-base">
            <strong className="text-slate-900">{users.length} total users</strong> · <strong className="text-emerald-400">{users.filter(u => u.status === 'active').length} active</strong>
          </p>
        </div>
        <button
          id="add-user-btn"
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
        >
          <UserPlus className="h-4 w-4" />
          Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap bg-slate-500/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input className="input pl-10 py-2.5 text-sm bg-slate-50 border-slate-200 focus:border-[#00e5ff] w-full" placeholder="Search name, email, or dept..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all', 'employee', 'manager', 'admin'].map(r => (
            <button key={r} onClick={() => setFilterRole(r)} className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300',
              filterRole === r 
                ? 'bg-gradient-to-r from-primary-500 to-[#b388ff] text-white shadow-[0_0_15px_rgba(179,136,255,0.4)]' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
            )}>{r === 'all' ? 'All Roles' : r}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header pl-6 py-4">Employee</th>
                <th className="table-header px-5 py-4 hidden md:table-cell">Department</th>
                <th className="table-header px-5 py-4">Role</th>
                <th className="table-header px-5 py-4">Status</th>
                <th className="table-header px-5 py-4 hidden lg:table-cell">ID</th>
                <th className="table-header pr-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((user) => {
                const isEditing = editing === user.id;
                return (
                  <tr key={user.id} className="table-row group">
                    <td className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-slate-900 text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                          {user.avatar}
                        </div>
                        <div>
                          {isEditing ? (
                            <input className="input text-sm py-1 bg-slate-100" value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                          ) : (
                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{user.name}</p>
                          )}
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {isEditing ? (
                        <input className="input text-sm py-1 w-32 bg-slate-100" value={editData.department} onChange={e => setEditData(d => ({ ...d, department: e.target.value }))} />
                      ) : (
                        <span className="font-medium text-slate-700">{user.department}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <select className="input text-sm py-1 w-28 bg-slate-100" value={editData.role} onChange={e => setEditData(d => ({ ...d, role: e.target.value }))}>
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <RoleBadge role={user.role} />
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleStatus(user.id)}>
                        <StatusBadge status={user.status} className="cursor-pointer hover:scale-105 transition-transform" />
                      </button>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{user.employeeId}</span>
                    </td>
                    <td className="pr-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button id={`save-user-${user.id}`} onClick={() => saveEdit(user.id)} className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                              <Save className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditing(null)} className="p-2 rounded-lg bg-slate-500/20 text-slate-500 hover:bg-slate-500/30 transition-colors">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button id={`edit-user-${user.id}`} onClick={() => startEdit(user)} className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-primary-500/20 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {saved === user.id && <span className="text-xs font-bold text-emerald-400 absolute ml-20">Saved</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-primary-500/20 rounded-full blur-[40px]" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="glow-dot text-[#b388ff]" /> Add New User
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-5 relative z-10">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" placeholder="e.g. Sarah Connor" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input className="input" type="email" placeholder="sarah.connor@example.com" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="label">System Role</label>
                    <select className="input" value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <input className="input" placeholder="e.g. Engineering" value={newUser.department} onChange={e => setNewUser(u => ({ ...u, department: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="label">Designation / Title</label>
                  <input className="input" placeholder="e.g. Senior Developer" value={newUser.designation} onChange={e => setNewUser(u => ({ ...u, designation: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-4 mt-8 relative z-10">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button id="confirm-add-user-btn" onClick={addUser} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5" /> Create User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
