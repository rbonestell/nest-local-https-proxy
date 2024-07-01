import * as https from 'https';
import { EventEmitter } from 'events';
import { AddressInfo } from 'net';
import { SecureContextOptions } from 'tls';
import { INestApplication } from '@nestjs/common';

/**
 * **⚠ DISCLAIMER: For local development use only! ⚠**
 * 
 * This is intended only for local development, testing, and troubleshooting.
 * It is not recommended to use this in any production context or public-facing environment.
 * 
 * @fires LocalHttpsProxy#listening when when the encapsulated {@link https.Server} successfully binds to a port and begins listening for connections.
 * @fires LocalHttpsProxy#error for any error condition which occurs after initialization of the LocalHttpsProxy instance.
 */
export class LocalHttpsProxy extends EventEmitter implements LocalHttpsProxy {

	private readonly httpsProxyServer: https.Server;

	/**
	 * @param nestApp NestJS application instance.
	 * @param httpsOptions Accepts {@link https.createServer}(`options`: {@link SecureContextOptions}) parameter from `node:https`. Object _must_ include `cert` and `key` properties.
	 * @param errorCallback Optional: Callback function called when any error condition occurs within the LocalHttpsProxy instance.
	 * @param listeningCallback Optional: Callback function called when the encapsulated {@link https.Server} successfully binds to a port and begins listening for connections.
	 * @throws When initialization of {@link https.Server} fails.
	 */
	constructor(
		nestApp: INestApplication,
		httpsOptions: SecureContextOptions,
		errorCallback?: (error: Error) => void,
		listeningCallback?: (port: number) => void
	) {
		super();
		if (!httpsOptions || !httpsOptions.cert || !httpsOptions.key)
			throw new Error('Invalid httpsOptions provided');
		this.httpsProxyServer = this.initHttpsServer(httpsOptions, nestApp);

		// Subscribe to events if callback functions provided
		if (errorCallback && errorCallback instanceof Function)
			this.on('error', errorCallback);
		if (listeningCallback && listeningCallback instanceof Function)
			this.on('listening', listeningCallback);
	}

	/**
	 * Start LocalHttpsProxy instance.
	 * @param listeningPort Optional: Port on which to listen for HTTPS connections, if not provided then an open port will be automatically assigned.
	 * @example <caption>Start a local HTTPS proxy listening on `0.0.0.0:43000`, proxying requests to your Nest app's HTTP server:</caption>
	 * const localHttpsProxy = new LocalHttpsProxy(app, httpsOptions); 
	 * localHttpsProxy.start(43000);
	 */
	public start(listeningPort?: number) {
		if (!this.httpsProxyServer?.listening) {
			this.httpsProxyServer.listen(listeningPort);
		} else if (this.httpsProxyServer.listening) {
			const address = this.httpsProxyServer.address() as AddressInfo;
			this.onError(new Error(`Unable to start ${LocalHttpsProxy.name} on port ${listeningPort} because it is already listening on port ${address.port}`));
		}
	}

	/**
	 * Stop LocalHttpsProxy and close all open connections.
	 */
	public close() {
		if (this.httpsProxyServer?.listening)
			this.httpsProxyServer.closeAllConnections();
	}

	/**
	 * Initialize private encapsulated instance of `https.Server`.
	 * @param httpsOptions Options used during `https.Server` initialization.
	 * @param nestApp NestJS application instance.
	 * @returns New {@link https.Server} instance configured using {@link httpsOptions}.
	 */
	private initHttpsServer(httpsOptions: SecureContextOptions, nestApp: INestApplication): https.Server {
		// Observe existing HTTP server in Nest app
		const requestListener = this.getNestAppRequestListener(nestApp);

		// Initialize new HTTPS server
		const httpsServer = https.createServer(httpsOptions, requestListener);
		httpsServer.on('error', (error) => this.onError(error));
		httpsServer.on('listening', () => this.onListening());
		return httpsServer;
	}

	/**
	 * Derive the requestListener from the HTTP server in the Nest Application instance.
	 * @param nestApp NestJS application instance.
	 * @returns requestListener from the HTTP server within Nest Application, or undefined if unavailable.
	 */
	private getNestAppRequestListener(nestApp: INestApplication) {
		const adapter = nestApp.getHttpAdapter();
		const listener = adapter?.getInstance()?.routing ?? adapter?.getInstance();
		if (!listener)
			throw new Error('Failed to derive HTTP server requestListener from Nest application');
		return listener;
	}

	private onError(error: Error) {
		/**
		 * Error Event
		 * @event LocalHttpsProxy#error
		 * @type {Error}
		 */
		this.emit('error', error);
	}

	private onListening() {
		const address = this.httpsProxyServer?.address() as AddressInfo;
		/**
		 * HTTPS Server Started Listening Event
		 * @event LocalHttpsProxy#listening
		 * @type {string}
		 */
		this.emit('listening', address?.port);
	}
}

export declare interface LocalHttpsProxy {
	/**
	 * Emitted when the encapsulated {@link https.Server} successfully binds to a port and begins listening for connections.
	 */
	on(event: 'listening', listener: (port: number) => void): this;

	/**
	 * Emitted for any error condition which occurs within the LocalHttpsProxy instance.
	 */
	on(event: 'error', listener: (error: Error) => void): this;
}