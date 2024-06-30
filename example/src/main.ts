import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LocalHttpsProxy } from 'nest-local-https-proxy';
import { INestApplication } from '@nestjs/common';
import { SecureContextOptions } from 'tls';

import * as path from 'path';
import * as fs from 'fs';

function startLocalSslProxy(app: INestApplication, port: number) {
  const certPath = path.join(__dirname, '..', 'certificate', 'cert.pem');
  const keyPath = path.join(__dirname, '..', 'certificate', 'key.pem');
  let httpsOptions: SecureContextOptions;
  // Confirm local certificate files exist
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    httpsOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };
  } else {
    console.log('Failed to initalize HTTPS certificates for local SSL proxy');
    return;
  }

  const httpsDevProxy = new LocalHttpsProxy(app, httpsOptions);
  httpsDevProxy.on('listening', (httpsPort) => {
    console.log(`HTTPS listening on https://0.0.0.0:${httpsPort}`);
  });
  httpsDevProxy.on('error', (error) => {
    console.error(`HTTPS proxy error occurred:${error.message}`);
  });
  httpsDevProxy.start(port);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000, '0.0.0.0');
  console.log(`HTTP listening on http://0.0.0.0:3000`);

  // Add local HTTPS proxy if local dev environment
  if (process.env.APP_ENV?.toLowerCase() === 'local')
    startLocalSslProxy(app, 3443);
}
bootstrap();
