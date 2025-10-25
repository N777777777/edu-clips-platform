import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Users, Trash2 } from "lucide-react";

interface User {
  id: string;
  username: string;
  created_at: string;
  roles: { role: string }[];
}

const UsersManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "student">("student");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          created_at,
          user_roles (role)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const formattedUsers = profiles?.map(p => ({
        id: p.id,
        username: p.username,
        created_at: p.created_at,
        roles: p.user_roles || []
      })) || [];
      
      setUsers(formattedUsers);
    } catch (error: any) {
      toast.error("خطأ في تحميل المستخدمين");
    }
  };

  const handleCreateUser = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: `${username}@platform.local`,
        password: password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("فشل إنشاء المستخدم");

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: role
        });

      if (roleError) throw roleError;

      toast.success("تم إنشاء المستخدم بنجاح");
      setUsername("");
      setPassword("");
      setRole("student");
      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "خطأ في إنشاء المستخدم");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;

      toast.success("تم حذف المستخدم بنجاح");
      fetchUsers();
    } catch (error: any) {
      toast.error("خطأ في حذف المستخدم");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Plus className="w-4 h-4" />
              إضافة مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-right"
              />
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-right"
              />
              <Select value={role} onValueChange={(v: "admin" | "student") => setRole(v)}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر الصلاحية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">طالب</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleCreateUser} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-accent"
              >
                {loading ? "جاري الإنشاء..." : "إنشاء المستخدم"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="border-0" style={{ boxShadow: "var(--shadow-elegant)" }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                {user.username}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">الصلاحية:</span>
                  <span className="font-medium">
                    {user.roles[0]?.role === "admin" ? "مدير" : "طالب"}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id, user.username)}
                  className="w-full gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف المستخدم
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UsersManager;