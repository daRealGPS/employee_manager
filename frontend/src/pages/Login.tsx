import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import InputField from '../components/InputField';
import PasswordInput from '../components/PasswordInput';
import ButtonPrimary from '../components/ButtonPrimary';
import { apiPath } from '../util/api';
import type { LoginResponse } from '../util/apiTypes';

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
  }

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
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card>
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-700">
          Employer Login
        </h2>
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
          <ButtonPrimary
            type="submit"
          >
            Login
          </ButtonPrimary>
        </form>
      </Card>
    </div>
  );
}