# Guia de Implantação no Railway.app

Este guia fornece instruções passo a passo para implantar sua aplicação Flask com Playwright no Railway.app gratuitamente.

## Pré-requisitos

1. **Conta no GitHub**: Se você ainda não tem, crie uma em [github.com](https://github.com)
2. **Conta no Railway.app**: Acesse [railway.app](https://railway.app) e crie uma conta (recomendado usar sua conta do GitHub para login)
3. **Git instalado**: Verifique se o Git está instalado no seu MacBook executando `git --version` no terminal

## Passo 1: Preparar o Repositório no GitHub

### 1.1. Criar um novo repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito e selecione **"New repository"**
3. Dê um nome ao repositório (ex: `mercury-marine-app`)
4. Deixe o repositório como **Public** (necessário para o plano gratuito do Railway)
5. **NÃO** inicialize o repositório com README, .gitignore ou licença (já temos esses arquivos)
6. Clique em **"Create repository"**

### 1.2. Fazer upload do código para o GitHub

No terminal do seu MacBook, navegue até a pasta do projeto `teste_mercury`:

```bash
cd ~/teste_mercury
```

Inicialize o repositório Git local:

```bash
git init
```

Adicione todos os arquivos ao repositório:

```bash
git add .
```

Faça o primeiro commit:

```bash
git commit -m "Initial commit - Flask app with Playwright"
```

Conecte seu repositório local ao repositório remoto do GitHub (substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub e `mercury-marine-app` pelo nome do seu repositório):

```bash
git remote add origin https://github.com/SEU_USUARIO/mercury-marine-app.git
```

Envie o código para o GitHub:

```bash
git branch -M main
git push -u origin main
```

Se solicitado, faça login com suas credenciais do GitHub.

## Passo 2: Implantar no Railway.app

### 2.1. Criar um novo projeto no Railway

1. Acesse [railway.app](https://railway.app) e faça login
2. No painel principal, clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Se for a primeira vez, o Railway solicitará permissão para acessar seus repositórios do GitHub. Clique em **"Configure GitHub App"** e autorize o acesso
5. Selecione o repositório `mercury-marine-app` (ou o nome que você deu)
6. Clique em **"Deploy Now"**

### 2.2. Configurar o projeto no Railway

O Railway detectará automaticamente o `Dockerfile` e começará a construir a imagem. Isso pode levar alguns minutos.

**Importante**: Verifique se o Railway está usando o Dockerfile:

1. No painel do projeto, clique na aba **"Settings"**
2. Role até a seção **"Build"**
3. Certifique-se de que o **"Builder"** está configurado como **"Dockerfile"**

### 2.3. Configurar variáveis de ambiente (se necessário)

Se sua aplicação precisar de variáveis de ambiente (como credenciais de login), você pode configurá-las:

1. No painel do projeto, clique na aba **"Variables"**
2. Adicione as variáveis necessárias

**Nota**: No código atual, o login e senha estão hardcoded. Para produção, é recomendável movê-los para variáveis de ambiente.

### 2.4. Obter a URL da aplicação

1. Após a implantação ser concluída, clique na aba **"Settings"**
2. Role até a seção **"Domains"**
3. Clique em **"Generate Domain"** para obter uma URL pública
4. A URL será algo como: `https://seu-projeto.up.railway.app`

## Passo 3: Testar a Aplicação

1. Acesse a URL gerada pelo Railway no seu navegador
2. Teste a funcionalidade de **Pesquisar Preço** com o item `33395`
3. Teste a funcionalidade de **Consultar Garantia** com o número do motor `2a795367`

## Solução de Problemas

### A aplicação não inicia ou apresenta erros

1. Verifique os logs no Railway:
   - No painel do projeto, clique na aba **"Deployments"**
   - Clique no deployment mais recente
   - Verifique os logs para identificar erros

### Erro relacionado ao Playwright

Se houver erros relacionados ao Playwright (como navegador não encontrado), verifique se o `Dockerfile` está instalando corretamente as dependências:

```dockerfile
RUN python3 -m playwright install --with-deps
```

### Limites do plano gratuito

O Railway oferece um plano gratuito com limites de:
- **500 horas de execução por mês**
- **$5 de crédito por mês**

Se sua aplicação ultrapassar esses limites, você precisará considerar um plano pago ou otimizar o uso.

## Atualizações Futuras

Para atualizar a aplicação no Railway após fazer alterações no código:

1. Faça as alterações localmente
2. Adicione e commit as alterações:
   ```bash
   git add .
   git commit -m "Descrição das alterações"
   ```
3. Envie para o GitHub:
   ```bash
   git push
   ```
4. O Railway detectará automaticamente as alterações e fará um novo deploy

## Observações Importantes

1. **Segurança**: O login e senha estão hardcoded no código. Para produção, mova-os para variáveis de ambiente.
2. **Performance**: O Playwright pode consumir recursos significativos. Monitore o uso no Railway para evitar ultrapassar os limites do plano gratuito.
3. **Timeout**: Certifique-se de que o Railway está configurado com um timeout adequado para as operações do Playwright (que podem levar alguns segundos).

## Suporte

Se você encontrar problemas durante a implantação, consulte:
- [Documentação do Railway](https://docs.railway.app/)
- [Documentação do Playwright](https://playwright.dev/python/)

---

**Boa sorte com a implantação!** 🚀
