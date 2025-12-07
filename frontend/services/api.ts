import axios from 'axios';
import {
    User, ServiceOrder, Part, StockMovement, Client, Boat, Marina,
    ServiceOrderCreate, ServiceItemCreate, OrderNoteCreate, ServiceOrderUpdate,
    PartCreate, PartUpdate, StockMovementCreate,
    TransactionCreate, Transaction,
    Manufacturer, Model, CompanyInfo,
    BoatCreate, BoatUpdate
} from '../types';

/**
 * Este arquivo define o serviço de API para interagir com o backend.
 * Ele usa Axios para fazer requisições HTTP e inclui um interceptor
 * para adicionar o token JWT em todas as requisições autenticadas.
 */

// Define a URL base da API.
// Em produção, usa o caminho relativo '/api' (assumindo que o frontend é servido pelo backend).
// Em desenvolvimento, usa 'http://localhost:8000/api' para se conectar ao backend local.
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000/api';

// Cria uma instância do Axios com a URL base e cabeçalhos padrão.
console.log('API_URL:', API_URL); // Debug: Check which API URL is being used
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json', // Define o tipo de conteúdo padrão para JSON.
    },
});

// Interceptor para adicionar o token JWT (JSON Web Token) a cada requisição.
// Isso é essencial para rotas que exigem autenticação.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // Obtém o token armazenado no localStorage.
    if (token) {
        // Se um token existir, adiciona o cabeçalho Authorization no formato "Bearer token".
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Retorna a configuração da requisição modificada.
});

// Objeto que contém todos os métodos para interagir com a API do backend.
export const ApiService = {
    // --- AUTH (Autenticação) ---
    /**
     * Realiza o login do usuário.
     * @param email O email do usuário.
     * @param password A senha do usuário.
     * @returns Os dados da resposta do login, incluindo o token de acesso.
     */
    login: async (email: string, password: string) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        const response = await api.post('/auth/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded' // Tipo de conteúdo específico para login via formulário.
            }
        });
        // O backend retorna camelCase devido ao alias_generator do Pydantic.
        const token = response.data.accessToken || response.data.access_token;
        localStorage.setItem('token', token); // Armazena o token no localStorage.
        return response.data;
    },

    /**
     * Obtém os dados do usuário atualmente autenticado.
     * @returns Os dados do usuário.
     */
    getMe: async () => {
        const response = await api.get<User>('/auth/me');
        return response.data;
    },

    /**
     * Realiza o logout do usuário, removendo o token do localStorage.
     */
    logout: () => {
        localStorage.removeItem('token');
    },

    // --- ORDERS (Ordens de Serviço) ---
    /**
     * Obtém uma lista de ordens de serviço.
     * @param status Opcional: filtra as ordens por status.
     * @returns Uma lista de ordens de serviço.
     */
    getOrders: async (status?: string) => {
        const params = status ? { status } : {};
        const response = await api.get<ServiceOrder[]>('/orders', { params });
        return response.data;
    },

    /**
     * Obtém uma ordem de serviço específica pelo ID.
     * @param id O ID da ordem de serviço.
     * @returns A ordem de serviço.
     */
    getOrder: async (id: number) => {
        const response = await api.get<ServiceOrder>(`/orders/${id}`);
        return response.data;
    },

    /**
     * Cria uma nova ordem de serviço.
     * @param order Os dados da ordem de serviço a ser criada.
     * @returns A ordem de serviço criada.
     */
    createOrder: async (order: ServiceOrderCreate) => {
        const response = await api.post<ServiceOrder>('/orders', order);
        return response.data;
    },

    /**
     * Atualiza uma ordem de serviço existente.
     * @param id O ID da ordem de serviço a ser atualizada.
     * @param order Os dados de atualização da ordem de serviço.
     * @returns A ordem de serviço atualizada.
     */
    updateOrder: async (id: number, order: ServiceOrderUpdate) => {
        const response = await api.put<ServiceOrder>(`/orders/${id}`, order);
        return response.data;
    },

    /**
     * Adiciona um item a uma ordem de serviço.
     * @param orderId O ID da ordem de serviço.
     * @param item Os dados do item a ser adicionado.
     * @returns A ordem de serviço atualizada com o novo item.
     */
    addOrderItem: async (orderId: number, item: ServiceItemCreate) => {
        const response = await api.post<ServiceOrder>(`/orders/${orderId}/items`, item);
        return response.data;
    },

    /**
     * Adiciona uma nota a uma ordem de serviço.
     * @param orderId O ID da ordem de serviço.
     * @param note Os dados da nota a ser adicionada.
     * @returns A nota adicionada.
     */
    addOrderNote: async (orderId: number, note: OrderNoteCreate) => {
        const response = await api.post(`/orders/${orderId}/notes`, note);
        return response.data;
    },

    /**
     * Completa uma ordem de serviço.
     * @param id O ID da ordem de serviço a ser completada.
     * @returns A ordem de serviço completada.
     */
    completeOrder: async (id: number) => {
        const response = await api.put<ServiceOrder>(`/orders/${id}/complete`);
        return response.data;
    },

    // --- INVENTORY (Inventário) ---
    /**
     * Obtém uma lista de todas as peças em estoque.
     * @returns Uma lista de peças.
     */
    getParts: async () => {
        const response = await api.get<Part[]>('/inventory/parts');
        return response.data;
    },

    /**
     * Obtém uma peça específica pelo ID.
     * @param id O ID da peça.
     * @returns A peça.
     */
    getPart: async (id: number) => {
        const response = await api.get<Part>(`/inventory/parts/${id}`);
        return response.data;
    },

    /**
     * Cria uma nova peça no estoque.
     * @param part Os dados da peça a ser criada.
     * @returns A peça criada.
     */
    createPart: async (part: PartCreate) => {
        const response = await api.post<Part>('/inventory/parts', part);
        return response.data;
    },

    /**
     * Atualiza uma peça existente.
     * @param id O ID da peça a ser atualizada.
     * @param part Os dados de atualização da peça.
     * @returns A peça atualizada.
     */
    updatePart: async (id: number, part: PartUpdate) => {
        const response = await api.put<Part>(`/inventory/parts/${id}`, part);
        return response.data;
    },

    /**
     * Obtém o histórico de movimentações de estoque.
     * @param partId Opcional: filtra as movimentações por ID da peça.
     * @returns Uma lista de movimentações de estoque.
     */
    getMovements: async (partId?: number) => {
        const params = partId ? { part_id: partId } : {};
        const response = await api.get<StockMovement[]>('/inventory/movements', { params });
        return response.data;
    },

    /**
     * Cria uma nova movimentação de estoque.
     * @param movement Os dados da movimentação a ser criada.
     * @returns A movimentação de estoque criada.
     */
    createMovement: async (movement: StockMovementCreate) => {
        const response = await api.post<StockMovement>('/inventory/movements', movement);
        return response.data;
    },

    // --- CLIENTS & BOATS (Clientes e Embarcações) ---
    /**
     * Obtém uma lista de todos os clientes.
     * @returns Uma lista de clientes.
     */
    getClients: async () => {
        const response = await api.get<Client[]>('/clients');
        return response.data;
    },

    /**
     * Obtém uma lista de embarcações.
     * @param clientId Opcional: filtra as embarcações por ID do cliente.
     * @returns Uma lista de embarcações.
     */
    getBoats: async (clientId?: number) => {
        const params = clientId ? { client_id: clientId } : {};
        const response = await api.get<Boat[]>('/boats', { params });
        return response.data;
    },

    /**
     * Cria uma nova embarcação.
     * @param boat Os dados da embarcação a ser criada.
     * @returns A embarcação criada.
     */
    createBoat: async (boat: BoatCreate) => {
        const response = await api.post<Boat>('/boats', boat);
        return response.data;
    },

    /**
     * Atualiza uma embarcação existente.
     * @param id O ID da embarcação a ser atualizada.
     * @param boat Os dados de atualização da embarcação.
     * @returns A embarcação atualizada.
     */
    updateBoat: async (id: number, boat: BoatUpdate) => {
        const response = await api.put<Boat>(`/boats/${id}`, boat);
        return response.data;
    },

    // --- FISCAL ---
    /**
     * Emite uma nota fiscal.
     * @param invoiceData Os dados da nota fiscal.
     * @returns A resposta da emissão da nota fiscal.
     */
    emitFiscalInvoice: async (invoiceData: any) => {
        const response = await api.post('/fiscal/emit', invoiceData);
        return response.data;
    },

    // --- MERCURY ---
    /**
     * Pesquisa um produto no portal Mercury Marine.
     * @param code O código ou descrição do produto.
     * @returns Os resultados da pesquisa de produtos.
     */
    searchMercuryProduct: async (code: string) => {
        const response = await api.get(`/mercury/search/${encodeURIComponent(code)}`);
        return response.data;
    },

    /**
     * Obtém informações de garantia de um motor Mercury.
     * @param serial O número de série do motor.
     * @returns Os dados da garantia.
     */
    getMercuryWarranty: async (serial: string) => {
        const response = await api.get(`/mercury/warranty/${encodeURIComponent(serial)}`);
        return response.data;
    },

    // --- TRANSACTIONS (Transações Financeiras) ---
    /**
     * Obtém uma lista de todas as transações financeiras.
     * @returns Uma lista de transações.
     */
    getTransactions: async () => {
        const response = await api.get<Transaction[]>('/transactions');
        return response.data;
    },

    /**
     * Cria uma nova transação financeira.
     * @param transaction Os dados da transação a ser criada.
     * @returns A transação criada.
     */
    createTransaction: async (transaction: TransactionCreate) => {
        const response = await api.post<Transaction>('/transactions', transaction);
        return response.data;
    },

    // --- CONFIGURATION (Configuração) ---
    /**
     * Obtém uma lista de fabricantes.
     * @param type Opcional: filtra os fabricantes por tipo ('BOAT' ou 'ENGINE').
     * @returns Uma lista de fabricantes.
     */
    getManufacturers: async (type?: 'BOAT' | 'ENGINE') => {
        const params = type ? { type } : {};
        const response = await api.get<Manufacturer[]>('/config/manufacturers', { params });
        return response.data;
    },

    /**
     * Cria um novo fabricante.
     * @param manufacturer Os dados do fabricante a ser criado.
     * @returns O fabricante criado.
     */
    createManufacturer: async (manufacturer: Omit<Manufacturer, 'id' | 'models'>) => {
        const response = await api.post<Manufacturer>('/config/manufacturers', manufacturer);
        return response.data;
    },

    // Adicionei esta função para buscar modelos diretamente, caso seja necessário sem um fabricante específico.
    // Embora a API de backend não tenha um endpoint direto para isso sem manufacturer_id,
    // o crud.get_manufacturers já traz os modelos. Este método seria para um futuro endpoint /config/models.
    /**
     * Obtém uma lista de modelos, opcionalmente filtrados por ID do fabricante.
     * OBS: O endpoint do backend retorna fabricantes com seus modelos aninhados.
     * Esta função assume um endpoint futuro para buscar modelos diretamente.
     * @param manufacturerId Opcional: filtra os modelos por ID do fabricante.
     * @returns Uma lista de modelos.
     */
    getModels: async (manufacturerId?: number) => {
        const params = manufacturerId ? { manufacturer_id: manufacturerId } : {};
        // Nota: Atualmente, o backend não tem um endpoint /config/models direto.
        // A busca de modelos é feita através do getManufacturers.
        // Este é um placeholder para um endpoint futuro ou uma adaptação se necessário.
        const response = await api.get<Model[]>('/config/models', { params });
        return response.data;
    },

    /**
     * Cria um novo modelo.
     * @param model Os dados do modelo a ser criado.
     * @returns O modelo criado.
     */
    createModel: async (model: Omit<Model, 'id'>) => {
        // A rota correta para criar modelos é /manufacturers/{id}/models no backend.
        // É necessário adaptar esta chamada para passar o manufacturerId corretamente.
        // Por agora, assumindo que `model` já contém `manufacturerId` ou que a API irá inferir.
        // A chamada ideal seria: api.post(`/config/manufacturers/${model.manufacturerId}/models`, model);
        const response = await api.post<Model>('/config/models', model);
        return response.data;
    },

    /**
     * Obtém as informações da empresa.
     * @returns As informações da empresa.
     */
    getCompanyInfo: async () => {
        const response = await api.get<CompanyInfo>('/config/company');
        return response.data;
    },

    /**
     * Atualiza as informações da empresa.
     * @param info As informações da empresa a serem atualizadas.
     * @returns As informações da empresa atualizadas.
     */
    updateCompanyInfo: async (info: CompanyInfo) => {
        const response = await api.put<CompanyInfo>('/config/company', info);
        return response.data;
    },
};
