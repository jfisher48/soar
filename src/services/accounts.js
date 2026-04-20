import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export async function getUserAssociatedAccounts(userId) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw new Error("User profile not found.");
    }

    const userData = userSnap.data();
    const rawAssociatedAccounts = userData.associatedAccounts;

    const associatedAccounts = Array.isArray(rawAssociatedAccounts)
    ? rawAssociatedAccounts
    : rawAssociatedAccounts && typeof rawAssociatedAccounts === "object"
        ? Object.values(rawAssociatedAccounts)
        : [];

    return associatedAccounts
        .slice() // avoid mutating original
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