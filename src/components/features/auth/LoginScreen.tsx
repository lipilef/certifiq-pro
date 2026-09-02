import React, { useState } from 'react';
import { Award, User as UserIcon, Lock, Mail } from 'lucide-react';
import { auth } from '../../../services/auth';
import { User } from '../../../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = await auth.login(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Email ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-900 p-3 rounded-full mb-3">
            <Award className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">CertifiqPRO</h1>
          <p className="text-gray-500 text-sm mt-1 text-center">Plataforma de Certificados SaaS</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="email" 
                required
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                placeholder="seu@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="password" 
                required
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors mt-2"
          >
            Entrar na Plataforma
          </button>
        </form>
        
        <div className="mt-6 text-xs text-gray-500 text-center bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
            <p className="font-semibold text-gray-700 border-b pb-1">Acessos de Teste (Mock DB):</p>
            <p><b>Super Admin:</b> super@certifiq.pro / admin</p>
            <p><b>Empresa:</b> admin@tech.com / 123</p>
            <p><b>Aluno:</b> joao@aluno.com / 123</p>
        </div>
      </div>
    </div>
  );
}
