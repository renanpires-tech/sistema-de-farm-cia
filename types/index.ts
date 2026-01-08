
// Define a estrutura de um usuário autenticado
export interface User {
  username: string;
}

// Define a estrutura de uma categoria de medicamento
export interface Categoria {
  id: number;
  nome: string;
  descricao?: string | null;
}

// Define a estrutura de um medicamento
export interface Medicamento {
  id: number;
  nome: string;
  dosagem: string;
  descricao?: string | null;
  preco: number;
  estoque: number;
  dataValidade: string;
  ativo: boolean;
  categoria: Categoria;
}

// Define a estrutura de um cliente
export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  dataNascimento: string;
}

// Define a estrutura de um item de venda
export interface ItemVenda {
  medicamentoId: number;
  nomeMedicamento: string;
  quantidade: number;
  precoUnitario: number;
}

// Define a estrutura de uma venda
export interface Venda {
  id: number;
  cliente: Cliente | null;
  itens: ItemVenda[];
  valorTotal: number;
  dataVenda: string;
}

// Define a estrutura de uma movimentação de estoque
export interface MovimentacaoEstoque {
    id: number;
    medicamentoId?: number;
    medicamento_id?: number;
    medicamentoNome?: string;
    medicamento?: {
        id: number;
        nome: string;
    };
    tipo: 'ENTRADA' | 'SAIDA';
    quantidade: number;
    quantidadeAnterior?: number;
    quantidade_anterior?: number;
    quantidadeAtual?: number;
    quantidade_atual?: number;
    data?: string;
    dataMovimentacao?: string;
    data_movimentacao?: string;
    observacao?: string;
    responsavel?: string;
}

// Define a estrutura de um alerta
export interface Alerta {
    id: number;
    medicamento: Medicamento;
    tipo: 'ESTOQUE_BAIXO' | 'VALIDADE_PROXIMA';
    mensagem: string;
}
