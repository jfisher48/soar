export function mapRealAccountToOption(account) {
    const retailerId = account?.id || ""

    return {
        id: retailerId,
        name: account?.name || account?.account || account?.accountName || "",
        accountId: retailerId,
        provisionalId: null,
        isProvisional: false,
        address: account?.address || null,
        city: account?.city || null,
        routeNumber: account?.routeNumber || "",
        label: account?.name || account?.account || account?.accountName || ""
    }
}

export function mapProvisionalAccountToOption(provisional) {
    const provisionalId = provisional?.provisionalId || provisional?.id || ""
    const name = provisional?.name || ""
    const cityPart = provisional?.city ? ` (${provisional.city})` : ""

    return {
        id: provisionalId,
        name,
        accountId: null,
        provisionalId,
        isProvisional: true,
        city: provisional?.city || null,
        routeNumber: provisional?.routeNumber || "",
        label: `${name}${cityPart} — Provisional`,
    }
}

export function buildAccountOptions(accounts = [], provisionalAccounts = []) {
    const realOptions = accounts
        .map(mapRealAccountToOption)
        .sort((a, b) => a.name.localeCompare(b.name));

    const provisionalOptions = provisionalAccounts
        .map(mapProvisionalAccountToOption)
        .sort((a, b) => a.name.localeCompare(b.name));

    const combined = [...realOptions, ...provisionalOptions];

    const nameCounts = combined.reduce((acc, option) => {
        const key = (option?.name || "").trim().toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return combined.map((option) => {
        const nameKey = (option?.name || "").trim().toLowerCase();

        return {
            ...option,
            showAddress: nameCounts[nameKey] > 1,
        };
    });
}