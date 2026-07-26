FROM php:8.4-cli

# A imagem base já habilita mbstring, dom, xml, xmlwriter, pdo_sqlite e sqlite3,
# exigidos pelo composer.lock e pelo PHPUnit. Aqui ficam apenas as dependências
# que faltam: ferramentas do Composer e a extensão zip.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libzip-dev \
    && docker-php-ext-install -j"$(nproc)" zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /backend

# Dependências em uma camada própria para aproveitar o cache de build.
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts --no-autoloader

COPY . .

RUN composer dump-autoload --optimize

# Marca qual lockfile gerou este `vendor`. O entrypoint compara com o lockfile
# atual para detectar um volume nomeado deixado por uma versão anterior.
RUN md5sum composer.lock | cut -d' ' -f1 > vendor/.composer-lock.hash

EXPOSE 8000

ENTRYPOINT ["/backend/docker-entrypoint.sh"]

# O servidor embutido atende ao ambiente local descrito nas specs; não é
# servidor de produção.
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
