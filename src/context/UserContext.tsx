import { useAuth } from '@/hooks/useAuth';

export function useUser() {
  const { user } = useAuth();
  return {
    user: user ? {
      ...user,
      firstName: user.firstName || (user as any).name || 'Admin',
      lastName: user.lastName || '',
      username: user.username || 'admin',
    } : null,
    loading: false,
    error: null,
    refetch: async () => {},
  };
}
