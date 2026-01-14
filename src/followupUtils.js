// Follow-up tracking utilities for email management
// Using localStorage for MVP - production would use database

const STORAGE_KEY = 'aiops_followups';
const DEFAULT_THRESHOLD_MINUTES = 2 * 24 * 60; // 2 days in minutes

// Load tracked emails from storage
export function getTrackedEmails() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return { emails: [], settings: { thresholdMinutes: DEFAULT_THRESHOLD_MINUTES } };
        }
        const data = JSON.parse(stored);
        // Migrate from old days-based threshold if needed
        if (data.settings?.thresholdDays && !data.settings?.thresholdMinutes) {
            data.settings.thresholdMinutes = data.settings.thresholdDays * 24 * 60;
            delete data.settings.thresholdDays;
            saveTrackedEmails(data);
        }
        return data;
    } catch {
        return { emails: [], settings: { thresholdMinutes: DEFAULT_THRESHOLD_MINUTES } };
    }
}

// Save tracked emails to storage
export function saveTrackedEmails(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Add an email to tracking
export function trackEmail(email) {
    const data = getTrackedEmails();

    // Avoid duplicates
    if (data.emails.find(e => e.threadId === email.threadId)) {
        return false;
    }

    data.emails.push({
        ...email,
        trackedAt: new Date().toISOString(),
        dismissed: false
    });

    saveTrackedEmails(data);
    return true;
}

// Remove email from tracking (dismiss)
export function dismissEmail(threadId) {
    const data = getTrackedEmails();
    const email = data.emails.find(e => e.threadId === threadId);
    if (email) {
        email.dismissed = true;
    }
    saveTrackedEmails(data);
}

// Completely remove email from tracking
export function removeTrackedEmail(threadId) {
    const data = getTrackedEmails();
    data.emails = data.emails.filter(e => e.threadId !== threadId);
    saveTrackedEmails(data);
}

// Get pending follow-ups (emails past threshold without reply)
export function getPendingFollowups(repliedThreadIds = []) {
    const data = getTrackedEmails();
    const thresholdMinutes = data.settings?.thresholdMinutes || DEFAULT_THRESHOLD_MINUTES;

    return data.emails.filter(email => {
        // Skip dismissed emails
        if (email.dismissed) return false;

        // Skip emails that have received replies
        if (repliedThreadIds.includes(email.threadId)) {
            return false;
        }

        // Check if past threshold (in minutes)
        const sentDate = new Date(email.date || email.trackedAt);
        const minutesSince = (Date.now() - sentDate.getTime()) / (1000 * 60);

        return minutesSince >= thresholdMinutes;
    });
}

// Calculate time elapsed since email was sent
export function getTimeSince(dateStr) {
    if (!dateStr) return { days: 0, hours: 0, minutes: 0, totalMinutes: 0 };
    const date = new Date(dateStr);
    const totalMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    return { days, hours, minutes, totalMinutes };
}

// Format elapsed time for display
export function formatTimeSince(dateStr) {
    const { days, hours, minutes } = getTimeSince(dateStr);

    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

// Legacy function for backward compatibility
export function getDaysSince(dateStr) {
    const { days } = getTimeSince(dateStr);
    return days;
}

// Update threshold setting (in minutes)
export function setThresholdMinutes(minutes) {
    const data = getTrackedEmails();
    data.settings = { ...data.settings, thresholdMinutes: minutes };
    saveTrackedEmails(data);
}

// Get current threshold in minutes
export function getThresholdMinutes() {
    const data = getTrackedEmails();
    return data.settings?.thresholdMinutes || DEFAULT_THRESHOLD_MINUTES;
}

// Parse threshold from days, hours, minutes
export function parseThreshold(days = 0, hours = 0, minutes = 0) {
    return (days * 24 * 60) + (hours * 60) + minutes;
}

// Convert minutes to days, hours, minutes object
export function thresholdToComponents(totalMinutes) {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    return { days, hours, minutes };
}

// Format threshold for display
export function formatThreshold(totalMinutes) {
    const { days, hours, minutes } = thresholdToComponents(totalMinutes);
    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' ') : '0 mins';
}

// Format recipient for display
export function formatRecipient(to) {
    if (!to) return 'Unknown';
    const match = to.match(/<(.+)>/);
    return match ? match[1] : to.split(',')[0].trim();
}

// Bulk track sent emails (from Gmail fetch)
export async function syncSentEmails(sentEmails) {
    const data = getTrackedEmails();
    let newCount = 0;

    sentEmails.forEach(email => {
        // Only track if not already tracked
        if (!data.emails.find(e => e.threadId === email.threadId)) {
            data.emails.push({
                id: email.id,
                threadId: email.threadId,
                to: email.to,
                from: email.from,
                subject: email.subject,
                date: email.date,
                body: email.body,
                snippet: email.snippet,
                trackedAt: new Date().toISOString(),
                dismissed: false
            });
            newCount++;
        }
    });

    saveTrackedEmails(data);
    return newCount;
}

// Clear all tracking data
export function clearAllTracking() {
    localStorage.removeItem(STORAGE_KEY);
}
