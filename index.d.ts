/// <reference types="node" />

import { Server } from 'http';
import { RequestHandler } from 'express';

/**
 * Options for creating a standalone proxy server
 */
export interface ProxyOptions {
  /**
   * Target URL to proxy requests to (required, fixed)
   */
  target: string;

  /**
   * Set Host header to target (default: false)
   */
  changeOrigin?: boolean;

  /**
   * Port for proxy server (default: 3000)
   */
  port?: number;

  /**
   * Logger configuration (optional)
   */
  logger?: LoggerOptions;
}

/**
 * Options for creating a proxy middleware
 */
export interface ProxyMiddlewareOptions {
  /**
   * Target URL to proxy requests to (required, fixed)
   */
  target: string;

  /**
   * Set Host header to target (default: false)
   */
  changeOrigin?: boolean;
}

/**
 * Options for logger plugin
 */
export interface LoggerOptions {
  /**
   * Directory to store log files (default: './logs')
   */
  logDir?: string;

  /**
   * Maximum days to keep logs (default: 7)
   */
  maxDays?: number;
}

/**
 * Create standalone HTTP/HTTPS proxy server
 * @param options - Proxy configuration
 * @returns HTTP Server instance
 *
 * @example
 * ```typescript
 * const { createProxy } = require('simple-proxy-id');
 *
 * // Without logger
 * const server = createProxy({
 *   target: 'https://api.example.com',
 *   changeOrigin: true,
 *   port: 3000
 * });
 *
 * // With logger
 * const serverWithLogger = createProxy({
 *   target: 'https://api.example.com',
 *   changeOrigin: true,
 *   port: 3000,
 *   logger: {
 *     logDir: './logs',
 *     maxDays: 7
 *   }
 * });
 * ```
 */
export function createProxy(options: ProxyOptions): Server;

/**
 * Create Express middleware for proxy
 * @param options - Proxy configuration
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const express = require('express');
 * const { createProxyMiddleware } = require('simple-proxy-id');
 *
 * const app = express();
 *
 * app.use('/api', createProxyMiddleware({
 *   target: 'https://api.example.com',
 *   changeOrigin: true
 * }));
 * ```
 */
export function createProxyMiddleware(options: ProxyMiddlewareOptions): RequestHandler;

/**
 * Create logger middleware for tracking requests
 * @param options - Logger configuration
 * @returns Express/Connect middleware function
 *
 * @example
 * ```typescript
 * const createLogger = require('simple-proxy-id/logger');
 *
 * app.use(createLogger({
 *   logDir: './logs',
 *   maxDays: 7
 * }));
 * ```
 */
export function createLogger(options?: LoggerOptions): RequestHandler;
