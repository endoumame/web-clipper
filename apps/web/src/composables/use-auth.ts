import type { DeepReadonly, Ref } from "vue";
import { readonly, ref } from "vue";
import { useApi } from "./use-api";

interface AuthUser {
  githubLinked: boolean;
  id: string;
  username: string;
}

// Module-level state (singleton)
const isAuthenticated = ref(false);
const needsSetup = ref(false);
const currentUser = ref<AuthUser | null>(null);
const isLoading = ref(true);

interface UseAuthReturn {
  checkAuth: () => Promise<void>;
  currentUser: DeepReadonly<Ref<AuthUser | null>>;
  isAuthenticated: DeepReadonly<Ref<boolean>>;
  isLoading: DeepReadonly<Ref<boolean>>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  needsSetup: DeepReadonly<Ref<boolean>>;
  setup: (username: string, password: string) => Promise<boolean>;
}

const handleAuthSuccess = function handleAuthSuccess(data: {
  authenticated: boolean;
  needsSetup: boolean;
  user: AuthUser | null;
}): void {
  isAuthenticated.value = data.authenticated;
  currentUser.value = data.user;
  needsSetup.value = data.needsSetup;
};

const handleAuthFailure = function handleAuthFailure(): void {
  isAuthenticated.value = false;
  currentUser.value = null;
};

const checkSetupStatus = async function checkSetupStatus(
  api: ReturnType<typeof useApi>,
): Promise<void> {
  // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access
  const statusRes = await api.api.auth.status.$get();
  // oxlint-disable-next-line typescript/no-unsafe-member-access, typescript/strict-boolean-expressions
  if (statusRes.ok) {
    // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access
    const statusData = await statusRes.json();
    // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-member-access
    needsSetup.value = statusData.needsSetup;
  }
};

interface AuthResponseData {
  authenticated: boolean;
  needsSetup: boolean;
  user: AuthUser;
}

const handleCheckAuthResponse = async function handleCheckAuthResponse(
  api: ReturnType<typeof useApi>,
  res: Response,
): Promise<void> {
  if (res.ok) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Response JSON shape matches AuthResponseData
    const data = (await res.json()) as AuthResponseData;
    isAuthenticated.value = data.authenticated;
    currentUser.value = data.user;
    needsSetup.value = data.needsSetup;
  } else {
    await checkSetupStatus(api);
    handleAuthFailure();
  }
};

const createCheckAuth = function createCheckAuth(
  api: ReturnType<typeof useApi>,
): () => Promise<void> {
  return async function checkAuth(): Promise<void> {
    isLoading.value = true;
    try {
      // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access
      const res = await api.api.auth.me.$get();
      // oxlint-disable-next-line typescript/no-unsafe-argument
      await handleCheckAuthResponse(api, res);
    } catch {
      handleAuthFailure();
    } finally {
      isLoading.value = false;
    }
  };
};

const createLogin = function createLogin(
  api: ReturnType<typeof useApi>,
): (username: string, password: string) => Promise<boolean> {
  return async function login(username: string, password: string): Promise<boolean> {
    try {
      // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access
      const res = await api.api.auth.login.$post({ json: { password, username } });
      // oxlint-disable-next-line typescript/no-unsafe-member-access, typescript/strict-boolean-expressions
      if (res.ok) {
        // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access
        const data = await res.json();
        // oxlint-disable-next-line typescript/no-unsafe-argument
        handleAuthSuccess(data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };
};

const createSetup = function createSetup(
  api: ReturnType<typeof useApi>,
): (username: string, password: string) => Promise<boolean> {
  return async function setup(username: string, password: string): Promise<boolean> {
    try {
      // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access
      const res = await api.api.auth.setup.$post({ json: { password, username } });
      // oxlint-disable-next-line typescript/no-unsafe-member-access, typescript/strict-boolean-expressions
      if (res.ok) {
        // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access
        const data = await res.json();
        // oxlint-disable-next-line typescript/no-unsafe-argument
        handleAuthSuccess(data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };
};

const createLogout = function createLogout(api: ReturnType<typeof useApi>): () => Promise<void> {
  return async function logout(): Promise<void> {
    try {
      // oxlint-disable-next-line typescript/no-unsafe-call, typescript/no-unsafe-member-access
      await api.api.auth.logout.$post();
    } catch {
      // Ignore errors on logout
    }
    handleAuthFailure();
  };
};

const useAuth = function useAuth(): UseAuthReturn {
  const api = useApi();

  return {
    checkAuth: createCheckAuth(api),
    currentUser: readonly(currentUser),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    login: createLogin(api),
    logout: createLogout(api),
    needsSetup: readonly(needsSetup),
    setup: createSetup(api),
  };
};

export { useAuth };
