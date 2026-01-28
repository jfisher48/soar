import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";
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

