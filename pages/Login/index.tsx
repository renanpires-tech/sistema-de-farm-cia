
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';

type LoginFormInputs = {
  username: string;
  pass: string;
};

// Página de Login
const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Função chamada na submissão do formulário
  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      await login(data.username, data.pass);
      navigate('/dashboard'); // Redireciona para o dashboard após o login
    } catch (error) {
      setLoginError('Usuário ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div className="flex flex-col items-center text-center">
            <div className="mb-4">
                <Logo />
            </div>
            <p className="text-gray-400">Faça login para acessar o sistema</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="relative">
            <input
              {...register('username', { required: 'Nome de usuário é obrigatório' })}
              type="text"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome de usuário"
              aria-invalid={errors.username ? "true" : "false"}
            />
             {errors.username && <p className="text-red-500 text-sm mt-1" role="alert">{errors.username.message}</p>}
          </div>

          <div className="relative">
             <input
              {...register('pass', { required: 'Senha é obrigatória' })}
              type="password"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Senha"
              aria-invalid={errors.pass ? "true" : "false"}
            />
            {errors.pass && <p className="text-red-500 text-sm mt-1" role="alert">{errors.pass.message}</p>}
          </div>

          {loginError && <p className="text-red-500 text-center" role="alert">{loginError}</p>}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
                'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
