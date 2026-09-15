const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const RiskAssessment = require('../models/RiskAssessment');
const Intervention = require('../models/Intervention');
const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');
const { getCurrentRisk } = require('../services/riskCalculationService');
const { logAction } = require('../services/auditService');

/** System-wide statistics for the admin dashboard (section 27 of the spec). */
const getStats = asyncHandler(async (req, res) => {
  const [totalStudents, totalFaculty, totalSubjects] = await Promise.all([
    Student.countDocuments({ status: 'ACTIVE' }),
    Faculty.countDocuments({ status: 'ACTIVE' }),
    Subject.countDocuments({ status: 'ACTIVE' }),
  ]);

  const students = await Student.find({ status: 'ACTIVE' }).select('_id').lean();
  let low = 0;
  let medium = 0;
  let high = 0;
  let unassessed = 0;

  await Promise.all(
    students.map(async (s) => {
      const risk = await getCurrentRisk(s._id);
      if (!risk) {
        unassessed += 1;
      } else if (risk.riskLevel === 'LOW') low += 1;
      else if (risk.riskLevel === 'MEDIUM') medium += 1;
      else high += 1;
    })
  );

  const interventionsCompleted = await Intervention.countDocuments({ status: 'COMPLETED' });
  const interventionOutcomes = await Intervention.aggregate([{ $group: { _id: '$outcome', count: { $sum: 1 } } }]);

  return successResponse(res, 200, 'System statistics retrieved', {
    totalStudents,
    totalFaculty,
    totalSubjects,
    riskDistribution: { low, medium, high, unassessed },
    interventionsCompleted,
    interventionOutcomes,
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  return successResponse(res, 200, 'Users retrieved', { users, count: users.length });
});

const setUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['ACTIVE', 'INACTIVE'].includes(status)) throw new ApiError(422, 'status must be ACTIVE or INACTIVE.');

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  user.status = status;
  await user.save();
  await logAction({ userId: req.user._id, action: 'USER_STATUS_CHANGED', targetType: 'User', targetId: user._id, metadata: { status } });

  return successResponse(res, 200, 'User status updated', { user });
});

module.exports = { getStats, listUsers, setUserStatus };
