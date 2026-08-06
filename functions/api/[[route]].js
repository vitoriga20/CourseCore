// bff/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// bff/node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
};

// bff/node_modules/hono/dist/utils/body.js
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// bff/node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// bff/node_modules/hono/dist/request.js
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// bff/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// bff/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content2) => this.html(content2);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) {
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// bff/node_modules/hono/dist/adapter/cloudflare-pages/handler.js
var handle = (app2) => (eventContext) => {
  return app2.fetch(
    eventContext.request,
    { ...eventContext.env, eventContext },
    {
      waitUntil: eventContext.waitUntil,
      passThroughOnException: eventContext.passThroughOnException,
      props: {}
    }
  );
};

// bff/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// bff/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// bff/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// bff/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// bff/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}

// bff/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// bff/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = /* @__PURE__ */ Object.create(null);
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// bff/node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      Object.keys(middleware).forEach((m) => {
        if ((method === METHOD_NAME_ALL || method === m) && !middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        }
      });
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          if (!routes[m][path2]) {
            this.#insertPath(m, path2);
            routes[m][path2] = [
              ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
            ];
          }
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = this.#tries = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = /* @__PURE__ */ Object.create(null);
    const handlerData = [];
    [middleware, routes].forEach((r) => {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
          continue;
        }
        const paramAssoc = pathData[1];
        handlerData[pathData[0]] = handlers.map(([h, paramCount]) => {
          const paramIndexMap = /* @__PURE__ */ Object.create(null);
          paramCount -= 1;
          for (; paramCount >= 0; paramCount--) {
            const [key, value] = paramAssoc[paramCount];
            paramIndexMap[key] = value;
          }
          return [h, paramIndexMap];
        });
      }
    });
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (let i = 0, len = handlerData.length; i < len; i++) {
      for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
        const map = handlerData[i][j]?.[1];
        if (!map) {
          continue;
        }
        const keys = Object.keys(map);
        for (let k = 0, len3 = keys.length; k < len3; k++) {
          map[keys[k]] = paramReplacementMap[map[keys[k]]];
        }
      }
    }
    const handlerMap = [];
    for (const i in indexReplacementMap) {
      handlerMap[i] = handlerData[indexReplacementMap[i]];
    }
    return [regexp, handlerMap, staticMap];
  }
};

// bff/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// bff/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = (children) => {
  for (const _ in children) {
    return true;
  }
  return false;
};
var Node2 = class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// bff/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// bff/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// bff/node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "QUERY"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(",").map((h) => h.trim());
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// bff/src/middleware/security.ts
function securityHeaders() {
  return async (c, next) => {
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Cross-Origin-Resource-Policy", "same-origin");
    c.header(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
    c.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    c.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
    await next();
  };
}

// bff/src/middleware/cache.ts
function cacheMiddleware(opts) {
  const swr = opts.staleWhileRevalidate ?? opts.ttl * 2;
  return async (c, next) => {
    if (c.req.method !== "GET") return next();
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) return next();
    const cache = caches.default;
    const req = new Request(c.req.url, c.req.raw);
    const cached = await cache.match(req);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set("X-Cache", "HIT");
      return new Response(cached.body, { status: cached.status, headers });
    }
    await next();
    const resp = c.res;
    if (resp.status === 200) {
      const toCache = resp.clone();
      const headers = new Headers(toCache.headers);
      headers.set("Cache-Control", `public, max-age=${opts.ttl}, stale-while-revalidate=${swr}`);
      headers.set("X-Cache", "MISS");
      const cachedResp = new Response(toCache.body, { status: resp.status, headers });
      c.executionCtx?.waitUntil?.(cache.put(req, cachedResp));
    }
  };
}

// bff/src/middleware/rateLimit.ts
function rateLimit(opts) {
  return async (c, next) => {
    const kv = c.env.RATE_LIMIT_KV;
    if (!kv) return next();
    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    const bucket = Math.floor(Date.now() / 1e3 / opts.windowSec);
    const key = `rl:${ip}:${bucket}`;
    const current = parseInt(await kv.get(key) || "0", 10);
    if (current >= opts.limit) {
      return c.json(
        { error: "Too many requests", code: "RATE_LIMITED" },
        429,
        { "Retry-After": String(opts.windowSec) }
      );
    }
    await kv.put(key, String(current + 1), { expirationTtl: opts.windowSec + 5 });
    c.header("X-RateLimit-Limit", String(opts.limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, opts.limit - current - 1)));
    return next();
  };
}

// bff/src/routes/health.ts
var health = new Hono2();
health.get("/healthz", (c) => {
  return c.json({ status: "ok", ts: (/* @__PURE__ */ new Date()).toISOString() });
});

// bff/src/lib/supabase.ts
function parseTotal(contentRange) {
  if (!contentRange) return null;
  const last = contentRange.split("/").pop();
  if (!last || last === "*") return null;
  const n = parseInt(last, 10);
  return Number.isNaN(n) ? null : n;
}
var SupabaseRest = class {
  constructor(base, key) {
    this.base = base;
    this.key = key;
  }
  base;
  key;
  buildUrl(table, q) {
    const u = new URL(`${this.base.replace(/\/$/, "")}/rest/v1/${table}`);
    u.searchParams.set("select", q.select ?? "*");
    if (q.filters) {
      for (const [col, [op, val]] of Object.entries(q.filters)) {
        u.searchParams.set(col, `${op}.${val}`);
      }
    }
    if (q.order) u.searchParams.set("order", q.order);
    if (q.limit != null) u.searchParams.set("limit", String(q.limit));
    if (q.offset != null) u.searchParams.set("offset", String(q.offset));
    return u.toString();
  }
  async query(table, q) {
    const url = this.buildUrl(table, q);
    const headers = {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      "Content-Type": "application/json"
    };
    if (q.single) headers["Accept"] = "application/vnd.pgrst.object+json";
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Supabase ${table} ${res.status}: ${body.slice(0, 500)}`);
    }
    const data = await res.json();
    return { data, total: parseTotal(res.headers.get("content-range")) };
  }
};

// bff/src/routes/content.ts
var content = new Hono2();
var PAPER_FIELDS = "id,school,college,subject,term,duration,created_at,updated_at";
var SECTION_FIELDS = "id,exam_id,title,order_index";
var QUESTION_BASE = "id,exam_id,section_id,question_type,title,content,options,hint,image,difficulty,tags,source,order_index,answer_reveal";
var QUESTION_ANSWERS = "answer,answers,blanks,tolerance,unit,solution,test_string";
function questionFields(includeAnswer) {
  return includeAnswer ? `${QUESTION_BASE},${QUESTION_ANSWERS}` : QUESTION_BASE;
}
function jsonError(c, status, code, message) {
  return c.json({ error: message, code }, status);
}
function parsePageParams(c) {
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query("pageSize") || "20", 10) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}
content.get("/papers", async (c) => {
  try {
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const { page, pageSize, offset } = parsePageParams(c);
    const filters = {};
    const subject = c.req.query("subject");
    const school = c.req.query("school");
    const term = c.req.query("term");
    if (subject) filters.subject = ["eq", subject];
    if (school) filters.school = ["eq", school];
    if (term) filters.term = ["eq", term];
    const includeQuestions = c.req.query("includeQuestions") === "true";
    const includeAnswer = c.req.query("includeAnswer") === "true";
    const secFields = includeQuestions ? `${SECTION_FIELDS},exam_questions(${questionFields(includeAnswer)})` : SECTION_FIELDS;
    const { data, total } = await sb.query("exam_papers", {
      select: `${PAPER_FIELDS},sections:exam_sections(${secFields})`,
      filters,
      order: "created_at.desc",
      limit: pageSize,
      offset
    });
    return c.json({
      data: data ?? [],
      meta: { page, pageSize, total: total ?? data?.length ?? 0 }
    });
  } catch (e) {
    return jsonError(c, 502, "UPSTREAM_ERROR", `[DBG] ${e?.message} || ${e?.stack?.slice(0, 500)}`);
  }
});
content.get("/papers/:id", async (c) => {
  try {
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const id = c.req.param("id");
    const includeAnswer = c.req.query("includeAnswer") === "true";
    const { data } = await sb.query("exam_papers", {
      select: `${PAPER_FIELDS},sections:exam_sections(${SECTION_FIELDS},exam_questions(${questionFields(includeAnswer)}))`,
      filters: { id: ["eq", id] },
      single: true
    });
    if (!data) return jsonError(c, 404, "PAPER_NOT_FOUND", "paper not found");
    return c.json({ data });
  } catch (e) {
    return jsonError(c, 502, "UPSTREAM_ERROR", e?.message || "supabase query failed");
  }
});
content.get("/papers/:id/questions", async (c) => {
  try {
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const paperId = c.req.param("id");
    const { page, pageSize, offset } = parsePageParams(c);
    const filters = { exam_id: ["eq", paperId] };
    const sectionId = c.req.query("sectionId");
    const type = c.req.query("type");
    if (sectionId) filters.section_id = ["eq", sectionId];
    if (type) filters.question_type = ["eq", type];
    const includeAnswer = c.req.query("includeAnswer") === "true";
    const { data, total } = await sb.query("exam_questions", {
      select: questionFields(includeAnswer),
      filters,
      order: "order_index.asc",
      limit: pageSize,
      offset
    });
    return c.json({
      data: data ?? [],
      meta: { page, pageSize, total: total ?? data?.length ?? 0 }
    });
  } catch (e) {
    return jsonError(c, 502, "UPSTREAM_ERROR", e?.message || "supabase query failed");
  }
});
content.get("/questions/:id", async (c) => {
  try {
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const id = c.req.param("id");
    const includeAnswer = c.req.query("includeAnswer") === "true";
    const { data } = await sb.query("exam_questions", {
      select: questionFields(includeAnswer),
      filters: { id: ["eq", id] },
      single: true
    });
    if (!data) return jsonError(c, 404, "QUESTION_NOT_FOUND", "question not found");
    return c.json({ data });
  } catch (e) {
    return jsonError(c, 502, "UPSTREAM_ERROR", e?.message || "supabase query failed");
  }
});
content.post("/questions/:id/reveal", async (c) => {
  return jsonError(
    c,
    501,
    "NOT_IMPLEMENTED",
    "answer reveal moves to Phase 2 judge endpoint (requires auth + attempt record)"
  );
});

// bff/src/middleware/auth.ts
async function verifyAuth(c, next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header", code: "UNAUTHENTICATED" }, 401);
  }
  const token = authHeader.slice(7);
  const sbUrl = c.env.SUPABASE_URL.replace(/\/$/, "");
  const res = await fetch(`${sbUrl}/auth/v1/user`, {
    headers: {
      apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return c.json({ error: "Invalid or expired token", detail: body.slice(0, 200), code: "UNAUTHENTICATED" }, 401);
  }
  const userData = await res.json();
  const user2 = {
    id: userData.id,
    email: userData.email,
    role: userData.role
  };
  c.set("user", user2);
  await next();
}

// bff/src/routes/user.ts
var user = new Hono2();
var WRONG_BOOK_FIELDS = "id,user_id,question_id,subject_id,curve_type,stage,wrong_count,right_count,streak_correct_count,status,reason,last_wrong_at,last_correct_at,last_reviewed_at,next_review_at,last_answer,created_at,updated_at";
var ANSWER_FIELDS = "id,user_id,item_id,question_id,answer,is_correct,created_at";
var PROGRESS_FIELDS = "id,user_id,item_id,status,score,updated_at";
var DAY_MS = 864e5;
function getNextReviewAt(stage, curveType, baseTime = Date.now()) {
  const curves = {
    classic: [1, 2, 4, 7, 15],
    compact: [1, 2, 4]
  };
  const curve = curves[curveType] || curves.classic;
  const idx = Math.max(0, Math.min(stage, curve.length - 1));
  const days = curve[idx];
  return new Date(baseTime + days * DAY_MS).toISOString();
}
function isMastered(stage, streak, curveType) {
  const curves = { classic: [1, 2, 4, 7, 15], compact: [1, 2, 4] };
  const curve = curves[curveType] || curves.classic;
  return stage >= curve.length || streak >= 2;
}
function jsonError2(c, status, code, message) {
  return c.json({ error: message, code }, status);
}
user.get("/wrong-book", verifyAuth, async (c) => {
  try {
    const userId = c.get("user").id;
    const subjectId = c.req.query("subjectId");
    const status = c.req.query("status");
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const filters = { user_id: ["eq", userId] };
    if (subjectId) filters.subject_id = ["eq", subjectId];
    if (status) filters.status = ["eq", status];
    const includeQuestion = c.req.query("includeQuestion") === "true";
    const select = includeQuestion ? `${WRONG_BOOK_FIELDS},exam_questions(id,question_type,title,content,options,tags)` : WRONG_BOOK_FIELDS;
    const { data, total } = await sb.query("wrong_book", {
      select,
      filters,
      order: "next_review_at.asc",
      limit: 500
    });
    return c.json({ data: data ?? [], meta: { total } });
  } catch (e) {
    return jsonError2(c, 502, "UPSTREAM_ERROR", e?.message || "supabase query failed");
  }
});
user.post("/wrong-book", verifyAuth, async (c) => {
  try {
    const userId = c.get("user").id;
    const body = await c.req.json();
    const { question_id, subject_id, curve_type = "classic", last_answer } = body;
    if (!question_id) return jsonError2(c, 400, "VALIDATION_ERROR", "question_id is required");
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextReview = getNextReviewAt(0, curve_type);
    const { data: existing } = await sb.query("wrong_book", {
      select: "*",
      filters: { user_id: ["eq", userId], question_id: ["eq", question_id] },
      single: true
    });
    if (existing) {
      const existingAny = existing;
      const { data } = await sb.query("wrong_book", {
        select: WRONG_BOOK_FIELDS,
        filters: { id: ["eq", existingAny.id] }
      });
      const current = data[0];
      const update = {
        wrong_count: (current?.wrong_count || 0) + 1,
        right_count: 0,
        streak_correct_count: 0,
        stage: 0,
        status: "\u672A\u638C\u63E1",
        last_wrong_at: now,
        last_reviewed_at: now,
        next_review_at: nextReview,
        last_answer: last_answer ?? null,
        updated_at: now
      };
      const result2 = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${existingAny.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },
          body: JSON.stringify(update)
        }
      );
      const updated = await result2.json();
      return c.json({ data: Array.isArray(updated) ? updated[0] : updated });
    }
    const result = await fetch(`${c.env.SUPABASE_URL}/rest/v1/wrong_book`, {
      method: "POST",
      headers: {
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        user_id: userId,
        question_id,
        subject_id: subject_id ?? null,
        curve_type,
        stage: 0,
        wrong_count: 1,
        right_count: 0,
        streak_correct_count: 0,
        status: "\u672A\u638C\u63E1",
        last_wrong_at: now,
        last_reviewed_at: now,
        next_review_at: nextReview,
        last_answer: last_answer ?? null
      })
    });
    const created = await result.json();
    return c.json({ data: Array.isArray(created) ? created[0] : created });
  } catch (e) {
    return jsonError2(c, 502, "UPSTREAM_ERROR", e?.message || "supabase query failed");
  }
});
user.patch("/wrong-book/:id", verifyAuth, async (c) => {
  try {
    const userId = c.get("user").id;
    const id = c.req.param("id");
    if (!id) return jsonError2(c, 400, "VALIDATION_ERROR", "id is required");
    const body = await c.req.json();
    const { is_correct, last_answer, reason } = body;
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: existingRaw } = await sb.query("wrong_book", {
      select: "*",
      filters: { id: ["eq", id], user_id: ["eq", userId] },
      single: true
    });
    const existing = existingRaw;
    if (!existing) return jsonError2(c, 404, "NOT_FOUND", "wrong_book entry not found");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (is_correct) {
      const newStreak = (existing.streak_correct_count || 0) + 1;
      const newStage = (existing.stage || 0) + 1;
      const mastered = isMastered(newStage, newStreak, existing.curve_type);
      const update2 = {
        right_count: (existing.right_count || 0) + 1,
        streak_correct_count: newStreak,
        stage: mastered ? Math.max(newStage, existing.stage || 0) : newStage,
        status: mastered ? "\u5DF2\u638C\u63E1" : "\u590D\u4E60\u4E2D",
        last_correct_at: now,
        last_reviewed_at: now,
        next_review_at: mastered ? null : getNextReviewAt(newStage, existing.curve_type),
        last_answer: last_answer ?? null,
        updated_at: now
      };
      const result = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${id}`,
        {
          method: "PATCH",
          headers: {
            apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },
          body: JSON.stringify(update2)
        }
      );
      const updated = await result.json();
      return c.json({ data: Array.isArray(updated) ? updated[0] : updated });
    }
    const update = {
      wrong_count: (existing.wrong_count || 0) + 1,
      right_count: 0,
      streak_correct_count: 0,
      stage: 0,
      status: "\u672A\u638C\u63E1",
      reason: reason ?? existing.reason,
      last_wrong_at: now,
      last_reviewed_at: now,
      next_review_at: getNextReviewAt(0, existing.curve_type),
      last_answer: last_answer ?? null,
      updated_at: now
    };
    const result2 = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${id}`,
      {
        method: "PATCH",
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(update)
      }
    );
    const updated2 = await result2.json();
    return c.json({ data: Array.isArray(updated2) ? updated2[0] : updated2 });
  } catch (e) {
    return jsonError2(c, 502, "UPSTREAM_ERROR", e?.message || "supabase query failed");
  }
});
user.delete("/wrong-book/:id", verifyAuth, async (c) => {
  try {
    const userId = c.get("user").id;
    const id = c.req.param("id");
    if (!id) return jsonError2(c, 400, "VALIDATION_ERROR", "id is required");
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: existingRaw } = await sb.query("wrong_book", {
      select: "id,user_id",
      filters: { id: ["eq", id], user_id: ["eq", userId] },
      single: true
    });
    const existing = existingRaw;
    if (!existing) return jsonError2(c, 404, "NOT_FOUND", "entry not found or not owned by user");
    const res = await fetch(`${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    if (!res.ok) return jsonError2(c, 502, "DELETE_FAILED", "failed to delete");
    return c.json({ ok: true });
  } catch (e) {
    return jsonError2(c, 502, "UPSTREAM_ERROR", e?.message || "supabase query failed");
  }
});
user.get("/practice-records", verifyAuth, async (c) => {
  try {
    const userId = c.get("user").id;
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const page = Math.max(1, parseInt(c.req.query("page") || "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query("pageSize") || "20", 10) || 20));
    const subjectId = c.req.query("subjectId");
    const filters = { user_id: ["eq", userId] };
    if (subjectId) filters.subject_id = ["eq", subjectId];
    const { data, total } = await sb.query("practice_records", {
      select: "*",
      filters,
      order: "created_at.desc",
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
    return c.json({ data: data ?? [], meta: { page, pageSize, total } });
  } catch (e) {
    return jsonError2(c, 502, "UPSTREAM_ERROR", e?.message || "supabase query failed");
  }
});
user.post("/practice-records", verifyAuth, async (c) => {
  try {
    const userId = c.get("user").id;
    const body = await c.req.json();
    const {
      mode,
      source_id,
      source_name,
      subject_id,
      total,
      answered,
      correct,
      wrong,
      duration_seconds,
      details
    } = body;
    if (!mode) return jsonError2(c, 400, "VALIDATION_ERROR", "mode is required");
    const payload = {
      user_id: userId,
      mode,
      source_id: source_id ?? null,
      source_name: source_name ?? null,
      subject_id: subject_id ?? null,
      total: total ?? 0,
      answered: answered ?? 0,
      correct: correct ?? 0,
      wrong: wrong ?? 0,
      duration_seconds: duration_seconds ?? 0,
      details: details ?? null,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const res = await fetch(`${c.env.SUPABASE_URL}/rest/v1/practice_records`, {
      method: "POST",
      headers: {
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const body2 = await res.text().catch(() => "");
      return jsonError2(c, 502, "UPSTREAM_ERROR", `insert failed: ${body2.slice(0, 300)}`);
    }
    const created = await res.json();
    return c.json({ data: Array.isArray(created) ? created[0] : created });
  } catch (e) {
    return jsonError2(c, 502, "UPSTREAM_ERROR", e?.message || "supabase query failed");
  }
});
user.get("/progress", verifyAuth, async (c) => {
  try {
    const userId = c.get("user").id;
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const [{ data: answers }, { data: progress }] = await Promise.all([
      sb.query("answers", {
        select: ANSWER_FIELDS,
        filters: { user_id: ["eq", userId] },
        order: "created_at.desc",
        limit: 5e3
      }),
      sb.query("progress", {
        select: PROGRESS_FIELDS,
        filters: { user_id: ["eq", userId] }
      })
    ]);
    return c.json({ data: { answers: answers ?? [], progress: progress ?? [] } });
  } catch (e) {
    return jsonError2(c, 502, "UPSTREAM_ERROR", e?.message || "supabase query failed");
  }
});
user.post("/progress", verifyAuth, async (c) => {
  try {
    const userId = c.get("user").id;
    const body = await c.req.json();
    const { answer_records = [], progress_updates = [] } = body;
    if (answer_records.length > 0) {
      const mapped = answer_records.map((r) => ({
        user_id: userId,
        item_id: r.item_id ?? null,
        question_id: r.question_id,
        answer: r.answer ?? null,
        is_correct: r.is_correct
      }));
      await fetch(`${c.env.SUPABASE_URL}/rest/v1/answers`, {
        method: "POST",
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(mapped)
      });
    }
    if (progress_updates.length > 0) {
      const mapped = progress_updates.map((p) => ({
        user_id: userId,
        item_id: p.item_id,
        status: p.status,
        score: p.score ?? null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }));
      await fetch(`${c.env.SUPABASE_URL}/rest/v1/progress?on_conflict=user_id,item_id`, {
        method: "POST",
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify(mapped)
      });
    }
    return c.json({ ok: true, inserted_answers: answer_records.length, upserted_progress: progress_updates.length });
  } catch (e) {
    return jsonError2(c, 502, "UPSTREAM_ERROR", e?.message || "supabase query failed");
  }
});

// bff/src/routes/judge.ts
var judge = new Hono2();
function jsonError3(c, status, code, message) {
  return c.json({ error: message, code }, status);
}
judge.post("/questions/:id/judge", verifyAuth, async (c) => {
  try {
    const userId = c.get("user").id;
    const questionId = c.req.param("id");
    if (!questionId) return jsonError3(c, 400, "VALIDATION_ERROR", "question id is required");
    const body = await c.req.json();
    const { user_answer, subject_id, curve_type = "classic" } = body;
    if (!user_answer) return jsonError3(c, 400, "VALIDATION_ERROR", "user_answer is required");
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: question } = await sb.query("exam_questions", {
      select: "id,question_type,answer,answers,blanks,tolerance,unit,solution,content,options,answer_reveal",
      filters: { id: ["eq", questionId] },
      single: true
    });
    if (!question) return jsonError3(c, 404, "QUESTION_NOT_FOUND", "question not found");
    const q = question;
    const userAns = user_answer;
    let isCorrect = false;
    switch (q.question_type) {
      case 0:
      // 单选
      case 1:
        isCorrect = String(userAns).trim().toLowerCase() === String(q.answer).trim().toLowerCase();
        break;
      case 2: {
        const blanks = q.blanks || 1;
        const tol = q.tolerance ?? 0;
        const answers = q.answers || [];
        if (Array.isArray(userAns)) {
          isCorrect = userAns.length === blanks && userAns.every((ua, i) => {
            const expected = answers[i] ?? q.answer;
            const uaNum = parseFloat(ua);
            const expNum = parseFloat(expected);
            if (!isNaN(uaNum) && !isNaN(expNum)) {
              return Math.abs(uaNum - expNum) <= (tol || 0);
            }
            return String(ua).trim() === String(expected).trim();
          });
        } else {
          isCorrect = String(userAns).trim() === String(q.answer).trim();
        }
        break;
      }
      case 3: {
        isCorrect = String(userAns).trim() === String(q.answer).trim();
        break;
      }
      case 4:
        isCorrect = String(userAns).trim() === String(q.answer).trim();
        break;
      default:
        isCorrect = String(userAns).trim() === String(q.answer).trim();
    }
    await fetch(`${c.env.SUPABASE_URL}/rest/v1/answers`, {
      method: "POST",
      headers: {
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: userId,
        question_id: questionId,
        answer: userAns,
        is_correct: isCorrect,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      })
    });
    const existingWb = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/wrong_book?user_id=eq.${userId}&question_id=eq.${questionId}`,
      {
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const wbData = await existingWb.json();
    const wbEntry = Array.isArray(wbData) ? wbData[0] : null;
    const DAY_MS2 = 864e5;
    const curves = { classic: [1, 2, 4, 7, 15], compact: [1, 2, 4] };
    const curve = curves[curve_type] || curves.classic;
    if (wbEntry) {
      if (isCorrect) {
        const newStreak = (wbEntry.streak_correct_count || 0) + 1;
        const newStage = (wbEntry.stage || 0) + 1;
        const mastered = newStage >= curve.length || newStreak >= 2;
        const days = mastered ? 0 : curve[Math.max(0, Math.min(newStage, curve.length - 1))];
        const update = {
          right_count: (wbEntry.right_count || 0) + 1,
          streak_correct_count: newStreak,
          stage: mastered ? Math.max(newStage, wbEntry.stage || 0) : newStage,
          status: mastered ? "\u5DF2\u638C\u63E1" : "\u590D\u4E60\u4E2D",
          last_correct_at: (/* @__PURE__ */ new Date()).toISOString(),
          last_reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
          next_review_at: mastered ? null : new Date(Date.now() + days * DAY_MS2).toISOString(),
          last_answer: userAns,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        await fetch(`${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${wbEntry.id}`, {
          method: "PATCH",
          headers: {
            apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(update)
        });
      } else {
        const days = curve[0];
        const update = {
          wrong_count: (wbEntry.wrong_count || 0) + 1,
          right_count: 0,
          streak_correct_count: 0,
          stage: 0,
          status: "\u672A\u638C\u63E1",
          last_wrong_at: (/* @__PURE__ */ new Date()).toISOString(),
          last_reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
          next_review_at: new Date(Date.now() + days * DAY_MS2).toISOString(),
          last_answer: userAns,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        await fetch(`${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${wbEntry.id}`, {
          method: "PATCH",
          headers: {
            apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(update)
        });
      }
    } else if (!isCorrect) {
      const days = curve[0];
      await fetch(`${c.env.SUPABASE_URL}/rest/v1/wrong_book`, {
        method: "POST",
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          question_id: questionId,
          subject_id: subject_id ?? null,
          curve_type,
          stage: 0,
          wrong_count: 1,
          right_count: 0,
          streak_correct_count: 0,
          status: "\u672A\u638C\u63E1",
          last_wrong_at: (/* @__PURE__ */ new Date()).toISOString(),
          last_reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
          next_review_at: new Date(Date.now() + days * DAY_MS2).toISOString(),
          last_answer: userAns
        })
      });
    }
    const reveal = q.answer_reveal || "after_submit";
    const shouldReveal = reveal === "after_submit" || reveal === "immediate";
    return c.json({
      data: {
        question_id: questionId,
        is_correct: isCorrect,
        user_answer: userAns,
        answer: shouldReveal ? q.answer : null,
        answers: shouldReveal ? q.answers : null,
        solution: shouldReveal ? q.solution : null,
        tolerance: shouldReveal ? q.tolerance : null,
        unit: shouldReveal ? q.unit : null
      }
    });
  } catch (e) {
    return jsonError3(c, 502, "UPSTREAM_ERROR", e?.message || "judge failed");
  }
});
judge.post("/questions/:id/reveal", verifyAuth, async (c) => {
  try {
    const userId = c.get("user").id;
    const questionId = c.req.param("id");
    if (!questionId) return jsonError3(c, 400, "VALIDATION_ERROR", "question id is required");
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: question } = await sb.query("exam_questions", {
      select: "id,answer,answers,blanks,tolerance,unit,solution,answer_reveal",
      filters: { id: ["eq", questionId] },
      single: true
    });
    if (!question) return jsonError3(c, 404, "QUESTION_NOT_FOUND", "question not found");
    const q = question;
    const reveal = q.answer_reveal || "after_submit";
    if (reveal === "immediate") {
      return c.json({
        data: {
          answer: q.answer,
          answers: q.answers,
          solution: q.solution,
          tolerance: q.tolerance,
          unit: q.unit
        }
      });
    }
    const { data: attempts } = await sb.query("answers", {
      select: "id",
      filters: { user_id: ["eq", userId], question_id: ["eq", questionId] },
      limit: 1
    });
    if (attempts && attempts.length > 0) {
      return c.json({
        data: {
          answer: q.answer,
          answers: q.answers,
          solution: q.solution,
          tolerance: q.tolerance,
          unit: q.unit
        }
      });
    }
    return jsonError3(c, 403, "REVEAL_NOT_AUTHORIZED", "submit an answer first to reveal");
  } catch (e) {
    return jsonError3(c, 502, "UPSTREAM_ERROR", e?.message || "reveal failed");
  }
});

// bff/src/routes/leaderboard.ts
var leaderboard = new Hono2();
leaderboard.get("/", async (c) => {
  try {
    const sbUrl = c.env.SUPABASE_URL.replace(/\/$/, "");
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "10", 10) || 10));
    const res = await fetch(`${sbUrl}/rest/v1/rpc/get_leaderboard`, {
      headers: {
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return c.json({ error: "leaderboard rpc failed", detail: body.slice(0, 300), code: "UPSTREAM_ERROR" }, 502);
    }
    const data = await res.json();
    return c.json({ data: Array.isArray(data) ? data.slice(0, limit) : [] });
  } catch (e) {
    return c.json({ error: e?.message || "leaderboard failed", code: "UPSTREAM_ERROR" }, 502);
  }
});

// bff/src/app.ts
var app = new Hono2();
app.use("*", securityHeaders());
app.use(
  "/api/*",
  cors({
    origin: "*",
    // 生产可收紧为具体域名
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400
  })
);
app.use("/api/v1/*", rateLimit({ limit: 120, windowSec: 60 }));
app.use("/api/v1/*", async (c, next) => {
  const ttl = parseInt(c.env.CONTENT_CACHE_TTL || "300", 10) || 300;
  return cacheMiddleware({ ttl })(c, next);
});
app.route("/api/v1", health);
app.route("/api/v1", content);
app.route("/api/v1/me", user);
app.route("/api/v1", judge);
app.route("/api/v1/leaderboard", leaderboard);
app.notFound((c) => c.json({ error: "Not Found", code: "NOT_FOUND" }, 404));
app.onError((err, c) => {
  console.error("[bff] unhandled", err);
  return c.json({ error: "Internal Server Error", code: "INTERNAL" }, 500);
});

// bff/src/pages-entry.ts
var onRequest = handle(app);
export {
  onRequest
};
