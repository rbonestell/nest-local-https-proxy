<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

<p align="center">A lightweight local HTTPS proxy library for Nest framework apps (Express or Fastify) 🔀</p>
<p align="center">
  <a href="https://www.npmjs.com/package/nest-local-https-proxy" target="_blank"><img alt="NPM Version" src="https://img.shields.io/npm/v/nest-local-https-proxy?logo=npm&logoColor=white"></a>
  <a href="https://github.com/rbonestell/nest-local-https-proxy/actions/workflows/build.yml?query=branch%3Amain" target="_blank"><img alt="Build Status" src="https://img.shields.io/github/actions/workflow/status/rbonestell/nest-local-https-proxy/build.yml?logo=typescript&logoColor=white"></a>
  <a href="https://github.com/rbonestell/nest-local-https-proxy/actions/workflows/test.yml?query=branch%3Amain" target="_blank"><img alt="Test Results" src="https://img.shields.io/github/actions/workflow/status/rbonestell/nest-local-https-proxy/test.yml?branch=main&logo=jest&logoColor=white&label=tests"></a>
  <a href="https://app.codecov.io/gh/rbonestell/nest-local-https-proxy/tree/main/lib" target="_blank"><img alt="Test Coverage" src="https://img.shields.io/codecov/c/github/rbonestell/nest-local-https-proxy?logo=codecov&logoColor=white"></a>
  <a href="https://github.com/rbonestell/nest-local-https-proxy/blob/main/LICENSE" target="_blank"><img alt="GitHub License" src="https://img.shields.io/github/license/rbonestell/nest-local-https-proxy?color=71C347">
</a>
  <!-- <a href="https://www.npmjs.com/nest-local-https-proxy" target="_blank"><img src="https://img.shields.io/npm/v/nest-local-https-proxy.svg" alt="NPM Version" /></a> -->
</p>

## Description

A lightweight local HTTPS proxy library for Nest framework apps, supporting both Express and Fastify HTTP adapters, designed for use with self-signed SSL certificates.

#### ⚠ Disclaimer

This library is intended only for use in local development, testing, and troubleshooting with self-signed SSL certificates. It is not recommended to use this in any production context or public-facing environment.

Always follow best practices when managing SSL certificates for any public-facing or production environment.

#### Self-signed SSL Certificates

See the following gist for info on creating self-signed SSL certificate PEM files using `openssl`:

* [Create a self-signed SSL certificate for local development and testing
](https://gist.github.com/rbonestell/097f58a38d6a81c128e99af05ab89f72)


## Installation

```bash
$ npm i nest-local-https-proxy
```

## Implementation

1. Load your certificate and private key files into an HTTPS options (`SecureContextOptions`) object.

    ```typescript
    const certPath = './cert.pem';
    const keyPath = './key.pem';
    let httpsOptions: SecureContextOptions;
    // Confirm local certificate files exist
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      httpsOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      };
    } else {
      console.log('Failed to initalize HTTPS certificates for local SSL proxy');
    }
    ```

1. Instatiate the `LocalHttpsProxy` class.

    Provide your `NestApplication` instance, and the HTTPS options object.

    ```typescript
    const httpsDevProxy = new LocalHttpsProxy(app, httpsOptions);
    ```

1. (Optional) Subscribe to events on `LocalHttpsProxy` instance.

    ```typescript
    httpsDevProxy.on('listening', (httpsPort) => {
      console.log(`HTTPS listening on ${httpsPort}`);
    });
    httpsDevProxy.on('error', (error) => {
      console.error(`HTTPS proxy error occurred: ${error.message}`);
    });
    ```

1. Start the proxy

    ```typescript
    httpsDevProxy.start(port);
    ```

## Test

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```

## License

The nest-local-https-proxy project is [MIT licensed](LICENSE).
