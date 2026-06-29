# 🚀 Setup Local

Como rodar FinFlow no seu computador.

---

## 📋 Pré-requisitos

- **Node.js:** v18+ (testar com `node --version`)
- **npm:** v9+ (vem com Node)
- **Git:** Para clonar repo
- **Conta Supabase:** Projeto já criado
- **VS Code (ou editor):** Para editar código

---

## 🔧 Passo 1: Clonar Repositório

```bash
git clone https://github.com/seu-usuario/pixel-perfect-clone-77516.git
cd pixel-perfect-clone-77516
```

---

## 🔧 Passo 2: Instalar Dependências

```bash
npm install
```

**O que acontece:**
- Baixa ~500MB de packages
- Instala React, TanStack, Tailwind, etc.
- Cria pasta `node_modules/`

**Tempo:** ~3 minutos (primeira vez)

---

## 🔧 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar arquivo `.env.local`

```bash
cp .env.example .env.local
```

### 3.2 Obter valores Supabase

Acesse [supabase.com/dashboard](https://supabase.com/dashboard):

1. Selecione projeto FinFlow
2. Settings (engrenagem) → API
3. Copy:
   - **URL** → `VITE_SUPABASE_URL` e `SUPABASE_URL`
   - **Publishable Key (anon)** → `VITE_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_PUBLISHABLE_KEY`
   - **Secret Key** → `SUPABASE_SECRET_KEY`

### 3.3 Preencher `.env.local`

```bash
# .env.local
VITE_SUPABASE_URL=https://jtpizybfydlhxbpjenry.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://jtpizybfydlhxbpjenry.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Importante:**
- `.env.local` está em `.gitignore` (não será commitado)
- Nunca compartilhe SUPABASE_SECRET_KEY

---

## 🔧 Passo 4: Rodar Desenvolvimento

```bash
npm run dev
```

**Output esperado:**
```
Local:        http://localhost:5173/
Press 'h' to show help
```

**O que acontece:**
- Vite inicia dev server
- Compila TypeScript
- Hot reload habilitado (mudanças aparecem sem reload manual)

**Acesse:** Abra [http://localhost:5173](http://localhost:5173) no browser

---

## ✅ Verificação

### Teste 1: Página carrega

```
Esperado: Landing page com "FinFlow — Gestão Financeira"
Se erro: Verifique console (F12) para mensagens
```

### Teste 2: Signup funciona

```
1. Clique "Entrar"
2. Clique "Criar conta"
3. Preencha: Nome, Email, Senha (min 8)
4. Clique "Criar"
5. ✅ Deve fazer signup e redirect para login
```

### Teste 3: Login funciona

```
1. Clique "Entrar"
2. Preencha: Email, Senha
3. Clique "Entrar"
4. ✅ Deve fazer login e ir para onboarding
5. Complete onboarding
6. ✅ Deve ver dashboard
```

### Teste 4: Dashboard

```
1. Logado, em /dashboard
2. Deve ver: Contas, Saldos, Transações vazias
3. ✅ Se vê, tudo funcionando
```

---

## 🛠️ Comandos úteis

| Comando | Função |
|---------|--------|
| `npm run dev` | Inicia dev server (http://localhost:5173) |
| `npm run build` | Build produção (otimizado) |
| `npm run preview` | Preview do build produção |
| `npm run lint` | Verificar erros de style (ESLint) |
| `npm run format` | Formatar código (Prettier) |
| `npm run tsc` | Type-check sem build |

---

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variable"

**Causa:** `.env.local` não foi criado ou valores faltando

**Solução:**
```bash
ls -la .env.local  # Verificar que existe
cat .env.local     # Verificar que tem VITE_SUPABASE_URL
npm run dev        # Reiniciar
```

### Erro: "Cannot find module '@/lib/queries'"

**Causa:** Path alias não configurado

**Solução:**
```bash
rm -rf node_modules/.vite
npm install
npm run dev
```

### Erro: "Supabase.auth.signUp is not a function"

**Causa:** Client Supabase não inicializou

**Solução:**
```bash
# Verificar que VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY existem
cat .env.local | grep VITE_SUPABASE

# Se faltam, adicionar e reiniciar
npm run dev
```

### Signup/Login falha silenciosamente

**Causa:** Erro de rede ou chaves inválidas

**Solução:**
```bash
# Abrir DevTools (F12) → Network → Ver requisição para auth/v1/signup
# Verificar status (deve ser 200)
# Se 400+, copiar resposta e verificar erro

# Regenerar chaves Supabase se necessário:
# Dashboard → Settings → API → Regenerate
```

---

## 📊 Estrutura após npm install

```
node_modules/          # ~500MB, NÃO COMITAR
  ├─ react/
  ├─ @tanstack/
  ├─ tailwindcss/
  └─ ... 300+ packages

.env.local             # Seu env (NÃO COMITAR)
package-lock.json      # Lock de versões (COMITAR)
.next                  # Build cache (NÃO COMITAR)
dist                   # Build produção (NÃO COMITAR)
```

---

## 🔄 Fluxo diário

```bash
# Morning: Puxar atualizações
git pull origin develop

# Instalar dependências se package.json mudou
npm install

# Rodar dev
npm run dev

# Trabalhar, editar arquivos, testes locais

# Antes de commitar:
npm run lint     # Verificar erros
npm run tsc      # Type-check
npm run build    # Build teste

# Commitar com Conventional Commits
git add .
git commit -m "feat(transactions): adicionar suporte a parcelamentos"
git push origin feature/parcelamentos
```

---

## 🧪 Teste básico de setup

```bash
#!/bin/bash
# test-setup.sh

echo "1. Node version:"
node --version

echo "2. npm version:"
npm --version

echo "3. Env vars:"
grep VITE_SUPABASE .env.local

echo "4. Lint:"
npm run lint

echo "5. Type-check:"
npm run tsc

echo "✅ Setup OK!"
```

---

## 📚 Relacionado

- **Deploy:** [[Deploy.md]]
- **Variáveis de Ambiente:** [[../Arquitetura/Variáveis-de-Ambiente.md]]
- **Estrutura de Pastas:** [[../Arquitetura/Estrutura-de-Pastas.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29  
**Tempo estimado:** 10 minutos (primeira vez)
