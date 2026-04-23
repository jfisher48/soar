import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, updateDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "../lib/firebase"
import { Toys } from "@mui/icons-material";

/* Fetches latest work orders */

export async function fetchWorkOrders({ pageSize= 25} = {}) {
    const colRef = collection(db, "workorders");

    const q = query(colRef, orderBy("touchedAt", "desc"), limit(pageSize));

    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}

/* Subscribe to Open Work Orders*/

export function subscribeToOpenWorkOrders({ routeNumbers = [], onUpdate, onError }) {
  if (!Array.isArray(routeNumbers) || routeNumbers.length === 0) {
    if (typeof onUpdate === "function") onUpdate([]);
    return () => {};
  }

  const colRef = collection(db, "workorders");

  const q = query(
    colRef,
    where("routeNumber", "in", routeNumbers.slice(0,10)),
    where("status", "==", "open"),
    orderBy("touchedAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      if (typeof onUpdate === "function") {
        onUpdate(data);
      }
    },
    (error) => {
      if (typeof onError === "function") {
        onError(error);
      }
    }
  );
}

/* Subscribe to Completed Work Orders */

export function subscribeToAggregatedWorkOrders({ userId, bucket = "completed", onUpdate, onError }) {
    if (!userId) {
        if (typeof onUpdate === "function") onUpdate([]);
        return () => {};
    }

    const ref = doc(db, "aggregatedOrders", `${userId}_${bucket}`);

    return onSnapshot(
        ref,
        (snap) => {
            const data = snap.exists() ? snap.data()?.last100 || [] : [];

            if (typeof onUpdate === "function") {
                onUpdate(Array.isArray(data) ? data : []);
            }
        },
        (error) => {
            if (typeof onError === "function") {
                onError(error);
            }
        }
    );
}



/* Fetches work order by Id */

export async function fetchWorkOrderById(id) {
    const ref = doc(db, "workorders", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;
    
    return { id: snap.id, ...snap.data()};
    
}

/* Update work order status */

export async function updateWorkOrderStatus( id, status, touchedBy, participants) {
    const ref = doc(db, "workorders", id);

    const patch = {
        status,
        touchedAt: serverTimestamp(),
        touchedBy: touchedBy || null
    };

    if (Array.isArray(participants) && participants.length) {
        patch.participants = Array.from(new Set(participants.filter(Boolean).map(String)));        
    }

    await updateDoc(ref, patch);
}

/* Create Work Orders */

export async function createWorkOrder({
  userId,
  requestedBy = "",
  account = "",
  retailerId = "",
  provisionalAccountId = "",
  isProvisionalAccount = false,
  routeNumber = "",
  orderType = "shelf strip",
}) {
  const userRef = doc(db, "users", userId);

  const workorderNumber = await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      throw new Error("User profile not found.");
    }

    const userData = userSnap.data();

    const requesterRouteNumber = String(userData.routeNumber || "").trim();
    const accountRouteNumber = String(routeNumber || "").trim();
    const createdOrderCount = Number(userData.createdOrderCount || 0);
    const fullName =
      requestedBy || `${userData.firstName || ""} ${userData.lastName || ""}`.trim();

    if (!requesterRouteNumber) {
      throw new Error("User routeNumber is missing.");
    }

    if (!accountRouteNumber) {
      throw new Error("Account routeNumber is missing.");
    }

    const newCount = createdOrderCount + 1;
    const newWorkorderNumber =
      requesterRouteNumber + String(newCount).padStart(7, "0");

    const workOrderRef = doc(db, "workorders", newWorkorderNumber);

    transaction.set(workOrderRef, {
      isNew: false,
      workorderNumber: newWorkorderNumber,
      requestedBy: fullName,
      requesterId: userId,
      requesterEmail: userData.email || "",
      requesterRouteNumber,
      routeNumber: accountRouteNumber,
      touchedBy: fullName,
      touchedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      orderType,
      format: "",
      account: account || "",
      retailerId: retailerId || "",
      provisionalAccountId: provisionalAccountId || "",
      isProvisionalAccount: Boolean(isProvisionalAccount),
      cost: "",
      lineCount: 0,
      stripCount: 0,
      comments: "",
      isRush: false,
      description: "",
      requestConfirmation: false,
      assignedTo: "",
      assignedToName: "",
      assignedToEmail: "",
      items: [],
      dueDate: null,
      status: "open",
      notifications: [],
      uniqueId: "",
    });

    transaction.update(userRef, {
      createdOrderCount: newCount,
    });

    return newWorkorderNumber;
  });

  return workorderNumber;
}

