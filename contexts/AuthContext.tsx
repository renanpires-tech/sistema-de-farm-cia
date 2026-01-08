
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { logger } from '../utils/logger';

// Define a forma do contexto de autenticação
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// Cria o contexto com um valor padrão
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Componente Provedor que encapsula a lógica de autenticação
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Efeito para verificar se há um usuário logado no armazenamento local ao iniciar a aplicação
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        logger.info('Sessão restaurada', { username: userData.username });
      }
    } catch (error) {
      logger.error("Falha ao carregar dados do usuário", error);
      localStorage.removeItem('user');
      localStorage.removeItem('auth');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função de login
  const login = useCallback(async (username: string, pass: string) => {
    try {
      logger.info(`Tentativa de login: ${username}`);
      
      // Valida se username e senha foram fornecidos
      if (!username || !pass) {
        throw new Error('Usuário e senha são obrigatórios');
      }
      
      // Codifica as credenciais em Base64 para Basic Auth
      const basicAuth = btoa(`${username}:${pass}`);
      
      // Armazena temporariamente o token para usar na requisição
      localStorage.setItem('auth', basicAuth);
      
      // Valida a autenticação tentando acessar um endpoint protegido
      // O backend não tem endpoint /auth/me, então usamos /categorias como validação
      try {
        await api.get('/categorias', true);
      } catch (authError: any) {
        // Remove o token em caso de erro
        localStorage.removeItem('auth');
        
        // Tratamento específico de erros de autenticação
        if (authError?.response?.status === 401) {
          logger.error('Credenciais inválidas', authError, { username });
          throw new Error('Usuário ou senha inválidos');
        } else if (authError?.response?.status === 0 || authError?.message?.includes('fetch')) {
          logger.error('Erro de conexão com o backend', authError, { username });
          throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        } else {
          logger.error('Erro ao validar autenticação', authError, { 
            username,
            statusCode: authError?.response?.status,
            errorData: authError?.response?.data 
          });
          throw new Error(authError?.message || 'Erro ao realizar login. Tente novamente.');
        }
      }
      
      // Se chegou aqui, o login foi bem-sucedido
      const userData: User = { username };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      logger.success('Login bem-sucedido', { username });
      logger.audit('LOGIN', 'Autenticação', undefined, { username });
    } catch (error) {
      // Garante que o token seja removido em caso de qualquer erro
      localStorage.removeItem('auth');
      logger.error('Falha no login', error, { username });
      throw error;
    }
  }, []);

  // Função de logout
  const logout = useCallback(() => {
    const username = user?.username;
    localStorage.removeItem('user');
    localStorage.removeItem('auth');
    setUser(null);
    logger.audit('LOGOUT', 'Autenticação', undefined, { username });
    logger.info('Usuário fez logout');
  }, [user]);

  const value = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
