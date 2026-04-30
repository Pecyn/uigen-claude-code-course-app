"use client";

import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

function getLabel(toolName: string, args: Record<string, string>, completed: boolean): string {
  const filename = args.path ? (args.path.split("/").pop() ?? args.path) : "";

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return completed ? `Created ${filename}` : `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return completed ? `Edited ${filename}` : `Editing ${filename}`;
      case "view":
        return completed ? `Read ${filename}` : `Reading ${filename}`;
      case "undo_edit":
        return completed ? `Undone edit in ${filename}` : `Undoing edit in ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename":
        return completed ? `Renamed ${filename}` : `Renaming ${filename}`;
      case "delete":
        return completed ? `Deleted ${filename}` : `Deleting ${filename}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const { toolName, args, state } = toolInvocation;
  const completed = state === "result";
  const typedArgs = args as Record<string, string>;
  const label = getLabel(toolName, typedArgs, completed);

  return (
    <div
      className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200"
      title={typedArgs.path}
    >
      {completed ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
