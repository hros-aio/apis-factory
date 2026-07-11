export interface SwaggerSetupOptions {
  /**
   * Title of the API documentation.
   */
  title?: string;

  /**
   * Description of the API.
   */
  description?: string;

  /**
   * Current version of the API (e.g. '1.0.0').
   */
  version?: string;

  /**
   * Optional server base URL.
   */
  serverUrl?: string;

  /**
   * Whether to enable Bearer Auth support.
   */
  bearerAuth?: boolean;

  /**
   * Document tags.
   */
  tags?: string[];

  /**
   * External documentation title.
   */
  externalDocTitle?: string;

  /**
   * External documentation URL.
   */
  externalDocUrl?: string;

  /**
   * Route path where Swagger UI will be mounted (defaults to 'docs' or SWAGGER_PATH env).
   */
  path?: string;

  /**
   * Force enable or disable Swagger, overriding the SWAGGER_ENABLED env variable.
   */
  enabled?: boolean;
}
