import { renderHook, act } from "@testing-library/react";
import { test, expect, vi, beforeEach, describe } from "vitest";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAuth — initial state", () => {
  test("isLoading starts false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("exposes signIn and signUp functions", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
  });
});

describe("signIn", () => {
  test("sets isLoading true during call then false after", async () => {
    let resolveSignIn!: (v: any) => void;
    (signInAction as any).mockReturnValue(
      new Promise((resolve) => { resolveSignIn = resolve; })
    );
    (getAnonWorkData as any).mockReturnValue(null);
    (getProjects as any).mockResolvedValue([]);
    (createProject as any).mockResolvedValue({ id: "p1" });

    const { result } = renderHook(() => useAuth());

    let signInPromise!: Promise<any>;
    act(() => { signInPromise = result.current.signIn("a@b.com", "pass"); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => { resolveSignIn({ success: true }); await signInPromise; });
    expect(result.current.isLoading).toBe(false);
  });

  test("returns the result from signInAction", async () => {
    const authResult = { success: false, error: "Invalid credentials" };
    (signInAction as any).mockResolvedValue(authResult);

    const { result } = renderHook(() => useAuth());
    let returned: any;
    await act(async () => { returned = await result.current.signIn("a@b.com", "wrong"); });

    expect(returned).toEqual(authResult);
  });

  test("calls signInAction with provided email and password", async () => {
    (signInAction as any).mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("user@test.com", "secret123"); });

    expect(signInAction).toHaveBeenCalledWith("user@test.com", "secret123");
  });

  test("does not call handlePostSignIn when sign-in fails", async () => {
    (signInAction as any).mockResolvedValue({ success: false, error: "Invalid credentials" });

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "bad"); });

    expect(getAnonWorkData).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("resets isLoading to false even when signInAction throws", async () => {
    (signInAction as any).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      try { await result.current.signIn("a@b.com", "pass"); } catch { /* expected */ }
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("signUp", () => {
  test("sets isLoading true during call then false after", async () => {
    let resolveSignUp!: (v: any) => void;
    (signUpAction as any).mockReturnValue(
      new Promise((resolve) => { resolveSignUp = resolve; })
    );
    (getAnonWorkData as any).mockReturnValue(null);
    (getProjects as any).mockResolvedValue([]);
    (createProject as any).mockResolvedValue({ id: "p1" });

    const { result } = renderHook(() => useAuth());

    let signUpPromise!: Promise<any>;
    act(() => { signUpPromise = result.current.signUp("a@b.com", "pass12345"); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => { resolveSignUp({ success: true }); await signUpPromise; });
    expect(result.current.isLoading).toBe(false);
  });

  test("returns the result from signUpAction", async () => {
    const authResult = { success: false, error: "Email already registered" };
    (signUpAction as any).mockResolvedValue(authResult);

    const { result } = renderHook(() => useAuth());
    let returned: any;
    await act(async () => { returned = await result.current.signUp("a@b.com", "pass12345"); });

    expect(returned).toEqual(authResult);
  });

  test("calls signUpAction with provided email and password", async () => {
    (signUpAction as any).mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signUp("new@test.com", "mypassword"); });

    expect(signUpAction).toHaveBeenCalledWith("new@test.com", "mypassword");
  });

  test("does not call handlePostSignIn when sign-up fails", async () => {
    (signUpAction as any).mockResolvedValue({ success: false, error: "Email already registered" });

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signUp("a@b.com", "pass12345"); });

    expect(getAnonWorkData).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("resets isLoading to false even when signUpAction throws", async () => {
    (signUpAction as any).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      try { await result.current.signUp("a@b.com", "pass12345"); } catch { /* expected */ }
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("handlePostSignIn — with anonymous work", () => {
  const anonMessages = [{ role: "user", content: "Hello" }];
  const anonFileSystemData = { "/App.jsx": "export default function App() {}" };

  beforeEach(() => {
    (signInAction as any).mockResolvedValue({ success: true });
    (getAnonWorkData as any).mockReturnValue({
      messages: anonMessages,
      fileSystemData: anonFileSystemData,
    });
    (createProject as any).mockResolvedValue({ id: "anon-project-1" });
  });

  test("creates a project using anonymous work messages and file system data", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "pass"); });

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: anonMessages,
        data: anonFileSystemData,
      })
    );
  });

  test("project name includes current time", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "pass"); });

    const call = (createProject as any).mock.calls[0][0];
    expect(call.name).toMatch(/^Design from /);
  });

  test("clears anonymous work after creating project", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "pass"); });

    expect(clearAnonWork).toHaveBeenCalledOnce();
  });

  test("navigates to the newly created project", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "pass"); });

    expect(mockPush).toHaveBeenCalledWith("/anon-project-1");
  });

  test("does not call getProjects when anon work exists", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "pass"); });

    expect(getProjects).not.toHaveBeenCalled();
  });
});

describe("handlePostSignIn — anon work with empty messages", () => {
  beforeEach(() => {
    (signInAction as any).mockResolvedValue({ success: true });
    (getAnonWorkData as any).mockReturnValue({
      messages: [],
      fileSystemData: {},
    });
    (getProjects as any).mockResolvedValue([{ id: "existing-1" }]);
  });

  test("falls through to getProjects when anon messages array is empty", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "pass"); });

    expect(getProjects).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/existing-1");
  });
});

describe("handlePostSignIn — no anonymous work, existing projects", () => {
  beforeEach(() => {
    (signInAction as any).mockResolvedValue({ success: true });
    (getAnonWorkData as any).mockReturnValue(null);
    (getProjects as any).mockResolvedValue([
      { id: "project-recent" },
      { id: "project-older" },
    ]);
  });

  test("navigates to the most recent (first) project", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "pass"); });

    expect(mockPush).toHaveBeenCalledWith("/project-recent");
  });

  test("does not create a new project", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "pass"); });

    expect(createProject).not.toHaveBeenCalled();
  });
});

describe("handlePostSignIn — no anonymous work, no existing projects", () => {
  beforeEach(() => {
    (signInAction as any).mockResolvedValue({ success: true });
    (getAnonWorkData as any).mockReturnValue(null);
    (getProjects as any).mockResolvedValue([]);
    (createProject as any).mockResolvedValue({ id: "brand-new" });
  });

  test("creates a new project with empty messages and data", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "pass"); });

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [], data: {} })
    );
  });

  test("new project name matches 'New Design #NNNNN' pattern", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "pass"); });

    const call = (createProject as any).mock.calls[0][0];
    expect(call.name).toMatch(/^New Design #\d+$/);
  });

  test("navigates to the newly created project", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signIn("a@b.com", "pass"); });

    expect(mockPush).toHaveBeenCalledWith("/brand-new");
  });
});

describe("handlePostSignIn — triggered by signUp", () => {
  test("runs post-sign-in flow when signUp succeeds", async () => {
    (signUpAction as any).mockResolvedValue({ success: true });
    (getAnonWorkData as any).mockReturnValue(null);
    (getProjects as any).mockResolvedValue([{ id: "proj-42" }]);

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signUp("new@test.com", "password1"); });

    expect(mockPush).toHaveBeenCalledWith("/proj-42");
  });

  test("uses anonymous work when signUp succeeds and anon work present", async () => {
    (signUpAction as any).mockResolvedValue({ success: true });
    (getAnonWorkData as any).mockReturnValue({
      messages: [{ role: "user", content: "hi" }],
      fileSystemData: { "/index.js": "console.log(1)" },
    });
    (createProject as any).mockResolvedValue({ id: "new-from-anon" });

    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.signUp("new@test.com", "password1"); });

    expect(clearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/new-from-anon");
  });
});
