#!/bin/sh
# Mantém o volume nomeado de `node_modules` em dia com o `package-lock.json`.
#
# O Compose monta um volume nomeado sobre `/frontend/node_modules` para que o
# bind mount do código não esconda as dependências instaladas na imagem. O
# efeito colateral é que o volume sobrevive ao `docker compose build`: um
# ambiente que já rodou uma versão anterior continuaria executando as
# dependências antigas, e a imagem nova ficaria escondida atrás delas.
#
# O build grava o hash do lockfile dentro de `node_modules`. Aqui ele é
# comparado com o lockfile atual: se o volume for de outra versão — ou de antes
# desta verificação existir —, as dependências são reinstaladas antes de o
# servidor subir.
set -e

HASH_FILE=node_modules/.package-lock.hash
CURRENT_HASH=$(md5sum package-lock.json | cut -d' ' -f1)

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE")" != "$CURRENT_HASH" ]; then
    echo "[entrypoint] node_modules do volume está fora de sincronia com package-lock.json; instalando."
    npm ci --no-audit --no-fund
    echo "$CURRENT_HASH" > "$HASH_FILE"
fi

exec "$@"
