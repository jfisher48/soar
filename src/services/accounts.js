import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export async function getUserProfile(userId) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User profile not found.");
  }

  return {
    id: userSnap.id,
    ...userSnap.data(),
  };
}

export async function getUserAssociatedAccounts(userId) {
  const userData = await getUserProfile(userId);

  const assignedRoutes = Array.isArray(userData.assignedRouteNumbers)
    ? userData.assignedRouteNumbers
    : userData.routeNumber
      ? [userData.routeNumber]
      : [];

  if (!assignedRoutes.length) return [];

  console.log("USER DATA:", userData);
  console.log("ASSIGNED ROUTES:"), assignedRoutes;

  const retailersRef = collection(db, "retailers");

  const retailersQuery = query(
    retailersRef,
    where("routeNumber", "in", assignedRoutes.slice(0, 10))
  );

  const snapshot = await getDocs(retailersQuery);

  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    .sort((a, b) => {
      const nameA = String(
        a.account || a.accountName || a.name || ""
      ).toLowerCase();

      const nameB = String(
        b.account || b.accountName || b.name || ""
      ).toLowerCase();

      return nameA.localeCompare(nameB);
    });
}

export async function getProvisionalAccountsByRoute(routeNumber) {
  if (!routeNumber) {
    return [];
  }

  const provisionalAccountsRef = collection(db, "provisionalAccounts");
  const provisionalQuery = query(
    provisionalAccountsRef,
    where("associatedRoutes", "array-contains", routeNumber)
  );

  const snapshot = await getDocs(provisionalQuery);

  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    .sort((a, b) => {
      const nameA = String(a.name || "").toLowerCase();
      const nameB = String(b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
}

export async function createProvisionalAccount({
    name,
    city = "",
    routeNumber,
    createdBy,
    createdByUid,    
}) {
    const provisionalRef = doc(collection(db, "provisionalAccounts"));

    const provisionalAccount = {
        provisionalId: provisionalRef.id,
        name: name.trim(),
        city: city.trim(),
        associatedRoutes: routeNumber ? [routeNumber] : [],
        createdAt: serverTimestamp(),
        createdBy,
        createdByUid
    };

    await setDoc(provisionalRef, provisionalAccount);

    return provisionalAccount;
}