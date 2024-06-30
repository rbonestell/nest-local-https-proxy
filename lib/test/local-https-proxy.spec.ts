import { EventEmitter } from 'events';
import { INestApplication, Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { LocalHttpsProxy } from '../src/local-https-proxy';
import * as https from 'https';
jest.mock('https');

// Mock NestJS dependencies
let mockNestApp: jest.Mocked<INestApplication> = {
  get: jest.fn(),
  getHttpAdapter: jest.fn()
} as any;

// Mock Express and Fastify dependencies
let mockExpressAdapter: jest.Mocked<ExpressAdapter> = new ExpressAdapter() as any;
let mockFastifyInstance = {
  routing: jest.fn(),  
} as any;
let mockFastifyAdapter: jest.Mocked<FastifyAdapter> = new FastifyAdapter() as any;
    mockFastifyAdapter.getInstance = jest.fn().mockReturnValue(mockFastifyInstance);

// Mock NodeJS HTTPS Server
let mockHttpsServerListeningStatus = false;
let mockHttpsServerPort = 43000;
let mockHttpsServer: jest.Mocked<https.Server> = new EventEmitter() as any;
    mockHttpsServer.listen = jest.fn().mockImplementation((port) => {
      mockHttpsServerPort = port;
      mockHttpsServerListeningStatus = true;
    });
    mockHttpsServer.closeAllConnections = jest.fn();
    mockHttpsServer.address = jest.fn().mockReturnValue({ port: mockHttpsServerPort });
    Object.defineProperty(mockHttpsServer, 'listening', {
      get: function () { return mockHttpsServerListeningStatus; },
      set: function (v) { mockHttpsServerListeningStatus = v; }
    });

// Mock NodeJS https.createServer function to return mockHttpsServer instance
(https.createServer as jest.Mock).mockImplementation(() => mockHttpsServer);
let httpsOptions = { cert: 'cert', key: 'key' };

// Run all tests for both Express and Fastify adapters
describe.each([
  { adapterName: 'Express', adapter: mockExpressAdapter },
  { adapterName: 'Fastify', adapter: mockFastifyAdapter },
])('LocalHttpsProxy for $adapterName', ({ adapter }) => {

  let mockHttpsAdapter = adapter as any;

  beforeEach(() => {
    // Reset mocks
    mockHttpsServerListeningStatus = false;
    mockNestApp.getHttpAdapter = jest.fn().mockReturnValue(mockHttpsAdapter);
  });

  afterEach(() => {
    // Remove all mockHttpsServer event listeners and reset mocks
    mockHttpsServer.removeAllListeners();
    jest.clearAllMocks();
  });

  it('should create an instance when provided with valid HTTPS options', () => {
    const proxy = new LocalHttpsProxy(mockNestApp, httpsOptions);
    expect(proxy).toBeInstanceOf(LocalHttpsProxy);
    expect(https.createServer).toHaveBeenCalledWith(httpsOptions, expect.any(Function));
  });

  it('should throw error when invalid HTTPS options are provided', () => {
    const invalidHttpsOptions = {};
    const initLocalHttpsProxyWithInvalidHttpsOpts = () => { return new LocalHttpsProxy(mockNestApp, invalidHttpsOptions); };

    expect(initLocalHttpsProxyWithInvalidHttpsOpts).toThrow('Invalid httpsOptions provided');
  });

  it('should start listening on the specified port', () => {
    const proxy = new LocalHttpsProxy(mockNestApp, httpsOptions);
    proxy.start(mockHttpsServerPort);

    expect(mockHttpsServer.listen).toHaveBeenCalledWith(mockHttpsServerPort);
  });

  it('should emit a listening event when the HTTPS server starts', () => {
    const proxy = new LocalHttpsProxy(mockNestApp, httpsOptions);
    const listeningSpy = jest.fn();
    proxy.on('listening', listeningSpy);

    proxy.start(mockHttpsServerPort);
    mockHttpsServer.emit('listening');

    expect(listeningSpy).toHaveBeenCalledWith(mockHttpsServerPort);
  });

  it('should emit an error event when the server encounters an error', () => {
    const proxy = new LocalHttpsProxy(mockNestApp, httpsOptions);
    const errorSpy = jest.fn();
    proxy.on('error', errorSpy);

    const testError = new Error('Test error');
    mockHttpsServer.emit('error', testError);

    expect(errorSpy).toHaveBeenCalledWith(testError);
  });

  it('should emit an error event when start() is called and server is already listening', () => {
    const proxy = new LocalHttpsProxy(mockNestApp, httpsOptions);
    const errorSpy = jest.fn();
    proxy.on('error', errorSpy);

    proxy.start(mockHttpsServerPort);
    proxy.start(mockHttpsServerPort);

    const expectedError = new Error(`Unable to start ${LocalHttpsProxy.name} on port ${mockHttpsServerPort} because it is already listening on port ${mockHttpsServerPort}`);
    expect(errorSpy).toHaveBeenCalledWith(expectedError);
  });

  it('should close all connections when close is called', () => {
    const proxy = new LocalHttpsProxy(mockNestApp, httpsOptions);
    proxy.start(mockHttpsServerPort);
    mockHttpsServerListeningStatus = true;
    proxy.close();
    expect(mockHttpsServer.closeAllConnections).toHaveBeenCalled();
  });

});

// Negative tests for unknown HTTP adapter
describe('LocalHttpsProxy for Unknown HTTP Adapter', () => {
  let mockHttpsAdapter = {
    getInstance: jest.fn().mockReturnValue(undefined)
  } as any;

  beforeEach(() => {
    // Reset mocks
    mockHttpsServerListeningStatus = false;
    mockNestApp.getHttpAdapter = jest.fn().mockReturnValue(mockHttpsAdapter);
  });

  it('should throw an error event when unable to derive Nest app HTTP request listener', () => {
    // Because error is emitted from constructor, we cannot subscribe to the 'error' event before it is emitted.
    // Therefore, we have to catch the error and check the message.
    // See: https://nodejs.org/api/events.html#eventtarget-error-handling
    let caughtError = undefined;
    try {
      const proxy = new LocalHttpsProxy(mockNestApp, httpsOptions);
    } catch (error) {
      caughtError = error;
      expect(error.message).toBe('Failed to derive HTTP server requestListener from Nest application');
    }
    expect(caughtError !== undefined).toBe(true);
  });
});