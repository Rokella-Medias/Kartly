import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Shield, ShieldAlert, ArrowLeft } from 'lucide-react';
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
    // If user is already authenticated, check role and redirect
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
        // Not an admin - sign out and show error
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
      // The useEffect hook or subsequent call will check role
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await checkAdminRoleAndRedirect(currentUser.id);
      } else {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0B0F19] text-slate-100 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-6 z-10">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <img src={kartlyLogo} alt="Kartly" className="h-10 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center justify-center gap-2 text-rose-500 font-semibold tracking-wider text-sm uppercase">
            <Shield className="w-4 h-4" />
            <span>Secure Administration Portal</span>
          </div>
        </div>

        <Card className="bg-[#121826]/80 border-slate-800 shadow-2xl backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-display text-white flex items-center justify-center gap-2">
              Admin Sign In
            </CardTitle>
            <CardDescription className="text-slate-400">
              Authorized personnel only. Access logs are monitored.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-900/50 text-red-200">
                  <ShieldAlert className="h-4 w-4 text-red-400" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || authLoading}
                  required
                  className="h-11 bg-[#1A2234] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || authLoading}
                    required
                    className="h-11 bg-[#1A2234] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:ring-rose-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    disabled={loading || authLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg hover:shadow-rose-600/20 transition-all duration-200 mt-6"
                disabled={loading || authLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating Admin...
                  </>
                ) : (
                  'Sign In to Console'
                )}
              </Button>
            </CardContent>
          </form>
        </Card>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Regular User Login
          </Link>
        </div>
      </div>
    </div>
  );
}
