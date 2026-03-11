import { ref, readonly } from "vue";
import { useApi } from "./useApi";

type AuthUser = {
  id: string;
  username: string;
  githubLinked: boolean;
};

// Module-level state (singleton)
const isAuthenticated = ref(false);
const needsSetup = ref(false);
const currentUser = ref<AuthUser | null>(null);
const isLoading = ref(true);

export function useAuth() {
  const api = useApi();

  async function checkAuth() {
    isLoading.value = true;
    try {
      const res = await api.api.auth.me.$get();
      if (res.ok) {
        const data = await res.json();
        isAuthenticated.value = data.authenticated;
        currentUser.value = data.user;
        needsSetup.value = data.needsSetup;
      } else {
        // 401 or other error — check setup status
        const statusRes = await api.api.auth.status.$get();
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          needsSetup.value = statusData.needsSetup;
        }
        isAuthenticated.value = false;
        currentUser.value = null;
      }
    } catch {
      isAuthenticated.value = false;
      currentUser.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(username: string, password: string): Promise<boolean> {
    try {
      const res = await api.api.auth.login.$post({ json: { username, password } });
      if (res.ok) {
        const data = await res.json();
        isAuthenticated.value = data.authenticated;
        currentUser.value = data.user;
        needsSetup.value = false;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function setup(username: string, password: string): Promise<boolean> {
    try {
      const res = await api.api.auth.setup.$post({ json: { username, password } });
      if (res.ok) {
        const data = await res.json();
        isAuthenticated.value = data.authenticated;
        currentUser.value = data.user;
        needsSetup.value = false;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function logout() {
    try {
      await api.api.auth.logout.$post();
    } catch {
      // Ignore errors on logout
    }
    isAuthenticated.value = false;
    currentUser.value = null;
  }

  return {
    isAuthenticated: readonly(isAuthenticated),
    needsSetup: readonly(needsSetup),
    currentUser: readonly(currentUser),
    isLoading: readonly(isLoading),
    checkAuth,
    login,
    setup,
    logout,
  };
}
