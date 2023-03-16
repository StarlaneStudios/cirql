var Je = Object.defineProperty;
var ze = (e, t, n) => t in e ? Je(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var j = (e, t, n) => (ze(e, typeof t != "symbol" ? t + "" : t, n), n), Re = (e, t, n) => {
  if (!t.has(e))
    throw TypeError("Cannot " + n);
};
var r = (e, t, n) => (Re(e, t, "read from private field"), n ? n.call(e) : t.get(e)), p = (e, t, n) => {
  if (t.has(e))
    throw TypeError("Cannot add the same private member more than once");
  t instanceof WeakSet ? t.add(e) : t.set(e, n);
}, N = (e, t, n, i) => (Re(e, t, "write to private field"), i ? i.call(e, n) : t.set(e, n), n), Ie = (e, t, n, i) => ({
  set _(s) {
    N(e, t, s, n);
  },
  get _() {
    return r(e, t, i);
  }
}), E = (e, t, n) => (Re(e, t, "access private method"), n);
import Be from "isomorphic-ws";
import { z as q } from "zod";
class Ge extends Event {
  constructor(n, i) {
    super("close");
    j(this, "code");
    j(this, "reason");
    this.code = n, this.reason = i;
  }
}
class He extends Event {
  constructor(n) {
    super("error");
    j(this, "error");
    this.error = n;
  }
}
const Ye = (e) => e.errors.map((n) => `- @${n.path.join(".")}: ${n.message}`).join(`
`);
class M extends Error {
  constructor(n, i) {
    super(n);
    j(this, "code");
    this.code = i;
  }
}
class Ve extends M {
  constructor(n, i) {
    super(n + `
` + Ye(i), "parse_failure");
    j(this, "reason");
    this.reason = i;
  }
}
class b extends M {
  constructor(n, i) {
    super(n, "invalid_query");
    j(this, "query");
    this.query = i;
  }
}
class Ze extends M {
  constructor(n) {
    super(`One or more queries returned a non-successful status code: 
${n.join(`
`)}`, "query_failure");
    j(this, "errors");
    this.errors = n;
  }
}
class Se extends M {
  constructor(t) {
    super(t, "auth_failure");
  }
}
const U = Symbol("Query Raw");
function o(e) {
  return {
    [U]: e
  };
}
function St(e) {
  return o(`$${e}`);
}
function Ke(e) {
  return o(`type::bool(${u(e)})`);
}
function We(e) {
  return o(`type::datetime(${u(e)})`);
}
function Xe(e) {
  return o(`type::decimal(${u(e)})`);
}
function _e(e) {
  return o(`type::duration(${u(e)})`);
}
function et(e) {
  return o(`type::float(${u(e)})`);
}
function tt(e) {
  return o(`type::int(${u(e)})`);
}
function nt(e) {
  return o(`type::number(${u(e)})`);
}
function rt(e, t) {
  return o(t ? `type::point(${u(e)}, ${u(t)})` : `type::point(${u(e)})`);
}
function it(e) {
  return o(`type::regex(${u(e)})`);
}
function st(e) {
  return o(`type::string(${u(e)})`);
}
function ot(e) {
  return o(`type::table(${u(e)})`);
}
function ut(e, t) {
  return o(`type::thing(${u(e)}, ${u(t)})`);
}
const Ue = {
  bool: Ke,
  datetime: We,
  decimal: Xe,
  duration: _e,
  float: et,
  int: tt,
  number: nt,
  point: rt,
  regex: it,
  string: st,
  table: ot,
  thing: ut
}, Le = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function at(e) {
  let t = "";
  for (let n = 0; n < 7; n++)
    t += Le.charAt(Math.floor(Math.random() * Le.length));
  return e ? `${t}_${e}` : t;
}
function le(e, t) {
  return `type::thing(${JSON.stringify(e)}, ${JSON.stringify(t)})`;
}
function he(e) {
  return e.fromTable ? Ue.thing(e.fromTable, e.fromId) : o(u(e.fromId));
}
function fe(e) {
  return e.toTable ? Ue.thing(e.toTable, e.toId) : o(u(e.toId));
}
function qe(e) {
  return typeof e == "object" && e !== null && !!e[U];
}
function ke(e) {
  return typeof e == "object" && e !== null && "toQuery" in e;
}
function de(...e) {
  return e.some((t) => typeof t == "string" && t.includes(","));
}
function u(e) {
  if (e === void 0)
    throw new Error("Cannot use undefined value");
  return qe(e) ? e[U] : ke(e) ? `(${e.toQuery()})` : e instanceof Date ? JSON.stringify(e.toISOString()) : e === null ? "NONE" : JSON.stringify(e);
}
function V(e, t) {
  if (e === void 0)
    throw new Error("Cannot use undefined value");
  return qe(e) ? t ? `(${e[U]})` : e[U] : ke(e) ? `(${e.toQuery()})` : e instanceof Date ? e.toISOString() : e === null ? "NONE" : e;
}
function ct(e) {
  const t = new URL("rpc", e.connection.endpoint.replace("http", "ws")), n = setInterval(() => a("ping"), 3e4), i = new Be(t), s = /* @__PURE__ */ new Map();
  let c = !1;
  const a = (f, l = []) => {
    const C = at();
    return new Promise((v, O) => {
      s.set(C, [v, O]), i.send(JSON.stringify({
        id: C,
        method: f,
        params: l
      })), setTimeout(() => {
        s.delete(C) && O(new Error("Request timed out"));
      }, 5e3);
    });
  }, h = (f, l) => {
    var C;
    clearInterval(n), (C = e.onDisconnect) == null || C.call(e, f, l);
  }, y = () => {
    c = !0, i.close(), h(-1, "connection terminated");
  }, w = async (f, l) => a("query", l ? [f, l] : [f]), d = async (f) => {
    try {
      return "token" in f ? (await a("authenticate", [f.token]), f.token) : await a("signin", [f]);
    } catch (l) {
      throw new Se("Authentication failed: " + (l.message || "unknown error"));
    }
  }, m = async (f) => {
    try {
      return await a("signup", [f]);
    } catch (l) {
      throw new Se("Registration failed: " + (l.message || "unknown error"));
    }
  }, k = async () => {
    try {
      await a("invalidate");
    } catch (f) {
      throw new Se("Sign out failed: " + (f.message || "unknown error"));
    }
  };
  return i.addEventListener("open", async () => {
    var C;
    const { namespace: f, database: l } = e.connection;
    e.credentials && d(e.credentials), f && l && a("use", [f, l]), (C = e.onConnect) == null || C.call(e);
  }), i.addEventListener("close", (f) => {
    c || h(f.code, f.reason);
  }), i.addEventListener("message", (f) => {
    const { id: l, result: C, method: v, error: O } = JSON.parse(f.data);
    if (v !== "notify")
      if (!s.has(l))
        console.warn("No callback for message", f.data);
      else {
        const [P, G] = s.get(l);
        s.delete(l), O ? G(O) : P(C);
      }
  }), i.addEventListener("error", (f) => {
    var l;
    (l = e.onError) == null || l.call(e, f.error);
  }), {
    close: y,
    query: w,
    signIn: d,
    signUp: m,
    signOut: k
  };
}
var H, ue, Ce, $e, Pe, Ee, Qe;
class xe extends EventTarget {
  constructor(n) {
    super();
    p(this, ue);
    p(this, $e);
    p(this, Ee);
    p(this, H, void 0);
    N(this, H, n);
  }
  /**
   * Execute a single query and return the result
   * 
   * @param request The query to execute
   * @returns The result of the query
   */
  async execute(n) {
    return (await this.batch(n))[0];
  }
  /**
   * Execute multiple queries and return the results in the same order
   * 
   * @param request The queries to execute
   * @returns The results of the queries, can be destructured
   */
  async batch(...n) {
    return E(this, ue, Ce).call(this, {
      queries: n,
      prefix: "",
      suffix: ""
    });
  }
  /**
   * Execute multiple queries and return the results in the same order. Unlike
   * `batch`, this method will execute the queries in a transaction.
   * 
   * @param request The queries to execute
   * @returns The results of the queries, can be destructured
   */
  async transaction(...n) {
    return E(this, ue, Ce).call(this, {
      queries: n,
      prefix: "BEGIN TRANSACTION",
      suffix: "COMMIT TRANSACTION"
    });
  }
}
H = new WeakMap(), ue = new WeakSet(), Ce = async function(n) {
  var y;
  if (!r(this, H).onRequest())
    throw new M("There is no active connection to the database", "no_connection");
  if (n.queries.length === 0)
    return [];
  const i = E(this, Ee, Qe).call(this, n), s = E(this, $e, Pe).call(this, n), c = [], a = [];
  r(this, H).onLog(s, i);
  const h = await r(this, H).onQuery(s, i);
  if (!Array.isArray(h) || h.length !== n.queries.length)
    throw new M("The response from the database was invalid", "invalid_response");
  for (let w = 0; w < h.length; w++) {
    const { status: d, detail: m } = h[w];
    d !== "OK" && c.push(`- Query ${w + 1}: ${m}`);
  }
  if (c.length > 0)
    throw new Ze(c);
  for (let w = 0; w < h.length; w++) {
    const { result: d } = h[w], { query: m, schema: k, validate: f } = n.queries[w], l = m._quantity;
    if (l == "zero") {
      a.push(void 0);
      continue;
    }
    const C = ((y = m._transform) == null ? void 0 : y.call(m, d)) ?? d, v = Array.isArray(C) ? C : [C];
    let O;
    if (f === !1)
      O = v;
    else {
      const P = m._schema || k;
      if (!P)
        throw new M(`No schema provided for query ${w + 1}`, "invalid_request");
      const G = P.array().safeParse(v);
      if (!G.success)
        throw new Ve(`Query ${w + 1} failed to parse`, G.error);
      O = G.data;
    }
    if (l == "one" && O.length === 0) {
      if (m._fallback === void 0)
        throw new M(`Query ${w + 1} expected at least one result but got ${O.length}`, "invalid_response");
      a.push(m._fallback);
      continue;
    }
    if (l == "one" || l == "maybe") {
      if (O.length > 1)
        throw new M(`Query ${w + 1} expected at most one result but got ${O.length}`, "invalid_response");
      a.push(O[0] || null);
      continue;
    }
    a.push(O);
  }
  return a;
}, $e = new WeakSet(), Pe = function(n) {
  let i = n.queries.map((s) => s.query.toQuery());
  return n.prefix && (i = [n.prefix, ...i]), n.suffix && (i = [...i, n.suffix]), i.join(`;
`);
}, Ee = new WeakSet(), Qe = function(n) {
  const i = {};
  for (const s of n.queries)
    for (const [c, a] of Object.entries(s.params || {})) {
      if (c in i)
        throw new M(`The parameter "${c}" was defined multiple times`, "invalid_query");
      i[c] = a;
    }
  return i;
};
var Z, D, J, K, W;
class Ct extends xe {
  constructor(n) {
    super({
      onQuery: (i, s) => this.handle.query(i, s),
      onRequest: () => this.isConnected && !!this.handle,
      onLog: (i, s) => {
        this.options.logging && this.options.logPrinter(i, s);
      }
    });
    j(this, "options");
    p(this, Z, null);
    p(this, D, !1);
    p(this, J, !1);
    p(this, K, 0);
    p(this, W, void 0);
    this.options = {
      autoConnect: !0,
      logging: !1,
      logPrinter: (i) => console.log(i),
      retryCount: 10,
      retryDelay: 2e3,
      ...n
    }, n.autoConnect !== !1 && this.connect();
  }
  /**
   * Returns whether the database is connected or not
   */
  get isConnected() {
    return r(this, J) && !r(this, D);
  }
  /**
   * Returns the underlying Surreal handle
   */
  get handle() {
    return r(this, Z);
  }
  /**
   * Manually open a connection to the Surreal database
   */
  connect() {
    r(this, J) || r(this, D) || (this.dispatchEvent(new Event("connect")), N(this, D, !0), N(this, Z, ct({
      connection: this.options.connection,
      credentials: this.options.credentials,
      onConnect: () => {
        clearTimeout(r(this, W)), N(this, K, 0), N(this, W, void 0), N(this, J, !0), N(this, D, !1), this.dispatchEvent(new Event("open"));
      },
      onDisconnect: (n, i) => {
        N(this, J, !1), N(this, D, !1), this.dispatchEvent(new Ge(n, i));
        const { retryCount: s, retryDelay: c } = this.options;
        (s < 0 || s > 0 && r(this, K) < s) && (Ie(this, K)._++, N(this, W, setTimeout(() => this.connect(), c)));
      },
      onError: (n) => {
        this.dispatchEvent(new He(n));
      }
    })));
  }
  /**
   * Terminate the active connection
   */
  disconnect() {
    var n;
    r(this, J) && ((n = r(this, Z)) == null || n.close());
  }
  /**
   * Returns a promise which resolves when the connection is ready
   * 
   * @returns A promise
   */
  ready() {
    return this.isConnected ? Promise.resolve() : new Promise((n, i) => {
      this.addEventListener("open", () => n(), { once: !0 }), this.addEventListener("error", (s) => i(s), { once: !0 });
    });
  }
  signIn(n) {
    return this.handle.signIn(n);
  }
  signUp(n) {
    return this.handle.signUp(n);
  }
  signOut() {
    return this.handle.signOut();
  }
}
Z = new WeakMap(), D = new WeakMap(), J = new WeakMap(), K = new WeakMap(), W = new WeakMap();
var be, De;
class Tt extends xe {
  constructor(n) {
    super({
      onQuery: (i, s) => E(this, be, De).call(this, i, s),
      onRequest: () => !0,
      onLog: (i, s) => {
        this.options.logging && this.options.logPrinter(i, s);
      }
    });
    p(this, be);
    j(this, "options");
    this.options = {
      logging: !1,
      logPrinter: (i) => console.log(i),
      ...n
    };
  }
  signIn(n) {
    throw new Error("Stateless queries do not support authentication yet");
  }
  signUp(n) {
    throw new Error("Stateless queries do not support authentication yet");
  }
  signOut() {
    throw new Error("Stateless queries do not support authentication yet");
  }
}
be = new WeakSet(), De = async function(n, i) {
  const { endpoint: s, namespace: c, database: a } = this.options.connection, { user: h, pass: y, DB: w, NS: d, SC: m, token: k } = this.options.credentials, f = new URLSearchParams(), l = new URL("sql", s);
  if (!h && !y && !k)
    throw new M("Missing username & password or token", "invalid_request");
  const v = {
    "User-Agent": "Cirql",
    Authorization: k ? `Bearer ${k}` : `Basic ${btoa(`${h}:${y}`)}`,
    Accept: "application/json"
  };
  return (d || c) && (v.NS = d || c), (w || a) && (v.DB = w || a), m && (v.SC = m), Object.entries(i).forEach(([P, G]) => {
    f.set(P, G);
  }), await fetch(`${l}?${f}`, {
    method: "POST",
    headers: v,
    body: n
  }).then((P) => P.json());
};
function Fe(e) {
  const t = [];
  function n(i, s) {
    Object.entries(i).forEach(([c, a]) => {
      if (a !== void 0)
        if (qe(a)) {
          const h = a[U];
          h ? t.push(`${s}${c} ${h}`) : n(a, `${s}${c}.`);
        } else
          t.push(`${s}${c} = ${a === null ? "NONE" : JSON.stringify(a)}`);
    });
  }
  return n(e, ""), t.join(", ");
}
function x(e) {
  const t = Object.keys(e), n = [];
  for (const i of t)
    if (i === "OR" || i === "AND") {
      const s = e[i], c = [];
      if (s === void 0)
        throw new M("Received expected undefined property in where clause", "invalid_request");
      for (const a of s) {
        const h = x(a);
        h && c.push(`(${h})`);
      }
      if (c.length == 0)
        continue;
      n.push(`(${c.join(` ${i} `)})`);
    } else if (i == "QUERY") {
      const [s, c] = e[i];
      n.push(`(${s.toQuery()}) ${c[U]}`);
    } else {
      const s = e[i];
      qe(s) ? n.push(`${i} ${s[U]}`) : n.push(`${i} = ${JSON.stringify(s)}`);
    }
  return n.join(" AND ");
}
var R, ae, Te, X, we;
const I = class {
  constructor(t) {
    p(this, ae);
    p(this, X);
    p(this, R, void 0);
    N(this, R, t);
  }
  get _schema() {
    return r(this, R).schema;
  }
  get _quantity() {
    return r(this, R).quantity;
  }
  get _state() {
    return Object.freeze({ ...r(this, R) });
  }
  /**
   * Define the schema that should be used to
   * validate the query result.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  with(t) {
    return new I({
      ...r(this, R),
      schema: t
    });
  }
  /**
   * Define the schema that should be used to
   * validate the query result. This is short
   * for `with(z.object(schema))`.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  withSchema(t) {
    return this.with(q.object(t));
  }
  /**
   * Define a schema which accepts any value,
   * useful in situations where a specific schema
   * isn't needed. This is short for `with(z.any())`.
   * 
   * @returns The query writer
   */
  withAny() {
    return this.with(q.any());
  }
  /**
   * Set an individual field to a value
   * 
   * @param key The field name
   * @param value The value
   * @returns 
   */
  set(t, n) {
    if (E(this, X, we).call(this))
      throw new b("Cannot set field when content is set");
    return new I({
      ...r(this, R),
      setFields: {
        ...r(this, R).setFields,
        [t]: n
      }
    });
  }
  /**
   * Set multiple fields at once using an object. Supports 
   * recursive objects and raw values. Can be used as effective
   * alternative to `content`.
   * 
   * @param fields The object to use for setting fields
   * @returns The query writer
   */
  setAll(t) {
    if (E(this, X, we).call(this))
      throw new b("Cannot set fields when content is set");
    return new I({
      ...r(this, R),
      setFields: {
        ...r(this, R).setFields,
        ...t
      }
    });
  }
  /**
   * Set the content for the created record. The content is
   * serialized to JSON, meaning you can not use raw query values.
   * 
   * When raw values are needed, use the `setAll` function instead.
   * 
   * @param content The content for the record
   * @returns The query writer
   */
  content(t) {
    if (E(this, ae, Te).call(this))
      throw new b("Cannot set content when fields are set");
    return new I({
      ...r(this, R),
      content: t
    });
  }
  /**
   * Define the return behavior for the query
   * 
   * @param value The return behavior
   * @returns The query writer
   */
  return(t) {
    return new I({
      ...r(this, R),
      returnMode: t
    });
  }
  /**
   * Define the return behavior for the query
   * 
   * @param value The return behavior
   * @returns The query writer
   */
  returnFields(...t) {
    return new I({
      ...r(this, R),
      returnMode: "fields",
      returnFields: t
    });
  }
  /**
   * Set the timeout for the query
   * 
   * @param seconds The timeout in seconds
   * @returns The query writer
   */
  timeout(t) {
    return new I({
      ...r(this, R),
      timeout: t
    });
  }
  /**
   * Run the query in parallel
   * 
   * @returns The query writer
   */
  parallel() {
    return new I({
      ...r(this, R),
      parallel: !0
    });
  }
  toQuery() {
    const {
      targets: t,
      content: n,
      setFields: i,
      returnMode: s,
      returnFields: c,
      timeout: a,
      parallel: h
    } = r(this, R);
    if (!t)
      throw new Error("No targets specified");
    let y = `CREATE ${t}`;
    if (E(this, ae, Te).call(this)) {
      const w = Fe(i);
      w && (y += ` SET ${w}`);
    } else
      E(this, X, we).call(this) && (y += ` CONTENT ${JSON.stringify(n)}`);
    return s === "fields" ? y += ` RETURN ${c.join(", ")}` : s && (y += ` RETURN ${s.toUpperCase()}`), a && (y += ` TIMEOUT ${a}s`), h && (y += " PARALLEL"), y;
  }
};
let me = I;
R = new WeakMap(), ae = new WeakSet(), Te = function() {
  return Object.keys(r(this, R).setFields).length > 0;
}, X = new WeakSet(), we = function() {
  return Object.keys(r(this, R).content).length > 0;
};
function Ot(...e) {
  if (e.length === 0)
    throw new b("At least one target must be specified");
  if (de(...e))
    throw new b("Multiple targets must be specified seperately");
  return new me({
    schema: null,
    quantity: e.length === 1 ? "one" : "many",
    targets: e.map((t) => V(t)).join(", "),
    setFields: {},
    content: {},
    returnMode: void 0,
    returnFields: [],
    timeout: void 0,
    parallel: !1
  });
}
function At(e, t) {
  return new me({
    schema: null,
    quantity: "one",
    targets: le(e, t),
    setFields: {},
    content: {},
    returnMode: void 0,
    returnFields: [],
    timeout: void 0,
    parallel: !1
  });
}
function B(e) {
  return o(`= ${u(e)}`);
}
function jt(e) {
  return o(`!= ${u(e)}`);
}
function vt(e) {
  return o(`== ${u(e)}`);
}
function Ft(e) {
  return o(`?= ${u(e)}`);
}
function Mt(e) {
  return o(`*= ${u(e)}`);
}
function It(e) {
  return o(`~ ${u(e)}`);
}
function Lt(e) {
  return o(`!~ ${u(e)}`);
}
function Ut(e) {
  return o(`?~ ${u(e)}`);
}
function kt(e) {
  return o(`*~ ${u(e)}`);
}
function xt(e) {
  return o(`< ${u(e)}`);
}
function Pt(e) {
  return o(`<= ${u(e)}`);
}
function Qt(e) {
  return o(`> ${u(e)}`);
}
function Dt(e) {
  return o(`>= ${u(e)}`);
}
function Jt(e) {
  return o(`CONTAINS ${u(e)}`);
}
function zt(e) {
  return o(`CONTAINSNOT ${u(e)}`);
}
function Bt(e) {
  return o(`CONTAINSALL ${u(e)}`);
}
function Gt(e) {
  return o(`CONTAINSANY ${u(e)}`);
}
function Ht(e) {
  return o(`CONTAINSNONE ${u(e)}`);
}
function Yt(e) {
  return o(`INSIDE ${u(e)}`);
}
function Vt(e) {
  return o(`NOTINSIDE ${u(e)}`);
}
function Zt(e) {
  return o(`ALLINSIDE ${u(e)}`);
}
function Kt(e) {
  return o(`ANYINSIDE ${u(e)}`);
}
function Wt(e) {
  return o(`NONEINSIDE ${u(e)}`);
}
function Xt(e) {
  return o(`OUTSIDE ${u(e)}`);
}
function _t(e) {
  return o(`INTERSECTS ${u(e)}`);
}
function en(e) {
  return o(`+= ${u(e)}`);
}
function tn(e) {
  return o(`-= ${u(e)}`);
}
var z;
const Me = class {
  constructor(t) {
    p(this, z, void 0);
    j(this, "_fallback", 0);
    j(this, "_schema", q.number());
    j(this, "_quantity", "one");
    N(this, z, t);
  }
  get _state() {
    return Object.freeze({ ...r(this, z) });
  }
  /**
   * Define the where clause for the query. All values will be escaped
   * automatically. Use of `raw` is supported, as well as any operators
   * wrapping the raw function.
   * 
   * @param where The where clause
   * @returns The query writer
   */
  where(t) {
    if (r(this, z).relation)
      throw new b("Cannot use where clause with countRelation");
    return typeof t == "object" && (t = x(t)), new Me({
      ...r(this, z),
      where: t
    });
  }
  toQuery() {
    const {
      target: t,
      where: n
    } = r(this, z);
    if (!t)
      throw new Error("No target specified");
    let i = `SELECT count() FROM ${t}`;
    return n && (i += ` WHERE ${n}`), i += " GROUP ALL", i;
  }
  _transform(t) {
    return t.map((n) => n.count);
  }
};
let ie = Me;
z = new WeakMap();
function nn(e) {
  return new ie({
    target: V(e),
    where: void 0,
    relation: !1
  });
}
function rn(e, t) {
  return new ie({
    target: t === void 0 ? JSON.stringify(e) : le(e, t),
    where: void 0,
    relation: !1
  });
}
function sn(e) {
  return new ie({
    target: e.edge,
    where: x({
      in: B(he(e)),
      out: B(fe(e))
    }),
    relation: !0
  });
}
var A;
const Q = class {
  constructor(t) {
    p(this, A, void 0);
    N(this, A, t);
  }
  get _schema() {
    return r(this, A).schema;
  }
  get _quantity() {
    return r(this, A).quantity;
  }
  get _state() {
    return Object.freeze({ ...r(this, A) });
  }
  /**
   * Define the schema that should be used to
   * validate the query result.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  with(t) {
    return new Q({
      ...r(this, A),
      schema: t
    });
  }
  /**
   * Define the schema that should be used to
   * validate the query result. This is short
   * for `with(z.object(schema))`.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  withSchema(t) {
    return this.with(q.object(t));
  }
  /**
   * Define a schema which accepts any value,
   * useful in situations where a specific schema
   * isn't needed. This is short for `with(z.any())`.
   * 
   * @returns The query writer
   */
  withAny() {
    return this.with(q.any());
  }
  /**
   * Define the where clause for the query. All values will be escaped
   * automatically. Use of `raw` is supported, as well as any operators
   * wrapping the raw function.
   * 
   * @param where The where clause
   * @returns The query writer
   */
  where(t) {
    if (r(this, A).unrelate)
      throw new b("Cannot use where clause with delRelation");
    return typeof t == "object" && (t = x(t)), new Q({
      ...r(this, A),
      where: t
    });
  }
  /**
   * Define the return behavior for the query
   * 
   * @param value The return behavior
   * @returns The query writer
   */
  return(t) {
    return new Q({
      ...r(this, A),
      returnMode: t
    });
  }
  /**
   * Define the return behavior for the query
   * 
   * @param value The return behavior
   * @returns The query writer
   */
  returnFields(...t) {
    return new Q({
      ...r(this, A),
      returnMode: "fields",
      returnFields: t
    });
  }
  /**
   * Set the timeout for the query
   * 
   * @param seconds The timeout in seconds
   * @returns The query writer
   */
  timeout(t) {
    return new Q({
      ...r(this, A),
      timeout: t
    });
  }
  /**
   * Run the query in parallel
   * 
   * @returns The query writer
   */
  parallel() {
    return new Q({
      ...r(this, A),
      parallel: !0
    });
  }
  toQuery() {
    const {
      targets: t,
      where: n,
      returnMode: i,
      returnFields: s,
      timeout: c,
      parallel: a
    } = r(this, A);
    if (!t)
      throw new Error("No targets specified");
    let h = `DELETE ${t}`;
    return n && (h += ` WHERE ${n}`), i === "fields" ? h += ` RETURN ${s.join(", ")}` : i && (h += ` RETURN ${i.toUpperCase()}`), c && (h += ` TIMEOUT ${c}s`), a && (h += " PARALLEL"), h;
  }
};
let se = Q;
A = new WeakMap();
function on(...e) {
  if (e.length === 0)
    throw new b("At least one target must be specified");
  if (de(...e))
    throw new b("Multiple targets must be specified seperately");
  return new se({
    schema: null,
    quantity: "many",
    targets: e.map((t) => V(t)).join(", "),
    where: void 0,
    returnMode: "before",
    returnFields: [],
    timeout: void 0,
    parallel: !1,
    unrelate: !1
  });
}
function un(e, t) {
  return new se({
    schema: null,
    quantity: "maybe",
    targets: t === void 0 ? JSON.stringify(e) : le(e, t),
    where: void 0,
    returnMode: "before",
    returnFields: [],
    timeout: void 0,
    parallel: !1,
    unrelate: !1
  });
}
function an(e) {
  return new se({
    schema: null,
    quantity: "maybe",
    targets: e.edge,
    where: x({
      in: B(he(e)),
      out: B(fe(e))
    }),
    returnMode: "before",
    returnFields: [],
    timeout: void 0,
    parallel: !1,
    unrelate: !0
  });
}
var S, ce, Ae, _, pe;
const L = class {
  constructor(t) {
    p(this, ce);
    p(this, _);
    p(this, S, void 0);
    j(this, "_quantity", "one");
    N(this, S, t);
  }
  get _schema() {
    return r(this, S).schema;
  }
  get _state() {
    return Object.freeze({ ...r(this, S) });
  }
  /**
   * Define the schema that should be used to
   * validate the query result.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  with(t) {
    return new L({
      ...r(this, S),
      schema: t
    });
  }
  /**
   * Define the schema that should be used to
   * validate the query result. This is short
   * for `with(z.object(schema))`.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  withSchema(t) {
    return this.with(q.object(t));
  }
  /**
   * Define a schema which accepts any value,
   * useful in situations where a specific schema
   * isn't needed. This is short for `with(z.any())`.
   * 
   * @returns The query writer
   */
  withAny() {
    return this.with(q.any());
  }
  /**
   * Set an individual field to a value
   * 
   * @param key The field name
   * @param value The value
   * @returns 
   */
  set(t, n) {
    if (E(this, _, pe).call(this))
      throw new b("Cannot set field when content is set");
    return new L({
      ...r(this, S),
      setFields: {
        ...r(this, S).setFields,
        [t]: n
      }
    });
  }
  /**
   * Set multiple fields at once using an object. Supports 
   * recursive objects and raw values. Can be used as effective
   * alternative to `content`.
   * 
   * @param fields The object to use for setting fields
   * @returns The query writer
   */
  setAll(t) {
    if (E(this, _, pe).call(this))
      throw new b("Cannot set fields when content is set");
    return new L({
      ...r(this, S),
      setFields: {
        ...r(this, S).setFields,
        ...t
      }
    });
  }
  /**
   * Set the content for the related record. The content is
   * serialized to JSON, meaning you can not use raw query values.
   * 
   * When raw values are needed, use the `setAll` function instead.
   * 
   * @param content The content for the record
   * @returns The query writer
   */
  content(t) {
    if (E(this, ce, Ae).call(this))
      throw new b("Cannot set content when fields are set");
    return new L({
      ...r(this, S),
      content: t
    });
  }
  /**
   * Define the return behavior for the query
   * 
   * @param value The return behavior
   * @returns The query writer
   */
  return(t) {
    return new L({
      ...r(this, S),
      returnMode: t
    });
  }
  /**
   * Define the return behavior for the query
   * 
   * @param value The return behavior
   * @returns The query writer
   */
  returnFields(...t) {
    return new L({
      ...r(this, S),
      returnMode: "fields",
      returnFields: t
    });
  }
  /**
   * Set the timeout for the query
   * 
   * @param seconds The timeout in seconds
   * @returns The query writer
   */
  timeout(t) {
    return new L({
      ...r(this, S),
      timeout: t
    });
  }
  /**
   * Run the query in parallel
   * 
   * @returns The query writer
   */
  parallel() {
    return new L({
      ...r(this, S),
      parallel: !0
    });
  }
  toQuery() {
    const {
      from: t,
      edge: n,
      to: i,
      content: s,
      setFields: c,
      returnMode: a,
      returnFields: h,
      timeout: y,
      parallel: w
    } = r(this, S);
    if (!t || !n || !i)
      throw new Error("From, edge, and to must be defined");
    let d = `RELATE ${t}->${n}->${i}`;
    if (E(this, ce, Ae).call(this)) {
      const m = Fe(c);
      m && (d += ` SET ${m}`);
    } else
      E(this, _, pe).call(this) && (d += ` CONTENT ${JSON.stringify(s)}`);
    return a === "fields" ? d += ` RETURN ${h.join(", ")}` : a && (d += ` RETURN ${a.toUpperCase()}`), y && (d += ` TIMEOUT ${y}s`), w && (d += " PARALLEL"), d;
  }
};
let Oe = L;
S = new WeakMap(), ce = new WeakSet(), Ae = function() {
  return Object.keys(r(this, S).setFields).length > 0;
}, _ = new WeakSet(), pe = function() {
  return Object.keys(r(this, S).content).length > 0;
};
function lt(e, t, n) {
  return new Oe({
    schema: null,
    from: V(e, !0),
    edge: t,
    to: V(n, !0),
    setFields: {},
    content: {},
    returnMode: void 0,
    returnFields: [],
    timeout: void 0,
    parallel: !1
  });
}
function cn(e) {
  const t = he(e), n = fe(e);
  return lt(`(${t[U]})`, e.edge, `(${n[U]})`);
}
var g;
const T = class {
  constructor(t) {
    p(this, g, void 0);
    N(this, g, t);
  }
  get _schema() {
    return r(this, g).schema;
  }
  get _quantity() {
    return r(this, g).quantity;
  }
  get _state() {
    return Object.freeze({ ...r(this, g) });
  }
  /**
   * Define the schema that should be used to
   * validate the query result.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  with(t) {
    return new T({
      ...r(this, g),
      schema: t
    });
  }
  /**
   * Define the schema that should be used to
   * validate the query result. This is short
   * for `with(z.object(schema))`.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  withSchema(t) {
    return this.with(q.object(t));
  }
  /**
   * Define a schema which accepts any value,
   * useful in situations where a specific schema
   * isn't needed. This is short for `with(z.any())`.
   * 
   * @returns The query writer
   */
  withAny() {
    return this.with(q.any());
  }
  /**
   * Append another projection to the query. Usually it is recommended
   * to pass projects to `select`, however in certain situations it
   * may be useful to add additional projections to the query.
   * 
   * @param projection The projection to add
   * @returns The query writer
   */
  and(t) {
    return new T({
      ...r(this, g),
      projections: [...r(this, g).projections, t]
    });
  }
  /**
   * Append a subquery projection to the query. The query will be
   * aliased with the given alias.
   * 
   * @param alias The alias for the subquery
   * @param query The subquery
   * @returns The query writer
   */
  andQuery(t, n) {
    return this.and(`(${n.toQuery()}) AS ${t}`);
  }
  /**
   * Specify the targets for the query. This can include table names,
   * record ids, and subqueries.
   * 
   * @param targets The targets for the query
   * @returns The query writer
   */
  from(...t) {
    const n = t.map((i) => {
      if (typeof i == "string" && de(i))
        throw new b("Multiple targets must be specified seperately");
      return V(i);
    });
    return new T({
      ...r(this, g),
      targets: n.join(", ")
    });
  }
  fromRecord(t, n) {
    return new T({
      ...r(this, g),
      quantity: "maybe",
      targets: n === void 0 ? JSON.stringify(t) : le(t, n),
      limit: 1
    });
  }
  /**
   * Specify the target for the query as a relation. This function
   * is especially useful in situations where the table names within a
   * record pointer may be spoofed, and specific table names are required.
   * 
   * Since this function will automatically configure a where clause, calling
   * `.where()` manually will throw an exception.
   * 
   * @param relation The relation information
   * @param id The record id, either the full id or just the unique id
   * @returns 
   */
  fromRelation(t) {
    return new T({
      ...r(this, g),
      quantity: "maybe",
      relation: !0,
      targets: t.edge,
      where: x({
        in: B(he(t)),
        out: B(fe(t))
      })
    });
  }
  /**
   * Define the where clause for the query. All values will be escaped
   * automatically. Use of `raw` is supported, as well as any operators
   * wrapping the raw function.
   * 
   * @param where The where clause
   * @returns The query writer
   */
  where(t) {
    if (r(this, g).relation)
      throw new b("Cannot use where clause with fromRelation");
    return typeof t == "object" && (t = x(t)), new T({
      ...r(this, g),
      where: t
    });
  }
  /**
   * Define the split fields for the query.
   * 
   * @param fields The split fields
   * @returns The query writer
   */
  split(...t) {
    return new T({
      ...r(this, g),
      split: t
    });
  }
  /**
   * Define the fields to group by. If you are grouping by all fields, use
   * the groupAll() method instead.
   * 
   * @param fields The fields to group by
   * @returns The query writer
   */
  groupBy(...t) {
    return new T({
      ...r(this, g),
      group: t
    });
  }
  /**
   * Group by all fields
   * 
   * @returns The query writer
   */
  groupAll() {
    return new T({
      ...r(this, g),
      group: "all"
    });
  }
  orderBy(t, n) {
    const i = typeof t == "string" ? { [t]: n || "asc" } : t;
    return new T({
      ...r(this, g),
      order: i
    });
  }
  /**
   * Limit the number of records returned by the query
   * 
   * @param limit The limit
   * @returns The query writer
   */
  limit(t) {
    return new T({
      ...r(this, g),
      quantity: "many",
      limit: t
    });
  }
  /**
   * Limit the number of records returned by the query to one.
   * This is useful for queries that are expected to return
   * a single record.
   * 
   * Unlike `limit(1)`, this method will cause the query to not
   * return an array of records when executed, but instead a
   * single record.
   */
  one() {
    return new T({
      ...r(this, g),
      quantity: "maybe",
      limit: 1
    });
  }
  /**
   * Start the query at the given index
   * 
   * @param start The start index
   * @returns The query writer
   */
  start(t) {
    return new T({
      ...r(this, g),
      start: t
    });
  }
  /**
   * Define the paths to the fields to fetch
   * 
   * @param fields The fields to fetch
   * @returns The query writer
   */
  fetch(...t) {
    return new T({
      ...r(this, g),
      fetch: t
    });
  }
  /**
   * Set the timeout for the query
   * 
   * @param seconds The timeout in seconds
   * @returns The query writer
   */
  timeout(t) {
    return new T({
      ...r(this, g),
      timeout: t
    });
  }
  /**
   * Run the query in parallel
   * 
   * @returns The query writer
   */
  parallel() {
    return new T({
      ...r(this, g),
      parallel: !0
    });
  }
  toQuery() {
    const {
      projections: t,
      targets: n,
      where: i,
      split: s,
      group: c,
      order: a,
      limit: h,
      start: y,
      fetch: w,
      timeout: d,
      parallel: m
    } = r(this, g);
    if (t) {
      if (!n)
        throw new Error("No targets specified");
    } else
      throw new Error("No projections specified");
    const k = t.length > 0 ? t.join(", ") : "*", f = Object.entries(a);
    let l = `SELECT ${k} FROM ${n}`;
    if (i && (l += ` WHERE ${i}`), s.length > 0 && (l += ` SPLIT ${s.join(", ")}`), c === "all" ? l += " GROUP ALL" : c.length > 0 && (l += ` GROUP BY ${c.join(", ")}`), f.length > 0) {
      const C = f.map(([v, O]) => `${v} ${O.toUpperCase()}`);
      l += ` ORDER BY ${C.join(", ")}`;
    }
    return h && (l += ` LIMIT BY ${h}`), y && (l += ` START AT ${y}`), w.length > 0 && (l += ` FETCH ${w.join(", ")}`), d && (l += ` TIMEOUT ${d}s`), m && (l += " PARALLEL"), l;
  }
};
let je = T;
g = new WeakMap();
function ln(...e) {
  if (de(...e))
    throw new b("Multiple projections must be specified seperately");
  return new je({
    schema: null,
    quantity: "many",
    projections: e,
    targets: void 0,
    where: void 0,
    split: [],
    group: [],
    order: {},
    limit: void 0,
    start: void 0,
    fetch: [],
    timeout: void 0,
    parallel: !1,
    relation: !1
  });
}
var $, ee, ge, te, ye;
const F = class {
  constructor(t) {
    p(this, ee);
    p(this, te);
    p(this, $, void 0);
    N(this, $, t);
  }
  get _schema() {
    return r(this, $).schema;
  }
  get _quantity() {
    return r(this, $).quantity;
  }
  get _state() {
    return Object.freeze({ ...r(this, $) });
  }
  /**
   * Define the schema that should be used to
   * validate the query result.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  with(t) {
    return new F({
      ...r(this, $),
      schema: t
    });
  }
  /**
   * Define the schema that should be used to
   * validate the query result. This is short
   * for `with(z.object(schema))`.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  withSchema(t) {
    return this.with(q.object(t));
  }
  /**
   * Define a schema which accepts any value,
   * useful in situations where a specific schema
   * isn't needed. This is short for `with(z.any())`.
   * 
   * @returns The query writer
   */
  withAny() {
    return this.with(q.any());
  }
  /**
   * Set an individual field to a value
   * 
   * @param key The field name
   * @param value The value
   * @returns 
   */
  set(t, n) {
    if (E(this, te, ye).call(this))
      throw new b("Cannot set field when content is set");
    return new F({
      ...r(this, $),
      setFields: {
        ...r(this, $).setFields,
        [t]: n
      }
    });
  }
  /**
   * Set multiple fields at once using an object. Supports 
   * recursive objects and raw values. Can be used as effective
   * alternative to `content`.
   * 
   * @param fields The object to use for setting fields
   * @returns The query writer
   */
  setAll(t) {
    if (E(this, te, ye).call(this))
      throw new b("Cannot set fields when content is set");
    return new F({
      ...r(this, $),
      setFields: {
        ...r(this, $).setFields,
        ...t
      }
    });
  }
  /**
   * Set the new content for the record. The content is
   * serialized to JSON, meaning you can not use raw query values.
   * 
   * When raw values are needed, use the `setAll` function instead.
   * 
   * @param content The content for the record
   * @returns The query writer
   */
  content(t) {
    if (E(this, ee, ge).call(this))
      throw new b("Cannot set content when fields are set");
    return new F({
      ...r(this, $),
      content: t,
      contentMode: "replace"
    });
  }
  /**
   * Merge the content into the record. The content is
   * serialized to JSON, meaning you can not use raw query values.
   * 
   * When raw values are needed, use the `setAll` function instead.
   * 
   * @param content The content for the record
   * @returns The query writer
   */
  merge(t) {
    if (E(this, ee, ge).call(this))
      throw new b("Cannot set content when fields are set");
    return new F({
      ...r(this, $),
      content: t,
      contentMode: "merge"
    });
  }
  /**
   * Define the where clause for the query. All values will be escaped
   * automatically. Use of `raw` is supported, as well as any operators
   * wrapping the raw function.
   * 
   * @param where The where clause
   * @returns The query writer
   */
  where(t) {
    if (r(this, $).relation)
      throw new b("Cannot use where clause with updateRelation");
    return typeof t == "object" && (t = x(t)), new F({
      ...r(this, $),
      where: t
    });
  }
  /**
   * Define the return behavior for the query
   * 
   * @param value The return behavior
   * @returns The query writer
   */
  return(t) {
    return new F({
      ...r(this, $),
      returnMode: t
    });
  }
  /**
   * Define the return behavior for the query
   * 
   * @param value The return behavior
   * @returns The query writer
   */
  returnFields(...t) {
    return new F({
      ...r(this, $),
      returnMode: "fields",
      returnFields: t
    });
  }
  /**
   * Set the timeout for the query
   * 
   * @param seconds The timeout in seconds
   * @returns The query writer
   */
  timeout(t) {
    return new F({
      ...r(this, $),
      timeout: t
    });
  }
  /**
   * Run the query in parallel
   * 
   * @returns The query writer
   */
  parallel() {
    return new F({
      ...r(this, $),
      parallel: !0
    });
  }
  toQuery() {
    const {
      targets: t,
      content: n,
      contentMode: i,
      setFields: s,
      where: c,
      returnMode: a,
      returnFields: h,
      timeout: y,
      parallel: w
    } = r(this, $);
    if (!t)
      throw new Error("No targets specified");
    let d = `UPDATE ${t}`;
    if (E(this, ee, ge).call(this)) {
      const m = Fe(s);
      m && (d += ` SET ${m}`);
    } else
      E(this, te, ye).call(this) && (d += ` ${i === "merge" ? "MERGE" : "CONTENT"} ${JSON.stringify(n)}`);
    return c && (d += ` WHERE ${c}`), a === "fields" ? d += ` RETURN ${h.join(", ")}` : a && (d += ` RETURN ${a.toUpperCase()}`), y && (d += ` TIMEOUT ${y}s`), w && (d += " PARALLEL"), d;
  }
};
let oe = F;
$ = new WeakMap(), ee = new WeakSet(), ge = function() {
  return Object.keys(r(this, $).setFields).length > 0;
}, te = new WeakSet(), ye = function() {
  return Object.keys(r(this, $).content).length > 0;
};
function hn(...e) {
  if (e.length === 0)
    throw new b("At least one target must be specified");
  if (de(...e))
    throw new b("Multiple targets must be specified seperately");
  return new oe({
    schema: null,
    quantity: "many",
    targets: e.map((t) => V(t)).join(", "),
    setFields: {},
    content: {},
    contentMode: void 0,
    where: void 0,
    returnMode: void 0,
    returnFields: [],
    timeout: void 0,
    parallel: !1,
    relation: !1
  });
}
function fn(e, t) {
  return new oe({
    schema: null,
    quantity: "maybe",
    targets: t === void 0 ? JSON.stringify(e) : le(e, t),
    setFields: {},
    content: {},
    contentMode: void 0,
    where: void 0,
    returnMode: void 0,
    returnFields: [],
    timeout: void 0,
    parallel: !1,
    relation: !1
  });
}
function dn(e) {
  return new oe({
    schema: null,
    quantity: "maybe",
    targets: e.edge,
    where: x({
      in: B(he(e)),
      out: B(fe(e))
    }),
    setFields: {},
    content: {},
    contentMode: void 0,
    returnMode: void 0,
    returnFields: [],
    timeout: void 0,
    parallel: !1,
    relation: !0
  });
}
var ne, Y, re;
const Ne = class {
  constructor(t, n, i) {
    p(this, ne, void 0);
    p(this, Y, void 0);
    p(this, re, void 0);
    N(this, ne, t), N(this, Y, n), N(this, re, i);
  }
  get _quantity() {
    return r(this, re);
  }
  get _schema() {
    return r(this, ne);
  }
  /**
   * Define the schema that should be used to
   * validate the query result.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  with(t) {
    return new Ne(t, r(this, Y), r(this, re));
  }
  /**
   * Define the schema that should be used to
   * validate the query result. This is short
   * for `with(z.object(schema))`.
   * 
   * @param schema The schema to use
   * @returns The query writer
   */
  withSchema(t) {
    return this.with(q.object(t));
  }
  /**
   * Define a schema which accepts any value,
   * useful in situations where a specific schema
   * isn't needed. This is short for `with(z.any())`.
   * 
   * @returns The query writer
   */
  withAny() {
    return this.with(q.any());
  }
  /**
   * Expect at most one record to be returned
   * 
   * @returns The query writer
   */
  single() {
    return new Ne(r(this, ne), r(this, Y), "maybe");
  }
  toQuery() {
    return r(this, Y);
  }
};
let ve = Ne;
ne = new WeakMap(), Y = new WeakMap(), re = new WeakMap();
function ht(e) {
  return new ve(null, e, "many");
}
const ft = /^[a-zA-Z0-9_]*$/;
function wn(e, t) {
  if (!ft.test(e))
    throw new Error(`Invalid LET name: ${e}`);
  return {
    _quantity: "zero",
    _schema: q.undefined(),
    toQuery() {
      return `LET $${e} = ${u(t)}`;
    }
  };
}
const pn = q.object({
  id: q.string()
}), gn = q.object({
  id: q.string(),
  in: q.string(),
  out: q.string()
});
function yn(e) {
  return e.trim().split(";").filter((t) => !!t).map((t) => ({
    query: ht(t),
    schema: q.any()
  }));
}
function dt() {
  return o("time::now()");
}
const mn = {
  now: dt
};
function wt() {
  return o("rand::bool()");
}
function pt(e) {
  return o(`rand::enum(${e.map(u).join(", ")})`);
}
function gt(e = 0, t = 1) {
  return o(`rand::float(${e}, ${t})`);
}
function yt(e) {
  return o(`rand::guid(${e ?? ""})`);
}
function mt(e, t) {
  return o(e && t ? `rand::int(${e}, ${t})` : "rand::int()");
}
function $t(e) {
  return o(`rand::string(${e ?? ""})`);
}
function Et(e, t) {
  return o(e && t ? `rand::time(${e}, ${t})` : "rand::time()");
}
function bt() {
  return o("rand::uuid()");
}
const $n = {
  bool: wt,
  enumOf: pt,
  float: gt,
  guid: yt,
  int: mt,
  string: $t,
  time: Et,
  uuid: bt
};
export {
  Ct as Cirql,
  Se as CirqlAuthenticationError,
  M as CirqlError,
  Ve as CirqlParseError,
  Ze as CirqlQueryError,
  Tt as CirqlStateless,
  b as CirqlWriterError,
  ie as CountQueryWriter,
  me as CreateQueryWriter,
  se as DeleteQueryWriter,
  gn as EdgeSchema,
  pn as RecordSchema,
  Oe as RelateQueryWriter,
  je as SelectQueryWriter,
  oe as UpdateQueryWriter,
  en as add,
  Mt as all,
  Zt as allInside,
  Ft as any,
  Kt as anyInside,
  Jt as contains,
  Bt as containsAll,
  Gt as containsAny,
  Ht as containsNone,
  zt as containsNot,
  nn as count,
  rn as countRecord,
  sn as countRelation,
  Ot as create,
  At as createRecord,
  on as del,
  un as delRecord,
  an as delRelation,
  vt as eeq,
  B as eq,
  kt as fall,
  Ut as fany,
  It as feq,
  Qt as gt,
  Dt as gte,
  Yt as inside,
  _t as intersects,
  wn as letValue,
  xt as lt,
  Pt as lte,
  jt as neq,
  Lt as nfeq,
  Wt as noneInside,
  Vt as notInside,
  Xt as outside,
  St as param,
  yn as parseQueries,
  ht as query,
  $n as rand,
  o as raw,
  lt as relate,
  cn as relateRelation,
  tn as remove,
  ln as select,
  mn as time,
  Ue as type,
  hn as update,
  fn as updateRecord,
  dn as updateRelation
};
