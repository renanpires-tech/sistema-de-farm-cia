import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import type { Medicamento } from '../../types';

interface MovimentacaoFormData {
  medicamentoId: number;
  quantidade: number;
  observacao?: string;
}

interface MovimentacaoFormProps {
  onSubmit: (data: MovimentacaoFormData) => Promise<void>;
  onCancel: () => void;
  medicamentos: Medicamento[];
  tipo: 'ENTRADA' | 'SAIDA';
  isLoading?: boolean;
}

const MovimentacaoForm: React.FC<MovimentacaoFormProps> = ({
  onSubmit,
  onCancel,
  medicamentos,
  tipo,
  isLoading = false,
}) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<MovimentacaoFormData>();

  const medicamentoId = watch('medicamentoId');
  const medicamentoSelecionado = medicamentos.find(m => m.id === Number(medicamentoId));

  const onSubmitForm: SubmitHandler<MovimentacaoFormData> = async (data) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Medicamento *
        </label>
        <select
          {...register('medicamentoId', {
            required: 'Medicamento é obrigatório',
            valueAsNumber: true,
          })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione um medicamento</option>
          {medicamentos.map((med) => (
            <option key={med.id} value={med.id}>
              {med.nome} {med.dosagem ? `(${med.dosagem})` : ''} - Estoque: {med.estoque} {!med.ativo ? '(INATIVO)' : ''}
            </option>
          ))}
        </select>
        {errors.medicamentoId && (
          <p className="text-red-400 text-sm mt-1">{errors.medicamentoId.message}</p>
        )}
      </div>

      {medicamentoSelecionado && tipo === 'SAIDA' && (
        <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <p className="text-yellow-400 text-sm">
            Estoque atual: <strong>{medicamentoSelecionado.estoque} unidades</strong>
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quantidade *
        </label>
        <input
          {...register('quantidade', {
            required: 'Quantidade é obrigatória',
            min: { value: 1, message: 'Quantidade deve ser maior que zero' },
            validate: (value) => {
              if (tipo === 'SAIDA' && medicamentoSelecionado) {
                if (value > medicamentoSelecionado.estoque) {
                  return `Quantidade não pode ser maior que o estoque disponível (${medicamentoSelecionado.estoque})`;
                }
              }
              return true;
            },
          })}
          type="number"
          min="1"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0"
        />
        {errors.quantidade && (
          <p className="text-red-400 text-sm mt-1">{errors.quantidade.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Observação
        </label>
        <textarea
          {...register('observacao')}
          rows={3}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder={tipo === 'ENTRADA' 
            ? 'Ex: Reposição de estoque, compra mensal, devolução...' 
            : 'Ex: Venda, perda, ajuste de inventário, descarte...'}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          Campo opcional. Máximo de 500 caracteres.
        </p>
      </div>

      <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
        <p className="text-blue-400 text-sm">
          Tipo de movimentação: <strong>{tipo === 'ENTRADA' ? 'ENTRADA' : 'SAÍDA'}</strong>
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            tipo === 'ENTRADA'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Processando...' : `Confirmar ${tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}`}
        </button>
      </div>
    </form>
  );
};

export default MovimentacaoForm;

