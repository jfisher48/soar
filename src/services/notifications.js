import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";


export async function fetchNotifications({ userId, role, limitCount = 10 } = {}) {
    const openField = role === "graphics" ? "assignedTo" : "requesterId";

    const openQuery = query(
        collection(db, "workorders"),
        where(openField, "==", userId),
        where("status", "==", "open" )
    );

    const openSnap = await getDocs(openQuery);

    const openNotifications = [];

    openSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const notifications = Array.isArray(data.notifications) ? data.notifications : [];

        notifications.forEach((notification, index) => {
            openNotifications.push({
                id: `${docSnap.id}_open_${index}`,
                user: notification.user || "SYSTEM",
                content: notification.content || notification.message || "",
                time: notification.time || null                
            });
        });
    });

    const completedDocRef = doc(db, "aggregatedOrders", `${userId}_completed`);
    const completedSnap = await getDoc(completedDocRef);

    const completedNotifications = [];

    if (completedSnap.exists()) {
        const completedData = completedSnap.data();
        const completedOrders = Array.isArray(completedData.last100) ? completedData.last100 : [];

        completedOrders.forEach((order, orderIndex) => {
            const notifications = Array.isArray(order.notifications) ? order.notifications :[];

            notifications.forEach((notification, notificationIndex) => {
                completedNotifications.push({
                    id: `completed_${order.id || orderIndex}_${notificationIndex}`,
                    user: notification.user || "SYSTEM",
                    content: notification.content || notification.message || "",
                    time: notification.time || null
                });
            });


        });
    }

    const heldDocRef = doc(db, "aggregatedOrders", `${userId}_held`);
    const heldSnap = await getDoc(heldDocRef);

    const heldNotifications = [];

    if (heldSnap.exists()) {
        const heldData = heldSnap.data();
        const heldOrders = Array.isArray(heldData.last100) ? heldData.last100 : [];

        heldOrders.forEach((order, orderIndex) => {
            const notifications = Array.isArray(order.notifications) ? order.notifications :[];

            notifications.forEach((notification, notificationIndex) => {
                heldNotifications.push({
                    id: `held_${order.id || orderIndex}_${notificationIndex}`,
                    user: notification.user || "SYSTEM",
                    content: notification.content || notification.message || "",
                    time: notification.time || null
                });
            });


        });
    }

    const allNotifications = [...openNotifications, ...completedNotifications, ...heldNotifications];

    return allNotifications.sort((a, b) => {
        const aSec = a.time?.seconds || 0;
        const bSec = b.time?.seconds || 0;
        return bSec - aSec;
    }).slice(0, limitCount);

} 

export function subscribeToOpenNotifications({ userId, role, onData, onError }) {
    const openField = role === "graphics" ? "assignedTo" : "requesterId";

    const openQuery = query(
        collection(db, "workorders"),
        where(openField, "==", userId),
        where("status", "==", "open")
    );

    return onSnapshot(
        openQuery,
        (snap) => {
            const openNotifications = [];

            snap.docs.forEach((docSnap) => {
                const data = docSnap.data();
                const notifications = Array.isArray(data.notifications) ? data.notifications : [];

                notifications.forEach((notification, index) => {
                    openNotifications.push({
                        id: `${docSnap.id}_open_${index}`,
                        user: notification.user || "SYSTEM",
                        content: notification.content || notification.message || "",
                        time: notification.time || null,
                    });
                });
            });

            const sorted = openNotifications.sort((a, b) => {
                const aSec = a.time?.seconds || 0;
                const bSec = b.time?.seconds || 0;
                return bSec - aSec;
            });

            onData(sorted);
        },
        onError
    );
}

export function subscribeToCompletedNotifications({
  userId,
  onData,
  onError,
}) {
  if (!userId) {
    onData?.([]);
    return () => {};
  }

  const completedRef = doc(db, "aggregatedOrders", `${userId}_completed`);

  return onSnapshot(
    completedRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData?.([]);
        return;
      }

      const data = snapshot.data() || {};
      const last100 = Array.isArray(data.last100) ? data.last100 : [];

      const completedNotifications = [];

      last100.forEach((workOrder, orderIndex) => {
        const workOrderNotifications = Array.isArray(workOrder?.notifications)
          ? workOrder.notifications
          : [];

        workOrderNotifications.forEach((notification, notificationIndex) => {
          completedNotifications.push({
            id: `completed_${workOrder.id || workOrder.workOrderId || orderIndex}_${notificationIndex}`,
            user: notification.user || "SYSTEM",
            content: notification.content || notification.message || "",
            time: notification.time || null,
            workOrderId: workOrder.id || workOrder.workOrderId || null,
            workOrderNumber: workOrder.workOrderNumber || null,
            sourceStatus: "completed",
          });
        });
      });

      const sorted = completedNotifications.sort((a, b) => {
        const aSec = a.time?.seconds || 0;
        const bSec = b.time?.seconds || 0;
        return bSec - aSec;
      });

      onData?.(sorted);
    },
    (error) => {
      onError?.(error);
    }
  );
}

export function subscribeToHeldNotifications({
  userId,
  onData,
  onError,
}) {
  if (!userId) {
    onData?.([]);
    return () => {};
  }

  const heldRef = doc(db, "aggregatedOrders", `${userId}_held`);

  return onSnapshot(
    heldRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData?.([]);
        return;
      }

      const data = snapshot.data() || {};
      const last100 = Array.isArray(data.last100) ? data.last100 : [];

      const heldNotifications = [];

      last100.forEach((workOrder, orderIndex) => {
        const workOrderNotifications = Array.isArray(workOrder?.notifications)
          ? workOrder.notifications
          : [];

        workOrderNotifications.forEach((notification, notificationIndex) => {
          heldNotifications.push({
            id: `held_${workOrder.id || workOrder.workOrderId || orderIndex}_${notificationIndex}`,
            user: notification.user || "SYSTEM",
            content: notification.content || notification.message || "",
            time: notification.time || null,
            workOrderId: workOrder.id || workOrder.workOrderId || null,
            workOrderNumber: workOrder.workOrderNumber || null,
            sourceStatus: "held",
          });
        });
      });

      const sorted = heldNotifications.sort((a, b) => {
        const aSec = a.time?.seconds || 0;
        const bSec = b.time?.seconds || 0;
        return bSec - aSec;
      });

      onData?.(sorted);
    },
    (error) => {
      onError?.(error);
    }
  );
}