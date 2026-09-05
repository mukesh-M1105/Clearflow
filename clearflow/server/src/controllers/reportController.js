const reportService = require('../services/reportService');

async function getPaymentsReport(req, res, next) {
  try {
    const { format = 'json', startDate, endDate, status, failureReason } = req.query;
    const merchantId = req.merchantScopeId;

    const data = await reportService.getPaymentsReport({
      startDate,
      endDate,
      merchantId,
      status,
      failureReason
    });

    if (format === 'csv') {
      const csv = reportService.exportToCsv(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="clearflow_payments_report.csv"');
      return res.status(200).send(csv);
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

async function getRecoveryReport(req, res, next) {
  try {
    const { format = 'json', startDate, endDate, status } = req.query;
    const merchantId = req.merchantScopeId;

    const data = await reportService.getRecoveryAttemptsReport({
      startDate,
      endDate,
      merchantId,
      status
    });

    if (format === 'csv') {
      const csv = reportService.exportToCsv(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="clearflow_recovery_report.csv"');
      return res.status(200).send(csv);
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

async function getMerchantsReport(req, res, next) {
  try {
    const { format = 'json' } = req.query;
    const merchantId = req.merchantScopeId;

    const data = await reportService.getMerchantsReport({ merchantId });

    if (format === 'csv') {
      const csv = reportService.exportToCsv(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="clearflow_merchants_report.csv"');
      return res.status(200).send(csv);
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPaymentsReport,
  getRecoveryReport,
  getMerchantsReport
};
