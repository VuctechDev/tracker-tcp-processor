FROM node:18

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

RUN npm build

# Copy the whole project including prisma/
COPY . .

# Generate Prisma client
# RUN npx prisma generate
# RUN npx prisma migrate dev --name add_order_table

EXPOSE 5001
CMD ["node", "dist/index.js"]
