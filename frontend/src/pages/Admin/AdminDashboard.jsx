import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
  Users,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  Loader2,
  RefreshCw,
  UserCheck,
  Shield,
  Edit2,
  Search,
  CreditCard,
  Check,
  Send,
} from 'lucide-react';
import { adminService } from '../../services/admin/admin.service';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import styles from './AdminDashboard.module.css';

/**
 * Admin Abuse Moderation, Telebirr Payment Verification, User Role Assignment,
 * and Platform Management Dashboard.
 */
export default function AdminDashboard() {
  const { isSuperAdmin } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState('payments'); // 'payments' | 'users' | 'reports' | 'questions'
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Payments verification state
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('pending');
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentActionLoading, setPaymentActionLoading] = useState(null);

  // Quick role assignment by email state
  const [quickEmail, setQuickEmail] = useState('');
  const [quickRole, setQuickRole] = useState('co-admin');
  const [quickLoading, setQuickLoading] = useState(false);

  // Reports state
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Users state
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Questions state
  const [questionsList, setQuestionsList] = useState([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Load stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Load payments
  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const data = await adminService.getPayments(paymentStatusFilter);
      setPaymentsList(data || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  }, [paymentStatusFilter]);

  // Load reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const reportsData = await adminService.getReports(statusFilter);
      setReports(reportsData || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Load users
  const fetchUsers = useCallback(async (searchQuery = '') => {
    setUsersLoading(true);
    try {
      const data = await adminService.getUsers(searchQuery);
      setUsersList(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Load questions
  const fetchQuestions = useCallback(async (searchQuery = '') => {
    setQuestionsLoading(true);
    try {
      const data = await adminService.getQuestions(searchQuery);
      setQuestionsList(data.questions || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    if (activeMainTab === 'payments') fetchPayments();
    if (activeMainTab === 'reports') fetchReports();
    if (activeMainTab === 'users') fetchUsers(userSearch);
    if (activeMainTab === 'questions') fetchQuestions(questionSearch);
  }, [activeMainTab, fetchStats, fetchPayments, fetchReports, fetchUsers, fetchQuestions]);

  // ─── Payment Actions ────────────────────────────────────────────────────────
  const handleApprovePayment = async payment => {
    if (
      !window.confirm(
        `Confirm transfer to 0941427950? Approve 5 Birr payment from ${payment.userFirstName} (${payment.phoneNumber}) with code ${payment.transactionId}?`,
      )
    ) {
      return;
    }

    setPaymentActionLoading(payment.paymentId);
    try {
      await adminService.approvePayment(payment.paymentId);
      setMessage(`Payment verified & approved! ${payment.userFirstName} (${payment.userEmail}) is now Premium.`);
      setPaymentsList(prev =>
        prev.map(p => (p.paymentId === payment.paymentId ? { ...p, status: 'completed' } : p)),
      );
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve payment');
    } finally {
      setPaymentActionLoading(null);
    }
  };

  const handleRejectPayment = async payment => {
    if (
      !window.confirm(
        `Are you sure you want to REJECT this payment (#${payment.paymentId} - code ${payment.transactionId})?`,
      )
    ) {
      return;
    }

    setPaymentActionLoading(payment.paymentId);
    try {
      await adminService.rejectPayment(payment.paymentId);
      setMessage(`Payment #${payment.paymentId} marked as rejected.`);
      setPaymentsList(prev =>
        prev.map(p => (p.paymentId === payment.paymentId ? { ...p, status: 'failed' } : p)),
      );
      fetchStats();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setPaymentActionLoading(null);
    }
  };

  // ─── Assign Role by Email (No Coding) ───────────────────────────────────────
  const handleAssignByEmail = async e => {
    e.preventDefault();
    if (!quickEmail.trim()) return;

    setQuickLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminService.assignRoleByEmail(quickEmail.trim(), quickRole);
      setMessage(res.message || `Successfully assigned role "${quickRole}" to ${quickEmail}!`);
      setQuickEmail('');
      fetchUsers(userSearch);
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to assign role.');
    } finally {
      setQuickLoading(false);
    }
  };

  // ─── Toggle User Premium Manually ───────────────────────────────────────────
  const handleTogglePremium = async (targetUser) => {
    const nextPremium = !targetUser.isPremium;
    if (
      !window.confirm(
        `Are you sure you want to ${nextPremium ? 'GRANT Premium to' : 'REVOKE Premium from'} ${targetUser.firstName} ${targetUser.lastName}?`,
      )
    ) {
      return;
    }

    try {
      await adminService.setUserPremium(targetUser.id, nextPremium);
      setMessage(`Premium status updated for ${targetUser.email}`);
      setUsersList(prev =>
        prev.map(u => (u.id === targetUser.id ? { ...u, isPremium: nextPremium ? 1 : 0 } : u)),
      );
      fetchStats();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update premium status');
    }
  };

  // ─── Change User Role ───────────────────────────────────────────────────────
  const handleChangeRole = async (targetUser, newRole) => {
    if (
      !window.confirm(
        `Are you sure you want to change ${targetUser.firstName} ${targetUser.lastName}'s role to "${newRole}"?`,
      )
    ) {
      return;
    }

    try {
      await adminService.updateUserRole(targetUser.id, newRole);
      setMessage(`Role updated to "${newRole}" for ${targetUser.email}`);
      setUsersList(prev =>
        prev.map(u => (u.id === targetUser.id ? { ...u, role: newRole } : u)),
      );
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update user role');
    }
  };

  // ─── Reports actions ────────────────────────────────────────────────────────
  const handleUpdateStatus = async (reportId, newStatus) => {
    setActionLoading(reportId);
    try {
      await adminService.updateReportStatus(reportId, newStatus);
      setMessage(`Report #${reportId} status marked as ${newStatus}.`);
      setReports(prev =>
        prev.map(r => (r.reportId === reportId ? { ...r, status: newStatus } : r)),
      );
      fetchStats();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteContent = async reportId => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this reported content from the forum? This action cannot be undone.',
      )
    ) {
      return;
    }

    setActionLoading(reportId);
    try {
      await adminService.deleteReportedContent(reportId);
      setMessage(`Reported content deleted and report marked as actioned.`);
      setReports(prev =>
        prev.map(r => (r.reportId === reportId ? { ...r, status: 'actioned' } : r)),
      );
      fetchStats();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Question actions ───────────────────────────────────────────────────────
  const handleDeleteQuestion = async questionId => {
    if (!window.confirm(`Are you sure you want to permanently delete Question #${questionId}? All its answers will also be removed.`)) {
      return;
    }

    try {
      await adminService.deleteQuestion(questionId);
      setMessage(`Question #${questionId} deleted successfully.`);
      setQuestionsList(prev => prev.filter(q => q.id !== questionId));
      fetchStats();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const openEditModal = (q) => {
    setEditingQuestion(q);
    setEditTitle(q.title);
    setEditContent(q.content);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingQuestion) return;
    setEditSaving(true);
    try {
      await adminService.editQuestion(editingQuestion.id, {
        title: editTitle,
        content: editContent,
      });
      setMessage(`Question #${editingQuestion.id} updated successfully.`);
      setQuestionsList(prev =>
        prev.map(q => (q.id === editingQuestion.id ? { ...q, title: editTitle, content: editContent } : q)),
      );
      setEditingQuestion(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update question');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <ShieldAlert size={28} color='#dc2626' />
            <h1 className={styles.title}>Admin &amp; Co-Admin Control Center</h1>
            <span className={styles.adminBadge}>Admin Protected</span>
          </div>
          <p className={styles.subtitle}>
            Verify Telebirr transfers (0941427950), assign admin/co-admin roles, and moderate forum content.
          </p>
        </div>

        <button
          type='button'
          onClick={() => {
            fetchStats();
            if (activeMainTab === 'payments') fetchPayments();
            if (activeMainTab === 'reports') fetchReports();
            if (activeMainTab === 'users') fetchUsers(userSearch);
            if (activeMainTab === 'questions') fetchQuestions(questionSearch);
          }}
          disabled={loading || usersLoading || questionsLoading || paymentsLoading}
          className={styles.actionBtn}
          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}
        >
          <RefreshCw size={15} className={loading || usersLoading || paymentsLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 600 }}>
          ✓ {message}
        </div>
      )}

      {errorMessage && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 600 }}>
          ⚠ {errorMessage}
        </div>
      )}

      {/* Stats Summary Grid */}
      {stats && (
        <div className={styles.statsGrid}>
          <div
            className={styles.statCard}
            onClick={() => setActiveMainTab('payments')}
            style={{ cursor: 'pointer', border: stats.pendingPayments > 0 ? '2px solid #f59e0b' : undefined }}
            title='Click to review Telebirr payments'
          >
            <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
              <CreditCard size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.pendingPayments || 0}</span>
              <span className={styles.statLabel}>Pending Telebirr Transfers</span>
            </div>
          </div>

          <div
            className={styles.statCard}
            onClick={() => setActiveMainTab('reports')}
            style={{ cursor: 'pointer' }}
            title='Click to review reports'
          >
            <div className={styles.statIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.pendingReports}</span>
              <span className={styles.statLabel}>Pending Abuse Reports</span>
            </div>
          </div>

          <div
            className={styles.statCard}
            onClick={() => setActiveMainTab('users')}
            style={{ cursor: 'pointer' }}
            title='Click to manage users & roles'
          >
            <div className={styles.statIcon} style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Users size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.totalUsers}</span>
              <span className={styles.statLabel}>Total Users</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#fdf4ff', color: '#a855f7' }}>
              <Sparkles size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.premiumUsers}</span>
              <span className={styles.statLabel}>Active Premium Members</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Feature Tabs */}
      <div className={styles.mainTabs}>
        <button
          type='button'
          onClick={() => setActiveMainTab('payments')}
          className={`${styles.mainTabBtn} ${activeMainTab === 'payments' ? styles.mainTabBtnActive : ''}`}
        >
          <CreditCard size={16} />
          Telebirr Payments ({stats?.pendingPayments || 0} pending)
        </button>

        <button
          type='button'
          onClick={() => setActiveMainTab('users')}
          className={`${styles.mainTabBtn} ${activeMainTab === 'users' ? styles.mainTabBtnActive : ''}`}
        >
          <Users size={16} />
          User &amp; Role Management
        </button>

        <button
          type='button'
          onClick={() => setActiveMainTab('reports')}
          className={`${styles.mainTabBtn} ${activeMainTab === 'reports' ? styles.mainTabBtnActive : ''}`}
        >
          <ShieldAlert size={16} />
          Abuse Reports ({stats?.pendingReports || 0} pending)
        </button>

        <button
          type='button'
          onClick={() => setActiveMainTab('questions')}
          className={`${styles.mainTabBtn} ${activeMainTab === 'questions' ? styles.mainTabBtnActive : ''}`}
        >
          <MessageSquare size={16} />
          Question Management
        </button>
      </div>

      {/* ─── TAB 1: TELEBIRR PAYMENTS VERIFICATION ────────────────────────── */}
      {activeMainTab === 'payments' && (
        <div>
          <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', color: '#0369a1' }}>
              📱 Payment Verification to Merchant Number: <strong>0941427950</strong>
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
              When learners send 5 Birr via Telebirr to <strong>0941427950</strong>, they enter their sender phone and SMS Transaction Code.
              Check your Telebirr SMS or app for incoming transfers, then click <strong>"Approve &amp; Activate Premium"</strong> below to upgrade their account.
            </p>
          </div>

          <div className={styles.tabsRow}>
            {[
              { id: 'pending', label: 'Pending Review' },
              { id: 'completed', label: 'Approved / Completed' },
              { id: 'failed', label: 'Rejected' },
              { id: 'all', label: 'All Records' },
            ].map(tab => (
              <button
                key={tab.id}
                type='button'
                onClick={() => setPaymentStatusFilter(tab.id)}
                className={`${styles.tabBtn} ${paymentStatusFilter === tab.id ? styles.tabBtnActive : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {paymentsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 size={32} className='animate-spin' color='#0284c7' style={{ margin: '0 auto 1rem' }} />
              <p>Loading Telebirr payment records...</p>
            </div>
          ) : paymentsList.length === 0 ? (
            <div className={styles.emptyState}>
              <CreditCard size={36} color='#64748b' style={{ margin: '0 auto 1rem' }} />
              <p>No payments matching "{paymentStatusFilter}" status.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.usersTable}>
                <thead>
                  <tr>
                    <th>Learner</th>
                    <th>Sender Phone</th>
                    <th>Transaction Code (SMS)</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map(p => (
                    <tr key={p.paymentId}>
                      <td>
                        <strong>{p.userFirstName} {p.userLastName}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{p.userEmail}</span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{p.phoneNumber}</strong>
                      </td>
                      <td>
                        <code style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800, color: '#0284c7' }}>
                          {p.transactionId}
                        </code>
                      </td>
                      <td>
                        <strong>{p.amount} {p.currency}</strong>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {formatDate(p.createdAt)}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            p.status === 'pending'
                              ? styles.statusPending
                              : p.status === 'completed'
                              ? styles.statusActioned
                              : styles.statusDismissed
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td>
                        {p.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button
                              type='button'
                              className={`${styles.actionBtn} ${styles.btnActioned}`}
                              disabled={paymentActionLoading === p.paymentId}
                              onClick={() => handleApprovePayment(p)}
                              title='Verify and grant Premium'
                            >
                              <Check size={14} />
                              Approve
                            </button>

                            <button
                              type='button'
                              className={`${styles.actionBtn} ${styles.btnDelete}`}
                              disabled={paymentActionLoading === p.paymentId}
                              onClick={() => handleRejectPayment(p)}
                              title='Reject payment'
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        ) : p.status === 'completed' ? (
                          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.8rem' }}>
                            ✓ Premium Active
                          </span>
                        ) : (
                          <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>Rejected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: USER & ROLE MANAGEMENT (NO CODING) ──────────────────── */}
      {activeMainTab === 'users' && (
        <div className={styles.userSection}>
          {/* Quick Assign Form */}
          {isSuperAdmin && (
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Shield size={20} color='#0284c7' />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                  Quick Role Assignment by Email (No Coding Needed)
                </h3>
              </div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.84rem', color: '#64748b' }}>
                Type any learner's email address and assign them as Super Admin or Co-Admin directly from this page.
              </p>

              <form onSubmit={handleAssignByEmail} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type='email'
                  placeholder='Enter user email (e.g. coadmin@gmail.com)'
                  value={quickEmail}
                  onChange={e => setQuickEmail(e.target.value)}
                  required
                  style={{ flex: 1, minWidth: '220px', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                />

                <select
                  value={quickRole}
                  onChange={e => setQuickRole(e.target.value)}
                  style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 700 }}
                >
                  <option value='co-admin'>Co-Admin (Moderator)</option>
                  <option value='admin'>Super Admin</option>
                  <option value='user'>Regular User</option>
                </select>

                <button
                  type='submit'
                  disabled={quickLoading}
                  className={styles.actionBtn}
                  style={{ background: '#0284c7', color: 'white', fontWeight: 700, padding: '0.65rem 1.25rem' }}
                >
                  {quickLoading ? <Loader2 size={16} className='animate-spin' /> : <Send size={15} />}
                  Assign Role
                </button>
              </form>
            </div>
          )}

          {/* Search bar */}
          <div className={styles.searchBarRow}>
            <div className={styles.searchInputWrap}>
              <Search size={16} color='#64748b' />
              <input
                type='text'
                placeholder='Search users by name, username, or email…'
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') fetchUsers(userSearch);
                }}
                className={styles.searchInput}
              />
            </div>
            <button
              type='button'
              className={styles.searchBtn}
              onClick={() => fetchUsers(userSearch)}
            >
              Search
            </button>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem', color: '#475569' }}>
            ℹ️ <strong>Roles:</strong>
            <ul style={{ margin: '0.35rem 0 0 1.25rem', padding: 0 }}>
              <li><strong>Super Admin (`admin`)</strong>: Full control over reports, payments, question edits, and assigning roles to others.</li>
              <li><strong>Co-Admin / Moderator (`co-admin`)</strong>: Can approve payments, review abuse reports, delete abusive posts, and edit/delete questions.</li>
              <li><strong>User</strong>: Regular student/learner.</li>
            </ul>
          </div>

          {usersLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 size={32} className='animate-spin' color='#0284c7' style={{ margin: '0 auto 1rem' }} />
              <p>Loading users...</p>
            </div>
          ) : usersList.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={36} color='#64748b' style={{ margin: '0 auto 1rem' }} />
              <p>No users found matching your search.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.usersTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Membership</th>
                    <th>Actions (Assign Role &amp; Premium)</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.firstName} {u.lastName}</strong>
                        {u.username && <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>@{u.username}</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={`${styles.roleBadge} ${
                            u.role === 'admin'
                              ? styles.roleAdmin
                              : u.role === 'co-admin' || u.role === 'moderator'
                              ? styles.roleCoAdmin
                              : styles.roleUser
                          }`}
                        >
                          {u.role === 'admin' ? 'Super Admin' : u.role === 'co-admin' || u.role === 'moderator' ? 'Co-Admin' : 'Regular User'}
                        </span>
                      </td>
                      <td>
                        {u.isPremium ? (
                          <span style={{ color: '#d97706', fontWeight: 700, fontSize: '0.8rem' }}>
                            ✨ Premium
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Free Tier</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {/* Manual Premium Toggle without DB */}
                          <button
                            type='button'
                            className={`${styles.actionBtn}`}
                            style={{
                              background: u.isPremium ? '#fef3c7' : '#ecfdf5',
                              color: u.isPremium ? '#d97706' : '#059669',
                              borderColor: u.isPremium ? '#fde68a' : '#a7f3d0',
                            }}
                            onClick={() => handleTogglePremium(u)}
                            title='Toggle Premium for this user directly'
                          >
                            <Sparkles size={13} />
                            {u.isPremium ? 'Revoke Premium' : 'Grant Premium'}
                          </button>

                          {/* Role Assignment Buttons */}
                          {isSuperAdmin && (
                            <>
                              {u.role !== 'admin' && (
                                <button
                                  type='button'
                                  className={`${styles.actionBtn} ${styles.btnAdmin}`}
                                  onClick={() => handleChangeRole(u, 'admin')}
                                  title='Promote to Super Admin'
                                >
                                  <Shield size={13} />
                                  Make Admin
                                </button>
                              )}

                              {u.role !== 'co-admin' && (
                                <button
                                  type='button'
                                  className={`${styles.actionBtn} ${styles.btnCoAdmin}`}
                                  onClick={() => handleChangeRole(u, 'co-admin')}
                                  title='Promote to Co-Admin (Moderator)'
                                >
                                  <UserCheck size={13} />
                                  Make Co-Admin
                                </button>
                              )}

                              {u.role !== 'user' && (
                                <button
                                  type='button'
                                  className={`${styles.actionBtn} ${styles.btnUser}`}
                                  onClick={() => handleChangeRole(u, 'user')}
                                  title='Revoke admin privileges to regular user'
                                >
                                  Set to User
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: ABUSE REPORTS ────────────────────────────────────────── */}
      {activeMainTab === 'reports' && (
        <>
          <div className={styles.tabsRow}>
            {[
              { id: 'all', label: 'All Reports' },
              { id: 'pending', label: 'Pending Review' },
              { id: 'actioned', label: 'Actioned / Resolved' },
              { id: 'dismissed', label: 'Dismissed' },
            ].map(tab => (
              <button
                key={tab.id}
                type='button'
                onClick={() => setStatusFilter(tab.id)}
                className={`${styles.tabBtn} ${statusFilter === tab.id ? styles.tabBtnActive : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <Loader2 size={36} className='animate-spin' color='#0284c7' style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: '#64748b' }}>Loading moderation reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={48} color='#16a34a' style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                No Abuse Reports Found
              </h3>
              <p style={{ margin: 0 }}>
                {statusFilter === 'all'
                  ? 'Great news! There are currently zero abuse reports in the forum.'
                  : `No reports matching "${statusFilter}" status.`}
              </p>
            </div>
          ) : (
            <div className={styles.reportsList}>
              {reports.map(report => {
                const isPending = report.status === 'pending';
                const targetUrl = report.questionHash
                  ? `/questions/${report.questionHash}`
                  : '#';

                return (
                  <div key={report.reportId} className={styles.reportCard}>
                    <div className={styles.reportHeader}>
                      <div className={styles.metaRow}>
                        <span className={styles.typeBadge}>
                          {report.itemType}
                        </span>
                        <span className={styles.reasonBadge}>
                          Reason: {report.reason}
                        </span>
                        <span
                          className={`${styles.statusBadge} ${
                            report.status === 'pending'
                              ? styles.statusPending
                              : report.status === 'actioned'
                              ? styles.statusActioned
                              : styles.statusDismissed
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Reported on {formatDate(report.createdAt)}
                      </span>
                    </div>

                    <div className={styles.contentBox}>
                      {targetUrl !== '#' ? (
                        <Link
                          to={targetUrl}
                          target='_blank'
                          rel='noreferrer'
                          className={styles.contentTitle}
                        >
                          <span>{report.contentTitle || 'View Reported Post'}</span>
                          <ExternalLink size={14} />
                        </Link>
                      ) : (
                        <strong className={styles.contentTitle}>
                          {report.contentTitle || 'Reported Post'}
                        </strong>
                      )}

                      <p className={styles.contentSnippet}>
                        {report.contentSnippet || 'Content details not available.'}
                      </p>
                    </div>

                    <div className={styles.reportDetailsBox}>
                      <strong>Reporter: </strong>
                      <span>
                        {report.reporterFirstName} {report.reporterLastName} ({report.reporterEmail})
                      </span>
                      {report.details && (
                        <p style={{ margin: '0.35rem 0 0 0' }}>
                          <strong>Note: </strong>
                          {report.details}
                        </p>
                      )}
                    </div>

                    <div className={styles.actionsRow}>
                      {actionLoading === report.reportId ? (
                        <Loader2 size={18} className='animate-spin' color='#0284c7' />
                      ) : (
                        <>
                          {isPending && (
                            <button
                              type='button'
                              className={`${styles.actionBtn} ${styles.btnDismiss}`}
                              onClick={() => handleUpdateStatus(report.reportId, 'dismissed')}
                            >
                              <XCircle size={15} />
                              Dismiss Report
                            </button>
                          )}

                          {report.status !== 'actioned' && (
                            <button
                              type='button'
                              className={`${styles.actionBtn} ${styles.btnActioned}`}
                              onClick={() => handleUpdateStatus(report.reportId, 'actioned')}
                            >
                              <CheckCircle2 size={15} />
                              Mark Actioned
                            </button>
                          )}

                          <button
                            type='button'
                            className={`${styles.actionBtn} ${styles.btnDelete}`}
                            onClick={() => handleDeleteContent(report.reportId)}
                            title='Delete content permanently and resolve report'
                          >
                            <Trash2 size={15} />
                            Delete Content
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── TAB 4: QUESTION MANAGEMENT ─────────────────────────────────── */}
      {activeMainTab === 'questions' && (
        <div className={styles.questionSection}>
          <div className={styles.searchBarRow}>
            <div className={styles.searchInputWrap}>
              <Search size={16} color='#64748b' />
              <input
                type='text'
                placeholder='Search questions by title or text…'
                value={questionSearch}
                onChange={e => setQuestionSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') fetchQuestions(questionSearch);
                }}
                className={styles.searchInput}
              />
            </div>
            <button
              type='button'
              className={styles.searchBtn}
              onClick={() => fetchQuestions(questionSearch)}
            >
              Search
            </button>
          </div>

          {questionsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 size={32} className='animate-spin' color='#0284c7' style={{ margin: '0 auto 1rem' }} />
              <p>Loading questions...</p>
            </div>
          ) : questionsList.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageSquare size={36} color='#64748b' style={{ margin: '0 auto 1rem' }} />
              <p>No questions found matching your search.</p>
            </div>
          ) : (
            <div className={styles.reportsList}>
              {questionsList.map(q => (
                <div key={q.id} className={styles.reportCard}>
                  <div className={styles.reportHeader}>
                    <div className={styles.metaRow}>
                      <span className={styles.typeBadge}>Question #{q.id}</span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        By <strong>{q.authorFirstName} {q.authorLastName}</strong> ({q.authorEmail})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {formatDate(q.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
                      <Link to={`/questions/${q.hash}`} target='_blank' rel='noreferrer' style={{ color: '#0284c7', textDecoration: 'none' }}>
                        {q.title} ↗
                      </Link>
                    </h3>
                    <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, maxHeight: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {q.content}
                    </p>
                  </div>

                  <div className={styles.actionsRow}>
                    <button
                      type='button'
                      className={`${styles.actionBtn} ${styles.btnDismiss}`}
                      onClick={() => openEditModal(q)}
                    >
                      <Edit2 size={14} />
                      Edit Question
                    </button>

                    <button
                      type='button'
                      className={`${styles.actionBtn} ${styles.btnDelete}`}
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      <Trash2 size={14} />
                      Delete Question
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Modal */}
          {editingQuestion && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem',
              }}
              onClick={() => setEditingQuestion(null)}
            >
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  maxWidth: '650px',
                  width: '100%',
                  padding: '1.75rem',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 800 }}>
                  Edit Question #{editingQuestion.id} (Moderator)
                </h3>
                <form onSubmit={handleSaveEdit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Question Title
                    </label>
                    <input
                      type='text'
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Question Content / Details
                    </label>
                    <textarea
                      rows={6}
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type='button'
                      onClick={() => setEditingQuestion(null)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={editSaving}
                      style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: '#0284c7', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {editSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
