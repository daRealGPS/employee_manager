import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import InputField from '../components/InputField';
import PasswordInput from '../components/PasswordInput';
import ButtonPrimary from '../components/ButtonPrimary';
import { apiPath } from '../util/api';
import type { LoginResponse } from '../util/apiTypes';
import { demoConfig } from '../util/demoConfig';

interface LoginForm {
  username: string;
  password: string;
}

export default function Login() {
  const [form, setForm] = useState<LoginForm>({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (name: string, value: string) => {
    setForm(f => ({ ...f, [name]: value }));
  };

  const fillDemoCredentials = () => {
    setForm({
      username: demoConfig.username,
      password: demoConfig.password,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch(apiPath('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, password: form.password }),
    });

    const data: LoginResponse = await res.json();

    if (res.ok && "token" in data && typeof data.token === "string") {
      sessionStorage.setItem("token", data.token);
      navigate("/dashboard");
    } else {
      setError("error" in data ? data.error : "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card>
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-700">
          Employer Login
        </h2>

        {demoConfig.enabled && (
          <div className="mb-4 rounded border border-purple-200 bg-purple-50 p-3 text-sm text-gray-700">
            <p className="font-semibold text-purple-700 mb-1">Demo Mode</p>
            <p>Username: <span className="font-medium">{demoConfig.username}</span></p>
            <p>Password: <span className="font-medium">{demoConfig.password}</span></p>
            <p className="mt-2 text-xs text-gray-600">
              Public registration is disabled. Demo data can be reset from the dashboard.
            </p>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="mt-3 rounded bg-purple-700 px-3 py-2 text-white hover:bg-blue-700"
            >
              Fill Demo Credentials
            </button>
          </div>
        )}

        {error && (
          <p className="bg-red-100 text-red-700 text-sm px-3 py-2 rounded mb-3 border border-red-300">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter your username"
          />
          <PasswordInput
            label="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
          />
          <ButtonPrimary type="submit">
            Login
          </ButtonPrimary>
        </form>
      </Card>
    </div>
  );
}