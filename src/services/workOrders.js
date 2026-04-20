import { collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase"

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
  accountId = "",
  orderType = "shelf strip",
}) {
  const userRef = doc(db, "users", userId);

  const workorderNumber = await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      throw new Error("User profile not found.");
    }

    const userData = userSnap.data();

    const routeNumber = String(userData.routeNumber || "").trim();
    const createdOrderCount = Number(userData.createdOrderCount || 0);
    const fullName =
      requestedBy || `${userData.firstName || ""} ${userData.lastName || ""}`.trim();

    if (!routeNumber) {
      throw new Error("User routeNumber is missing.");
    }

    const newCount = createdOrderCount + 1;
    const newWorkorderNumber =
      routeNumber + String(newCount).padStart(7, "0");

    const workOrderRef = doc(db, "workorders", newWorkorderNumber);

    transaction.set(workOrderRef, {
      isNew: false,
      workorderNumber: newWorkorderNumber,
      requestedBy: fullName,
      requesterId: userId,
      requesterEmail: userData.email || "",
      touchedBy: fullName,
      touchedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      orderType,
      format: "",
      account: account || "",
      accountId: accountId || "",
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

