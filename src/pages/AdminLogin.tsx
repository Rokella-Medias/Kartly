import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Shield, ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import kartlyLogo from '@/assets/kartly-logo.png';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminRoleAndRedirect(user.id);
    }
  }, [user, authLoading, navigate]);

  const checkAdminRoleAndRedirect = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) throw roleError;

      if (data) {
        toast.success('Admin login successful!');
        navigate('/admin');
      } else {
        setError('Access Denied: This account does not have administrator privileges.');
        await signOut();
      }
    } catch (err: any) {
      console.error('Role check error:', err);
      setError('An error occurred while verifying privileges.');
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await checkAdminRoleAndRedirect(currentUser.id);
      } else {
        setLoading(false);
      }
    }
  };

  return (
    /* Force light mode regardless of global theme */
    <div className="light" style={{ colorScheme: 'light' }}>
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 40%, #fdf4ff 100%)',
          color: '#0f172a',
        }}
      >
        {/* Decorative background blobs */}
        <div
          className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
            transform: 'translate(-30%, -30%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(244,63,94,0.07) 0%, transparent 70%)',
            transform: 'translate(30%, 30%)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
          }}
        />

        <div className="w-full max-w-md px-4 py-8 z-10 space-y-6">
          {/* Logo + badge */}
          <div className="text-center space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 mb-1">
              <img src={kartlyLogo} alt="Kartly" className="h-10 w-auto" />
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
              style={{ background: 'rgba(244,63,94,0.1)', color: '#be123c', border: '1px solid rgba(244,63,94,0.2)' }}>
              <Shield className="w-3.5 h-3.5" />
              Secure Administration Portal
            </div>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8 space-y-6"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99,102,241,0.12)',
              boxShadow: '0 20px 60px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.06)',
            }}
          >
            {/* Header */}
            <div className="text-center space-y-1">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}
              >
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#0f172a', fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
                Admin Sign In
              </h1>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Authorized personnel only. All access is monitored.
              </p>
            </div>

            {/* Error alert */}
            {error && (
              <div
                className="flex items-start gap-3 rounded-xl p-3.5 text-sm"
                style={{ background: 'rgba(254,226,226,0.8)', border: '1px solid rgba(248,113,113,0.4)', color: '#b91c1c' }}
              >
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="admin-email" className="text-sm font-medium" style={{ color: '#374151' }}>
                  Admin Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || authLoading}
                  required
                  autoComplete="email"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="admin-password" className="text-sm font-medium" style={{ color: '#374151' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || authLoading}
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 44px 0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      background: 'rgba(255,255,255,0.9)',
                      color: '#0f172a',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6366f1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || authLoading}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || authLoading}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '10px',
                  border: 'none',
                  background: loading || authLoading
                    ? '#a5b4fc'
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: loading || authLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  boxShadow: loading || authLoading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                  transition: 'opacity 0.2s, transform 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!loading && !authLoading) {
                    (e.target as HTMLButtonElement).style.opacity = '0.92';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.opacity = '1';
                  (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                {loading || authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Sign In to Admin Console
                  </>
                )}
              </button>
            </form>

            {/* Security notice */}
            <div
              className="flex items-center gap-2 text-xs rounded-lg p-3"
              style={{ background: 'rgba(241,245,249,0.8)', color: '#64748b' }}
            >
              <Shield className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
              <span>This portal is restricted to authorized administrators. Unauthorized access attempts are logged and reported.</span>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: '#64748b' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Regular User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
