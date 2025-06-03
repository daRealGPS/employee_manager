import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDelete, MdVisibility, MdEdit } from 'react-icons/md';
import ActionButton from '../components/ActionButton';
import useApi from '../util/api';
import Card from '../components/Card';
import InputField from '../components/InputField';
import PasswordInput from '../components/PasswordInput';
import ButtonPrimary from '../components/ButtonPrimary';
import H2 from '../components/H2';
import H1 from '../components/H1';
import StatusPill from '../components/StatusPill';
import {
  tableBase,
  tableHeaderRow,
  tableHeaderCell,
  tableRow,
  tableCell,
} from '../components/tableStyles';
import type {
  EmployeesListResponse,
  AttendanceTodayResponse,
} from "../util/apiTypes";

type FormTypes = 'create' | 'delete' | 'update';

interface Employee {
  id: number;
  username: string;
}

interface CreateForm {
  username: string;
  password: string;
}

interface UpdateForm {
  username: string;
  newUsername: string;
  newPassword: string;
}

interface APIResponse {
  message?: string;
  error?: string;
  employees?: Employee[];
}

type Status = 'idle' | 'success' | 'error'; 

interface FormMessages { 
  create: string;
  update: string;
  delete: string;
}

interface FormStatuses { 
  create: Status;
  update: Status;
  delete: Status;
}

interface LoadingState { 
  employees: boolean;
  attendance: boolean;
}

const initialCreateForm: CreateForm = {
  username: '',
  password: '',
};

const initialUpdateForm: UpdateForm = {
  username: '',
  newUsername: '',
  newPassword: '',
};

export default function EmployeeManager() {
  const navigate = useNavigate();
  const { get, post, put, del } = useApi();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(initialCreateForm);
  const [updateForm, setUpdateForm] = useState<UpdateForm>(initialUpdateForm);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>({});

  const [formMessages, setFormMessages] = useState<FormMessages>({ 
    create: '',
    update: '',
    delete: '',
  });

  const [formStatuses, setFormStatuses] = useState<FormStatuses>({ 
    create: 'idle',
    update: 'idle',
    delete: 'idle',
  });

  const [loading, setLoading] = useState<LoadingState>({ 
    employees: true,
    attendance: true,
  });

  const handleCreateChange = (name: string, value: string) => {
    setCreateForm(f => ({ ...f, [name]: value }));
  };

  const handleEditClick = (emp: Employee) => {
    setSelectedEmployeeId(emp.id);
    setUpdateForm({
      username: emp.username,
      newUsername: '',
      newPassword: '',
    });
    setFormFeedback('update', '', 'idle'); 
  };

  const handleUpdateChange = (name: string, value: string) => {
    setUpdateForm(f => ({ ...f, [name]: value }));
  };

  const setFormFeedback = ( 
    type: FormTypes,
    message: string,
    status: Status
  ) => {
    setFormMessages(prev => ({
      ...prev,
      [type]: message,
    }));

    setFormStatuses(prev => ({
      ...prev,
      [type]: status,
    }));

    if (type === 'create') {
      setFormMessages(prev => ({ ...prev, update: '', delete: '' }));
      setFormStatuses(prev => ({ ...prev, update: 'idle', delete: 'idle' }));
    } else if (type === 'update') {
      setFormMessages(prev => ({ ...prev, create: '', delete: '' }));
      setFormStatuses(prev => ({ ...prev, create: 'idle', delete: 'idle' }));
    }
  };

  const setLoadingKey = (key: keyof LoadingState, value: boolean) => { 
    setLoading(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  function resetForms(formType: FormTypes, isError: boolean) {
    if (isError) return; 
    if (formType === 'create') {
      setCreateForm(initialCreateForm);
    } else if (formType === 'update') {
      clearUpdateForm();
    }
  }

  async function fetchEmployees() {
    try {
      setLoadingKey('employees', true);
      const res = await get('/employees/list');
      setLoadingKey('employees', false);
      if (!res) return;

      const data: EmployeesListResponse = await res.json();
      if ("error" in data) {
        console.error("Failed to fetch employees:", data.error);
        setEmployees([]);
        return;
      }
      
      setEmployees(data.employees ?? []);
    } catch (err) {
      console.error('Failed to fetch employees', err);
      setLoadingKey('employees', false);
    }
  }

  async function fetchTodayAttendance() {
    try {
      setLoadingKey('attendance', true);
      const res = await get('/attendance/today');
      setLoadingKey('attendance', false);
      if (!res) return;

      const data = (await res.json()) as AttendanceTodayResponse;
      if ("error" in data) {
        console.error("Failed to fetch attendance:", data.error);
        setAttendanceMap({});
        return;
      }

      const markedUserIDs: number[] = (data.attendance ?? []).map(
        (entry: { id: number }) => entry.id
      );
      const map: Record<number, boolean> = {};
      markedUserIDs.forEach(id => {
        map[id] = true;
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
      setLoadingKey('attendance', false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await post('/employees/create', createForm);
      if (!res) return;

      const data: APIResponse = await res.json();
      const isError = !!data.error;

      setFormFeedback(
        'create',
        data.message ?? data.error ?? '',
        isError ? 'error' : 'success'
      );

      resetForms('create', isError);
      void fetchEmployees();
    } catch (err) {
      console.error('Failed to create employee', err);
      setFormFeedback('create', 'Unexpected error while creating employee', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Delete this employee and all related data?');
    if (!confirmed) return;

    try {
      const res = await del('/employees/delete', {
        body: JSON.stringify({ id }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res) return;

      const data: APIResponse = await res.json();
      const isError = !!data.error;

      setFormFeedback(
        'delete',
        data.message ?? data.error ?? '',
        isError ? 'error' : 'success'
      );

      if (!isError) {
        void fetchEmployees();
      }
    } catch (err) {
      console.error('Failed to delete employee', err);
      setFormFeedback('delete', 'Unexpected error while deleting employee', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEmployeeId == null) {
      setFormFeedback(
        'update',
        'Please select an employee to update from the list.',
        'error'
      );
      return;
    }

    const { username, newUsername, newPassword } = updateForm;

    const payload: {
      id: number;
      username: string;
      newUsername?: string;
      newPassword?: string;
    } = { id: selectedEmployeeId, username };

    if (newUsername?.trim()) payload.newUsername = newUsername.trim();
    if (newPassword?.trim()) payload.newPassword = newPassword.trim();

    try {
      const res = await put('/employees/update', payload);
      if (!res) return;

      const data: APIResponse = await res.json();
      const isError = !!data.error;

      setFormFeedback(
        'update',
        data.message || data.error || '',
        isError ? 'error' : 'success'
      );

      resetForms('update', isError);
      void fetchEmployees();
    } catch (err) {
      console.error('Failed to update employee', err);
      setFormFeedback('update', 'Unexpected error while updating employee', 'error');
    }
  };

  const clearUpdateForm = () => {
    setSelectedEmployeeId(null);
    setUpdateForm(initialUpdateForm);
  };

  useEffect(() => {
    fetchEmployees();
    fetchTodayAttendance();
  }, []);

  return (
    <main className="min-h-screen p-6 bg-gray-50 max-w-5xl mx-auto space-y-6">
      <div className="w-full space-y-6">
        <H1>Employee Manager</H1>
      </div>

      <Card>
        <H2>Create Employee</H2>
        {formMessages.create && (
          <p
            className={`text-center text-sm font-medium mt-2 ${
              formStatuses.create === 'error' ? 'text-red-500' : 'text-green-600'
            }`}
          >
            {formMessages.create}
          </p>
        )}
        <form onSubmit={handleCreate} className="space-y-4 mt-4">
          <InputField
            label="Username"
            name="username"
            value={createForm.username}
            onChange={handleCreateChange}
          />
          <PasswordInput
            label="Password"
            name="password"
            value={createForm.password}
            onChange={handleCreateChange}
          />
          <div className="flex justify-end">
            <ButtonPrimary type="submit">Add</ButtonPrimary>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <H2>Employee List</H2>
          {(loading.employees || loading.attendance) && (
            <span className="text-xs text-gray-500">
              Loading employees and attendance
            </span>
          )}
        </div>

        {formMessages.delete && (
          <p
            className={`mt-1 text-sm ${
              formStatuses.delete === 'error' ? 'text-red-500' : 'text-green-600'
            }`}
          >
            {formMessages.delete}
          </p>
        )}

        {loading.employees ? (
          <p className="mt-3 py-6 text-center text-gray-500 text-sm">
            Loading employees
          </p>
        ) : employees.length === 0 ? (
          <p className="mt-3 py-6 text-center text-gray-500 text-sm">
            No employees yet. Create one above to get started.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className={tableBase}>
              <thead>
                <tr className={tableHeaderRow}>
                  <th className={`${tableHeaderCell} w-1/4`}>Username</th>
                  <th className={`${tableHeaderCell} w-1/4`}>Attendance (today)</th>
                  <th className={`${tableHeaderCell} w-1/2`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr
                    key={emp.id}
                    className={`${tableRow} ${
                      selectedEmployeeId === emp.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <td className={`${tableCell} text-center truncate`}>
                      {emp.username}
                    </td>
                    <td className={tableCell}>
                      {loading.attendance ? (
                        <span className="text-xs text-gray-400">
                          Loading
                        </span>
                      ) : attendanceMap[emp.id] ? (
                        <StatusPill label="Present" variant="success" />
                      ) : (
                        <StatusPill label="Absent" variant="error" />
                      )}
                    </td>
                    <td className={tableCell}>
                      <div className="flex justify-end space-x-2">
                        <ActionButton
                          variant="primary"
                          onClick={() =>
                            navigate(`/attendance/${emp.id}`, {
                              state: { username: emp.username },
                            })
                          }
                        >
                          <MdVisibility size={16} />
                        </ActionButton>

                        {selectedEmployeeId !== emp.id && (
                          <ActionButton
                            variant="primary"
                            onClick={() => handleEditClick(emp)}
                          >
                            <MdEdit size={16} />
                        </ActionButton>
                        )}
                        <ActionButton
                          variant="danger"
                          onClick={() => handleDelete(emp.id)}
                        >
                          <MdDelete size={16} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>


      {selectedEmployeeId !== null && (
        <Card>
          <H2>Update Employee</H2>
          {formMessages.update && (
            <p
              className={`mt-2 text-sm ${
                formStatuses.update === 'error' ? 'text-red-500' : 'text-green-600'
              }`}
            >
              {formMessages.update}
            </p>
          )}
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <InputField
              label="Current Username"
              name="username"
              value={updateForm.username}
              onChange={handleUpdateChange}
              disabled
            />
            <InputField
              label="New Username (optional)"
              name="newUsername"
              value={updateForm.newUsername}
              onChange={handleUpdateChange}
            />
            <PasswordInput
              label="New Password (optional)"
              name="newPassword"
              value={updateForm.newPassword}
              onChange={handleUpdateChange}
            />
            <div className="flex justify-end space-x-2">
              <ButtonPrimary type="button" onClick={clearUpdateForm}>
                Cancel
              </ButtonPrimary>
              <ButtonPrimary type="submit">
                Update
              </ButtonPrimary>
            </div>
          </form>
        </Card>
      )}

    </main>
  );
}
