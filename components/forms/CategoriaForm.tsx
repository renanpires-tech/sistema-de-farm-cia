import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import type { Categoria } from '../../types';

interface CategoriaFormData {
  nome: string;
  descricao?: string | null;
}

interface CategoriaFormProps {
  onSubmit: (data: CategoriaFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Categoria>;
  isLoading?: boolean;
}

const CategoriaForm: React.FC<CategoriaFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<CategoriaFormData>({
    defaultValues: {
      nome: initialData?.nome || '',
      descricao: initialData?.descricao || null,
    },
  });

  const onSubmitForm: SubmitHandler<CategoriaFormData> = async (data) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nome da Categoria *
        </label>
        <input
          {...register('nome', { required: 'Nome é obrigatório' })}
          type="text"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Analgésico"
        />
        {errors.nome && (
          <p className="text-red-400 text-sm mt-1">{errors.nome.message}</p>
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
          placeholder="Ex: Medicamentos para reduzir inflamações e dores"
          defaultValue={initialData?.descricao || ''}
        />
        <p className="text-xs text-gray-400 mt-1">
          Opcional. Deixe em branco se não houver descrição.
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
};

export default CategoriaForm;

