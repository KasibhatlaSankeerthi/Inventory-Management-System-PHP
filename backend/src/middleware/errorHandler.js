export function errorHandler(error, _req, res, _next) {
  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({
      message: 'Request body must be valid JSON.',
    });
    return;
  }

  if (error?.code?.startsWith?.('ER_') || error?.code === 'ECONNREFUSED') {
    res.status(503).json({
      message: 'Database request failed. Verify the database server and backend environment settings.',
    });
    return;
  }

  res.status(500).json({
    message: 'Unexpected server error.',
  });
}
