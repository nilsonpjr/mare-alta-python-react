import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ApiService } from '../services/api'; // [MODIFIED] Import ApiService
import { Anchor, Mail, Lock, ArrowRight, UserCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
  setCurrentView: (view: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, setCurrentView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // [NEW] Loading state

  const handleLogin = async (e: React.FormEvent) => { // [MODIFIED] Async
    e.preventDefault();
    setError('');
    setIsLoading(true);
    console.log('[DEBUG] Iniciando login...');
    console.log('[DEBUG] Email:', email);
    console.log('[DEBUG] Senha:', password);

    try {
      // 1. Login para obter token
      console.log('[DEBUG] Passo 1: Chamando ApiService.login...');
      const loginResponse = await ApiService.login(email, password);
      console.log('[DEBUG] Resposta do login:', loginResponse);

      // Backend returns camelCase (accessToken) but we check both just in case
      const token = loginResponse?.accessToken || loginResponse?.access_token;
      console.log('[DEBUG] Token extraído:', token);

      if (!token) {
        throw new Error('Token não recebido do backend.');
      }

      // 2. Buscar dados do usuário logado
      console.log('[DEBUG] Passo 2: Chamando ApiService.getMe()...');
      const user = await ApiService.getMe();
      console.log('[DEBUG] Resposta do getMe (usuário):', user);

      if (user) {
        console.log('[DEBUG] Usuário recebido. Chamando onLogin...');
        onLogin(user);
        // Redirecionamento baseado no papel do usuário
        if (user.role === UserRole.TECHNICIAN) {
          setCurrentView('tech-orders');
        } else if (user.role === UserRole.CLIENT) {
          setCurrentView('client-portal');
        } else {
          setCurrentView('dashboard');
        }
        console.log('[DEBUG] Login concluído com sucesso!');
      } else {
        throw new Error('Dados do usuário não recebidos após login.');
      }
    } catch (err: any) {
      console.error("[DEBUG] Erro no bloco CATCH:", err);

      // Log detalhado do erro da API
      if (err.response) {
        console.error("[DEBUG] Erro de resposta da API:", err.response.data);
        console.error("[DEBUG] Status do erro:", err.response.status);
        console.error("[DEBUG] Headers do erro:", err.response.headers);
      } else if (err.request) {
        console.error("[DEBUG] Erro de requisição (sem resposta):", err.request);
      } else {
        console.error("[DEBUG] Erro geral:", err.message);
      }

      setError('Credenciais inválidas. Verifique usuário e senha.');
    } finally {
      setIsLoading(false);
      console.log('[DEBUG] Finalizando tentativa de login.');
    }
  };

  const handleDemoLogin = (email: string, pass: string) => {
    setEmail(email);
    setPassword(pass);
    // Pequeno delay para preencher os campos visualmente antes de submeter
    setTimeout(() => {
      // Chama o login programaticamente
      const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
      // Precisamos chamar a função async, mas dentro do timeout não podemos usar await diretamente da mesma forma
      // Então chamamos e tratamos a promise se necessário, ou apenas deixamos rodar
      // Mas como handleLogin usa o estado 'email' e 'password', e o setState é assíncrono, 
      // pode ser que não pegue os valores atualizados imediatamente.
      // Melhor passar os valores diretamente ou forçar a atualização.
      // Para simplificar no demo, vamos chamar a API direto com os valores:

      setIsLoading(true);
      ApiService.login(email, pass)
        .then(() => ApiService.getMe())
        .then(user => {
          onLogin(user);
          if (user.role === UserRole.TECHNICIAN) setCurrentView('tech-orders');
          else if (user.role === UserRole.CLIENT) setCurrentView('client-portal');
          else setCurrentView('dashboard');
        })
        .catch(() => setError('Erro no login de demonstração'))
        .finally(() => setIsLoading(false));

    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1566374828859-96892552e6c5?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-900/50"></div>

      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 flex flex-col">
        <div className="bg-slate-900/50 p-8 border-b border-white/10 text-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-900/50 rotate-3 transform hover:rotate-6 transition-transform">
            <Anchor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">MARE ALTA</h1>
          <p className="text-cyan-200 text-sm font-medium mt-1">Gestão Náutica Especializada</p>
        </div>

        <div className="p-8 bg-white">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-cyan-600 transition-colors" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm hover:border-cyan-300"
                  placeholder="seu.nome@marealta.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha de Acesso</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-cyan-600 transition-colors" />
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm hover:border-cyan-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-cyan-200 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all transform active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Acessando...' : 'Acessar Sistema'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-center text-slate-400 mb-4 font-semibold uppercase tracking-wider">Ambiente de Demonstração</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleDemoLogin('admin@marealta.com', '123456')}
                disabled={isLoading}
                className="group p-3 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-red-200 hover:shadow-md hover:shadow-red-100 transition-all duration-200 flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCircle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-xs font-bold text-slate-600 group-hover:text-red-600">Admin</span>
              </button>

              <button
                onClick={() => handleDemoLogin('tecnico@marealta.com', '123456')}
                disabled={isLoading}
                className="group p-3 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-100 transition-all duration-200 flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-600">Técnico</span>
              </button>

              <button
                onClick={() => handleDemoLogin('cliente@marealta.com', '123456')}
                disabled={isLoading}
                className="group p-3 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100 transition-all duration-200 flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCircle className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">Cliente</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 text-slate-500 text-xs opacity-60">
        © {new Date().getFullYear()} Mare Alta Náutica - v3.0.0 (Python Backend)
      </div>
    </div>
  );
};