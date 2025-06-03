const pool = require('../db');
const { auditLog } = require("../utils/audit");
const { AppError } = require("../utils/AppError");

const assignTask = async (req, res, next) => {
  const { id: userId, description } = req.body;

  const { rows } = await pool.query(
    'INSERT INTO tasks (user_id, description, status) VALUES ($1, $2, $3) RETURNING id',
    [userId, description, 'pending']
  );

  const taskId = rows[0]?.id ?? null;

  auditLog({
    req,
    action: "task.assign",
    targetType: "task",
    targetId: taskId,
    success: true,
    statusCode: 201,
    metadata: { assigned_to_user_id: userId },
  });

  res.status(201).json({ message: 'Task assigned successfully' });
};

const getTasks = async (req, res) => {
  const requestedUserId = req.query.id ?? null;
  const requesterUserId = req.user.userId;
  const requesterRole = req.user.role;

  if (requestedUserId && requesterRole !== "employer") {
    throw new AppError(403, "Not authorized to query other users' tasks");
  }

  const userIdToFetch = requesterRole === "employer" && requestedUserId
    ? requestedUserId
    : requesterUserId;

  const { rows } = requesterRole === "employer" && requestedUserId
    ? await pool.query(
        `SELECT t.id, u.username, t.description, t.status
         FROM tasks t
         JOIN users u ON t.user_id = u.id
         WHERE t.user_id = $1
         ORDER BY t.id DESC`,
        [userIdToFetch]
      )
    : await pool.query(
        `SELECT id, description, status
         FROM tasks
         WHERE user_id = $1
         ORDER BY id DESC`,
        [userIdToFetch]
      );

  res.status(200).json({ tasks: rows });
};

const deleteTask = async (req, res) => {
  const taskId = req.params.taskId;

  const result = await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
  if (result.rowCount === 0) {
    throw new AppError(404, "Task not found");
  }

  res.status(200).json({ message: "Task deleted." });
};

const updateTaskStatus = async (req, res) => {
  const taskId = req.params.taskId;
  const { status } = req.body;
  const requesterUserId = req.user.userId;
  const requesterRole = req.user.role;

  if (requesterRole !== "employee") {
    throw new AppError(403, "Only employees can update task status");
  }

  const { rows } = await pool.query(
    `SELECT id, status, completed_count, reopened_count
     FROM tasks
     WHERE id = $1 AND user_id = $2`,
    [taskId, requesterUserId]
  );

  if (rows.length === 0) {
    throw new AppError(403, "Not authorized to update this task");
  }

  const task = rows[0];

  if (status === "done") {
    if (task.completed_count >= 2) {
      throw new AppError(429, "Task marked done too many times");
    }

    await pool.query(
      `UPDATE tasks
       SET status = 'done',
           completed_count = completed_count + 1
       WHERE id = $1`,
      [taskId]
    );

    auditLog({
      req,
      action: "task.status.update",
      targetType: "task",
      targetId: Number(taskId),
      success: true,
      statusCode: 200,
      metadata: { from: task.status, to: "done" },
    });

    return res.status(200).json({ message: "Task marked done", status: "done" });
  }

  if (status === "pending") {
    if (task.reopened_count >= 2) {
      throw new AppError(429, "Task reopened too many times");
    }

    await pool.query(
      `UPDATE tasks
       SET status = 'pending',
           reopened_count = reopened_count + 1
       WHERE id = $1`,
      [taskId]
    );

    auditLog({
      req,
      action: "task.status.update",
      targetType: "task",
      targetId: Number(taskId),
      success: true,
      statusCode: 200,
      metadata: { from: task.status, to: "pending" },
    });

    return res.status(200).json({ message: "Task marked pending", status: "pending" });
  }

  throw new AppError(400, "Invalid status");
};

module.exports = { assignTask, getTasks, updateTaskStatus, deleteTask };
