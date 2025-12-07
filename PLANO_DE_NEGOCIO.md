# Plano de Negócios: Sistema de Gestão Náutica "Mare Alta"

## 1. Resumo Executivo
O "Mare Alta" é um sistema integrado de gestão (ERP) focado no nicho náutico (Marinas, Oficinas Autorizadas e Estaleiros). O objetivo é profissionalizar a gestão desses negócios, substituindo planilhas e cadernos por uma solução digital moderna, modular e fácil de usar.

O diferencial do produto está na **Estética Premium** (interface moderna e agradável), **Rapidez** (uso intuitivo) e **Especificidade** (ferramentas feitas sob medida para barcos e motores, como a integração Mercury).

---

## 2. Estrutura de Venda em Módulos
A venda modular permite captar clientes de diferentes portes (desde o mecânico autônomo até a grande marina). O cliente paga apenas pelo que precisa.

### Módulo 1: "Gestor Oficina" (Carro Chefe)
*Focado em Oficinas Mecânicas e Assistências Técnicas.*
- **Funcionalidades:**
    - Cadastro de Clientes e Embarcações.
    - Ordem de Serviço (O.S.) Digital: Checklists personalizados, status (Aberto, Em Análise, Aprovado, Em Serviço, Concluído).
    - Histórico de Manutenção: "Prontuário" do barco.
    - Integração Mercury (Consulta de Garantia/Peças).
    - Agendamento de Serviços.

### Módulo 2: "Estoque & Peças"
*Essencial para quem vende peças ou gerencia almoxarifado.*
- **Funcionalidades:**
    - Controle de Estoque (Entradas/Saídas).
    - Curva ABC de peças.
    - Leitor de Código de Barras / QR Code.
    - Alerta de Estoque Mínimo.
    - Requisição de Peças direto na O.S.

### Módulo 3: "Financeiro & Fiscal"
*Para quem quer eliminar o contador externo para tarefas básicas.*
- **Funcionalidades:**
    - Contas a Pagar e Receber.
    - Fluxo de Caixa.
    - Emissão de Notas Fiscais (NFe de Produto e NFSe de Serviço).
    - Integração Bancária (Boleto/Pix).

### Módulo 4: "Marina & Pátio" (Novo - Sugestão)
*Focado na logística de movimentação de barcos.*
- **Funcionalidades:**
    - Mapa Visual do Pátio (Vagas Secas e Molhadas).
    - "Movimentação": Agenda de descida e subida de barcos (Rampa/Forklift).
    - Controle de Consumo (Gelo, Água, Combustível na marina).

### Módulo 5: "CRM & Vendas" (Novo - Sugestão)
*Para lojas de barcos e fidelização.*
- **Funcionalidades:**
    - Funil de Vendas (Leads) para quem vende barcos/motores novos.
    - **Pós-Venda Automatizado**: O sistema avisa o vendedor quando o barco do cliente faz 1 ano ou atinge horas de motor para oferecer revisão (via WhatsApp).
    - Clube de Benefícios.

---

## 3. O Que Precisa Ser Desenvolvido (Gap Analysis)
Para tornar o sistema comercializável e robusto, faltam os seguintes pontos técnicos e funcionais no seu projeto atual:

### A. Funcionalidades Faltantes
1.  **Multi-Empresa (SaaS Puro)**:
    -   Hoje o sistema roda local ou para um único dono. Para vender em escala, o backend Python deve suportar múltiplos `tenant_id` (cada marina tem seus dados isolados).
2.  **App do Mecânico / Tablet**:
    -   Uma versão simplificada da O.S. para o mecânico usar no tablet dentro do barco: tirar fotos do problema, marcar checklist e bater ponto (start/stop no serviço).
3.  **Mapa de Pátio Visual (Drag & Drop)**:
    -   Interface visual para arrastar barcos entre vagas e agendar descidas.
4.  **Emissor Fiscal Real**:
    -   Integrar com uma API de notas fiscais (ex: FocusNFe, eNotas) para emitir notas de verdade.
5.  **Aprovação & Execução:** Cliente aprova, e o sistema gera as Ordens de Serviço individuais para cada terceirizado, mantendo a gestão centralizada.

### B. Melhorias Técnicas
1.  **Autenticação e Perfis de Acesso**:
    -   Definir permissões granulares: "Mecânico" só vê suas O.S., "Gerente" vê financeiro, "Recepcionista" só agendamento.
2.  **Backup em Nuvem**:
    -   Garanta que os dados do cliente nunca sumam.

### Módulo 9: Orçador Inteligente de Revisões ✅ IMPLEMENTADO
*Focado em velocidade e padronização (Mercury / Yamaha / Mercruiser).*
- **Funcionalidades Implementadas:**
    - **✅ Base de Conhecimento de Revisões:** 19 kits pré-cadastrados para Mercury (Verado, Portáteis, MerCruiser, Diesel, SeaPro, OptiMax) e Yamaha.
    - **✅ Orçamento em 1 Clique:** Interface visual onde o mecânico seleciona marca, modelo e intervalo - o sistema gera o orçamento completo automaticamente.
    - **✅ Geração de Pré-Ordem:** Botão que cria a OS completa com todos os itens (peças e mão de obra) já preenchidos.
    - **✅ PDF Profissional:** Exportação de orçamento em PDF pronto para enviar ao cliente, com logo da oficina.
    - **✅ Integração com Estoque:** Baixa automática de peças quando a OS é concluída, com match por Part Number.
    - **✅ Gestão de Preços Inteligente:**
        - Sistema de **edição individual** de peças com cálculo automático de markup (+60%).
        - Ferramenta de **atualização de preços em massa** para aplicar margem personalizada em todo o estoque.
        - 37 peças Mercury/Yamaha pré-cadastradas com SKU, custo e preço organizadas por localização.
    - **✅ Catálogo Mercury:** Vínculo com Part Numbers oficiais para garantir precisão técnica.

**Diferencial Comercial:** Este módulo reduz de 30 minutos para 30 segundos o tempo necessário para criar um orçamento de revisão completo e profissional.

---

## 4. Tabela de Preços Sugerida (Mensalidade/SaaS)
*Valores estimados para o mercado brasileiro.*

| Plano | Módulos Inclusos | Público Alvo | Valor Sugerido |
| :--- | :--- | :--- | :--- |
| **Start** | Oficina (Básico) | Mecânico Autônomo | R$ 149,90 / mês |
| **Pro** | Oficina + Estoque + Financeiro | Oficinas Médias | R$ 399,90 / mês |
| **Marina**| Todos + Módulo Pátio | Marinas Completas | R$ 890,00 / mês |
| **Enterprise**| Personalizado | Grandes Estaleiros | Sob Consulta |

*Adicional*: Cobrar taxa de implantação (setup) de R$ 1.500 a R$ 5.000 para importar dados antigos e treinar a equipe.

---

## 5. Próximos Passos Imediatos
Baseado no progresso atual do projeto:

### ✅ Concluído:
1. ✅ **Backend Python FastAPI:** Infraestrutura multi-tenant preparada (75% completa).
2. ✅ **Orçador de Revisões:** Módulo completo e funcional com 19 kits Mercury/Yamaha.
3. ✅ **Gestão de Preços:** Sistema automático de markup e atualização em massa.

### 🎯 Próximas Prioridades:
1. **Completar Multi-Tenancy (Fase 2 - 25% restante):**
   - Atualizar todos os endpoints CRUD para filtrar por `tenant_id`.
   - Testar isolamento de dados entre tenants.
   
2. **Deploy e Validação:**
   - Fazer deploy da Fase 1 em ambiente de produção/homologação.
   - Coletar feedback de usuários reais (mecânicos e donos de oficina).

3. **Refinar o CRM:**
   - Transformar a tela de CRM em ferramenta automática de WhatsApp (integração com API Z-API ou Twilio).
   - Alertas automáticos de revisão por horas de motor.

4. **Módulo de Pátio (Fase 3):**
   - Desenvolver interface visual de vagas para marinas.
   - Sistema de agendamento de descida/subida de barcos.

**Foco Comercial:** Com a Fase 1 completa, o sistema já está **vendável** para oficinas náuticas que trabalham com Mercury/Yamaha. O diferencial do Orçador Inteligente é um argumento de venda forte.
