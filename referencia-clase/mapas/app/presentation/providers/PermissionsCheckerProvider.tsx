import { useEffect, type PropsWithChildren } from 'react';
import { usePermissionsStore } from '../store/usePermissionsStore';

export function PermissionsCheckerProvider({ children }: PropsWithChildren) {
  const checkPermission = usePermissionsStore((state) => state.checkPermission);

  useEffect(() => {
    void checkPermission();
  }, [checkPermission]);

  return children;
}
