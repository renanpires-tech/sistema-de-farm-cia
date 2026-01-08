// Serviço de API para comunicação com o backend
const getApiBaseUrl = (): string => {
  // @ts-ignore - Vite adiciona import.meta.env em tempo de build
  return import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080/api';
};

const API_BASE_URL = getApiBaseUrl();

// Interface para opções de requisição
interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

// Função para obter o token de autenticação
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth');
};

// Função para fazer requisições HTTP
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const {
    method = 'GET',
    headers = {},
    body,
    requiresAuth = true,
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Adiciona autenticação se necessário
  if (requiresAuth) {
    const authToken = getAuthToken();
    if (authToken) {
      requestHeaders['Authorization'] = `Basic ${authToken}`;
    }
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    // Se a resposta não for ok, tenta parsear o erro
    if (!response.ok) {
      let errorMessage = 'Erro ao processar a requisição';
      let errorData: any = null;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          
          // Tenta múltiplas formas de extrair a mensagem de erro
          // Backend Java Spring Boot geralmente usa:
          // - message (mensagem geral)
          // - error (tipo do erro)
          // - errors[] (array de erros de validação)
          // - validationErrors (objeto com erros de validação por campo)
          
          if (Array.isArray(errorData.errors)) {
            // Se for array de erros de validação, junta todos
            errorMessage = errorData.errors.map((e: any) => 
              typeof e === 'string' ? e : (e.message || e.field || e.defaultMessage || JSON.stringify(e))
            ).join(', ');
          } else if (errorData.validationErrors) {
            // Se for objeto com erros por campo
            const validationErrs = Object.entries(errorData.validationErrors)
              .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('; ');
            errorMessage = validationErrs || errorMessage;
          } else {
            errorMessage = errorData.message || 
                          errorData.error || 
                          errorData.erro || 
                          errorData.detail ||
                          errorMessage;
          }
        } else {
          // Se não for JSON, tenta ler como texto
          const text = await response.text();
          errorMessage = text || response.statusText || errorMessage;
          errorData = { message: errorMessage };
        }
      } catch (parseError) {
        // Se não conseguir parsear, usa a mensagem padrão ou statusText
        errorMessage = response.statusText || errorMessage;
        errorData = { message: errorMessage };
      }

      // Se for erro 401 (não autorizado), limpa o localStorage
      if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('auth');
        window.location.href = '/#/login';
      }

      // Cria erro com informações adicionais
      const error = new Error(errorMessage);
      (error as any).response = { 
        status: response.status, 
        data: errorData,
        statusText: response.statusText,
      };
      throw error;
    }

    // Se a resposta estiver vazia (204 No Content), retorna void
    if (response.status === 204) {
      return undefined as T;
    }

    // Tenta parsear JSON
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido ao fazer requisição');
  }
};

// Funções auxiliares para métodos HTTP
export const api = {
  get: <T>(endpoint: string, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'GET', requiresAuth }),

  post: <T>(endpoint: string, body: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'POST', body, requiresAuth }),

  put: <T>(endpoint: string, body: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, requiresAuth }),

  patch: <T>(endpoint: string, body: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body, requiresAuth }),

  delete: <T>(endpoint: string, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'DELETE', requiresAuth }),
};

// Exporta a URL base para uso em outros lugares se necessário
export { API_BASE_URL };

