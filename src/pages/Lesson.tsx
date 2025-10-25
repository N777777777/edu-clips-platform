import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowRight, GraduationCap } from "lucide-react";

interface LessonData {
  id: string;
  name: string;
  youtube_url: string;
}

const Lesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetchLesson();
  }, [id]);

  const checkAuthAndFetchLesson = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      if (!id) {
        toast.error("معرف الحصة غير صحيح");
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      setLesson(data);
    } catch (error: any) {
      toast.error("خطأ في تحميل الحصة");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/10 to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">{lesson.name}</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-elegant)" }}>
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={getYoutubeEmbedUrl(lesson.youtube_url)}
                title={lesson.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="w-full h-full"
                style={{ minHeight: "70vh" }}
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-right mb-4">{lesson.name}</h2>
              <p className="text-muted-foreground text-right">
                استمتع بمشاهدة الدرس وتعلم بشكل أفضل
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Lesson;
