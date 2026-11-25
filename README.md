# JACM Carpintería

Portafolio y contacto para **carpinteros** en México: trabajos, materiales, WhatsApp, solicitud de visita. **Planos y cotización** solo en el panel del administrador (`/mi-taller/planos`).

Nombre del paquete npm: `jacm-carpinteria` (la carpeta del repo puede seguir llamándose `madereria`).

## Desarrollo local

```bash
cd madereria   # carpeta del proyecto
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

- **Público:** http://localhost:3010  
- **Admin:** http://localhost:3010/entrar  
- **Planos:** http://localhost:3010/mi-taller/planos  

### Credenciales de prueba (después de `db:setup`)

| Campo        | Valor                            |
| ------------ | -------------------------------- |
| Correo       | `taller@jacm-carpinteria.local`  |
| Contraseña   | `taller1234`                     |

Si ya tenías la base con `taller@madereria.local`, vuelve a ejecutar `npm run db:setup` o pon en `.env` el correo que siga en la base.

## Variables de entorno

| Variable        | Obligatorio | Descripción |
| --------------- | ----------- | ----------- |
| `AUTH_SECRET`   | Sí (prod)   | Firma de sesión. Genera con `openssl rand -base64 32`. |
| `DATABASE_URL`  | Sí          | SQLite: `file:./prisma/dev.db`. En servidor, ruta en disco persistente. |
| `SHOP_EMAIL`    | Sí          | Correo del carpintero cuya ficha es la página pública. |
| `NODE_ENV`      | Prod        | `production` (cookies seguras en HTTPS). |
| `PORT`          | No          | Default `3010`. |

Copia `.env.example` a `.env` en el servidor y **no** subas `.env` al repositorio.

## Qué necesitas para desplegar en un servidor

### Requisitos mínimos

- **Node.js 20+** (LTS recomendado)
- **npm** (o lockfile del proyecto)
- **HTTPS** delante de la app (Nginx, Caddy o proxy de tu hosting)
- **Disco persistente** para:
  - archivo SQLite (`DATABASE_URL`)
  - carpeta `data/uploads/` (fotos del taller)

### Pasos típicos (VPS Linux)

1. Clonar o subir el proyecto al servidor.
2. Crear `.env` con `AUTH_SECRET`, `DATABASE_URL` y `SHOP_EMAIL`.
3. Instalar y compilar:
   ```bash
   npm ci
   npx prisma generate
   npm run build
   npx prisma db push
   npx prisma db seed    # solo primera vez o entorno demo
   ```
4. Arrancar en producción:
   ```bash
   npm run start
   ```
   O con **pm2**: `pm2 start npm --name jacm-carpinteria -- start`
5. **Nginx** (ejemplo): proxy a `http://127.0.0.1:3010`, certificado Let's Encrypt.
6. Backups periódicos de `prisma/*.db` y `data/uploads/`.

### Docker (opcional)

```bash
docker build -t jacm-carpinteria .
docker run -d -p 3010:3010 \
  -e AUTH_SECRET="tu-secreto" \
  -e SHOP_EMAIL="taller@tudominio.com" \
  -e DATABASE_URL="file:/app/prisma/prod.db" \
  -v jacm-db:/app/prisma \
  -v jacm-uploads:/app/data/uploads \
  jacm-carpinteria
```

Monta volúmenes para que no se pierdan la base ni las fotos al reiniciar el contenedor.

### Checklist antes de producción

- [ ] `AUTH_SECRET` único y largo
- [ ] Cambiar contraseña del taller (no dejar `taller1234`)
- [ ] `SHOP_EMAIL` = correo real del carpintero registrado
- [ ] HTTPS activo (cookies de sesión van con `secure`)
- [ ] Backup de BD y `data/uploads`
- [ ] Firewall: solo 80/443 públicos; puerto 3010 solo localhost

### Celular en la misma WiFi (solo desarrollo)

`npm run dev` escucha en `0.0.0.0:3010`. En producción usa el dominio con HTTPS.

## Estructura de URLs

| Quién      | Ruta |
| ---------- | ---- |
| Clientes   | `/` — portafolio, materiales, contacto |
| Carpintero | `/entrar`, `/mi-taller`, `/mi-taller/planos` |

No hace falta base de datos PostgreSQL para la versión actual (SQLite). Si más adelante creces a muchos talleres, conviene migrar Prisma a Postgres.

## Despliegue con **container-apps** (como time-record)

Tu infraestructura en **DigitalOcean 104.248.126.117**: Traefik + red `proxy`, cada app en `/opt/apps/<nombre>`, imágenes en **ghcr.io**, CI con `Jonathan1612/container-apps/.github/workflows/deploy-app.yml`.

### Cómo encaja con las otras apps

| App | Dominio | Repo |
| --- | ------- | ---- |
| jacm-portafolio | jacm.com.mx | jacm-portafolio |
| plantillas-app | plantillas.jacm.com.mx | plantillas-app |
| **jacm-time-record** | time.jacm.com.mx + time-api | jacm-time-record |
| **jacm-carpinteria** (esta) | **carpinteria.jacm.com.mx** | jacm-carpinteria |

No comparte base de datos con time-record (allí es MongoDB; aquí SQLite en volumen propio).

### Pasos para ponerla en producción

1. **Crear repo GitHub** `Jonathan1612/jacm-carpinteria` y subir esta carpeta (`madereria/`).
2. En **container-apps** (ya actualizado en el monorepo local): entrada en `apps.yml` y, en el servidor, `git pull` en `/opt/container-apps` para registrar la app.
3. **DNS:** `carpinteria.jacm.com.mx` → `104.248.126.117` (igual que `time.jacm.com.mx`).
4. **Secrets en el repo jacm-carpinteria** (mismos que time-record para el servidor):
   - `DO_HOST`, `DO_USER`, `DO_SSH_KEY` (y `DO_PORT` si aplica)
   - **`AUTH_SECRET`** (obligatorio, `openssl rand -base64 32`)
   - `SHOP_EMAIL` (opcional; correo del carpintero en la BD)
5. Push a **`main`** → GitHub Actions construye la imagen `ghcr.io/jonathan1612/jacm-carpinteria:latest` y en el servidor hace `docker compose pull && up`.
6. **Primera vez:** en el servidor, en `.env` de `/opt/apps/jacm-carpinteria` puedes poner `RUN_DB_SEED=true`, redeploy, luego quitar y cambiar la contraseña del taller. O usa `/registro` si está habilitado.

Archivos clave en este proyecto: `docker-compose.yml`, `Dockerfile`, `.github/workflows/deploy.yml`.

Detalle del servidor y Traefik: repo **container-apps** → `DEPLOYED_APPS.md`.