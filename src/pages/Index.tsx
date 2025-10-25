import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LogOut, GraduationCap, Play, Settings } from "lucide-react";

interface Section {
  id: string;
  name: string;
}

interface Lesson {
  id: string;
  name: string;
  youtube_url: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasAdminRole = roles?.some(r => r.role === "admin");
      setIsAdmin(hasAdminRole);

      fetchSections();
    } catch (error: any) {
      toast.error("خطأ في التحقق من الجلسة");
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from("sections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSections(data || []);
    } catch (error: any) {
      toast.error("خطأ في تحميل الأقسام");
    }
  };

  const fetchLessons = async (sectionId: string) => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("section_id", sectionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error: any) {
      toast.error("خطأ في تحميل الحصص");
    }
  };

  const handleSectionClick = (section: Section) => {
    setSelectedSection(section);
    fetchLessons(section.id);
  };

  const handleLessonClick = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              المنصة التعليمية
            </h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                لوحة التحكم
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">مرحباً بك في منصتك التعليمية</h2>
          <p className="text-muted-foreground">اختر قسم لعرض الحصص والدروس المتاحة</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Card
              key={section.id}
              className="hover:shadow-xl transition-all cursor-pointer border-0 group"
              style={{ boxShadow: "var(--shadow-elegant)" }}
              onClick={() => handleSectionClick(section)}
            >
              <CardHeader>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {section.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <Play className="w-4 h-4" />
                  عرض الحصص
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">لا توجد أقسام متاحة حالياً</p>
          </div>
        )}
      </main>

      {selectedSection && (
        <Dialog open={!!selectedSection} onOpenChange={() => setSelectedSection(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-right">{selectedSection.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {lessons.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد حصص في هذا القسم بعد
                </p>
              ) : (
                <div className="grid gap-4">
                  {lessons.map((lesson) => (
                    <Card
                      key={lesson.id}
                      className="hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => handleLessonClick(lesson.id)}
                    >
                      <CardContent className="p-4 flex justify-between items-center">
                        <span className="font-medium text-right flex-1">{lesson.name}</span>
                        <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent">
                          <Play className="w-4 h-4" />
                          فتح الحصة
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default Index;