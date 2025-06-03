export type ApiError = { error: string };

export type ApiMessage = { message: string };

export type LoginResponse = { token: string } | ApiError;

export type Employee = { id: number; username: string };
export type EmployeesListResponse = { employees: Employee[] } | ApiError;

export type Task = { id: number; description: string; status: "pending" | "done" };
export type TasksListResponse =
  | { tasks: Task[] }
  | ApiError;

export type AttendanceTodayRow = {
  id: number; // currently user id from backend query
  username: string;
  timestamp: string;
  photo_url: string;
  distance_m: number;
  geofence_ok: boolean;
  timestamp_ist: string;
};

export type AttendanceTodayResponse = { attendance: AttendanceTodayRow[] } | ApiError;

export type EmployeeAttendanceRecord = {
  photo_url: string;
  timestamp_ist: string;
  distance_m: number;
  geofence_ok: boolean;
};

export type EmployeeAttendanceResponse =
  | { record: EmployeeAttendanceRecord }
  | { message: "Attendance not marked today" }
  | ApiError;