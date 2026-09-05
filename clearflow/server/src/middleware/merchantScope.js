/**
 * Merchant Data Isolation Middleware
 * Enforces strict multi-tenant boundary:
 * - If user is MERCHANT: Restricts query scope exclusively to their assigned merchant_id.
 *   Attempts to access other merchants' IDs will be blocked with 403 Forbidden.
 * - If user is ADMIN or REVENUE_MANAGER: Allowed to query any merchant or filter optionally.
 */
function merchantScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role === 'MERCHANT') {
    if (!req.user.merchant_id) {
      return res.status(403).json({
        success: false,
        message: 'No merchant profile is associated with this merchant account.'
      });
    }

    // Force request merchant scope to user's assigned merchant
    req.merchantScopeId = req.user.merchant_id;

    // Check if route params or query attempted to access another merchant
    if (req.params.merchantId && req.params.merchantId !== req.user.merchant_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to view or modify other merchants’ data.'
      });
    }

    if (req.query.merchantId && req.query.merchantId !== req.user.merchant_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cross-merchant filtering is strictly prohibited.'
      });
    }
  } else {
    // Admin or Revenue Manager: allow query param filter if provided
    req.merchantScopeId = req.query.merchantId || req.params.merchantId || null;
  }

  next();
}

module.exports = { merchantScope };
