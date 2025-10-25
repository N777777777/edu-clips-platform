import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Video } from "lucide-react";
import LessonsManager from "./LessonsManager";

interface Section {
  id: string;
  name: string;
  created_at: string;
}

const SectionsManager = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [newSectionName, setNewSectionName] = useState("");
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

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

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      toast.error("الرجاء إدخال اسم القسم");
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
        .from("sections")
        .insert({ 
          name: newSectionName.trim(),
          created_by: profile?.id 
        });

      if (error) throw error;

      toast.success("تم إنشاء القسم بنجاح");
      setNewSectionName("");
      setDialogOpen(false);
      fetchSections();
    } catch (error: any) {
      toast.error(error.message || "خطأ في إنشاء القسم");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟")) return;

    try {
      const { error } = await supabase
        .from("sections")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("تم حذف القسم بنجاح");
      fetchSections();
    } catch (error: any) {
      toast.error("خطأ في حذف القسم");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">الأقسام التعليمية</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Plus className="w-4 h-4" />
              إضافة قسم جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء قسم جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="اسم القسم"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="text-right"
              />
              <Button 
                onClick={handleCreateSection} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-accent"
              >
                {loading ? "جاري الإنشاء..." : "إنشاء القسم"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Card 
            key={section.id} 
            className="hover:shadow-lg transition-all cursor-pointer border-0"
            style={{ boxShadow: "var(--shadow-elegant)" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-start">
                <span className="text-lg">{section.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSection(section.id);
                  }}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setSelectedSection(section)}
              >
                <Video className="w-4 h-4" />
                إدارة الحصص
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSection && (
        <LessonsManager
          section={selectedSection}
          onClose={() => setSelectedSection(null)}
        />
      )}
    </div>
  );
};

export default SectionsManager;