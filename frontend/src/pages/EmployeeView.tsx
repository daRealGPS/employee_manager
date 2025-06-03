import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { MdDelete } from 'react-icons/md';
import useApi from '../util/api';
import Card from '../components/Card';
import ButtonPrimary from '../components/ButtonPrimary';
import H1 from '../components/H1';
import H2 from '../components/H2';
import ActionButton from '../components/ActionButton';
import { tableBase, tableHeaderCell, tableHeaderRow, tableRow, tableCell } from '../components/tableStyles';
import StatusPill from '../components/StatusPill';
import type { ApiError, ApiMessage, EmployeeAttendanceResponse, TasksListResponse } from '../util/apiTypes';

interface AttendanceRecord {
  timestamp_ist: string;
  photo_url: string;
}

interface Task {
  id: number;
  description: string;
  status: string;
}

type Status = 'idle' | 'success' | 'error'; 

interface LoadingState { 
  attendance: boolean;
  tasks: boolean;
}

interface TaskFeedback { 
  message: string;
  status: Status;
}

export default function EmployeeView() {
  const { get, post, del } = useApi();
  const { id } = useParams();
  const state = useLocation().state as { username?: string } | null;
  const username = state?.username;

  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [notMarked, setNotMarked] = useState(false);

  const [loading, setLoading] = useState<LoadingState>({ 
    attendance: true,
    tasks: true,
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState('');

  const [taskFeedback, setTaskFeedback] = useState<TaskFeedback>({ 
    message: '',
    status: 'idle',
  });

  const setLoadingKey = (key: keyof LoadingState, value: boolean) => { 
    setLoading(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    if (!id) {
      setError('Missing employee id in URL'); 
      setLoadingKey('attendance', false);
      setLoadingKey('tasks', false);
      return;
    }

    const fetchAttendance = async () => {
      try {
        setLoadingKey('attendance', true);
        const res = await get(`/attendance/${id}`);
        setLoadingKey('attendance', false);
        if (!res) return;

        const data: EmployeeAttendanceResponse = await res.json();

        if (!res.ok) {
          setError("error" in data ? data.error : "Error fetching attendance");
          return;
        }

        if ("message" in data && data.message === "Attendance not marked today") {
          setNotMarked(true);
          setAttendance(null);
          return;
        }

        if ("record" in data) {
          setAttendance(data.record);
          setNotMarked(false);
          return;
        }

        setError("Error fetching attendance");
      } catch {
        setLoadingKey('attendance', false);
        setError('Failed to load attendance');
      }
    };

    const fetchTasks = async () => {
      try {
        setLoadingKey('tasks', true);
        const res = await get(`/tasks?id=${id}`);
        setLoadingKey('tasks', false);
        if (!res) return;

        const data: TasksListResponse = await res.json();
        if(!res.ok) {
          if("error" in data) setError(data.error)
          return;
        }

        if ("tasks" in data) setTasks(data.tasks || []);
      } catch {
        setLoadingKey('tasks', false);
        setError('Failed to load tasks');
      }
    };

    fetchAttendance();
    fetchTasks();
  }, [id]);

  const handleAddTask = async () => {
    const trimmed = newTask.trim();
    if (!trimmed || !id) return;

    try {
      const numericId = Number(id);
      const res = await post('/tasks/assign', { id: numericId, description: trimmed });

      if (!res) return;
      const data: ApiMessage | ApiError = await res.json();
      const isError = error in data;

      setTaskFeedback({
        message: ("message" in data ? data.message : data.error) || "",
        status: isError ? 'error' : 'success',
      });

      if (!isError) {
        setNewTask('');
        const updated = await get(`/tasks?id=${id}`);
        if (!updated) return;
        const result = await updated.json();
        setTasks(result.tasks || []);
      }
    } catch {
      setTaskFeedback({
        message: 'Error assigning task',
        status: 'error',
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const confirmed = window.confirm('Delete this task?'); 
    if (!confirmed) return;

    try {
      const res = await del(`/tasks/${taskId}`);
      if (!res) return;

      if (res.ok) {
        setTasks(t => t.filter(task => task.id !== taskId));
      }
    } catch {
      setTaskFeedback({
        message: 'Failed to delete task',
        status: 'error',
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
        <p className="text-red-600 text-center text-sm">{error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
        <H1>Attendance and Tasks</H1>
        <p className=" text-gray-600">
          {username ? `Employee: ${username}` : id ? `Employee ID: ${id}` : ''}
        </p>
      </div>

      <Card>
        <H2> Today's attendance </H2>
        {loading.attendance ? (
          <p className="text-sm text-gray-500 text-center">Loading attendance</p>
        ) : notMarked ? (
          <p className="text-red-600 text-center text-sm">
            Attendance not marked today
          </p>
        ) : attendance ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 text-center">
              <span className="font-medium">Timestamp (IST):</span> {attendance.timestamp_ist}
            </p>
            <div className="flex justify-center">
              <img
                src={attendance.photo_url || 'https://placehold.co/600x400'}
                alt="Attendance photo"
                className="w-full max-w-xs h-48 object-cover rounded border"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center">
            No attendance record found for today.
          </p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <H2>Tasks</H2>
          {loading.tasks && (
            <span className="text-xs text-gray-500">Loading tasks</span>
          )}
        </div>

        {loading.tasks ? (
          <p className="text-sm text-gray-500 text-center">Loading tasks</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center">
            No tasks assigned yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableBase}>
              <thead>
                <tr className={tableHeaderRow}>
                  <th className={`${tableHeaderCell} w-1/2`}>Task</th>
                  <th className={`${tableHeaderCell} w-1/4`}>Status</th>
                  <th className={`${tableHeaderCell} w-1/4`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className={tableRow}>
                    <td className={`${tableCell} break-all w-1/2`}>{task.description}</td>
                    <td className={`${tableCell} w-1/4`}>
                      <StatusPill label={task.status} variant={task.status === 'pending' ? 'warning' : 'success'} />
                     </td>
                    <td className={`${tableCell} w-1/4`}>
                      <ActionButton
                        variant="danger"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <MdDelete size={16} />
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-800">Assign New Task</h4>
          <input
            type="text"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="Task description"
            className="border px-3 py-2 rounded w-full text-sm"
          />
          <div className="flex justify-end">
            <ButtonPrimary onClick={handleAddTask}>
              Add Task
            </ButtonPrimary>
          </div>
          {taskFeedback.message && (
            <p
              className={`text-xs text-center mt-1 ${
                taskFeedback.status === 'error' ? 'text-red-500' : 'text-green-600'
              }`}
            >
              {taskFeedback.message}
            </p>
          )}
        </div>
      </Card>
    </main>
  )
};

