import { collection, doc, getDoc, getDocs, limit, orderBy, query, updateDoc, serverTimestamp } from "firebase/firestore";
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

