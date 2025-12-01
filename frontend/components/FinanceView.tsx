import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionCreate } from '../types'; // Importa as definições de tipo para transações.
import { ApiService } from '../services/api'; // Importa o serviço de API para comunicação com o backend.
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, 
  Search, FileText, Calendar, ArrowUpRight, ArrowDownRight 
} from 'lucide-react'; // Ícones para a interface.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'; // Componentes para gráficos (atualmente não utilizados no JSX, mas importados).

/**
 * FinanceView (Visão Financeira)
 * Componente React para gerenciar e visualizar transações financeiras.
 * Inclui a exibição de KPIs (Receitas, Despesas, Saldo) e permite o lançamento manual de novas transações.
 */
export const FinanceView: React.FC = () => {
  // --- Variáveis de Estado ---
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Lista de transações financeiras carregadas do backend.
  const [searchTerm, setSearchTerm] = useState(''); // Termo de busca para filtrar a lista de transações.
  const [isModalOpen, setIsModalOpen] = useState(false); // Controla a visibilidade do modal de "Novo Lançamento".
  const [newTransaction, setNewTransaction] = useState<TransactionCreate>({
    type: 'EXPENSE', // Tipo padrão para nova transação (Despesa).
    date: new Date().toISOString().split('T')[0], // Data padrão: hoje.
    status: 'PAID', // Status padrão: Pago.
    category: '', // Categoria vazia.
    description: '', // Descrição vazia.
    amount: 0, // Valor inicial zero.
  });

  /**
   * KPI (Key Performance Indicators) - Indicadores Chave de Performance.
   * Calcula as receitas totais, despesas totais, saldo e valor pendente
   * com base nas transações atuais. Re-calculado apenas quando 'transactions' muda.
   */
  const kpi = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'INCOME') // Filtra transações de receita.
      .reduce((acc, curr) => acc + curr.amount, 0); // Soma os valores.
    
    const expense = transactions
      .filter(t => t.type === 'EXPENSE') // Filtra transações de despesa.
      .reduce((acc, curr) => acc + curr.amount, 0); // Soma os valores.

    const pending = transactions
      .filter(t => t.status === 'PENDING') // Filtra transações com status 'PENDING'.
      .reduce((acc, curr) => acc + curr.amount, 0); // Soma os valores.

    return { income, expense, balance: income - expense, pending };
  }, [transactions]); // Depende da lista de transações.

  /**
   * Função assíncrona para buscar as transações financeiras do backend.
   * Atualiza o estado `transactions` com os dados recebidos.
   */
  const fetchTransactions = async () => {
    try {
      const data = await ApiService.getTransactions(); // Chama o serviço de API para obter as transações.
      setTransactions(data); // Atualiza o estado com as transações.
    } catch (error) {
      console.error("Falha ao buscar transações", error);
      // Em uma aplicação real, aqui seria exibida uma notificação de erro para o usuário.
    }
  };

  /**
   * Hook useEffect: Executa `fetchTransactions` uma única vez após a montagem inicial do componente.
   * O array de dependências vazio (`[]`) garante que o efeito não será re-executado em re-renderizações subsequentes.
   */
  useEffect(() => {
    fetchTransactions();
  }, []);

  /**
   * Lida com o salvamento de uma nova transação.
   * Valida os campos obrigatórios e chama a API para criar a transação.
   * Após salvar, recarrega as transações e fecha o modal.
   */
  const handleSave = async () => {
    // Validação básica dos campos obrigatórios.
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.date) {
      alert("Por favor, preencha a descrição, o valor e a data da transação.");
      return;
    }

    try {
      await ApiService.createTransaction(newTransaction); // Chama a API para criar a transação.
      fetchTransactions(); // Recarrega a lista de transações para incluir a recém-criada.
      setIsModalOpen(false); // Fecha o modal de lançamento.
      // Reseta o formulário de nova transação para os valores padrão.
      setNewTransaction({
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        status: 'PAID',
        category: '',
        description: '',
        amount: 0,
      });
    } catch (error) {
      console.error("Falha ao salvar transação", error);
      // Em uma aplicação real, aqui seria exibida uma notificação de erro para o usuário.
      alert("Erro ao salvar transação. Tente novamente.");
    }
  };

  /**
   * Variável memoizada que filtra a lista de transações com base no termo de busca.
   * A busca é insensível a maiúsculas/minúsculas e verifica descrição, número de documento e categoria.
   */
  const filteredTransactions = useMemo(() => transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ), [transactions, searchTerm]);

  // --- Renderização do Componente (JSX) ---
  // A estrutura JSX define a interface do usuário do componente FinanceView.
  return (
    <div className="p-8">
      {/* Cabeçalho da página com título e botão para adicionar novo lançamento */}
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Financeiro</h2>
           <p className="text-slate-500 text-sm">Controle de Entradas e Saídas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} // Abre o modal de novo lançamento.
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Lançamento Manual
        </button>
      </div>

      {/* Cartões KPI (Key Performance Indicators) - Receitas, Despesas e Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Cartão de Receitas Totais */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <TrendingUp className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase">Receitas Totais</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">R$ {kpi.income.toFixed(2)}</p>
        </div>

        {/* Cartão de Despesas Totais */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <TrendingDown className="w-16 h-16 text-red-600" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase">Despesas Totais</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">R$ {kpi.expense.toFixed(2)}</p>
        </div>

        {/* Cartão de Saldo Líquido (Receitas - Despesas) */}
        <div className={`p-6 rounded-xl shadow-sm border relative overflow-hidden ${kpi.balance >= 0 ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white border-transparent' : 'bg-white border-slate-200 text-red-600'}`}>
           <div className="absolute top-0 right-0 p-4 opacity-20">
             <DollarSign className="w-16 h-16 text-white" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${kpi.balance >= 0 ? 'bg-white/20' : 'bg-red-100'}`}>
              <DollarSign className={`w-5 h-5 ${kpi.balance >= 0 ? 'text-white' : 'text-red-600'}`} />
            </div>
            <span className={`text-sm font-bold uppercase ${kpi.balance >= 0 ? 'text-cyan-100' : 'text-slate-500'}`}>Saldo Líquido</span>
          </div>
          <p className="text-3xl font-bold">R$ {kpi.balance.toFixed(2)}</p>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50">
          {/* Campo de busca para filtrar a lista de transações */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar lançamento, categoria ou NF..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Transações */}
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Categoria / NF</th>
              <th className="px-6 py-4 text-center">Tipo</th>
              <th className="px-6 py-4 text-right">Valor</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Exibe uma mensagem se não houver transações filtradas, caso contrário, mapeia as transações */}
            {filteredTransactions.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhum lançamento encontrado.</td>
                </tr>
            ) : filteredTransactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    {new Date(t.date).toLocaleDateString('pt-BR')} {/* Formata a data para o padrão brasileiro */}
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                    {t.description}
                    {t.orderId && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">AUTO</span>} {/* Indica transações automáticas */}
                </td>
                <td className="px-6 py-4 text-slate-600">
                    <div className="flex flex-col">
                        <span>{t.category}</span>
                        {t.documentNumber && <span className="text-xs text-slate-400">NF: {t.documentNumber}</span>}
                    </div>
                </td>
                <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {t.type === 'INCOME' ? 'ENTRADA' : 'SAÍDA'}
                    </span>
                </td>
                <td className={`px-6 py-4 text-right font-bold ${
                    t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                    {t.type === 'EXPENSE' ? '-' : '+'} R$ {t.amount.toFixed(2)} {/* Exibe o valor formatado */}
                </td>
                <td className="px-6 py-4 text-center">
                  {t.status === 'PAID' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <FileText className="w-3 h-3" /> Pago
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                      <Calendar className="w-3 h-3" /> Pendente
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Novo Lançamento Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-bold mb-4">Novo Lançamento</h3>
            
            <div className="grid grid-cols-2 gap-4">
               {/* Opção de seleção de Tipo (Despesa/Receita) */}
               <div className="col-span-2 flex gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="type" 
                        checked={newTransaction.type === 'EXPENSE'}
                        onChange={() => setNewTransaction({...newTransaction, type: 'EXPENSE'})}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="font-medium text-red-700 bg-red-50 px-3 py-1 rounded">Despesa (Saída)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="type" 
                        checked={newTransaction.type === 'INCOME'}
                        onChange={() => setNewTransaction({...newTransaction, type: 'INCOME'})}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded">Receita (Entrada)</span>
                  </label>
               </div>

              {/* Campo para Descrição */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-slate-200 outline-none bg-white text-slate-900"
                  placeholder="Ex: Compra de peças, Conta de Luz"
                  value={newTransaction.description || ''}
                  onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                />
              </div>

              {/* Campo para Categoria com datalist de sugestões */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Categoria</label>
                <input 
                    type="text" 
                    list="categories"
                    className="w-full p-2 border rounded bg-white text-slate-900"
                    value={newTransaction.category || ''}
                    onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                />
                <datalist id="categories">
                    <option value="Peças / Estoque" />
                    <option value="Serviços" />
                    <option value="Infraestrutura" />
                    <option value="Impostos" />
                    <option value="Pessoal" />
                </datalist>
              </div>

              {/* Campo para Valor */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={newTransaction.amount || ''}
                  onChange={e => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                />
              </div>

              {/* Campo para Data */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Data</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={newTransaction.date}
                  onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                />
              </div>

              {/* Campo para Número do Documento / NF */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nº Documento / NF</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded bg-white text-slate-900"
                  value={newTransaction.documentNumber || ''}
                  onChange={e => setNewTransaction({...newTransaction, documentNumber: e.target.value})}
                />
              </div>
            </div>

            {/* Botões de ação do Modal */}
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)} // Fecha o modal ao cancelar.
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} // Salva o lançamento ao clicar.
                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700"
              >
                Salvar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};