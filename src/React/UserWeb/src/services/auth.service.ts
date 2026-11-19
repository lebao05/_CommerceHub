export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  roles: string[];
}

export interface RegistrationResult {
  userId: string;
  email: string;
  name: string;
  requiresEmailConfirmation: boolean;
}

const gatewayBaseUrl = (import.meta.env.VITE_GATEWAY_BASE_URL || 'http://localhost:5108').replace(/\/$/, '');
const identityBaseUrl = (import.meta.env.VITE_IDENTITY_BASE_URL || 'http://localhost:5063').replace(/\/$/, '');

type UserInfoResponse = Record<string, unknown>;

export const authService = {
  async getCurrentUser(): Promise<AuthUser | null> {
    const response = await fetch(`${gatewayBaseUrl}/userinfo`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Could not load user information (${response.status}).`);
    }

    const claims = await response.json() as UserInfoResponse;
    const getClaim = (name: string): string | undefined => {
      const value = claims[name];
      return typeof value === 'string' && value.length > 0 ? value : undefined;
    };
    const id = getClaim('sub');

    if (!id) {
      throw new Error('The gateway user-info response is missing the subject claim.');
    }

    const email = getClaim('email') ?? '';
    const rawRoles = claims.role;

    return {
      id,
      email,
      name: getClaim('name') ?? email,
      username: getClaim('preferred_username') ?? email.split('@')[0],
      roles: Array.isArray(rawRoles)
        ? rawRoles.filter((role): role is string => typeof role === 'string')
        : typeof rawRoles === 'string' ? [rawRoles] : [],
    };
  },

  async register(name: string, email: string, password: string): Promise<RegistrationResult> {
    const response = await fetch(`${identityBaseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    const result = await response.json() as RegistrationResult & {
      error?: string;
      title?: string;
      errors?: Record<string, string[]>;
    };

    if (!response.ok) {
      const validationError = result.errors
        ? Object.values(result.errors).flat()[0]
        : undefined;
      throw new Error(result.error ?? validationError ?? result.title ?? `Registration failed (${response.status}).`);
    }

    return result;
  },

  getLoginUrl(returnUrl: string): string {
    return `${gatewayBaseUrl}/login?redirectUrl=${encodeURIComponent(returnUrl)}`;
  },

  getLogoutUrl(returnUrl: string): string {
    return `${gatewayBaseUrl}/logout?redirectUrl=${encodeURIComponent(returnUrl)}`;
  },
};
