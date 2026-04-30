import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, string>,
  completed = false
): ToolInvocation {
  if (completed) {
    return { toolCallId: "test-id", toolName, args, state: "result", result: {} } as ToolInvocation;
  }
  return { toolCallId: "test-id", toolName, args, state: "call" } as ToolInvocation;
}

test("str_replace_editor create in-progress shows Creating label", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/components/Card.tsx" })} />);
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("str_replace_editor create completed shows Created label", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/components/Card.tsx" }, true)} />);
  expect(screen.getByText("Created Card.tsx")).toBeDefined();
});

test("str_replace_editor str_replace in-progress shows Editing label", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "src/App.tsx" })} />);
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("str_replace_editor str_replace completed shows Edited label", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "src/App.tsx" }, true)} />);
  expect(screen.getByText("Edited App.tsx")).toBeDefined();
});

test("str_replace_editor insert treated as edit", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "src/App.tsx" })} />);
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("str_replace_editor view in-progress shows Reading label", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "src/lib/utils.ts" })} />);
  expect(screen.getByText("Reading utils.ts")).toBeDefined();
});

test("str_replace_editor view completed shows Read label", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "src/lib/utils.ts" }, true)} />);
  expect(screen.getByText("Read utils.ts")).toBeDefined();
});

test("file_manager rename in-progress shows Renaming label", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "src/components/OldName.tsx" })} />);
  expect(screen.getByText("Renaming OldName.tsx")).toBeDefined();
});

test("file_manager rename completed shows Renamed label", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "src/components/OldName.tsx" }, true)} />);
  expect(screen.getByText("Renamed OldName.tsx")).toBeDefined();
});

test("file_manager delete in-progress shows Deleting label", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "src/components/Button.tsx" })} />);
  expect(screen.getByText("Deleting Button.tsx")).toBeDefined();
});

test("file_manager delete completed shows Deleted label", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "src/components/Button.tsx" }, true)} />);
  expect(screen.getByText("Deleted Button.tsx")).toBeDefined();
});

test("unknown tool falls back to raw tool name", () => {
  render(<ToolCallBadge toolInvocation={makeInvocation("unknown_tool", {})} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("completed state renders green dot", () => {
  const { container } = render(
    <ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "Card.tsx" }, true)} />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("in-progress state renders spinner", () => {
  const { container } = render(
    <ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "Card.tsx" })} />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("full path is set as title attribute", () => {
  const { container } = render(
    <ToolCallBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/components/Card.tsx" })} />
  );
  const badge = container.firstChild as HTMLElement;
  expect(badge.title).toBe("src/components/Card.tsx");
});
