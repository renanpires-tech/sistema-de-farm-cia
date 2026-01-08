# Sistema de Farmácia - Front-end

Sistema front-end React/TypeScript para gerenciamento de farmácia, integrado com API REST Java Spring Boot.

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- **Node.js** 18+ instalado
- **Backend Java Spring Boot** rodando (porta 8080)

### Passo 1: Instalar Dependências

```bash
npm install
```

### Passo 2: Configurar Variável de Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

**Importante:** Se o seu backend estiver rodando em outra porta ou URL, ajuste o valor acima.

### Passo 3: Rodar o Backend (se ainda não estiver rodando)

Abra um terminal e navegue até o diretório do backend:

```bash
cd "C:\Users\Renan Pires\Desktop\Desafio Java-29-12"
.\mvnw.cmd spring-boot:run
```

Aguarde até ver a mensagem indicando que o servidor iniciou (geralmente na porta 8080).

### Passo 4: Rodar o Front-end

Abra outro terminal (deixe o backend rodando) e execute:

```bash
npm run dev
```

O front-end estará disponível em: `http://localhost:3000`

### Passo 5: Fazer Login

Acesse `http://localhost:3000` e use as credenciais:

- **Usuário:** `admin`
- **Senha:** `admin123`

## 📋 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a build de produção
- `npm run preview` - Visualiza a build de produção

## 🔧 Solução de Problemas

### Erro: "Cannot find module"
Execute novamente:
```bash
npm install
```

### Erro de conexão com o backend
- Verifique se o backend está rodando na porta 8080
- Verifique se a URL no arquivo `.env` está correta
- Verifique se não há erro de CORS (veja INTEGRACAO.md)

### Porta 3000 já está em uso
O Vite usará automaticamente a próxima porta disponível (3001, 3002, etc.)

## 📚 Documentação

Para mais detalhes sobre a integração com o backend, consulte o arquivo [INTEGRACAO.md](./INTEGRACAO.md).
