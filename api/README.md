# API - Portfólio

API para analytics e health check do portfólio.

## Setup

### 1. Instalar dependências

```bash
cd api
npm install
```

### 2. Configurar database

Para desenvolvimento local (SQLite):

```bash
npm run db:setup
```

Para produção (Turso):
1. Criar conta em [turso.tech](https://turso.tech)
2. Criar banco de dados
3. Copiar URL e token para `.env`

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

### 4. Rodar localmente

```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`

## Endpoints

### POST /api/events

Registra um evento de访问.

```json
{
  "event": "page_view",
  "page": "/",
  "referrer": "https://google.com",
  "metadata": {
    "screen": "1920x1080",
    "language": "pt-BR"
  }
}
```

### GET /api/health

Verifica status da API.

### GET /api/health/check

Verificação simplificada para o frontend.

### GET /api/events/stats

Estatísticas básicas (desenvolvimento).

## Deploy

Automático via Vercel ao fazer push para a branch `main`.

## Segurança

- Rate limiting: 100 requests/min por IP
- IPs são hasheados (não armazenados)
- User-Agent sanitizado
- CORS configurado apenas para domínios permitidos
