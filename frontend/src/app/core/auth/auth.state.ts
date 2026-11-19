import { Injectable, computed, signal } from '@angular/core';
import { AdminUser } from './auth.models';

export type AuthStatus =
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'refreshing'
  | 'sessionExpired';

export interface AuthSnapshot {
  status: AuthStatus;
  accessToken: string | null;
  admin: AdminUser | null;
  expiresAt: number | null;
  canRefreshSession: boolean;
}

const INITIAL_STATE: AuthSnapshot = {
  status: 'unauthenticated',
  accessToken: null,
  admin: null,
  expiresAt: null,
  canRefreshSession: false,
};

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly value = signal<AuthSnapshot>(INITIAL_STATE);
  readonly snapshot = this.value.asReadonly();
  readonly status = computed(() => this.value().status);
  readonly accessToken = computed(() => this.value().accessToken);
  readonly admin = computed(() => this.value().admin);
  readonly expiresAt = computed(() => this.value().expiresAt);
  readonly canRefreshSession = computed(() => this.value().canRefreshSession);

  setStatus(status: AuthStatus): void {
    this.value.update((current) => ({ ...current, status }));
  }

  setAdmin(admin: AdminUser): void {
    this.value.update((current) => ({ ...current, admin }));
  }

  setAuthenticated(accessToken: string, expiresIn: number, admin: AdminUser): void {
    this.value.set({
      status: 'authenticated',
      accessToken,
      admin,
      expiresAt: Date.now() + Math.max(0, expiresIn) * 1000,
      canRefreshSession: true,
    });
  }

  expireAccessToken(): void {
    this.value.update((current) => ({
      ...current,
      status: 'sessionExpired',
      accessToken: null,
      admin: null,
      expiresAt: null,
    }));
  }

  clear(status: 'unauthenticated' | 'sessionExpired' = 'unauthenticated'): void {
    this.value.set({ ...INITIAL_STATE, status });
  }
}
