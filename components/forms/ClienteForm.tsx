import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import type { Cliente } from '../../types';

interface ClienteFormData {
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  dataNascimento: string;
}

interface ClienteFormProps {
  onSubmit: (data: ClienteFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Cliente>;
  isLoading?: boolean;
}

const ClienteForm: React.FC<ClienteFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ClienteFormData>({
    defaultValues: initialData ? {
      ...initialData,
      dataNascimento: initialData.dataNascimento?.split('T')[0],
    } : {},
  });

  const onSubmitForm: SubmitHandler<ClienteFormData> = async (data) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nome Completo *
        </label>
        <input
          {...register('nome', { required: 'Nome é obrigatório' })}
          type="text"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: João Silva"
        />
        {errors.nome && (
          <p className="text-red-400 text-sm mt-1">{errors.nome.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CPF *
          </label>
          <input
            {...register('cpf', {
              required: 'CPF é obrigatório',
              pattern: {
                value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                message: 'CPF inválido (formato: 000.000.000-00)',
              },
            })}
            type="text"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="000.000.000-00"
          />
          {errors.cpf && (
            <p className="text-red-400 text-sm mt-1">{errors.cpf.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data de Nascimento *
          </label>
          <input
            {...register('dataNascimento', { required: 'Data de nascimento é obrigatória' })}
            type="date"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.dataNascimento && (
            <p className="text-red-400 text-sm mt-1">{errors.dataNascimento.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            E-mail *
          </label>
          <input
            {...register('email', {
              required: 'E-mail é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'E-mail inválido',
              },
            })}
            type="email"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="exemplo@email.com"
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefone
          </label>
          <input
            {...register('telefone', {
              pattern: {
                value: /^[\d\s\(\)\-]+$/,
                message: 'Telefone inválido',
              },
            })}
            type="text"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(00) 00000-0000"
          />
          {errors.telefone && (
            <p className="text-red-400 text-sm mt-1">{errors.telefone.message}</p>
          )}
        </div>
      </div>

      <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
        <p className="text-blue-400 text-xs">
          ⚠️ Cliente deve ter mais de 18 anos para realizar compras
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

export default ClienteForm;

