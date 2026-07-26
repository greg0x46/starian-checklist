#!/bin/sh
# Mantém o volume nomeado de `vendor` em dia com o `composer.lock`.
#
# O Compose monta um volume nomeado sobre `/backend/vendor` para que o bind
# mount do código não esconda as dependências instaladas na imagem. O efeito
# colateral é que o volume sobrevive ao `docker compose build`: um ambiente que
# já rodou uma versão anterior continuaria executando as dependências antigas —
# um Laravel 11 escondido atrás de uma imagem com Laravel 13.
#
# O build grava o hash do lockfile dentro de `vendor`. Aqui ele é comparado com
# o lockfile atual: se o volume for de outra versão — ou de antes desta
# verificação existir —, as dependências são reinstaladas antes de o servidor
# subir.
set -e

HASH_FILE=vendor/.composer-lock.hash
CURRENT_HASH=$(md5sum composer.lock | cut -d' ' -f1)

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE")" != "$CURRENT_HASH" ]; then
    echo "[entrypoint] vendor do volume está fora de sincronia com composer.lock; instalando."
    composer install --no-interaction --prefer-dist
    echo "$CURRENT_HASH" > "$HASH_FILE"
fi

exec "$@"
