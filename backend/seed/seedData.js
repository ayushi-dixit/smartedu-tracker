/**
 * Synthetic demo data generator.
 * Creates fictional accounts and academic records ONLY — no real student
 * data is used anywhere in this project (see spec section 55).
 *
 * Generates 220 students across 10 "academic archetypes" (Part 4 of the
 * update spec: high-attendance/high-marks, high-attendance/poor-marks,
 * poor-attendance/high-marks, poor-attendance/poor-marks, good-academics-
 * incomplete-assignments, declining, improving, stable, severe-high-risk,
 * and fully mixed). Archetypes only shape the RAW INPUT ranges (attendance,
 * marks, assignment completion, trend) — every student's actual risk score
 * and level is computed by the real riskEngine, never hand-assigned. An
 * offline Monte Carlo check of these exact ranges (220 draws) produced a
 * LOW/MEDIUM/HIGH split of roughly 41% / 34% / 25%, a realistic and
 * demo-useful spread rather than an artificially forced one.
 *
 * Run: npm run seed   (from backend/)
 * Destroy + reseed: npm run seed:destroy
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Assessment = require('../models/Assessment');
const Assignment = require('../models/Assignment');
const RiskAssessment = require('../models/RiskAssessment');
const Intervention = require('../models/Intervention');
const AuditLog = require('../models/AuditLog');
const Note = require('../models/Note');
const Notification = require('../models/Notification');
const UserPreference = require('../models/UserPreference');

const { calculateStudentRisk } = require('../services/riskEngine');
const { getStudentAcademicMetrics } = require('../services/dashboardService');
const { round2 } = require('../utils/helpers');

const DEMO_PASSWORD = 'Passw0rd!123';
const TOTAL_STUDENTS = 220;
const TOTAL_FACULTY = 14;

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Rohan',
  'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kavya', 'Myra', 'Anika', 'Riya', 'Prisha', 'Navya',
  'Karan', 'Nikhil', 'Rahul', 'Amit', 'Deepak', 'Priya', 'Neha', 'Pooja', 'Sneha', 'Meera',
  'Aryan', 'Kabir', 'Yash', 'Devansh', 'Ritika', 'Simran', 'Tanvi', 'Om', 'Harsh', 'Manav',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Yadav', 'Mishra', 'Pandey', 'Tiwari', 'Chauhan',
  'Rathore', 'Joshi', 'Agarwal', 'Bansal', 'Saxena', 'Malhotra', 'Kapoor', 'Chopra', 'Nair', 'Reddy',
  'Iyer', 'Menon', 'Rao', 'Desai', 'Shah', 'Mehta', 'Bhatt', 'Sinha', 'Dubey', 'Trivedi',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

const SUBJECTS_SEED = [
  { subjectCode: 'MCA101', subjectName: 'Programming Fundamentals', semester: 1, credits: 4 },
  { subjectCode: 'MCA102', subjectName: 'Discrete Mathematics', semester: 1, credits: 3 },
  { subjectCode: 'MCA201', subjectName: 'Data Structures', semester: 2, credits: 4 },
  { subjectCode: 'MCA202', subjectName: 'Operating Systems', semester: 2, credits: 4 },
  { subjectCode: 'MCA301', subjectName: 'Advanced Database Management', semester: 3, credits: 4 },
  { subjectCode: 'MCA302', subjectName: 'Computer Networks', semester: 3, credits: 3 },
  { subjectCode: 'MCA401', subjectName: 'Machine Learning', semester: 4, credits: 4 },
  { subjectCode: 'MCA402', subjectName: 'Cloud Computing', semester: 4, credits: 3 },
];

/**
 * Academic archetypes. Each defines RAW INPUT ranges only — attendance %,
 * academic marks %, assignment completion %, and a trend bias applied
 * across the 3 seeded "waves" per student. The risk engine (unchanged)
 * decides the resulting score/level from these numbers, same as it would
 * for any real student.
 */
const ARCHETYPES = [
  { name: 'high_attendance_high_marks', weight: 0.15, attendance: [85, 98], marks: [75, 95], assignment: [85, 100], trend: [-2, 8] },
  { name: 'high_attendance_poor_marks', weight: 0.09, attendance: [85, 98], marks: [28, 45], assignment: [35, 65], trend: [-12, 3] },
  { name: 'poor_attendance_high_marks', weight: 0.08, attendance: [35, 55], marks: [70, 90], assignment: [55, 85], trend: [-5, 10] },
  { name: 'poor_attendance_poor_marks', weight: 0.14, attendance: [25, 45], marks: [15, 35], assignment: [10, 35], trend: [-22, -5] },
  { name: 'good_academics_incomplete_assignments', weight: 0.08, attendance: [72, 88], marks: [62, 82], assignment: [10, 35], trend: [-6, 4] },
  { name: 'declining_performance', weight: 0.11, attendance: [45, 68], marks: [38, 58], assignment: [35, 60], trend: [-25, -14] },
  { name: 'improving_performance', weight: 0.10, attendance: [55, 75], marks: [35, 55], assignment: [40, 65], trend: [12, 25] },
  { name: 'stable_performance', weight: 0.10, attendance: [62, 78], marks: [50, 66], assignment: [50, 70], trend: [-3, 3] },
  { name: 'severe_high_risk', weight: 0.09, attendance: [20, 42], marks: [10, 30], assignment: [5, 30], trend: [-25, -15] },
  { name: 'mixed_risk', weight: 0.06, attendance: [30, 95], marks: [20, 90], assignment: [20, 95], trend: [-20, 20] },
];
const ARCHETYPE_WEIGHT_SUM = ARCHETYPES.reduce((s, a) => s + a.weight, 0);

function pickArchetype() {
  const r = Math.random() * ARCHETYPE_WEIGHT_SUM;
  let cumulative = 0;
  for (const a of ARCHETYPES) {
    cumulative += a.weight;
    if (r <= cumulative) return a;
  }
  return ARCHETYPES[ARCHETYPES.length - 1];
}

async function wipeCollections() {
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Faculty.deleteMany({}),
    Subject.deleteMany({}),
    Attendance.deleteMany({}),
    Assessment.deleteMany({}),
    Assignment.deleteMany({}),
    RiskAssessment.deleteMany({}),
    Intervention.deleteMany({}),
    AuditLog.deleteMany({}),
    Note.deleteMany({}),
    Notification.deleteMany({}),
    UserPreference.deleteMany({}),
  ]);
}

/**
 * Creates one "wave" of academic records for a student against a subject,
 * shaped by the archetype, then runs the real risk engine pipeline
 * (dashboard aggregation -> riskEngine -> RiskAssessment) so seeded risk
 * history is produced by the SAME code path as live usage.
 */
async function seedWaveAndCalculateRisk({ student, subject, archetype, waveIndex, backdateDays }) {
  const attendancePct = randFloat(archetype.attendance[0], archetype.attendance[1]);
  const totalClasses = randInt(20, 40) * (waveIndex + 1);
  const attendedClasses = Math.round((attendancePct / 100) * totalClasses);

  await Attendance.create({
    studentId: student._id,
    subjectId: subject._id,
    totalClasses,
    attendedClasses,
    attendancePercentage: round2((attendedClasses / totalClasses) * 100),
    recordDate: new Date(Date.now() - backdateDays * 24 * 60 * 60 * 1000),
  });

  const base = randFloat(archetype.marks[0], archetype.marks[1]);
  const trendShift = randFloat(archetype.trend[0], archetype.trend[1]) * (waveIndex * 0.5);
  const marksPct = Math.min(100, Math.max(0, base + trendShift));
  const maxMarks = 50;
  await Assessment.create({
    studentId: student._id,
    subjectId: subject._id,
    assessmentType: waveIndex === 0 ? 'INTERNAL_1' : waveIndex === 1 ? 'INTERNAL_2' : 'INTERNAL_3',
    marksObtained: round2((marksPct / 100) * maxMarks),
    maxMarks,
    assessmentDate: new Date(Date.now() - backdateDays * 24 * 60 * 60 * 1000),
  });

  const completionPct = randFloat(archetype.assignment[0], archetype.assignment[1]);
  const totalAssignments = randInt(2, 4);
  const submitted = Math.round((completionPct / 100) * totalAssignments);
  for (let a = 1; a <= totalAssignments; a += 1) {
    const isSubmitted = a <= submitted;
    await Assignment.create({
      studentId: student._id,
      subjectId: subject._id,
      assignmentTitle: `${subject.subjectCode} Assignment W${waveIndex + 1}.${a}`,
      maxScore: 10,
      obtainedScore: isSubmitted ? randInt(5, 10) : null,
      status: isSubmitted ? (Math.random() < 0.8 ? 'SUBMITTED_ON_TIME' : 'SUBMITTED_LATE') : 'NOT_SUBMITTED',
      dueDate: new Date(Date.now() - backdateDays * 24 * 60 * 60 * 1000),
      submissionDate: isSubmitted ? new Date(Date.now() - backdateDays * 24 * 60 * 60 * 1000) : null,
    });
  }

  const metrics = await getStudentAcademicMetrics(student._id);
  if (!metrics.isComplete) return null;

  const result = calculateStudentRisk({
    attendancePercentage: metrics.attendance.attendancePercentage,
    academicAverage: metrics.academic.academicAverage,
    assignmentCompletionPercentage: metrics.assignment.assignmentCompletionPercentage,
    assessmentPercentagesChronological: metrics.academic.chronologicalPercentages,
  });

  const riskDoc = await RiskAssessment.create({ studentId: student._id, ...result });
  // Backdate createdAt so the risk history chart shows a realistic progression.
  riskDoc.createdAt = new Date(Date.now() - backdateDays * 24 * 60 * 60 * 1000);
  await riskDoc.save();

  return riskDoc;
}

async function run() {
  const shouldDestroy = process.argv.includes('--destroy');

  await connectDB();
  console.log('[seed] Connected. Wiping existing collections...');
  await wipeCollections();

  if (shouldDestroy) {
    console.log('[seed] Destroy-only run complete. Collections are now empty.');
    await mongoose.disconnect();
    return;
  }

  console.log('[seed] Creating admin account...');
  const adminPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const adminUser = await User.create({ email: 'admin@smartedu.local', passwordHash: adminPasswordHash, role: 'ADMIN', status: 'ACTIVE', onboardingCompleted: true });

  console.log('[seed] Creating subjects...');
  const subjects = await Subject.insertMany(SUBJECTS_SEED);

  console.log(`[seed] Creating ${TOTAL_FACULTY} faculty accounts...`);
  const facultyPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const facultyList = [];
  for (let i = 1; i <= TOTAL_FACULTY; i += 1) {
    const email = `faculty${i}@smartedu.local`;
    const user = await User.create({ email, passwordHash: facultyPasswordHash, role: 'FACULTY', status: 'ACTIVE', onboardingCompleted: true });
    const faculty = await Faculty.create({
      userId: user._id,
      facultyId: `FAC${String(i).padStart(3, '0')}`,
      fullName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      email,
      department: 'MCA',
      assignedSubjectIds: [],
    });
    facultyList.push(faculty);
  }

  // Assign each subject to a faculty round-robin, and record it back on the faculty doc.
  for (let i = 0; i < subjects.length; i += 1) {
    const faculty = facultyList[i % facultyList.length];
    subjects[i].facultyId = faculty._id;
    await subjects[i].save();
    faculty.assignedSubjectIds.push(subjects[i]._id);
    await faculty.save();
  }

  console.log(`[seed] Creating ${TOTAL_STUDENTS} students across 10 academic archetypes...`);
  const studentPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const distributionCount = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  const archetypeDistribution = {};
  const interventionCandidates = [];
  const welcomeNotifications = [];
  let firstStudentUserId = null;
  let firstHighRiskStudent = null;

  for (let i = 1; i <= TOTAL_STUDENTS; i += 1) {
    const email = `student${i}@smartedu.local`;
    const user = await User.create({ email, passwordHash: studentPasswordHash, role: 'STUDENT', status: 'ACTIVE', onboardingCompleted: i !== 1 });
    if (i === 1) firstStudentUserId = user._id;

    const semester = pick([1, 2, 3, 4]);
    const assignedFaculty = pick(facultyList);
    const eligibleSubjects = subjects.filter((s) => s.semester === semester);
    const subjectPool = eligibleSubjects.length ? eligibleSubjects : subjects.slice(0, 2);

    const student = await Student.create({
      userId: user._id,
      studentId: `S${String(i).padStart(3, '0')}`,
      fullName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      email,
      phone: `9${randInt(100000000, 999999999)}`,
      course: 'MCA',
      semester,
      section: pick(['2MCA1', '2MCA2', '2MCA3', '2MCA4']),
      enrollmentYear: pick([2023, 2024, 2025]),
      previousSemesterAverage: randFloat(30, 95),
      facultyIds: [assignedFaculty._id],
      status: 'ACTIVE',
    });

    const archetype = pickArchetype();
    archetypeDistribution[archetype.name] = (archetypeDistribution[archetype.name] || 0) + 1;
    let lastRisk = null;

    // 3 waves = a small risk history per student (oldest -> newest).
    const waveOffsets = [42, 21, 3]; // days ago
    for (let w = 0; w < waveOffsets.length; w += 1) {
      const subject = subjectPool[w % subjectPool.length];
      const riskDoc = await seedWaveAndCalculateRisk({ student, subject, archetype, waveIndex: w, backdateDays: waveOffsets[w] });
      if (riskDoc) lastRisk = riskDoc;
    }

    if (lastRisk) {
      distributionCount[lastRisk.riskLevel] += 1;
      if (lastRisk.riskLevel !== 'LOW') interventionCandidates.push({ student, faculty: assignedFaculty, risk: lastRisk });
      if (lastRisk.riskLevel === 'HIGH' && !firstHighRiskStudent) firstHighRiskStudent = { student, faculty: assignedFaculty, risk: lastRisk };

      welcomeNotifications.push({
        userId: user._id,
        type: 'RISK_LEVEL_CHANGED',
        title: 'Your initial academic risk assessment is ready',
        message: `Your academic risk level is ${lastRisk.riskLevel} (score ${lastRisk.totalRiskScore}).`,
        relatedStudentId: student._id,
        read: i % 3 === 0, // vary read/unread so the demo shows both states
      });
    }

    if (i % 50 === 0) console.log(`[seed]   ...${i}/${TOTAL_STUDENTS} students done`);
  }

  console.log('[seed] Risk distribution:', distributionCount);
  console.log('[seed] Archetype distribution:', archetypeDistribution);

  if (welcomeNotifications.length) {
    await Notification.insertMany(welcomeNotifications);
  }

  console.log('[seed] Creating sample interventions for at-risk students...');
  const sample = interventionCandidates.slice(0, Math.min(40, interventionCandidates.length));
  const interventionTypes = ['ATTENDANCE_COUNSELLING', 'ACADEMIC_COUNSELLING', 'DOUBT_SESSION', 'ASSIGNMENT_REMINDER', 'STUDY_SUPPORT', 'FACULTY_FOLLOW_UP'];

  for (let idx = 0; idx < sample.length; idx += 1) {
    const { student, faculty, risk } = sample[idx];
    const closeIt = idx % 2 === 0;

    await Intervention.create({
      studentId: student._id,
      facultyId: faculty._id,
      riskAssessmentId: risk._id,
      interventionType: pick(interventionTypes),
      reason: `Risk level ${risk.riskLevel} (${risk.totalRiskScore}) detected on latest assessment.`,
      actionTaken: closeIt ? 'Met with student; agreed on an improvement plan.' : '',
      status: closeIt ? 'COMPLETED' : 'PENDING',
      interventionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      followUpDate: closeIt ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      previousRiskScore: risk.totalRiskScore,
      newRiskScore: closeIt ? round2(Math.max(0, risk.totalRiskScore - randFloat(5, 20))) : null,
      outcome: closeIt ? 'IMPROVED' : 'PENDING_REVIEW',
    });
  }

  console.log('[seed] Seeding a few demo Notes...');
  if (firstStudentUserId) {
    await Note.create({
      authorId: firstStudentUserId,
      authorRole: 'STUDENT',
      studentId: null,
      title: 'Study plan',
      content: 'Revise Data Structures chapter 3 before the next internal. Ask faculty about the pending assignment deadline.',
      pinned: true,
    });
  }
  if (firstHighRiskStudent) {
    await Note.create({
      authorId: firstHighRiskStudent.faculty.userId,
      authorRole: 'FACULTY',
      studentId: firstHighRiskStudent.student._id,
      title: 'Initial observation',
      content: `${firstHighRiskStudent.student.fullName} is showing a HIGH risk pattern — low attendance combined with declining internal marks. Plan a counselling session this week.`,
      pinned: false,
    });
  }

  console.log('\n[seed] Done!\n');
  console.log('Demo accounts (password for ALL demo accounts is the same):');
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log('  Admin:    admin@smartedu.local');
  console.log(`  Faculty:  faculty1@smartedu.local ... faculty${TOTAL_FACULTY}@smartedu.local`);
  console.log(`  Student:  student1@smartedu.local ... student${TOTAL_STUDENTS}@smartedu.local`);
  console.log('  Note: student1@smartedu.local has onboardingCompleted=false to demo the first-login tutorial.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
