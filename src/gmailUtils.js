// Gmail utility functions for managing connection and tokens

// Check if Gmail is connected and token is valid
export function getGmailConnection() {
    try {
        const stored = localStorage.getItem('gmail_connection');
        if (!stored) return null;

        const connection = JSON.parse(stored);
        return connection;
    } catch {
        return null;
    }
}

// Check if token needs refresh (5 min buffer)
export function needsTokenRefresh(connection) {
    if (!connection?.expiresAt) return true;
    return Date.now() > (connection.expiresAt - 5 * 60 * 1000);
}

// Refresh access token using refresh token
export async function refreshGmailToken() {
    const connection = getGmailConnection();

    if (!connection?.refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await fetch('/api/integrations/gmail-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: connection.refreshToken })
    });

    const data = await response.json();

    if (!response.ok) {
        if (data.needsReauth) {
            // Clear stored connection if refresh failed
            localStorage.removeItem('gmail_connection');
        }
        throw new Error(data.error || 'Failed to refresh token');
    }

    // Update stored connection with new access token
    const updatedConnection = {
        ...connection,
        accessToken: data.accessToken,
        expiresAt: data.expiresAt
    };
    localStorage.setItem('gmail_connection', JSON.stringify(updatedConnection));

    return updatedConnection;
}

// Get valid access token (refreshing if needed)
export async function getValidAccessToken() {
    let connection = getGmailConnection();

    if (!connection) {
        throw new Error('Gmail not connected');
    }

    if (needsTokenRefresh(connection)) {
        connection = await refreshGmailToken();
    }

    return connection.accessToken;
}

// Start Gmail OAuth flow
export async function startGmailAuth(firebaseUid) {
    const response = await fetch(`/api/integrations/gmail-auth?uid=${firebaseUid}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to start Gmail auth');
    }

    // Redirect to Google OAuth
    window.location.href = data.authUrl;
}

// Disconnect Gmail
export function disconnectGmail() {
    localStorage.removeItem('gmail_connection');
}

// Test Gmail connection
export async function testGmailConnection() {
    const accessToken = await getValidAccessToken();

    const response = await fetch('/api/integrations/gmail-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Gmail test failed');
    }

    return data;
}

// Fetch emails from Gmail
export async function fetchEmails(maxResults = 15) {
    const accessToken = await getValidAccessToken();

    const response = await fetch('/api/integrations/gmail-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, maxResults })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch emails');
    }

    return data;
}

