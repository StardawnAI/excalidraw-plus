/**
 * Handle messages from Draw.io iframe
 * @param {MessageEvent} evt - The message event
 * @param {Object} handlers - Event handlers for different Draw.io events
 * @param {string} baseUrl - Base URL to validate origin
 */
export function handleEvent(evt, handlers, baseUrl) {
  // Security check: validate origin
  const allowedOrigins = [
    'https://embed.diagrams.net',
    'https://www.diagrams.net',
    'https://app.diagrams.net'
  ];

  // If custom baseUrl is provided, add it to allowed origins
  if (baseUrl) {
    try {
      const url = new URL(baseUrl);
      allowedOrigins.push(url.origin);
    } catch (e) {
      console.warn('Invalid baseUrl provided:', baseUrl);
    }
  }

  if (!allowedOrigins.includes(evt.origin)) {
    return;
  }

  const data = evt.data;

  // Handle string messages (legacy format)
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      handleJsonMessage(parsed, handlers);
    } catch (e) {
      // Not JSON, might be legacy string message
      if (data === 'ready' && handlers.init) {
        handlers.init({ event: 'init' });
      }
    }
    return;
  }

  // Handle JSON protocol messages
  if (typeof data === 'object' && data.event) {
    handleJsonMessage(data, handlers);
  }
}

/**
 * Handle parsed JSON message
 * @param {Object} data - Parsed message data
 * @param {Object} handlers - Event handlers
 */
function handleJsonMessage(data, handlers) {
  const eventType = data.event;
  const handler = handlers[eventType];

  if (handler && typeof handler === 'function') {
    handler(data);
  }
}
