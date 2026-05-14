import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  clearAdminSession,
  hasValidAdminSession,
  touchAdminSession
} from "../../auth/adminAuth";

type RequireAdminAuthProps = {
  children: ReactNode;
};

function RequireAdminAuth({ children }: RequireAdminAuthProps) {
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(() => hasValidAdminSession());

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const syncSessionState = () => {
      const valid = hasValidAdminSession();
      if (!valid) {
        clearAdminSession();
        setIsAuthorized(false);
        setTimedOut(true);
      }
    };

    const handleActivity = () => {
      if (!hasValidAdminSession()) {
        return;
      }

      touchAdminSession();
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "click",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart"
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    const timer = window.setInterval(syncSessionState, 1000);

    return () => {
      window.clearInterval(timer);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [isAuthorized]);

  const redirectTo = useMemo(() => {
    if (timedOut) {
      return "/login?reason=timeout";
    }

    return "/login";
  }, [timedOut]);

  if (!isAuthorized) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export default RequireAdminAuth;
