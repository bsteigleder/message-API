const metrics = {
  messageSubmissions: {
    valid: 0,
    invalid: 0,
  },
  requests: {
    total: 0,
    byType: {},
  },
  responses: {
    total: 0,
    byStatusCode: {},
  },
};

export function recordMessageSubmission(result) {
  metrics.messageSubmissions[result] += 1;
}

export function recordRequest(type) {
  metrics.requests.total += 1;
  metrics.requests.byType[type] = (metrics.requests.byType[type] || 0) + 1;
}

export function recordResponse(statusCode) {
  const key = String(statusCode);

  metrics.responses.total += 1;
  metrics.responses.byStatusCode[key] = (metrics.responses.byStatusCode[key] || 0) + 1;
}

export function getMessageSubmissionStats() {
  return { ...metrics.messageSubmissions };
}

export function getRequestStats() {
  return {
    total: metrics.requests.total,
    byType: { ...metrics.requests.byType },
  };
}

export function getResponseStats() {
  return {
    total: metrics.responses.total,
    byStatusCode: { ...metrics.responses.byStatusCode },
  };
}

export function resetMetrics() {
  metrics.messageSubmissions.valid = 0;
  metrics.messageSubmissions.invalid = 0;
  metrics.requests.total = 0;
  metrics.requests.byType = {};
  metrics.responses.total = 0;
  metrics.responses.byStatusCode = {};
}
