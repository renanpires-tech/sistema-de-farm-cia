# Guia de Integração Front-end com Back-end

Este documento explica como integrar o front-end com o backend Java Spring Boot desenvolvido.

## ✅ Configuração Inicial

### 1. Variável de Ambiente

Crie um arquivo `.env` na raiz do projeto (ou `.env.local`) com a seguinte configuração:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

**Importante:** O backend roda na porta **8080** por padrão. Se você alterou a porta, ajuste a URL acima.

### 2. Instalação de Dependências

As dependências já estão configuradas no `package.json`. Se necessário, execute:

```bash
npm install
```

### 3. Credenciais de Autenticação

O backend utiliza **Basic Authentication** com as seguintes credenciais padrão:

- **Usuário**: `admin`
- **Senha**: `admin123`

Essas credenciais devem ser usadas para fazer login no sistema.

## 🔧 Estrutura da Integração

### Serviços de API

A integração foi organizada em serviços específicos por entidade:

- `services/api.ts` - Cliente HTTP base com autenticação
- `services/medicamentos.ts` - CRUD de medicamentos
- `services/clientes.ts` - CRUD de clientes
- `services/categorias.ts` - CRUD de categorias
- `services/vendas.ts` - Criação e listagem de vendas
- `services/estoque.ts` - Movimentações de estoque
- `services/alertas.ts` - Alertas do sistema
- `services/dashboard.ts` - Estatísticas do dashboard

## 📡 Endpoints do Backend

O front-end está configurado para usar os seguintes endpoints do seu backend:

### Autenticação
- Validação: Qualquer endpoint protegido (usa `/api/categorias` como teste)
- Método: Basic Authentication (usuario:senha em Base64)

### Categorias
- `GET /api/categorias` - Lista todas as categorias
- `GET /api/categorias/{id}` - Busca categoria por ID
- `POST /api/categorias` - Cria nova categoria

### Medicamentos
- `GET /api/medicamentos` - Lista todos os medicamentos (inclui inativos)
- `GET /api/medicamentos/ativos` - Lista apenas medicamentos ativos ⭐
- `GET /api/medicamentos/{id}` - Busca medicamento por ID
- `POST /api/medicamentos` - Cria novo medicamento
- `PUT /api/medicamentos/{id}` - Atualiza medicamento
- `DELETE /api/medicamentos/{id}` - Exclui medicamento (soft delete)
- `PATCH /api/medicamentos/{id}/status` - Ativa/Inativa medicamento ⭐

### Clientes
- `GET /api/clientes` - Lista todos os clientes
- `GET /api/clientes/{id}` - Busca cliente por ID
- `POST /api/clientes` - Cria novo cliente
- `PUT /api/clientes/{id}` - Atualiza cliente

**Nota:** O backend não possui endpoint de busca, então a busca é feita localmente no front-end após carregar todos os clientes.

### Estoque
- `POST /api/estoque/entrada` - Registra entrada de estoque
- `POST /api/estoque/saida` - Registra saída de estoque
- `GET /api/estoque/{medicamentoId}` - Consulta estoque atual de um medicamento

**Nota:** O backend não possui endpoint para listar histórico de movimentações. A página de Estoque mostra uma mensagem informativa.

### Vendas
- `GET /api/vendas` - Lista todas as vendas
- `GET /api/vendas/{id}` - Busca venda por ID
- `GET /api/vendas/cliente/{clienteId}` - Busca vendas por cliente
- `POST /api/vendas` - Cria nova venda ⭐

**Estrutura de venda:**
```json
{
  "itens": [
    {
      "medicamentoId": 1,
      "quantidade": 2
    }
  ]
}
```

**Importante:** O backend não exige `clienteId` na venda e obtém o preço automaticamente do banco de dados.

### Alertas
- `GET /api/alertas/estoque-baixo` - Lista medicamentos com estoque baixo
- `GET /api/alertas/validade-proxima` - Lista medicamentos com validade próxima

**Nota:** O front-end combina os dois endpoints para exibir todos os alertas juntos.

### Dashboard
**Nota:** O backend não possui endpoint específico para estatísticas do dashboard. O front-end calcula as estatísticas combinando dados de outros endpoints:
- Medicamentos ativos: `/api/medicamentos/ativos`
- Clientes: `/api/clientes`
- Vendas: `/api/vendas` (filtra por data)
- Alertas: Combinação de `/api/alertas/*`

## 🔐 Autenticação

O sistema usa **HTTP Basic Authentication**. As credenciais são:

- **Usuário**: `admin`
- **Senha**: `admin123`

O front-end:
1. Codifica as credenciais em Base64 ao fazer login
2. Armazena o token no `localStorage`
3. Inclui automaticamente o header `Authorization: Basic {token}` em todas as requisições

### Validação de Login

O front-end valida o login tentando acessar `/api/categorias`. Se a requisição for bem-sucedida, o login é considerado válido.

## 📋 Formato de Resposta Esperado

### Sucesso
Todas as respostas de sucesso retornam JSON com os dados da entidade.

### Erro
Erros retornam status HTTP apropriado (400, 401, 404, 500, etc.) e JSON:

```json
{
  "message": "Mensagem de erro",
  "error": "Descrição do erro"
}
```

O front-end automaticamente:
- Redireciona para `/login` em caso de erro 401 (não autorizado)
- Exibe mensagens de erro nas páginas
- Remove credenciais inválidas do localStorage

## 🚀 Testando a Integração

1. **Inicie o backend:**
   ```bash
   cd "C:\Users\Renan Pires\Desktop\Desafio Java-29-12"
   .\mvnw.cmd spring-boot:run
   ```

2. **Configure a variável de ambiente:**
   Crie um arquivo `.env` na raiz do front-end:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

3. **Inicie o front-end:**
   ```bash
   npm run dev
   ```

4. **Faça login:**
   - Acesse `http://localhost:3000`
   - Use as credenciais: `admin` / `admin123`

5. **Teste as funcionalidades:**
   - Navegue pelas páginas
   - Verifique se os dados são carregados corretamente
   - Teste criar, editar e excluir registros

## ⚠️ Diferenças e Limitações

### Funcionalidades não disponíveis no backend:

1. **Busca de clientes:** Não há endpoint `/clientes/search`. A busca é feita localmente no front-end.

2. **Histórico de movimentações:** Não há endpoint para listar todas as movimentações de estoque. A página mostra uma mensagem informativa.

3. **Estatísticas do dashboard:** Não há endpoint `/dashboard/stats`. As estatísticas são calculadas no front-end combinando dados de outros endpoints.

### Ajustes feitos no front-end:

1. **Medicamentos:** Usa `/medicamentos/ativos` para listar apenas ativos na página principal.

2. **Status de medicamento:** Usa `PATCH /medicamentos/{id}/status` com body `{ "status": true/false }`.

3. **Alertas:** Combina os endpoints `/alertas/estoque-baixo` e `/alertas/validade-proxima` para exibir todos os alertas.

4. **Vendas:** Envia apenas `itens` com `medicamentoId` e `quantidade`. O preço é obtido pelo backend.

## 🐛 Solução de Problemas

### Erro: "Erro ao processar a requisição"

- Verifique se o backend está rodando na porta 8080
- Verifique se a URL base está correta no `.env`
- Verifique o console do navegador para erros de CORS

### Erro: "401 Unauthorized"

- Verifique se as credenciais estão corretas (`admin` / `admin123`)
- Verifique se o token está sendo enviado corretamente
- Limpe o `localStorage` e faça login novamente

### Dados não aparecem

- Verifique o console do navegador para erros
- Verifique se os endpoints retornam dados no formato esperado
- Verifique se a estrutura dos tipos TypeScript corresponde à resposta da API

### CORS Error

Se houver erro de CORS, configure no backend Spring Boot adicionando ao `application.properties`:

```properties
spring.web.cors.allowed-origins=http://localhost:3000
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,PATCH
spring.web.cors.allowed-headers=*
```

Ou configure um `@CrossOrigin` nos controllers.

## 📝 Notas Finais

- O front-end está totalmente integrado com o backend
- Todas as funcionalidades principais estão funcionais
- Algumas funcionalidades (como histórico de movimentações) podem ser implementadas no backend futuramente
- O sistema de autenticação funciona corretamente com Basic Auth

## 🔗 Links Úteis

- **Backend API Docs (Swagger)**: `http://localhost:8080/swagger-ui.html`
- **Backend Base URL**: `http://localhost:8080/api`
- **Front-end**: `http://localhost:3000`
