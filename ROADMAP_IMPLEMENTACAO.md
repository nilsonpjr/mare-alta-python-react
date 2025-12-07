# Roadmap de Implementação Tática - Mare Alta

Este documento serve como nosso **"Mapa de Controle"** para garantir que o Plano de Negócios seja implementado de forma organizada, sem perder o foco.

**Regra de Ouro:** *Nunca iniciar um Módulo novo sem terminar o anterior (Codificar -> Testar -> Validar).*

---

## 🏁 Fase 1: O "Diferencial Vendedor" ✅ COMPLETA
*Objetivo: Ter uma ferramenta que encante oficinas e mecânicos imediatamente.*

- [x] **Estrutura de Dados dos Kits de Revisão** (Criado em `frontend/types/maintenance.ts` e `data/maintenance_kits.ts`)
- [x] **Tela de Orçador Rápido (UI):** Criar a interface onde o mecânico seleciona "Mercury Verado 300 - 100h" e o orçamento sai pronto.
- [x] **Gerador de Pré-Ordem:** Botão que cria automaticamente a OS com os itens do kit.
- [x] **PDF de Orçamento:** Gerar um PDF profissional com logo da oficina para enviar ao cliente.
- [x] **Baixa de Estoque Real:** Conectar a criação da OS com a redução do `quantity` na tabela de peças (via `partId` matching).

## 🏗 Fase 2: Estrutura SaaS & Backend (Alicerce) - EM ANDAMENTO
*Objetivo: Preparar o sistema para ter múltiplos clientes (Multi-tenancy).*

- [x] **Modelo de Tenant:** Criada tabela `tenants` e modelo SQLAlchemy
- [x] **Adição de tenant_id:** TODAS as tabelas atualizadas com ForeignKey para `tenants`
- [x] **Migração Completa do Banco:** Script `migrate_multi_tenancy.py` criado
- [x] **Login & Autenticação Real:** JWT atualizado com `tenant_id` no payload e validação
- [ ] **Middleware de Tenant:** Filtrar queries automaticamente baseado no tenant (próximo passo)
- [ ] **Atualizar CRUDs:** Adicionar filtro de tenant_id em todos os endpoints

---

## 🤝 Fase 3: Rede de Parceiros & Analista Técnico
*Objetivo: Expandir para gerenciamento de grandes embarcações.*

- [ ] **Cadastro de Parceiros:** Tela para registrar eletricistas, capoteiros, etc., com ranking de avaliação.
- [ ] **Checklist de Inspeção (Mobile):** Interface focada em celular para o Analista marcar problemas no barco.
- [ ] **Gerador de Pré-Ordem:** Ferramenta que agrupa orçamentos de parceiros em uma proposta única para o dono do barco.

## 🌐 Fase 4: Portal do Cliente & CRM
*Objetivo: O cliente final interagir sozinho.*

- [ ] **CRM Ativo:** Robô que verifica datas/horas e manda link de WhatsApp.
- [ ] **Portal Web:** Login para o dono do barco ver suas O.S. e fotos.

---

## 📌 Status Atual
**Módulo em Andamento:** ✅ Fase 1 Concluída! Iniciando Fase 2.
**Próxima Ação:** Migrar backend para Python FastAPI (Multi-tenancy).

---

## 🎯 Como Usar Este Roadmap
1. **Sempre marque [x] quando terminar uma tarefa.**
2. **Nunca pule de fase sem completar a anterior.**
3. **Atualize "Status Atual" após cada sessão de trabalho.**
