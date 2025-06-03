const pool = require("../db");
const { auditLog } = require("../utils/audit");
const { AppError } = require("../utils/AppError");
const { haversineMeters } = require("../utils/geo");

const markAttendance = async (req, res) => {
  const { photo_url, latitude, longitude, accuracy_m } = req.body;

  const userId = req.user.userId;
  const role = req.user.role;

  if (role !== "employee") {
    throw new AppError(403, "Only employees can mark attendance");
  }

  const fenceLat = Number(process.env.GEOFENCE_LAT);
  const fenceLng = Number(process.env.GEOFENCE_LNG);
  const radiusM = Number(process.env.GEOFENCE_RADIUS_M ?? 0);
  const maxAccuracyM = Number(process.env.GEOFENCE_MAX_ACCURACY_M ?? 999999);

  if (!Number.isFinite(fenceLat) || !Number.isFinite(fenceLng) || !Number.isFinite(radiusM) || radiusM <= 0) {
    throw new AppError(500, "Geofence not configured");
  }

  if (accuracy_m !== undefined && accuracy_m !== null) {
    if (Number(accuracy_m) > maxAccuracyM) {
      throw new AppError(400, "GPS accuracy too low. Move outdoors and try again.");
    }
  }

  const distanceM = haversineMeters(Number(latitude), Number(longitude), fenceLat, fenceLng);
  const geofenceOk = distanceM <= radiusM;

  if (!geofenceOk) {
    auditLog({
      req,
      action: "attendance.submit",
      targetType: "attendance",
      targetId: null,
      success: false,
      statusCode: 403,
      metadata: { reason: "geofence_failed", distance_m: Math.round(distanceM), radius_m: radiusM },
    });

    throw new AppError(403, "Outside allowed location");
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO attendance
        (user_id, photo_url, latitude, longitude, accuracy_m, distance_m, geofence_ok)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id
      `,
      [userId, photo_url, latitude, longitude, accuracy_m ?? null, distanceM, true]
    );

    const attendanceId = rows[0]?.id ?? null;

    auditLog({
      req,
      action: "attendance.submit",
      targetType: "attendance",
      targetId: attendanceId,
      success: true,
      statusCode: 201,
      metadata: { distance_m: Math.round(distanceM), radius_m: radiusM },
    });

    res.status(201).json({ message: "Attendance logged successfully" });
  } catch (err) {
    // once-per-day unique index hit
    if (err.code === "23505") {
      auditLog({
        req,
        action: "attendance.submit",
        targetType: "attendance",
        targetId: null,
        success: false,
        statusCode: 409,
        metadata: { reason: "already_marked_today" },
      });

      throw new AppError(409, "Attendance already marked today");
    }

    throw err;
  }
};

const getTodayAttendance = async (req, res) => {
  const { rows } = await pool.query(
    `
    SELECT u.id, u.username,
           a.timestamp,
           a.photo_url,
           a.distance_m,
           a.geofence_ok,
           to_char(timezone('Asia/Kolkata', a.timestamp), 'YYYY-MM-DD HH24:MI:SS') AS timestamp_ist
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    WHERE a.attendance_day = (timezone('Asia/Kolkata', now()))::date
    ORDER BY a.timestamp DESC
    `
  );

  res.status(200).json({ attendance: rows });
};

const getEmployeeAttendance = async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(
    `
    SELECT photo_url,
           to_char(timezone('Asia/Kolkata', timestamp), 'YYYY-MM-DD HH24:MI:SS') AS timestamp_ist,
           distance_m,
           geofence_ok
    FROM attendance
    WHERE user_id = $1
      AND attendance_day = (timezone('Asia/Kolkata', now()))::date
    ORDER BY timestamp DESC
    LIMIT 1
    `,
    [id]
  );

  if (rows.length === 0) {
    return res.status(200).json({ message: "Attendance not marked today" });
  }

  res.status(200).json({ record: rows[0] });
};

module.exports = { markAttendance, getTodayAttendance, getEmployeeAttendance };
