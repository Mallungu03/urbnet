# 📱 Reporta — Plataforma Municipal de Crowdsourcing

Reporta é uma plataforma de crowdsourcing que permite cidadãos reportarem incidentes urbanos com confirmação comunitária e alertas geoespaciais em tempo real. Desenvolvida para municípios de Angola, utiliza tecnologias modernas para escalabilidade, segurança e experiência de usuário robusta.

## 🎯 Propósito

Capacitar cidadãos a relatar incidentes urbanos (buracos, iluminação danificada, acidentes, etc.) com localização geográfica precisa, fotos e confirmação comunitária, enquanto administradores podem gerenciar categorias, validar relatórios e tomar ações preventivas baseadas em dados.

## ✨ Funcionalidades Principais

- **📍 Reportagem de Incidentes** — Criar relatórios com localização GPS, mídia (fotos/vídeos), categoria e descrição
- **👥 Confirmação Comunitária** — Usuários confirmam relatórios para aumentar credibilidade
- **🚨 Alertas de Proximidade** — Notificações automáticas baseadas em raio geoespacial (PostGIS)
- **📬 Notificações Multi-Canal** — Email, Push (FCM/APNs) e in-app
- **👤 Rede Social** — Seguir usuários para receber atualizações de seus relatórios
- **🔐 Autenticação Segura** — JWT com refresh tokens rotacionados por dispositivo
- **👨‍💼 Painel Administrativo** — Gerenciar categorias, suspender usuários, visualizar logs de auditoria
- **📊 Dispositivos Multi-Sessão** — Fingerprinting de dispositivos com controle de sessões
- **🔍 Auditoria Imutável** — Registro completo de todas as ações do sistema

## 🛠 Stack Tecnológico

| Componente | Tecnologia |
|---|---|
| **Runtime** | Node.js 18+ |
| **Framework** | NestJS 11 |
| **Linguagem** | TypeScript 5 |
| **Banco de Dados** | PostgreSQL 15+ com PostGIS |
| **ORM** | Prisma 7.6 |
| **Autenticação** | JWT + Argon2 |
| **Geolocalização** | PostGIS com índices GIST |
| **Storage** | AWS S3 |
| **Email** | Nodemailer com templates |
| **Processamento de Imagem** | Sharp |
| **Segurança** | Helmet, Compression, Throttler |
| **Logging** | Winston |
| **Event-Driven** | @nestjs/event-emitter |

## 📋 Pré-requisitos

- **Node.js** 18.17+ ou superior
- **npm** 9+ ou **yarn** 4+
- **PostgreSQL** 15+ com extensão PostGIS habilitada
- **Docker** (opcional, para ambiente isolado)

## 🚀 Instalação e Setup

### 1. Clonar Repositório

```bash
git clone <repository-url>
cd urbnet/api
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto `api/`:

```env
# Base
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/urbnet_db

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRATION=7d

# Email (Nodemailer)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=noreply@reporta.ao

# S3 Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_REGION=us-east-1

# Logging
LOG_LEVEL=debug
```

### 4. Preparar Banco de Dados

```bash
# Aplicar migrations
npm run migrate:dev

# Gerar cliente Prisma
npm run prisma:generate
```

### 5. Verificar Setup

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`

## 📚 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev          # Modo watch com hot-reload
npm run start:debug        # Modo debug com hot-reload

# Build
npm run build              # Compilar TypeScript para dist/

# Produção
npm run start:prod         # Executar build em produção

# Banco de Dados
npm run migrate:dev        # Criar/aplicar migrations (dev)
npm run migrate:status     # Verificar status das migrations
npm run migrate:reset      # Reset do banco (⚠️ dev only)

# Prisma
npm run prisma:generate    # Regenerar cliente Prisma
npm run prisma:studio      # Abrir Prisma Studio (UI visual)

# Qualidade
npm run lint               # ESLint com fix automático
npm run format             # Prettier formatting
npm run test               # Testes unitários
npm run test:e2e           # Testes end-to-end
npm run test:cov           # Cobertura de testes
```

## 🏗 Arquitetura e Padrões

### Estrutura de Diretórios

```
src/
├── config/                 # Configurações globais
│   ├── db/                # Prisma module e service
│   └── env/               # Validação e carregamento de ENV
├── modules/               # Bounded contexts do DDD
│   ├── auth/              # Autenticação JWT e OTP
│   ├── users/             # Perfis, dispositivos e sessões
│   ├── reports/           # Criação e gerenciamento de reports
│   ├── alerts/            # Zonas geoespaciais e alertas
│   ├── notification/      # Notificações multi-canal
│   └── admin/             # Operações administrativas
├── shared/                # Código compartilhado
│   ├── decorators/        # @CurrentUser, @Public, @Roles
│   ├── guards/            # AuthGuard global
│   ├── interfaces/        # DTOs e tipos compartilhados
│   ├── pipes/             # Pipes customizados
│   └── queries/           # Query objects reutilizáveis
├── generated/             # Arquivos gerados (Prisma Client)
├── app.controller.ts      # Health check
├── app.module.ts          # Módulo raiz
└── main.ts                # Entry point
```

### Padrões de Design Implementados

#### 1. **Use-Case Pattern**
Cada operação é um arquivo separado em `use-cases/`:
```typescript
// modules/reports/use-cases/create-report.use-case.ts
export class CreateReportUseCase {
  constructor(private prisma: PrismaService) {}
  
  async execute(input: CreateReportInput): Promise<Report> {
    // Lógica isolada
  }
}
```

#### 2. **Event-Driven Architecture**
Listeners desacoplados reagem a eventos do domínio:
```typescript
@EventListener()
async onReportCreated(event: ReportCreatedEvent) {
  // Trigger notificações, alertas, etc.
}
```

#### 3. **Domain-Driven Design (DDD)**
Bounded contexts bem definidos:
- **User Context** — Autenticação, profiles, dispositivos
- **Report Context** — Criação, confirmações, mídia
- **Notification Context** — Multi-canal (email, push, in-app)
- **Alert Context** — Geospatial com PostGIS

#### 4. **Repository Pattern**
Via Prisma com queries reutilizáveis:
```typescript
// shared/queries/find-many.query.ts
export class FindManyQuery {
  pagination(query: any) { /* ... */ }
  filters(query: any) { /* ... */ }
}
```

#### 5. **Custom Guards e Decorators**
```typescript
@Get(':id')
@UseGuards(AuthGuard)
@Roles('admin')
getReport(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
  // Apenas admins autenticados
}
```

### Geospatial com PostGIS

Queries de proximidade otimizadas com índices GIST:

```typescript
// Encontrar alertas dentro de raio (1km)
const nearbyAlerts = await prisma.$queryRaw`
  SELECT * FROM "AlertZone"
  WHERE ST_DWithin(
    location::geography,
    ST_Point($1, $2)::geography,
    1000
  )
`;
```

## 🔐 Segurança

- **Autenticação** — JWT com accessToken (15min) + refreshToken (7d) rotacionado por dispositivo
- **Senhas** — Hash com Argon2 (cost factor 12)
- **CORS** — Configurado por ambiente
- **Rate Limiting** — Throttler global em endpoints críticos
- **Helmet** — Headers HTTP de segurança
- **Validation** — DTO + class-validator em todas as requisições
- **Soft Delete** — Dados não são permanentemente deletados
- **Auditoria** — Imutável AuditLog de todas as ações

## 📖 Documentação de Endpoints

### Autenticação

```http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/otp/request
POST /auth/otp/verify
```

### Reports

```http
POST   /reports                    # Criar report
GET    /reports                    # Listar reports
GET    /reports/:id                # Detalhe de report
PATCH  /reports/:id                # Atualizar report
DELETE /reports/:id                # Deletar report
POST   /reports/:id/confirmations  # Confirmar report
```

### Usuários

```http
GET    /users/:id                  # Perfil de usuário
PATCH  /users/:id                  # Atualizar perfil
POST   /users/:id/follow           # Seguir usuário
DELETE /users/:id/follow           # Deixar de seguir
```

### Notificações

```http
GET    /notifications              # Listar notificações do usuário
PATCH  /notifications/:id/read     # Marcar como lida
```

### Admin (requer role admin)

```http
POST   /admin/categories           # Criar categoria
PATCH  /admin/categories/:id       # Atualizar categoria
DELETE /admin/categories/:id       # Deletar categoria
PATCH  /admin/users/:id/ban        # Banir usuário
PATCH  /admin/users/:id/role       # Alterar role do usuário
GET    /admin/audit-logs           # Ver logs de auditoria
```

## 🧪 Testes

```bash
# Executar testes unitários
npm run test

# Modo watch
npm run test -- --watch

# Cobertura
npm run test:cov

# Testes end-to-end
npm run test:e2e
```

## 🐳 Docker (Opcional)

```bash
# Build imagem
docker build -t reporta-api .

# Executar container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  reporta-api
```

## 🤝 Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feature/sua-feature`
2. Commit suas mudanças: `git commit -am 'Adiciona nova feature'`
3. Push para a branch: `git push origin feature/sua-feature`
4. Abra um Pull Request

### Padrões de Código

- TypeScript strict mode
- Nomenclatura em inglês (código) e português (comentários)
- Máximo 80 caracteres por linha
- Testes para lógica crítica
- ESLint + Prettier obrigatório

## 📝 Licença

UNLICENSED — Projeto privado

## 👤 Contato e Redes

- **Autor** — Américo Malungo Sebastião Miguel
- **Instagram** — [@_americomalungo](https://www.instagram.com/_americomalungo?igsh=MnFybWxidW9uNnJ5)
- **LinkedIn** — [Américo Malungo](https://www.linkedin.com/in/am%C3%A9rico-malungo-b66208338?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app)

---

## 🚀 Próximas Etapas

- [ ] Integração com payment gateway (para premium features)
- [ ] Mobile app (React Native)
- [ ] Dashboard administrativo (React)
- [ ] Relatórios analytics avançados
- [ ] Machine learning para detecção de duplicatas
- [ ] Integração com sistemas municipais
