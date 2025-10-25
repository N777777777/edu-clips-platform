import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSetupAdmin = async () => {
    setSetupLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-admin');
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success("تم إنشاء حساب الأدمن! يمكنك الآن تسجيل الدخول");
        setUsername("btc123");
      }
    } catch (error: any) {
      toast.error("خطأ في إنشاء حساب الأدمن");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@platform.local`,
        password: password,
      });

      if (error) throw error;

      toast.success("تم تسجيل الدخول بنجاح!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md shadow-xl border-0" style={{ boxShadow: "var(--shadow-elegant)" }}>
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-2">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            المنصة التعليمية
          </CardTitle>
          <CardDescription className="text-base">
            أدخل بيانات الدخول للوصول إلى الدروس
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="h-12 text-right"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-12 text-right"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
              disabled={loading}
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">أو</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleSetupAdmin}
              disabled={setupLoading}
              className="w-full h-12"
            >
              {setupLoading ? "جاري الإعداد..." : "إعداد حساب الأدمن (مرة واحدة)"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;