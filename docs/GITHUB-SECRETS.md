# Secrets de GitHub para jacm-carpinteria

Misma idea que **jacm-time-record** y **jacm-portafolio**: el workflow llama a `container-apps/.github/workflows/deploy-app.yml`.

Configuración en el repo **Jonathan1612/jacm-carpinteria** → Settings → Secrets and variables → Actions.

## Obligatorios (igual que time-record para el servidor)

| Secret | Qué es | Dónde sacarlo |
| ------ | ------ | ------------- |
| `DO_HOST` | IP del VPS | `104.248.126.117` (mismo que time-record) |
| `DO_USER` | Usuario SSH | El mismo valor que ya tiene **jacm-time-record** |
| `DO_SSH_KEY` | Clave privada SSH (PEM completa) | La misma que **jacm-time-record** (copiar/pegar el secret entero) |
| `DO_PORT` | Opcional | `22` si no lo tenías definido |

## Obligatorio solo para esta app (sesión del administrador)

| Secret | Qué es | Cómo generarlo |
| ------ | ------ | -------------- |
| `AUTH_SECRET` | Firma de cookies de login | En terminal: `openssl rand -base64 32` — **nuevo** para carpintería (no reutilices el JWT de time-record) |

## Recomendados

| Secret / variable | Qué es |
| ----------------- | ------ |
| `SHOP_EMAIL` | Correo del taller en la BD (default seed: `taller@jacm-carpinteria.local`; en prod usa el correo real del carpintero) |

## Los que **no** necesitas (time-record sí)

- `JWT_SECRET` — solo backend de time-record (`jwt_required: false` aquí)
- `MONGO_*` — esta app usa SQLite en volumen Docker

## Después del primer deploy

1. DNS: `carpinteria.jacm.com.mx` → `104.248.126.117`
2. En el servidor, una vez: en `/opt/apps/jacm-carpinteria/.env` poner `RUN_DB_SEED=true`, `docker compose up -d`, entrar y **cambiar contraseña**
3. Quitar `RUN_DB_SEED` del `.env`

## Copiar secrets desde time-record

En GitHub puedes duplicar `DO_HOST`, `DO_USER`, `DO_SSH_KEY`, `DO_PORT` del repo **jacm-time-record** al repo **jacm-carpinteria**. Solo **AUTH_SECRET** debe ser un valor nuevo.