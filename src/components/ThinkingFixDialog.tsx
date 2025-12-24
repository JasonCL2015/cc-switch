import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Check, AlertCircle, Loader2, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClaudeProject {
  name: string;
  path: string;
  last_modified: number;
}

interface ThinkingFixResult {
  total_lines: number;
  modified_lines: number;
  thinking_blocks_removed: number;
  errors: number;
  backup_path: string | null;
  jsonl_file: string;
}

interface ThinkingFixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThinkingFixDialog({
  open,
  onOpenChange,
}: ThinkingFixDialogProps) {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ClaudeProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<ThinkingFixResult | null>(null);

  // Load projects when dialog opens
  useEffect(() => {
    if (open) {
      loadProjects();
      setResult(null);
    }
  }, [open]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectList = await invoke<ClaudeProject[]>("get_claude_projects");
      setProjects(projectList);
      // Select the most recently modified project by default
      if (projectList.length > 0) {
        setSelectedProject(projectList[0].path);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error(t("thinkingFix.loadError", "Failed to load projects"));
    } finally {
      setLoading(false);
    }
  };

  const handleFix = async () => {
    if (!selectedProject) return;

    setFixing(true);
    setResult(null);
    try {
      const fixResult = await invoke<ThinkingFixResult>("fix_thinking_blocks", {
        projectPath: selectedProject,
      });
      setResult(fixResult);

      if (fixResult.thinking_blocks_removed > 0) {
        toast.success(
          t("thinkingFix.success", {
            count: fixResult.thinking_blocks_removed,
            defaultValue: `Removed ${fixResult.thinking_blocks_removed} thinking blocks`,
          }),
        );
      } else {
        toast.info(t("thinkingFix.noBlocks", "No thinking blocks found"));
      }
    } catch (error) {
      console.error("Failed to fix thinking blocks:", error);
      toast.error(
        t("thinkingFix.fixError", "Failed to fix thinking blocks: ") +
          String(error),
      );
    } finally {
      setFixing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Extract project name from path (last part after the last -)
  const getProjectDisplayName = (name: string) => {
    const parts = name.split("-");
    return parts[parts.length - 1] || name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-3 border-b-0 bg-transparent pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Shield className="h-5 w-5 text-emerald-500 fill-emerald-500" />
            {t("thinkingFix.title", "Fix 400 Thinking Error")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {t(
              "thinkingFix.description",
              "Remove thinking blocks from Claude Code session files to fix 400 errors caused by lost thinking content.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FolderOpen className="h-8 w-8 mb-2" />
              <p>{t("thinkingFix.noProjects", "No Claude projects found")}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-2">
                {t("thinkingFix.selectProject", "Select a project to fix:")}
              </p>
              {projects.map((project) => (
                <button
                  key={project.path}
                  onClick={() => setSelectedProject(project.path)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selectedProject === project.path
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-border hover:border-muted-foreground/50 hover:bg-muted/50",
                  )}
                >
                  <div className="font-medium text-sm">
                    {getProjectDisplayName(project.name)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(project.last_modified)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {result && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                {result.thinking_blocks_removed > 0 ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="font-medium text-sm">
                  {result.thinking_blocks_removed > 0
                    ? t("thinkingFix.resultSuccess", "Fix completed")
                    : t("thinkingFix.resultNoBlocks", "No changes needed")}
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  {t("thinkingFix.file", "File")}: {result.jsonl_file}
                </p>
                <p>
                  {t("thinkingFix.linesProcessed", "Lines processed")}:{" "}
                  {result.total_lines}
                </p>
                <p>
                  {t("thinkingFix.blocksRemoved", "Thinking blocks removed")}:{" "}
                  {result.thinking_blocks_removed}
                </p>
                {result.backup_path && (
                  <p className="text-green-600 dark:text-green-400">
                    {t("thinkingFix.backupCreated", "Backup created")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 border-t-0 bg-transparent pt-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close", "Close")}
          </Button>
          <Button
            onClick={handleFix}
            disabled={!selectedProject || fixing || loading}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {fixing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("thinkingFix.fixing", "Fixing...")}</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 fill-current" />
                <span>{t("thinkingFix.fix", "Fix")}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
