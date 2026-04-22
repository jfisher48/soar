export function mapRealAccountToOption(account) {
    const retailerId = account?.id || ""

    return {
        id: retailerId,
        name: account?.name || account?.account || account?.accountName || "",
        accountId: retailerId,
        provisionalId: null,
        isProvisional: false,
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
        .sort((a, b) => a.name.localeCompare(b.name))

    const provisionalOptions = provisionalAccounts
        .map(mapProvisionalAccountToOption)
        .sort((a, b) => a.name.localeCompare(b.name))

    return [...realOptions, ...provisionalOptions]
}