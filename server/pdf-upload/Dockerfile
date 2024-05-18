FROM node:14

# Install Google Cloud SDK
RUN apt-get update && apt-get install -y curl gnupg
RUN echo "deb http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
RUN curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
RUN apt-get update && apt-get install -y google-cloud-sdk

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Copy the service account key to the container
COPY ./server/keys/ai-pdf-translation-service-10642063de1f.json /app/ai-pdf-translation-service-10642063de1f.json

# Set the environment variable to point to the service account key
ENV GOOGLE_APPLICATION_CREDENTIALS="/app/ai-pdf-translation-service-10642063de1f.json"

CMD ["node", "index.js"]
