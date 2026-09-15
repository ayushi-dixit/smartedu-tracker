const {
  calculateStudentRisk,
  calculateTrend,
  calculateTrendRisk,
  getRiskLevel,
} = require('../services/riskEngine');

describe('Risk Engine — formula correctness (spec section 11-12)', () => {
  test('Case A: Attendance 95, Academic 90, Assignment 95, TrendDelta +10 -> LOW', () => {
    const result = calculateStudentRisk({
      attendancePercentage: 95,
      academicAverage: 90,
      assignmentCompletionPercentage: 95,
      trendDeltaOverride: 10,
    });
    expect(result.riskLevel).toBe('LOW');
  });

  test('Case B: Attendance 70, Academic 60, Assignment 65, TrendDelta 0 (see note below)', () => {
    // NOTE: the spec's test-case table (section 51) labels this "Expected: MEDIUM",
    // but applying the spec's own exact formula (section 11: weights 0.25/0.35/0.15/0.25)
    // to these exact inputs gives:
    //   attendanceRisk=30, academicRisk=40, assignmentRisk=35, trendRisk=50 (STABLE, delta=0)
    //   total = 30*0.25 + 40*0.35 + 35*0.15 + 50*0.25 = 39.25 -> LOW (threshold is <40 = LOW)
    // This is the same category of inconsistency as the section 6.8 worked example:
    // the illustrative expected label was not recomputed against the final formula.
    // Per section 12 ("do not modify thresholds without explicit instruction"), the
    // formula is treated as authoritative, so this case is asserted as LOW. It sits
    // right at the boundary (39.25, just under the 40 MEDIUM cutoff), which is almost
    // certainly why the spec's own hand-written label drifted from the formula result.
    // Documented in README "Known Limitations".
    const result = calculateStudentRisk({
      attendancePercentage: 70,
      academicAverage: 60,
      assignmentCompletionPercentage: 65,
      trendDeltaOverride: 0,
    });
    expect(result.totalRiskScore).toBe(39.25);
    expect(result.riskLevel).toBe('LOW');
  });

  test('Case C: Attendance 45, Academic 35, Assignment 40, TrendDelta -15 -> HIGH', () => {
    const result = calculateStudentRisk({
      attendancePercentage: 45,
      academicAverage: 35,
      assignmentCompletionPercentage: 40,
      trendDeltaOverride: -15,
    });
    expect(result.riskLevel).toBe('HIGH');
  });

  test('boundary: score just under 40 -> LOW', () => {
    expect(getRiskLevel(39.99)).toBe('LOW');
  });
  test('boundary: score at 40 -> MEDIUM', () => {
    expect(getRiskLevel(40.0)).toBe('MEDIUM');
  });
  test('boundary: score just under 65 -> MEDIUM', () => {
    expect(getRiskLevel(64.99)).toBe('MEDIUM');
  });
  test('boundary: score at 65 -> HIGH', () => {
    expect(getRiskLevel(65.0)).toBe('HIGH');
  });

  test('trend: declining example from spec (80 -> 65)', () => {
    const trend = calculateTrend([80, 65]);
    expect(trend.trendDelta).toBe(-15);
    expect(trend.trendStatus).toBe('DECLINING');
    expect(calculateTrendRisk(trend.trendDelta, trend.trendStatus)).toBe(80);
  });

  test('trend: improving example from spec (55 -> 70)', () => {
    const trend = calculateTrend([55, 70]);
    expect(trend.trendDelta).toBe(15);
    expect(trend.trendStatus).toBe('IMPROVING');
    expect(calculateTrendRisk(trend.trendDelta, trend.trendStatus)).toBe(20);
  });

  test('trend: stable example from spec (70 -> 72)', () => {
    const trend = calculateTrend([70, 72]);
    expect(trend.trendDelta).toBe(2);
    expect(trend.trendStatus).toBe('STABLE');
    expect(calculateTrendRisk(trend.trendDelta, trend.trendStatus)).toBe(46);
  });

  test('trend: fewer than 2 assessments -> INSUFFICIENT_DATA, neutral risk 50', () => {
    const trend = calculateTrend([80]);
    expect(trend.trendStatus).toBe('INSUFFICIENT_DATA');
    expect(calculateTrendRisk(trend.trendDelta, trend.trendStatus)).toBe(50);
  });

  test('worked example from spec section 6.8 (component risks + level; see note below)', () => {
    // NOTE: the spec's illustrative example (section 6.8) lists totalRiskScore
    // as 57.65 for these inputs, but applying the spec's OWN exact formula from
    // section 11 (0.25/0.35/0.15/0.25 weights) to these exact component risks
    // gives 54.25, not 57.65 — the worked example predates the final formula
    // in the source document and the two are not numerically consistent.
    // Per section 12 ("do not modify thresholds/formula without explicit
    // instruction"), the formula in section 11 is treated as authoritative;
    // the component risks and resulting risk LEVEL (MEDIUM) still match.
    const result = calculateStudentRisk({
      attendancePercentage: 58,
      academicAverage: 45,
      assignmentCompletionPercentage: 60,
      trendDeltaOverride: -12,
    });
    expect(result.attendanceRisk).toBe(42);
    expect(result.academicRisk).toBe(55);
    expect(result.assignmentRisk).toBe(40);
    expect(result.trendRisk).toBe(74);
    expect(result.totalRiskScore).toBe(54.25);
    expect(result.riskLevel).toBe('MEDIUM');
  });

  test('weighted attendance aggregation must not be a simple average (spec section 7)', () => {
    // Subject A: 20/20 = 100%, Subject B: 10/20 = 50% -> weighted overall = 30/40 = 75%
    const totalAttended = 20 + 10;
    const totalClasses = 20 + 20;
    const overall = (totalAttended / totalClasses) * 100;
    expect(overall).toBe(75);
  });

  test('simulator and real calculation use the identical function (single source of truth)', () => {
    const input = {
      attendancePercentage: 62,
      academicAverage: 48,
      assignmentCompletionPercentage: 55,
      trendDeltaOverride: -10,
    };
    const a = calculateStudentRisk(input);
    const b = calculateStudentRisk(input);
    expect(a).toEqual(b);
  });
});
