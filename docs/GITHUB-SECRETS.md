# Secrets de GitHub — jacm-carpinteria

Configuración **igual que jacm-time-record** para el servidor; **distinto** solo `AUTH_SECRET` (y opcional `SHOP_EMAIL`).

Repo: https://github.com/Jonathan1612/jacm-carpinteria  
Donde pegarlos: **Settings → Secrets and variables → Actions → Repository secrets → New repository secret**

Repo de referencia (copiar los mismos valores que ya funcionan allí):  
https://github.com/Jonathan1612/jacm-time-record/settings/secrets/actions

> GitHub **no muestra** el valor guardado de un secret. Si no lo tienes guardado en otro sitio, hay que **volver a pegar** el mismo texto que usaste la primera vez (misma clave SSH, mismo usuario, etc.).

---

## 1. Los mismos que time-record (copiar el mismo valor)

| Nombre del secret | ¿Igual que time-record? | Qué valor poner |
| ----------------- | ----------------------- | --------------- |
| `DO_HOST` | Sí, mismo valor | `104.248.126.117` |
| `DO_USER` | Sí, mismo valor | El usuario SSH con el que entras al VPS (el de time-record; suele ser `root` o el que definiste) |
| `DO_SSH_KEY` | Sí, mismo archivo/clave | **Todo** el contenido de la **clave privada PEM** que usaste en time-record (`-----BEGIN ... PRIVATE KEY-----` … `-----END ...`) |
| `DO_PORT` | Sí (si lo tienes allí) | `22` |

### Dónde está la clave SSH en tu Mac (si la generaste ahí)

Suele ser una de estas (abre el archivo y copia **todo** el texto):

- `~/.ssh/id_ed25519` (sin `.pub`)
- `~/.ssh/id_rsa` (sin `.pub`)
- O el archivo `.pem` que guardaste cuando configuraste deploy por primera vez

En terminal (solo para ver el archivo y copiarlo tú):

```bash
cat ~/.ssh/id_ed25519
```

Ese texto completo va en el secret **`DO_SSH_KEY`** de **jacm-carpinteria** (y debe ser el mismo que en time-record).

---

## 2. Solo para carpintería (valor nuevo)

| Nombre | ¿Igual que time-record? | Qué valor poner |
| ------ | ----------------------- | --------------- |
| `AUTH_SECRET` | **No** — no uses `JWT_SECRET` | Cadena nueva. En Mac: `openssl rand -base64 32` y pega el resultado |

---

## 3. Opcional

| Nombre | Valor |
| ------ | ----- |
| `SHOP_EMAIL` | Correo del carpintero en la app (seed: `taller@jacm-carpinteria.local`; en prod el real). Si no lo pones, el deploy usa el default del compose. |

---

## 4. Lo que **no** debes agregar (time-record sí)

- `JWT_SECRET` — solo API de time-record
- `MONGO_ROOT_PASSWORD`, `MONGO_APP_PASSWORD`, etc.

---

## 5. Después de guardar los secrets

1. **Actions** → workflow **Deploy** → **Run workflow** (o un push a `main` ya lo dispara).
2. DNS: `carpinteria.jacm.com.mx` → `104.248.126.117`.
3. En el servidor: `cd /opt/container-apps && git pull origin dev` (si aún no está actualizado `apps.yml`).

Primer arranque: en el servidor `/opt/apps/jacm-carpinteria/.env` puedes poner una vez `RUN_DB_SEED=true`, redeploy, cambiar contraseña, quitar `RUN_DB_SEED`.