"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const roles = ["Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer", "Data Scientist"];
const levels = ["Junior", "Mid-Level", "Senior", "Lead"];
const commonTechs = ["React", "Node.js", "TypeScript", "Python", "AWS", "PostgreSQL", "MongoDB", "Docker", "Kubernetes"];

const setupSchema = z.object({
  role: z.string().min(1, "Please select a role"),
  level: z.string().min(1, "Please select a level"),
  techstack: z.array(z.string()).min(1, "Select at least one technology"),
  customTech: z.string().optional(),
});

type SetupFormData = z.infer<typeof setupSchema>;

interface InterviewSetupProps {
  onStartInterview: (data: {
    role: string;
    level: string;
    techstack: string[];
  }) => Promise<void>;
  isLoading?: boolean;
}

export function InterviewSetup({ onStartInterview, isLoading }: InterviewSetupProps) {
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [customTechInput, setCustomTechInput] = useState("");

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      role: "",
      level: "",
      techstack: [],
      customTech: "",
    },
  });

  const toggleTech = (tech: string) => {
    const newTechs = selectedTechs.includes(tech)
      ? selectedTechs.filter((t) => t !== tech)
      : [...selectedTechs, tech];
    setSelectedTechs(newTechs);
    setValue("techstack", newTechs);
  };

  const addCustomTech = () => {
    if (customTechInput.trim() && !selectedTechs.includes(customTechInput.trim())) {
      const newTechs = [...selectedTechs, customTechInput.trim()];
      setSelectedTechs(newTechs);
      setValue("techstack", newTechs);
      setCustomTechInput("");
    }
  };

  const onSubmit = async (data: SetupFormData) => {
    try {
      await onStartInterview({
        role: data.role,
        level: data.level,
        techstack: data.techstack,
      });
    } catch {
      toast.error("Failed to start interview");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Interview Setup</h1>
        <p className="text-muted-foreground">Configure your mock interview settings</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              {...register("role")}
              className="w-full mt-1.5 p-2.5 rounded-lg border bg-background"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {errors.role && (
              <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
            )}
          </div>

          <div>
            <Label>Experience Level</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {levels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    setValue("level", level, { shouldValidate: true });
                  }}
                  className={cn(
                    "px-4 py-2 rounded-lg border transition-colors",
                    watch("level") === level
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <input type="hidden" {...register("level")} />
            {errors.level && (
              <p className="text-sm text-red-500 mt-1">{errors.level.message}</p>
            )}
          </div>

          <div>
            <Label>Technologies</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {commonTechs.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => toggleTech(tech)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-sm transition-colors",
                    selectedTechs.includes(tech)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {tech}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Add custom technology..."
                value={customTechInput}
                onChange={(e) => setCustomTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTech();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addCustomTech}>
                Add
              </Button>
            </div>
            {selectedTechs.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTechs.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => toggleTech(tech)}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input type="hidden" {...register("techstack")} />
            {errors.techstack && (
              <p className="text-sm text-red-500 mt-1">{errors.techstack.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? "Starting..." : "Start Interview"}
        </Button>
      </form>
    </div>
  );
}
