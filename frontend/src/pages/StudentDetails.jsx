import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import RiskCard from '../components/RiskCard';
import MetricCard from '../components/MetricCard';
import RiskBadge from '../components/RiskBadge';
import TrendChart from '../components/TrendChart';
import AIExplanationPanel from '../components/AIExplanationPanel';
import SimulatorPanel from '../components/SimulatorPanel';
import InterventionPanel from '../components/InterventionPanel';
import AcademicRecordForms from '../components/AcademicRecordForms';

export default function StudentDetails() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [risk, setRisk] = useState(null);
  const [history, setHistory] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentRes, historyRes, interventionRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get(`/risk/history/${id}`),
        api.get(`/interventions/student/${id}`),
      ]);
      setStudent(studentRes.data.data.student);
      setMetrics(studentRes.data.data.metrics);
      setRisk(studentRes.data.data.currentRisk);
      setHistory(historyRes.data.data.history);
      setInterventions(interventionRes.data.data.interventions);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load this student.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCalculateRisk() {
    setCalculating(true);
    setError(null);
    try {
      await api.post(`/risk/calculate/${id}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not calculate risk.'));
    } finally {
      setCalculating(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading student…" />;
  if (!student) return <ErrorBanner message={error || 'Student not found.'} />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/faculty" className="text-sm text-ink-500 hover:underline">← Back to dashboard</Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">{student.fullName}</h1>
          <p className="text-sm text-ink-500">
            {student.studentId} · {student.course} · Semester {student.semester} {student.section ? `· ${student.section}` : ''}
          </p>
        </div>
        <button onClick={handleCalculateRisk} disabled={calculating} className="btn-primary">
          {calculating ? 'Calculating…' : 'Calculate / Recalculate Risk'}
        </button>
      </div>

      <ErrorBanner message={error} />

      {!metrics?.isComplete && (
        <div className="rounded-md border border-risk-medium/30 bg-risk-mediumBg px-4 py-3 text-sm text-risk-medium">
          Insufficient academic data for a complete risk assessment. Missing: {metrics?.missing?.join(', ') || 'unknown'}.
          Add the missing data below, then calculate risk.
        </div>
      )}

      <RiskCard risk={risk} />

      {risk && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">Contributing Factors</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Attendance" value={risk.attendancePercentage} suffix="%" tone={risk.attendancePercentage >= 75 ? 'good' : risk.attendancePercentage >= 60 ? 'warn' : 'bad'} />
            <MetricCard label="Academic Average" value={risk.academicAverage} suffix="%" tone={risk.academicAverage >= 60 ? 'good' : risk.academicAverage >= 40 ? 'warn' : 'bad'} />
            <MetricCard label="Assignment Completion" value={risk.assignmentCompletionPercentage} suffix="%" tone={risk.assignmentCompletionPercentage >= 75 ? 'good' : risk.assignmentCompletionPercentage >= 50 ? 'warn' : 'bad'} />
            <MetricCard label="Performance Trend" value={risk.trendStatus} />
          </div>
        </div>
      )}

      {risk && <AIExplanationPanel studentId={id} hasRisk={!!risk} />}

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-ink-900">Risk History</h3>
        <TrendChart data={history} />
      </div>

      <AcademicRecordForms studentId={id} onSaved={load} />

      <InterventionPanel studentId={id} interventions={interventions} hasRisk={!!risk} onChanged={load} />

      <SimulatorPanel
        studentId={id}
        initial={
          risk
            ? {
                attendancePercentage: risk.attendancePercentage,
                academicAverage: risk.academicAverage,
                assignmentCompletionPercentage: risk.assignmentCompletionPercentage,
                trendDelta: risk.trendDelta,
              }
            : undefined
        }
      />
    </div>
  );
}
