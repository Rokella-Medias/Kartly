import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  ShoppingCart,
  IndianRupee,
  Trash2,
  ArrowLeft,
  Loader2,
  LogOut,
  Eye,
  Upload,
  Search,
  Mail,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  UserCheck,
  Activity,
  KeyRound,
} from 'lucide-react';
import kartlyLogo from '@/assets/kartly-logo.png';
import { toast } from 'sonner';

interface EnrichedUser {
  id: string;
  email: string;
  email_confirmed: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  business_name: string | null;
  roles: string[];
  order_count: number;
  total_revenue: number;
  upload_count: number;
}

export default function Admin() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<EnrichedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  useEffect(() => {
    if (!authLoading && !user) navigate('/admin-login');
    if (!adminLoading && !isAdmin && user) navigate('/dashboard');
  }, [user, authLoading, isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-list-users');
      if (response.error) throw response.error;
      setUsers(response.data.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const viewUserHistory = async (userId: string) => {
    setSelectedUser(userId);
    setOrdersLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('order_date', { ascending: false })
      .limit(50);

    if (error) {
      toast.error('Failed to load user orders');
      setOrdersLoading(false);
      return;
    }
    setSelectedUserOrders(data || []);
    setOrdersLoading(false);
  };

  const deleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      const response = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: userId },
      });
      if (response.error) throw response.error;

      toast.success('User deleted successfully');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (selectedUser === userId) {
        setSelectedUser(null);
        setSelectedUserOrders([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const resetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setResettingPassword(true);
    try {
      const response = await supabase.functions.invoke('admin-reset-password', {
        body: { user_id: resetPasswordUser.id, new_password: newPassword },
      });
      if (response.error) throw response.error;
      toast.success(`Password reset for ${resetPasswordUser.email}`);
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(query) ||
      u.full_name?.toLowerCase().includes(query) ||
      u.business_name?.toLowerCase().includes(query)
    );
  });

  const platformStats = {
    totalUsers: users.length,
    verifiedUsers: users.filter((u) => u.email_confirmed).length,
    activeToday: users.filter((u) => {
      if (!u.last_sign_in_at) return false;
      const diff = Date.now() - new Date(u.last_sign_in_at).getTime();
      return diff < 86400000;
    }).length,
    totalOrders: users.reduce((s, u) => s + u.order_count, 0),
    totalRevenue: users.reduce((s, u) => s + u.total_revenue, 0),
    totalUploads: users.reduce((s, u) => s + u.upload_count, 0),
    adminCount: users.filter((u) => u.roles.includes('admin')).length,
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const selectedUserData = users.find((u) => u.id === selectedUser);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={kartlyLogo} alt="Kartly" className="h-11 w-auto" />
            <Badge variant="secondary" className="ml-1">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate('/'); }} title="Sign out">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage users, monitor activity, and oversee the platform.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.verifiedUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Active Today</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.activeToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.totalOrders.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(platformStats.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">CSV Uploads</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.totalUploads}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            {selectedUser && (
              <TabsTrigger value="history" className="gap-1.5">
                <Clock className="w-4 h-4" />
                User History
              </TabsTrigger>
            )}
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      All Users
                    </CardTitle>
                    <CardDescription className="mt-1">{filteredUsers.length} users found</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, business..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">No users found.</p>
                ) : (
                  <div className="overflow-x-auto -mx-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id} className="group">
                            <TableCell className="pl-6">
                              <div>
                                <p className="font-medium text-foreground">{u.full_name || '—'}</p>
                                <p className="text-xs text-muted-foreground">{u.business_name || 'No business'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm truncate max-w-[180px]">{u.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {u.email_confirmed ? (
                                <Badge variant="outline" className="text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.1)] gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.1)] gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {u.roles.includes('admin') ? (
                                <Badge className="gradient-primary text-primary-foreground gap-1">
                                  <Shield className="w-3 h-3" />
                                  Admin
                                </Badge>
                              ) : (
                                <Badge variant="secondary">User</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{formatDate(u.created_at)}</p>
                                <p className="text-xs text-muted-foreground">{getTimeSince(u.created_at)}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{u.last_sign_in_at ? formatDate(u.last_sign_in_at) : 'Never'}</p>
                                <p className="text-xs text-muted-foreground">{getTimeSince(u.last_sign_in_at)}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{u.order_count.toLocaleString()}</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{formatCurrency(u.total_revenue)}</span>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => viewUserHistory(u.id)} title="View history">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setResetPasswordUser(u); setNewPassword(''); }} title="Reset password">
                                  <KeyRound className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      disabled={u.id === user?.id}
                                      title={u.id === user?.id ? 'Cannot delete yourself' : 'Delete user'}
                                    >
                                      {deletingUserId === u.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete <strong>{u.full_name || u.email}</strong> and all their data including orders, uploads, and profile. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteUser(u.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete Permanently
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            {selectedUser && selectedUserData && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        {selectedUserData.full_name || 'User'}'s Activity
                      </CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {selectedUserData.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Last login: {formatDateTime(selectedUserData.last_sign_in_at)}
                        </span>
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedUser(null); setSelectedUserOrders([]); }}>
                      Close
                    </Button>
                  </div>

                  {/* User Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Orders</p>
                      <p className="text-lg font-bold text-foreground">{selectedUserData.order_count}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(selectedUserData.total_revenue)}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Uploads</p>
                      <p className="text-lg font-bold text-foreground">{selectedUserData.upload_count}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="text-lg font-bold text-foreground">{formatDate(selectedUserData.created_at)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : selectedUserOrders.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-8 text-center">No orders found for this user.</p>
                  ) : (
                    <div className="overflow-x-auto -mx-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-6">Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Marketplace</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Net Settlement</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedUserOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="pl-6 font-mono text-xs">{order.order_id}</TableCell>
                              <TableCell>{formatDate(order.order_date)}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{order.product_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">{order.marketplace}</Badge>
                              </TableCell>
                              <TableCell>{order.quantity}</TableCell>
                              <TableCell>₹{Number(order.total_amount).toLocaleString('en-IN')}</TableCell>
                              <TableCell>₹{Number(order.net_settlement_amount || 0).toLocaleString('en-IN')}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="capitalize">{order.order_status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => { if (!open) { setResetPasswordUser(null); setNewPassword(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetPasswordUser?.full_name || resetPasswordUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Enter new password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPasswordUser(null); setNewPassword(''); }}>Cancel</Button>
            <Button onClick={resetPassword} disabled={resettingPassword || newPassword.length < 6}>
              {resettingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
