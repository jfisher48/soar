export function buildParticipants({ requesterId, assignedTo }= {}) {
    const ids = [requesterId, assignedTo].filter(Boolean).map(String);
    return Array.from(new Set(ids));
}