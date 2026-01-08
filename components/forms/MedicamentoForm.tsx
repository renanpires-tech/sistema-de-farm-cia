import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import type { Medicamento, Categoria } from '../../types';

interface MedicamentoFormData {
  nome: string;
  dosagem: string;
  descricao?: string;
  preco: number;
  quantidadeEstoque: number;
  dataValidade: string;
  categoriaId: number;
  ativo: boolean;
}

interface MedicamentoFormProps {
  onSubmit: (data: MedicamentoFormData) => Promise<void>;
  onCancel: () => void;
  categorias: Categoria[];
  initialData?: Partial<Medicamento>;
  isLoading?: boolean;
}

const MedicamentoForm: React.FC<MedicamentoFormProps> = ({
  onSubmit,
  onCancel,
  categorias,
  initialData,
  isLoading = false,
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<MedicamentoFormData>({
    defaultValues: initialData ? {
      nome: initialData.nome || '',
      dosagem: initialData.dosagem || '',
      descricao: initialData.descricao || '',
      preco: initialData.preco || 0,
      quantidadeEstoque: initialData.estoque || 0,
      dataValidade: initialData.dataValidade ? initialData.dataValidade.split('T')[0] : '',
      categoriaId: initialData.categoria?.id || 0,
      ativo: initialData.ativo !== undefined ? initialData.ativo : true,
    } : {
      ativo: true,
      dosagem: '',
    },
  });

  const onSubmitForm: SubmitHandler<MedicamentoFormData> = async (data) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nome *
        </label>
        <input
          {...register('nome', { required: 'Nome é obrigatório' })}
          type="text"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Paracetamol"
        />
        {errors.nome && (
          <p className="text-red-400 text-sm mt-1">{errors.nome.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Dosagem *
        </label>
        <input
          {...register('dosagem', { required: 'Dosagem é obrigatória' })}
          type="text"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: 500mg"
        />
        {errors.dosagem && (
          <p className="text-red-400 text-sm mt-1">{errors.dosagem.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Descrição
        </label>
        <textarea
          {...register('descricao')}
          rows={3}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Descrição do medicamento (opcional)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preço (R$) *
          </label>
          <input
            {...register('preco', {
              required: 'Preço é obrigatório',
              min: { value: 0.01, message: 'Preço deve ser maior que zero' },
            })}
            type="number"
            step="0.01"
            min="0.01"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
          {errors.preco && (
            <p className="text-red-400 text-sm mt-1">{errors.preco.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quantidade em Estoque *
          </label>
          <input
            {...register('quantidadeEstoque', {
              required: 'Quantidade é obrigatória',
              min: { value: 0, message: 'Quantidade não pode ser negativa' },
            })}
            type="number"
            min="0"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
          {errors.quantidadeEstoque && (
            <p className="text-red-400 text-sm mt-1">{errors.quantidadeEstoque.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data de Validade *
          </label>
          <input
            {...register('dataValidade', {
              required: 'Data de validade é obrigatória',
              validate: (value) => {
                const date = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date > today || 'Data de validade deve ser futura';
              },
            })}
            type="date"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.dataValidade && (
            <p className="text-red-400 text-sm mt-1">{errors.dataValidade.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Categoria *
          </label>
          <select
            {...register('categoriaId', { 
              required: 'Categoria é obrigatória',
              valueAsNumber: true,
            })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={initialData?.categoria?.id || undefined}
          >
            <option value="">Selecione uma categoria</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
          {errors.categoriaId && (
            <p className="text-red-400 text-sm mt-1">{errors.categoriaId.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center">
        <input
          {...register('ativo')}
          type="checkbox"
          id="ativo"
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="ativo" className="ml-2 text-sm text-gray-300">
          Medicamento ativo
        </label>
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
};

export default MedicamentoForm;

