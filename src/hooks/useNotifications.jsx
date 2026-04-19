import { useEffect, useMemo, useState } from "react";
import {
  subscribeToOpenNotifications,
  subscribeToCompletedNotifications,
  subscribeToHeldNotifications,
} from "../services/notifications.js";

function normalizeNotification(item, source) {
  if (!item) return null;

  return {
    ...item,
    source,
    time: item.time ?? item.createdAt ?? item.updatedAt ?? null,
  };
}

function sortByNewest(a, b) {
  const getTime = (val) => {
    if (!val) return 0;

    if (typeof val.toMillis === "function") {
      return val.toMillis();
    }

    if (typeof val.seconds === "number") {
      return val.seconds * 1000;
    }

    const parsed = new Date(val).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  return getTime(b.time) - getTime(a.time);
}

export default function useNotifications({ user, profile }) {
  const [openNotifications, setOpenNotifications] = useState([]);
  const [completedNotifications, setCompletedNotifications] = useState([]);
  const [heldNotifications, setHeldNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid || !profile?.role) {
      setOpenNotifications([]);
      setCompletedNotifications([]);
      setHeldNotifications([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    let openReady = false;
    let completedReady = false;
    let heldReady = false;

    const finishIfReady = () => {
      if (openReady && completedReady && heldReady) {
        setLoading(false);
      }
    };

    const unsubscribeOpen = subscribeToOpenNotifications({
      userId: user.uid,
      role: profile.role,
      onData: (data) => {
        setOpenNotifications(
          (data || [])
            .map((item) => normalizeNotification(item, "open"))
            .filter(Boolean)
        );
        openReady = true;
        finishIfReady();
      },
      onError: (e) => {
        console.error("Failed to subscribe to open notifications", e);
        setError(e?.message || "Failed to load notifications");
        openReady = true;
        finishIfReady();
      },
    });

    const unsubscribeCompleted = subscribeToCompletedNotifications({
      userId: user.uid,
      onData: (data) => {
        setCompletedNotifications(
          (data || [])
            .map((item) => normalizeNotification(item, "completed"))
            .filter(Boolean)
        );
        completedReady = true;
        finishIfReady();
      },
      onError: (e) => {
        console.error("Failed to subscribe to completed notifications", e);
        setError(e?.message || "Failed to load notifications");
        completedReady = true;
        finishIfReady();
      },
    });

    const unsubscribeHeld = subscribeToHeldNotifications({
      userId: user.uid,
      onData: (data) => {
        setHeldNotifications(
          (data || [])
            .map((item) => normalizeNotification(item, "held"))
            .filter(Boolean)
        );
        heldReady = true;
        finishIfReady();
      },
      onError: (e) => {
        console.error("Failed to subscribe to held notifications", e);
        setError(e?.message || "Failed to load notifications");
        heldReady = true;
        finishIfReady();
      },
    });

    return () => {
      unsubscribeOpen?.();
      unsubscribeCompleted?.();
      unsubscribeHeld?.();
    };
  }, [user?.uid, profile?.role]);

  const notifications = useMemo(() => {
    return [
      ...openNotifications,
      ...completedNotifications,
      ...heldNotifications,
    ].sort(sortByNewest);
  }, [openNotifications, completedNotifications, heldNotifications]);

  return {
    notifications,
    loading,
    error,
  };
}