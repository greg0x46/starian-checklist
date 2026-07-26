FROM node:22

WORKDIR /frontend

# npm ci instala exatamente as versões fixadas em package-lock.json.
COPY package.json package-lock.json ./
RUN npm ci

# Marca qual lockfile gerou este `node_modules`. O entrypoint compara com o
# lockfile atual para detectar um volume nomeado deixado por uma versão anterior.
RUN md5sum package-lock.json | cut -d' ' -f1 > node_modules/.package-lock.hash

COPY . .

ENV NG_CLI_ANALYTICS=false

EXPOSE 4200

ENTRYPOINT ["/frontend/docker-entrypoint.sh"]

CMD ["npm", "run", "start", "--", "--host=0.0.0.0"]
