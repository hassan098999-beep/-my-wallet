export const evaluateExpression = (expr: string): number => {
  try {
    let cleanExpr = expr.replace(/[^0-9+\-*/.]/g, '');
    // Remove trailing operators
    cleanExpr = cleanExpr.replace(/[+\-*/.]+$/, '');
    if (!cleanExpr) return 0;
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${cleanExpr}`)();
    return isNaN(result) || !isFinite(result) ? 0 : result;
  } catch {
    return 0;
  }
};
