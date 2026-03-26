/* eslint-disable no-magic-numbers */
const HTTP_OK = 200 as const;
const HTTP_CREATED = 201 as const;
const HTTP_NO_CONTENT = 204 as const;
const HTTP_REDIRECT = 302 as const;
const HTTP_BAD_REQUEST = 400 as const;
const HTTP_UNAUTHORIZED = 401 as const;
const HTTP_NOT_FOUND = 404 as const;
const HTTP_CONFLICT = 409 as const;
const HTTP_INTERNAL_ERROR = 500 as const;
const HTTP_BAD_GATEWAY = 502 as const;
/* eslint-enable no-magic-numbers */

export {
  HTTP_BAD_GATEWAY,
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_CREATED,
  HTTP_INTERNAL_ERROR,
  HTTP_NO_CONTENT,
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_REDIRECT,
  HTTP_UNAUTHORIZED,
};
