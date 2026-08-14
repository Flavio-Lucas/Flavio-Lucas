# Arquitetura - Portfólio + API

**Versão:** 1.0  
**Data:** 14/08/2026  
**Status:** Planejamento

---

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
┌───────────────────────────┐  ┌───────────────────────────────┐
│   GitHub Pages (Site)     │  │   Vercel (API)                │
│   https://flaviolucas.dev │  │   https://api.flaviolucas.dev │
│                           │  │                               │
│   - HTML/CSS/JS           │──│   - /api/events (analytics)   │
│   - Estático              │  │   - /api/health (monitoring)  │
│   - PDF fallback          │  │   - /api/cv (curriculo)       │
└───────────────────────────┘  └───────────────────────────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │   Database       │
                               │   (Turso/Neon)   │
                               │   SQLite/PG      │
                               └─────────────────┘
```

---

## 1. API de Eventos (Analytics)

### Endpoint: `POST /api/events`

Registra eventos de访问 do portfólio.

### Schema de Evento

```json
{
  "event": "page_view",
  "page": "/",
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0...",
  "ip_hash": "abc123...",  // Hash da IP (não armazena IP real)
  "timestamp": "2026-08-14T10:30:00Z",
  "metadata": {
    "screen": "1920x1080",
    "language": "pt-BR"
  }
}
```

### Tipos de Eventos

| Evento | Descrição |
|--------|-----------|
| `page_view` | Visualização de página |
| `section_view` | Visualização de seção (scroll) |
| `project_click` | Clique em projeto |
| `cv_download` | Download do PDF |
| `cv_api_fallback` | API indisponível, usando PDF |

### Limites e Segurança

- Rate limit: 100 requests/min por IP (hash)
- IP não é armazenada, apenas hash SHA-256
- User-Agent sanitizado (sem dados sensíveis)
- Dados retidos por 90 dias

---

## 2. Dashboard de Métricas

### Endpoint: `GET /api/dashboard`

Retorna métricas agregadas.

### Autenticação

```
┌─────────────────────────────────────────┐
│ Login:                                  │
│   - Email: flavio@flaviolucas.dev       │
│   - Senha: (variável de ambiente)       │
│                                         │
│ JWT Token (24h de validade)             │
│   - HttpOnly cookie                     │
│   - Secure (HTTPS only)                 │
│   - SameSite: Strict                    │
└─────────────────────────────────────────┘
```

### Endpoints do Dashboard

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Login e retorna JWT |
| `GET` | `/api/dashboard` | Métricas agregadas |
| `GET` | `/api/dashboard/daily` | Métricas por dia |
| `GET` | `/api/dashboard/pages` | Métricas por página |

### Resposta do Dashboard

```json
{
  "period": "7d",
  "total_views": 142,
  "unique_visitors": 89,
  "top_pages": [
    { "page": "/", "views": 89 },
    { "page": "/#projects", "views": 34 },
    { "page": "/#contact", "views": 19 }
  ],
  "daily": [
    { "date": "2026-08-14", "views": 23 },
    { "date": "2026-08-13", "views": 31 }
  ],
  "referrers": [
    { "source": "google.com", "count": 45 },
    { "source": "github.com", "count": 23 }
  ]
}
```

---

## 3. Health Check

### Endpoint: `GET /api/health`

```json
{
  "status": "healthy",
  "timestamp": "2026-08-14T10:30:00Z",
  "services": {
    "database": "connected",
    "api": "responsive"
  },
  "uptime": 86400
}
```

### Monitoramento

- **UptimeRobot** (gratuito): Verifica a cada 5 minutos
- **Discord Webhook**: Alerta quando status != healthy
- **Logs**: Armazenados no Vercel (últimas 24h)

---

## 4. Integração com CV Digital (Futuro)

### Projeto: `curriculo-automatico`

Localização: `/personal/curriculo-automatico`

### Arquitetura Planejada

```
┌─────────────────────────────────────────────────────────────┐
│                    PORTFÓLIO                                 │
│  Seção "Editar Currículo"                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Editor JSON (textarea/editores visuais)            │   │
│  │                                                      │   │
│  │  [Salvar] → PUT /api/cv                             │   │
│  │  [Baixar PDF] → GET /api/cv/pdf                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    API (Vercel)                              │
│                                                              │
│  GET  /api/cv          → Retorna currículo JSON             │
│  PUT  /api/cv          → Atualiza currículo (auth required) │
│  GET  /api/cv/pdf      → Gera PDF a partir do JSON         │
│  GET  /api/cv/fallback → Retorna PDF estático (fallback)   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (Turso)                          │
│                                                              │
│  Table: curriculum                                           │
│  - id: TEXT PRIMARY KEY                                     │
│  - data: JSON                                               │
│  - version: INTEGER                                         │
│  - updated_at: TIMESTAMP                                    │
│  - updated_by: TEXT                                          │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura do JSON do Currículo

```json
{
  "personal": {
    "name": "Flavio Lucas",
    "email": "contato@flaviolucas.dev",
    "phone": "+55 XX XXXXX-XXXX",
    "location": "Cascavel, PR"
  },
  "summary": "Desenvolvedor Full Stack...",
  "experience": [
    {
      "company": "Empresa X",
      "role": "Desenvolvedor",
      "period": "2022-2026",
      "description": "..."
    }
  ],
  "education": [...],
  "skills": [...],
  "languages": [...]
}
```

### Fallback PDF

Quando a API estiver indisponível:

```javascript
// No frontend
async function loadCV() {
  try {
    const response = await fetch('https://api.flaviolucas.dev/api/cv');
    if (!response.ok) throw new Error('API error');
    return await response.json();
  } catch (error) {
    // Fallback: carregar PDF estático
    console.warn('API indisponível, usando PDF fallback');
    window.open('/download/cv.pdf', '_blank');
    logFallbackUsage('cv_api_fallback');
    return null;
  }
}
```

---

## 5. Stack Tecnológica

### Frontend (Portfólio)
- HTML5 / CSS3 / JavaScript vanilla
- Hospedagem: GitHub Pages
- Build: Estático (sem build step)

### API
- Runtime: Node.js 20
- Framework: Hono (leve, rápido para Vercel)
- Hospedagem: Vercel (Hobby - gratuito)
- Armazenamento: Turso (SQLite - gratuito)

### Database (Opções Gratuitas)

| Opção | Free Tier | Notas |
|-------|-----------|-------|
| **Turso** | 500MB, 9B leituras/mês | SQLite distribuído, recomendado |
| **Neon** | 512MB, 191.9h compute/mês | PostgreSQL, bom também |
| **Upstash** | 10K comandos/dia | Redis, mais complexo |

**Recomendação:** Turso (mais simples, SQLite)

---

## 6. Segurança

### Variáveis de Ambiente (Vercel)

```env
# Database
DATABASE_URL=file:./local.db  # Desenvolvimento
TURSO_DATABASE_URL=libsql://...  # Produção
TURSO_AUTH_TOKEN=...

# Auth
JWT_SECRET= (gerar com: openssl rand -base64 32)
ADMIN_EMAIL=flavio@flaviolucas.dev
ADMIN_PASSWORD_HASH= (bcrypt hash)

# CORS
ALLOWED_ORIGINS=https://flaviolucas.dev,https://www.flaviolucas.dev
```

### Rate Limiting

```javascript
// Middleware de rate limit
const rateLimit = {
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por IP
  message: { error: 'Rate limit exceeded' }
};
```

### Headers de Segurança

```javascript
// no vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

## 7. Deploy

### GitHub Pages (Site)
- Trigger: Push para `master`
- Build: Automático (estático)
- Domínio: `flaviolucas.dev` (Cloudflare DNS)

### Vercel (API)
- Trigger: Push para `main` na pasta `api/`
- Branch: `v2` para preview
- Preview URL: `api-flaviolucas-v2.vercel.app`
- Production: `api.flaviolucas.dev`

### Configuração Vercel

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" }
  ]
}
```

---

## 8. Cronograma de Implementação

### Fase 1: API Base (1-2 dias)
- [ ] Criar estrutura do projeto API
- [ ] Implementar `/api/events` (POST)
- [ ] Implementar `/api/health` (GET)
- [ ] Configurar database (Turso)
- [ ] Deploy no Vercel

### Fase 2: Dashboard (2-3 dias)
- [ ] Autenticação JWT
- [ ] Login page
- [ ] Dashboard de métricas
- [ ] Gráficos básicos

### Fase 3: Integração Frontend (1 dia)
- [ ] Script de tracking no portfólio
- [ ] Testar eventos
- [ ] Configurar CORS

### Fase 4: CV Digital (futuro)
- [ ] Endpoints de CRUD para currículo
- [ ] Editor no portfólio
- [ ] Geração de PDF
- [ ] Fallback automático

---

## 9. Custos Totais

| Serviço | Custo Mensal |
|---------|--------------|
| GitHub Pages | $0 |
| Vercel Hobby | $0 |
| Turso (free tier) | $0 |
| Cloudflare DNS | $0 |
| **Total** | **$0** |

---

## 10. Monitoramento e Alertas

### UptimeRobot (Gratuito)
- Monitora `/api/health` a cada 5 minutos
- Notificação por email quando offline
- Status page pública (opcional)

### Discord Webhook
```javascript
// Notificação de alerta
async function sendAlert(status) {
  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `⚠️ API Status: ${status}`
    })
  });
}
```

---

## Notas Importantes

1. **Dados sensíveis nunca no repo** - Usar variáveis de ambiente
2. **Backup regular** - Exportar database semanalmente
3. **Logs** - Manter por 30 dias no máximo
4. **GDPR** - Não coletar dados pessoais identificáveis
5. **IP hashing** - SHA-256 com salt rotativo

---

**Próximo passo:** Criar a estrutura da API na branch `v2`
