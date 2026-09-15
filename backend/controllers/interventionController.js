const Intervention = require('../models/Intervention');
const Student = require('../models/Student');
const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { canAccessStudent } = require('./studentController');
const { getCurrentRisk, recalculateAndStoreRisk } = require('../services/riskCalculationService');
const { logAction } = require('../services/auditService');
const { notifyUser } = require('../services/notificationService');

/** Faculty-only: record an intervention against the student's current risk assessment. */
const createIntervention = asyncHandler(async (req, res) => {
  if (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Only faculty can record interventions.');
  }

  const { studentId, interventionType, reason, actionTaken, interventionDate, followUpDate } = req.body;

  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden. Not your assigned student.');

  const currentRisk = await getCurrentRisk(student._id);
  if (!currentRisk) throw new ApiError(422, 'Calculate risk for this student before recording an intervention.');

  if (!req.profile && req.user.role === 'FACULTY') throw new ApiError(404, 'Faculty profile not found for this account.');

  const intervention = await Intervention.create({
    studentId,
    facultyId: req.profile ? req.profile._id : req.body.facultyId,
    riskAssessmentId: currentRisk._id,
    interventionType,
    reason,
    actionTaken: actionTaken || '',
    interventionDate: interventionDate || Date.now(),
    followUpDate: followUpDate || null,
    previousRiskScore: currentRisk.totalRiskScore,
    status: 'PENDING',
    outcome: 'PENDING_REVIEW',
  });

  await logAction({ userId: req.user._id, action: 'INTERVENTION_CREATED', targetType: 'Intervention', targetId: intervention._id, metadata: { studentId } });

  if (student.userId) {
    await notifyUser({
      userId: student.userId,
      type: 'INTERVENTION_CREATED',
      title: 'A faculty member recorded a support action for you',
      message: `${interventionType.replaceAll('_', ' ')}: ${reason}`,
      relatedStudentId: student._id,
    });
  }

  return successResponse(res, 201, 'Intervention recorded', { intervention });
});

const listInterventionsForStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden.');

  const interventions = await Intervention.find({ studentId: student._id }).sort({ createdAt: -1 }).populate('facultyId', 'fullName facultyId');
  return successResponse(res, 200, 'Interventions retrieved', { interventions });
});

/**
 * Faculty-only update. Supports:
 *  - status change (PENDING/COMPLETED/NOT_COMPLETED)
 *  - follow-up notes
 *  - "close follow-up": recalculates risk from current academic data,
 *    stores newRiskScore, and derives outcome purely from the score
 *    comparison (never from AI judgement), per spec section 22.
 */
const updateIntervention = asyncHandler(async (req, res) => {
  if (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Only faculty can update interventions.');
  }

  const intervention = await Intervention.findById(req.params.id);
  if (!intervention) throw new ApiError(404, 'Intervention not found.');

  const student = await Student.findById(intervention.studentId);
  if (!canAccessStudent(req, student)) throw new ApiError(403, 'Forbidden.');

  const { status, followUpNotes, followUpDate, actionTaken, closeFollowUp } = req.body;

  if (status !== undefined) intervention.status = status;
  if (followUpNotes !== undefined) intervention.followUpNotes = followUpNotes;
  if (followUpDate !== undefined) intervention.followUpDate = followUpDate;
  if (actionTaken !== undefined) intervention.actionTaken = actionTaken;

  if (closeFollowUp) {
    const newRisk = await recalculateAndStoreRisk(student._id);
    intervention.newRiskScore = newRisk.totalRiskScore;

    if (newRisk.totalRiskScore < intervention.previousRiskScore) intervention.outcome = 'IMPROVED';
    else if (newRisk.totalRiskScore === intervention.previousRiskScore) intervention.outcome = 'STABLE';
    else intervention.outcome = 'WORSENED';

    if (intervention.status === 'PENDING') intervention.status = 'COMPLETED';
  }

  await intervention.save();
  await logAction({ userId: req.user._id, action: 'INTERVENTION_UPDATED', targetType: 'Intervention', targetId: intervention._id });

  if (closeFollowUp && student.userId) {
    await notifyUser({
      userId: student.userId,
      type: 'INTERVENTION_UPDATED',
      title: 'Your follow-up was reviewed',
      message: `Outcome: ${intervention.outcome.replaceAll('_', ' ')}. Risk score is now ${intervention.newRiskScore}.`,
      relatedStudentId: student._id,
    });
  }

  return successResponse(res, 200, 'Intervention updated', { intervention });
});

module.exports = { createIntervention, listInterventionsForStudent, updateIntervention };
