import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";

interface Lesson {
  id: string;
  name: string;
  youtube_url: string;
  created_at: string;
}

interface LessonsManagerProps {
  section: { id: string; name: string };
  onClose: () => void;
}

const LessonsManager = ({ section, onClose }: LessonsManagerProps) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonName, setLessonName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, [section.id]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("section_id", section.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error: any) {
      toast.error("خطأ في تحميل الحصص");
    }
  };

  const handleAddLesson = async () => {
    if (!lessonName.trim() || !youtubeUrl.trim()) {
      toast.error("الرجاء إدخال اسم الحصة ورابط الفيديو");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مصرح");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      const { error } = await supabase
        .from("lessons")
        .insert({
          section_id: section.id,
          name: lessonName.trim(),
          youtube_url: youtubeUrl.trim(),
          created_by: profile?.id
        });

      if (error) throw error;

      toast.success("تم إضافة الحصة بنجاح");
      setLessonName("");
      setYoutubeUrl("");
      fetchLessons();
    } catch (error: any) {
      toast.error(error.message || "خطأ في إضافة الحصة");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحصة؟")) return;

    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("تم حذف الحصة بنجاح");
      fetchLessons();
    } catch (error: any) {
      toast.error("خطأ في حذف الحصة");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">حصص قسم: {section.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-right">إضافة حصة جديدة</h3>
            <Input
              placeholder="اسم الحصة"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
              className="text-right"
            />
            <Input
              placeholder="رابط فيديو YouTube"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="text-left"
            />
            <Button
              onClick={handleAddLesson}
              disabled={loading}
              className="w-full gap-2 bg-gradient-to-r from-primary to-accent"
            >
              <Plus className="w-4 h-4" />
              {loading ? "جاري الإضافة..." : "إضافة الحصة"}
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-right">الحصص الموجودة</h3>
            {lessons.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد حصص في هذا القسم بعد
              </p>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-card border"
                  >
                    <div className="flex-1 text-right">
                      <p className="font-medium">{lesson.name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {lesson.youtube_url}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonsManager;