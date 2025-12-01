# Testes completos e funcionais para rodar projeto localmente

## Preparação
- [ ] Criar e ativar ambiente virtual Python
- [ ] Instalar dependências via requirements.txt
- [ ] Instalar dependências do Playwright (navegadores, libs) com `python3 -m playwright install --with-deps`
- [ ] Rodar o servidor Flask localmente: `python app_playwright.py`

## Testes Funcionais

### Teste da página inicial
- [ ] Acessar http://127.0.0.1:5000
- [ ] Verificar se a página carrega sem erros visuais
- [ ] Confirmar que o conteúdo da página está correto (formulário de pesquisa)

### Teste POST /pesquisar_preco
- [ ] Enviar requisição POST com item válido (ex: "33395")
- [ ] Confirmar resposta JSON adequada e sem erros

### Teste POST /consultar_garantia
- [ ] Enviar requisição POST com número do motor válido (ex: "2a795367")
- [ ] Confirmar resposta JSON adequada e sem erros

## Testes de Robustez e Erros
- [ ] Testar inputs inválidos para ambos endpoints e avaliar retorno
- [ ] Verificar logs para erros ou exceções durante as operações async

## Finalização
- [ ] Confirmar que não há erros durante todas as operações
- [ ] Realizar screenshots e logs para documentação

Após todos estes passos concluídos com sucesso, o projeto estará validado para execução local.
