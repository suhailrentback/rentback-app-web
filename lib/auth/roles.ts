// lib/auth/roles.ts
export type Role = 'tenant' | 'landlord' | 'staff';
export const ROLE_COOKIE = 'rb_role';

export function roleToHome(role: Role): '/tenant' | '/landlord' | '/admin' {
  switch (role) {
    case 'landlord':
      return '/landlord';
    case 'staff':
      return '/admin';
    default:
      return '/tenant';
  }
}

export function pathAllowedForRole(pathname: string, role: Role): boolean {
  if (pathname.startsWith('/tenant')) return role === 'tenant';
  if (pathname.startsWith('/landlord')) return role === 'landlord';
  if (pathname.startsWith('/admin')) return role === 'staff';
  return true; // anything else (public) is fine
}
