var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/mersenne-twister/src/mersenne-twister.js
var require_mersenne_twister = __commonJS({
  "node_modules/mersenne-twister/src/mersenne-twister.js"(exports, module) {
    var MersenneTwister = function(seed) {
      if (seed == void 0) {
        seed = (/* @__PURE__ */ new Date()).getTime();
      }
      this.N = 624;
      this.M = 397;
      this.MATRIX_A = 2567483615;
      this.UPPER_MASK = 2147483648;
      this.LOWER_MASK = 2147483647;
      this.mt = new Array(this.N);
      this.mti = this.N + 1;
      if (seed.constructor == Array) {
        this.init_by_array(seed, seed.length);
      } else {
        this.init_seed(seed);
      }
    };
    MersenneTwister.prototype.init_seed = function(s) {
      this.mt[0] = s >>> 0;
      for (this.mti = 1; this.mti < this.N; this.mti++) {
        var s = this.mt[this.mti - 1] ^ this.mt[this.mti - 1] >>> 30;
        this.mt[this.mti] = (((s & 4294901760) >>> 16) * 1812433253 << 16) + (s & 65535) * 1812433253 + this.mti;
        this.mt[this.mti] >>>= 0;
      }
    };
    MersenneTwister.prototype.init_by_array = function(init_key, key_length) {
      var i, j, k;
      this.init_seed(19650218);
      i = 1;
      j = 0;
      k = this.N > key_length ? this.N : key_length;
      for (; k; k--) {
        var s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;
        this.mt[i] = (this.mt[i] ^ (((s & 4294901760) >>> 16) * 1664525 << 16) + (s & 65535) * 1664525) + init_key[j] + j;
        this.mt[i] >>>= 0;
        i++;
        j++;
        if (i >= this.N) {
          this.mt[0] = this.mt[this.N - 1];
          i = 1;
        }
        if (j >= key_length)
          j = 0;
      }
      for (k = this.N - 1; k; k--) {
        var s = this.mt[i - 1] ^ this.mt[i - 1] >>> 30;
        this.mt[i] = (this.mt[i] ^ (((s & 4294901760) >>> 16) * 1566083941 << 16) + (s & 65535) * 1566083941) - i;
        this.mt[i] >>>= 0;
        i++;
        if (i >= this.N) {
          this.mt[0] = this.mt[this.N - 1];
          i = 1;
        }
      }
      this.mt[0] = 2147483648;
    };
    MersenneTwister.prototype.random_int = function() {
      var y;
      var mag01 = new Array(0, this.MATRIX_A);
      if (this.mti >= this.N) {
        var kk;
        if (this.mti == this.N + 1)
          this.init_seed(5489);
        for (kk = 0; kk < this.N - this.M; kk++) {
          y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
          this.mt[kk] = this.mt[kk + this.M] ^ y >>> 1 ^ mag01[y & 1];
        }
        for (; kk < this.N - 1; kk++) {
          y = this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK;
          this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ y >>> 1 ^ mag01[y & 1];
        }
        y = this.mt[this.N - 1] & this.UPPER_MASK | this.mt[0] & this.LOWER_MASK;
        this.mt[this.N - 1] = this.mt[this.M - 1] ^ y >>> 1 ^ mag01[y & 1];
        this.mti = 0;
      }
      y = this.mt[this.mti++];
      y ^= y >>> 11;
      y ^= y << 7 & 2636928640;
      y ^= y << 15 & 4022730752;
      y ^= y >>> 18;
      return y >>> 0;
    };
    MersenneTwister.prototype.random_int31 = function() {
      return this.random_int() >>> 1;
    };
    MersenneTwister.prototype.random_incl = function() {
      return this.random_int() * (1 / 4294967295);
    };
    MersenneTwister.prototype.random = function() {
      return this.random_int() * (1 / 4294967296);
    };
    MersenneTwister.prototype.random_excl = function() {
      return (this.random_int() + 0.5) * (1 / 4294967296);
    };
    MersenneTwister.prototype.random_long = function() {
      var a = this.random_int() >>> 5, b = this.random_int() >>> 6;
      return (a * 67108864 + b) * (1 / 9007199254740992);
    };
    module.exports = MersenneTwister;
  }
});

// node_modules/polyfill-crypto.getrandomvalues/index.js
var require_polyfill_crypto = __commonJS({
  "node_modules/polyfill-crypto.getrandomvalues/index.js"(exports, module) {
    var MersenneTwister = require_mersenne_twister();
    var twister = new MersenneTwister(Math.random() * Number.MAX_SAFE_INTEGER);
    module.exports = getRandomValues3;
    function getRandomValues3(abv) {
      var l = abv.length;
      while (l--) {
        abv[l] = Math.floor(randomFloat() * 256);
      }
      return abv;
    }
    function randomFloat() {
      return twister.random();
    }
  }
});

// src/shared/Metadata.ts
var MetadataDefaults = {
  ["com.phenoui.strapi.auth.server" /* strapiServer */]: "http://localhost:1337"
};

// src/plugin/metadata.ts
function updateMetadata(node, key, value) {
  if (!node.getPluginData(key)) {
    node.setRelaunchData({ open: "" });
  }
  node.setPluginData(key, JSON.stringify(value));
}
function getMetadata(node, key) {
  try {
    return JSON.parse(node.getPluginData(key));
  } catch (e) {
    console.error(e);
    updateMetadata(node, key, "");
    return "";
  }
}
async function setLocalData(key, value) {
  await figma.clientStorage.setAsync(key, value);
}
async function getLocalData(key) {
  return await figma.clientStorage.getAsync(key);
}

// src/plugin/screens.ts
function showEmptyScreen(bus) {
  bus.execute("updateScreen", { screen: 3 /* empty */ });
}
function showErrorScreen(bus, title, description) {
  bus.execute("updateScreen", {
    screen: 0 /* error */,
    error: {
      title,
      description
    }
  });
}
async function showStrapiLoginScreen(bus, api, error) {
  bus.execute("updateScreen", {
    screen: 1 /* strapi_login */,
    credentials: {
      id: api.root.id,
      server: await getLocalData("com.phenoui.strapi.auth.server" /* strapiServer */),
      user: await getLocalData("com.phenoui.strapi.auth.user" /* strapiUser */),
      error
    }
  });
}
function showGithubLoginScreen(bus, api, error) {
  const node = api.currentPage.selection[0];
  bus.execute("updateScreen", {
    screen: 2 /* github_login */,
    credentials: {
      id: api.root.id,
      layerName: node.name,
      error
    }
  });
}
function _tabToLayerScreen(tab) {
  switch (tab) {
    case 0 /* figma */:
      return 4 /* figma_layer */;
    case 2 /* github */:
      return 6 /* github_layer */;
    case 1 /* strapi */:
      return 5 /* strapi_layer */;
  }
}
function showLayerScreen(bus, data, tab) {
  bus.execute("updateScreen", Object.assign({ screen: _tabToLayerScreen(tab) }, data));
}

// src/plugin/execute.ts
var funcRegex = /([^(]+)\((.*)\)\s*$/;
var splitArgsRegex = /,(?![^()[\]]+[)\]])/;
var builtInMethods = {
  hello: (context, subject) => {
    const r = `Hello ${subject}!`;
    console.log(r);
    return r;
  },
  exportSVG: async (context, node) => {
    return await node.exportAsync({ format: "SVG_STRING", useAbsoluteBounds: true });
  },
  exportPNG: async (context, node) => {
    const bytes = await node.exportAsync({ format: "PNG", useAbsoluteBounds: true, constraint: { type: "SCALE", value: 3 } });
    return figma.base64Encode(bytes);
  },
  exportJPEG: async (context, node) => {
    const bytes = await node.exportAsync({ format: "JPG", useAbsoluteBounds: true, constraint: { type: "SCALE", value: 3 } });
    return figma.base64Encode(bytes);
  },
  nativeType: (context, node) => figmaTypeToWidget(node),
  getVariants: async (context, node, baseSpec) => {
    const variants = {};
    const mappings = Object.assign({}, baseSpec.mappings);
    for (let i = 0, n = node.children.length; i < n; ++i) {
      variants[node.children[i].name] = _overrideSource(mappings, `children[${i}]`);
    }
    return processSpec(context.cache, context.strapi, node, variants);
  },
  nodeAsType: async (context, node, type) => {
    return await exportNode(context.cache, context.strapi, node, type);
  },
  firstVisibleProperty: (context, entries, property) => {
    var _a;
    for (const entry of entries) {
      if (entry.visible) {
        return (_a = entry[property]) != null ? _a : null;
      }
    }
    return null;
  },
  firstVisibleEntry: (context, entries) => {
    for (const entry of entries) {
      if (entry.visible) {
        return entry;
      }
    }
    return null;
  }
};
async function execute(cache, strapi, node, instruction) {
  const components = funcRegex.exec(instruction);
  if (components) {
    const funcPath = components[1];
    const argsDefs = components[2].split(splitArgsRegex);
    const args = [];
    for (const def of argsDefs) {
      if (def.trim()) {
        args.push(await fetchValue(cache, strapi, node, def.trim(), true));
      }
    }
    if (funcPath in builtInMethods) {
      const context = {
        node,
        cache,
        strapi
      };
      return await builtInMethods[funcPath](context, ...args);
    } else {
      const funcComps = funcPath.split(".");
      const solved = resolvePath(node, funcComps);
      if (solved) {
        return await solved.value.apply(solved.parent, args);
      }
    }
  }
  return null;
}
function _overrideSource(spec, source) {
  if (Array.isArray(spec)) {
    const result2 = [];
    for (const entry of spec) {
      if (typeof entry === "string") {
        result2.push(`${"*" /* source */}${source}${"*" /* source */}${entry}`);
      } else {
        result2.push(_overrideSource(entry, source));
      }
    }
    return result2;
  }
  const result = {};
  for (const key of Object.keys(spec)) {
    const entry = spec[key];
    if (typeof entry === "string") {
      result[key] = `${"*" /* source */}${source}${"*" /* source */}${entry}`;
    } else {
      result[key] = _overrideSource(entry, source);
    }
  }
  return result;
}

// src/plugin/tools/export/userdata.ts
function getComponentProperty(node, key) {
  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
    const k = node.componentPropertyDefinitions[key] ? key : key.split(/#(?!.*#)/)[0];
    if (node.componentPropertyDefinitions[k]) {
      return {
        value: node.componentPropertyDefinitions[k].defaultValue,
        valueType: node.componentPropertyDefinitions[k].type
      };
    }
  } else {
    const instanceNode = node;
    const k = instanceNode.componentProperties[key] ? key : key.split(/#(?!.*#)/)[0];
    if (instanceNode.componentProperties[k]) {
      return {
        value: instanceNode.componentProperties[k].value,
        valueType: instanceNode.componentProperties[k].type
      };
    }
  }
  return void 0;
}
function _getVariantOptions(node, key) {
  let componentNode = node;
  while (componentNode.type !== "COMPONENT_SET" && componentNode.parent) {
    if ("mainComponent" in componentNode) {
      componentNode = componentNode.mainComponent;
    } else {
      componentNode = componentNode.parent;
    }
  }
  if (componentNode) {
    const k = componentNode.componentPropertyDefinitions[key] ? key : key.split(/#(?!.*#)/)[0];
    const variantOptions = componentNode.componentPropertyDefinitions[k].variantOptions;
    if (variantOptions) {
      const options = [];
      for (const option of variantOptions) {
        options.push({
          value: option,
          label: option
        });
      }
      return options;
    }
  }
  return [];
}
function getUserData(node, type, userData, parentType) {
  for (const key of Object.keys(userData)) {
    if (key === "__layout__") {
      continue;
    }
    const valueKey = parentType ? `${type}_${parentType}_${key}` : `${type}_${key}`;
    const value = getMetadata(node, valueKey);
    userData[key] = Object.assign({}, userData[key]);
    const data = userData[key];
    switch (data.type) {
      case "number":
        if (typeof value === "string") {
          if (Boolean(value)) {
            data.value = parseFloat(value);
          }
        } else {
          data.value = value;
        }
        break;
      case "componentProperty":
        const propNode = findNode(figma, data.nodeId);
        if (propNode) {
          Object.assign(data, getComponentProperty(propNode, data.key));
          if (data.valueType === "VARIANT") {
            data.options = _getVariantOptions(propNode, data.key);
          }
        }
        break;
      case "union":
        data.fields = getUserData(node, type, data.fields, parentType ? `${parentType}_${key}` : key);
        break;
      default:
        data.value = value;
        break;
    }
  }
  return userData;
}

// src/plugin/tools/export/export.ts
function findNode(api, id) {
  if (id === api.root.id) {
    return api.root;
  } else if (id === api.currentPage.id || id === "com.phenoui.figma.current.page" /* currentPage */) {
    return api.currentPage;
  }
  return api.getNodeById(id);
}
function findComponentOrInstance(node) {
  if (node.type === "COMPONENT") {
    if (node.parent && node.parent.type === "COMPONENT_SET") {
      return node.parent;
    }
    return node;
  } else if (node.type === "INSTANCE" || node.type === "COMPONENT_SET") {
    return node;
  }
  if (node.parent) {
    return findComponentOrInstance(node.parent);
  }
  return null;
}
function figmaTypeToWidget(node) {
  switch (node.type) {
    case "COMPONENT":
      if (node.parent && node.parent.type === "COMPONENT_SET") {
        return node.parent.name;
      }
      return node.name;
    case "COMPONENT_SET":
      return node.name;
    case "FRAME":
      return "Frame";
    case "INSTANCE":
      const main = node.mainComponent;
      if (main.parent && main.parent.type === "COMPONENT_SET") {
        return main.parent.name;
      }
      return main.name;
    default:
      return `${node.type.charAt(0).toUpperCase()}${node.type.slice(1).toLowerCase()}`;
  }
}
function resolvePath(obj, path) {
  let parent = null;
  let value = obj;
  for (const comp of path) {
    if (!comp) {
      continue;
    }
    const openBracket = comp.indexOf("[");
    const closeBracket = comp.indexOf("]");
    if (openBracket !== -1 && closeBracket !== -1) {
      const base = comp.substring(0, openBracket);
      const index = comp.substring(openBracket + 1, closeBracket);
      if (!(base in value) || !(index in value[base])) {
        return { value: null, parent };
      }
      parent = value[base];
      value = value[base][index];
    } else {
      if (!(comp in value)) {
        return { value: null, parent };
      }
      parent = value;
      value = value[comp];
    }
  }
  return { value, parent };
}
async function fetchValue(cache, strapi, node, mapping, rawNodes = false) {
  const operator = mapping.substring(0, 1);
  const path = mapping.substring(1);
  switch (operator) {
    case "!" /* literal */:
      try {
        return JSON.parse(path);
      } catch (e) {
        return path;
      }
    case "#" /* valuePath */:
      return JSON.parse(JSON.stringify(resolvePath(node, path.split(".")).value));
    case "$" /* nodePath */:
      const solved = resolvePath(node, path.split("."));
      const fetched = solved.value;
      if (!rawNodes) {
        if (Array.isArray(fetched)) {
          const value = [];
          for (const n of fetched) {
            if (n.visible) {
              const exported = await exportNode(cache, strapi, n);
              value.push(exported);
            }
          }
          return value;
        } else if (fetched) {
          if (fetched.visible) {
            return await exportNode(cache, strapi, fetched);
          }
          return null;
        }
      }
      return fetched;
    case "@" /* inherit */:
      const spec = await strapi.getTypeSpec(path, cache);
      if (!spec || rawNodes) {
        return spec;
      }
      return await processSpec(cache, strapi, node, spec.mappings);
    case "%" /* execute */:
      return await execute(cache, strapi, node, path);
    case "*" /* source */:
      const components = path.split("*" /* source */);
      const source = resolvePath(node, components[0].split(".")).value;
      return await fetchValue(cache, strapi, source, components[1]);
    default:
      throw `ERROR parsing - Unrecognized mapping operator [${operator}] for mapping ${mapping}`;
  }
}
function _isObject(val) {
  return typeof val === "object" && !Array.isArray(val) && val !== null;
}
async function processSpec(cache, strapi, node, spec) {
  if (Array.isArray(spec)) {
    const result2 = [];
    for (const entry of spec) {
      if (typeof entry === "string") {
        result2.push(await fetchValue(cache, strapi, node, entry));
      } else if (typeof entry === "number" || entry === null || entry === true || entry === false) {
        result2.push(entry);
      } else {
        result2.push(await processSpec(cache, strapi, node, entry));
      }
    }
    return result2;
  }
  const result = {};
  for (const key of Object.keys(spec)) {
    const entry = spec[key];
    const keyPath = key.split(".");
    let base = result;
    let prop = keyPath.shift();
    while (keyPath.length) {
      if (!_isObject(base[prop])) {
        base[prop] = {};
      }
      base = base[prop];
      prop = keyPath.shift();
    }
    let val;
    if (typeof entry === "string") {
      val = await fetchValue(cache, strapi, node, entry);
    } else if (typeof entry === "number" || entry === null || entry === true || entry === false) {
      val = entry;
    } else {
      val = await processSpec(cache, strapi, node, entry);
    }
    if (_isObject(val) && _isObject(base[prop])) {
      base[prop] = Object.assign({}, base[prop], val);
    } else {
      base[prop] = val;
    }
  }
  return result;
}
function _getUserDataExport(node, type, userData) {
  if (!userData) {
    return null;
  }
  const withValues = getUserData(node, type, userData);
  const result = {};
  for (const key of Object.keys(userData)) {
    const entry = withValues[key];
    result[key] = entry.value;
    if (result[key] === "" || result[key] === null || result[key] === void 0) {
      result[key] = entry.default;
      if (entry.type === "group") {
        result[key] = {
          type: "group",
          properties: result[key] || []
        };
      } else if (entry.type === "union") {
        const fields = entry.fields;
        const fieldKeys = Object.keys(fields);
        const fieldValues = fieldKeys.map((k) => {
          var _a;
          return { [k]: (_a = fields[k].value) != null ? _a : fields[k].default };
        });
        result[key] = {
          type: "union",
          fields: Object.assign({}, ...fieldValues)
        };
        console.log("Union", result[key]);
      }
    }
  }
  return result;
}
async function getTypeSpec(type, node, strapi, cache, useDefaultCache = false) {
  let typeData = await strapi.getTypeSpec(type, cache, useDefaultCache);
  if (!typeData && (node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET")) {
    let componentType;
    switch (node.type) {
      case "COMPONENT":
        componentType = "FigmaComponent";
        break;
      case "COMPONENT_SET":
        componentType = "FigmaComponentSet";
        break;
      default:
        componentType = "FigmaComponentInstance";
        break;
    }
    typeData = await strapi.getTypeSpec(componentType, cache, useDefaultCache);
  } else if (!typeData) {
    typeData = await strapi.getTypeSpec("_missing_type", cache, useDefaultCache);
    if (typeData) {
      typeData.mappings = [
        `@${figmaTypeToWidget(node)}`,
        {
          type: `!${type}`
        }
      ];
      await strapi.resolveSpecMappings(typeData, cache, useDefaultCache);
    }
  }
  if (typeData && (node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET")) {
    const componentProps = _findComponentPropertiesRecursive(node);
    const baseComponent = findComponentOrInstance(node);
    if (baseComponent && baseComponent.parent) {
      const parentComponent = findComponentOrInstance(baseComponent.parent);
      if (parentComponent && parentComponent.id !== baseComponent.id) {
        componentProps["overrideComponentProperties"] = {
          type: "boolean",
          default: true,
          description: "Use ancestors properties"
        };
      }
    }
    typeData.userData = Object.assign({}, typeData.userData, componentProps);
  }
  return typeData;
}
function _findComponentPropertiesRecursive(node) {
  const componentProps = {};
  if (node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET") {
    const properties = node.type === "COMPONENT" || node.type === "COMPONENT_SET" ? node.componentPropertyDefinitions : node.componentProperties;
    for (let key in properties) {
      key = properties[key].type === "VARIANT" ? `${key}#variant` : key;
      const [description, propertyId] = key.split(/#(?!.*#)/);
      componentProps[key] = {
        description,
        type: "componentProperty",
        key,
        nodeId: node.id,
        propertyId
      };
    }
  }
  if (node.type !== "COMPONENT_SET" && "children" in node) {
    for (const child of node.children) {
      const childProps = _findComponentPropertiesRecursive(child);
      if (Object.keys(childProps).length) {
        for (const key of Object.keys(childProps)) {
          if (!(key in componentProps)) {
            componentProps[key] = childProps[key];
          }
        }
      }
    }
  }
  return componentProps;
}
async function exportNode(cache, strapi, node, overrideType) {
  try {
    const type = overrideType || getMetadata(node, "com.phenoui.layer.widget_override" /* widgetOverride */) || figmaTypeToWidget(node);
    const spec = await getTypeSpec(type, node, strapi, cache);
    if (!spec) {
      return null;
    }
    let result = await processSpec(cache, strapi, node, spec.mappings);
    if (Array.isArray(result)) {
      result = Object.assign({}, ...result);
    }
    const infoSpec = await getTypeSpec("__info", { type: "FRAME" }, strapi, cache);
    result["__info"] = await processSpec(cache, strapi, node, infoSpec.mappings);
    const userData = _getUserDataExport(node, type, spec.userData);
    if (userData) {
      result["__userData"] = userData;
    }
    return result;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
async function exportToFlutter(strapi, node) {
  const cache = /* @__PURE__ */ new Map();
  return await exportNode(cache, strapi, node);
}
function _exportValue(value, cache) {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => _exportValue(v, cache));
  }
  if (typeof value === "object") {
    const result = {};
    if ("type" in value && typeof value.type === "string") {
      if (cache.has(value)) {
        return value.id;
      }
      cache.add(value);
      for (const key in value) {
        if (key === "parent" || key === "mainComponent" || key === "masterComponent") {
          result[key] = value[key].id;
        } else if (key === "defaultVariant") {
          result[key] = {
            id: value[key].id,
            name: value[key].name
          };
        } else {
          try {
            result[key] = _exportValue(value[key], cache);
          } catch (_) {
            result[key] = null;
          }
        }
      }
    } else {
      for (const key of Object.keys(value)) {
        result[key] = _exportValue(value[key], cache);
      }
    }
    return result;
  }
  return null;
}
function exportRawJson(node) {
  try {
    const cache = /* @__PURE__ */ new Set();
    return _exportValue(node, cache);
  } catch (e) {
    console.log(e);
    return null;
  }
}

// src/plugin/Strapi.ts
var ForbiddenError = class extends Error {
};
var DataError = class extends Error {
};
var UnknownError = class extends Error {
  constructor(msg, data) {
    super(msg);
    this.data = data;
  }
};
var Strapi = class {
  constructor(api) {
    this.defaultCache = /* @__PURE__ */ new Map();
    this.server = "";
    this.jwt = "";
    this.loaded = (async () => {
      this.jwt = await getLocalData("com.phenoui.strapi.auth.token" /* strapiJWT */) || "";
      this.server = await getLocalData("com.phenoui.strapi.auth.server" /* strapiServer */) || MetadataDefaults["com.phenoui.strapi.auth.server" /* strapiServer */];
    })();
    this.api = api;
  }
  async isLoggedIn() {
    await this.loaded;
    return Boolean(this.jwt);
  }
  async logout() {
    this.jwt = "";
    await setLocalData("com.phenoui.strapi.auth.token" /* strapiJWT */, "");
  }
  async performLogin(bus, server, user, password) {
    if (user && password) {
      server = server ? server.trim() : MetadataDefaults["com.phenoui.strapi.auth.server" /* strapiServer */];
      const url = this._urlForEndpoint(server, "/api/admins/auth-with-password" /* login */);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ identity: user, password })
        });
        const result = await response.json();
        if (result.token) {
          this.jwt = result.token;
          this.server = server.trim();
          await setLocalData("com.phenoui.strapi.auth.user" /* strapiUser */, user);
          await setLocalData("com.phenoui.strapi.auth.token" /* strapiJWT */, this.jwt);
          await setLocalData("com.phenoui.strapi.auth.server" /* strapiServer */, this.server);
          return true;
        } else if (result.error) {
          showStrapiLoginScreen(bus, this.api, result.error.message);
        } else {
          showStrapiLoginScreen(bus, this.api, "UNKNOWN ERROR, CONTACT DARIO!");
        }
      } catch (e) {
        showStrapiLoginScreen(bus, this.api, `ERROR contacting server: ${e.message}`);
        return false;
      }
    } else {
      showStrapiLoginScreen(bus, this.api, "Please enter all the required fields");
    }
    return false;
  }
  async getTypeSpec(type, cache, useDefaultCache = false) {
    if (cache && cache.has(type)) {
      return Object.assign({}, cache.get(type));
    }
    if (useDefaultCache) {
      if (this.defaultCache.has(type)) {
        return Object.assign({}, this.defaultCache.get(type));
      }
    }
    const endpoint = "/phui/widget/spec/type";
    const url = this._urlForEndpoint(this.server, endpoint, { id: type });
    const data = await this._fetchGET(url);
    if (data) {
      await this.resolveSpecMappings(data, cache, useDefaultCache);
      if (cache) {
        cache.set(type, data);
      }
      this.defaultCache.set(type, data);
      return Object.assign({}, data);
    }
    return null;
  }
  async resolveSpecMappings(spec, cache, useDefaultCache = false) {
    if (Array.isArray(spec.mappings)) {
      spec.mappings = spec.mappings.map((t) => {
        if (typeof t === "string") {
          const operator = t.substring(0, 1);
          const path = t.substring(1);
          if (operator === "@" /* inherit */) {
            return this.getTypeSpec(path, cache, useDefaultCache).then((s) => s == null ? void 0 : s.mappings);
          } else {
            throw new DataError(`Unknown operator [${operator}] in mapping [${t}]`);
          }
        }
        return Promise.resolve(t);
      });
      spec.mappings = await Promise.all(spec.mappings);
      spec.mappings = Object.assign({}, ...spec.mappings);
    }
  }
  async getTypeList(search, limit) {
    if (!search) {
      return [];
    }
    const endpoint = "/phui/widget/spec/search";
    const url = this._urlForEndpoint(this.server, endpoint, { id: search });
    const data = await this._fetchGET(url);
    if (data && data.items && data.items.length) {
      return data.items.map((d) => d.type);
    }
    return [];
  }
  async uploadData(collection, payload, tag) {
    const path = `${tag}/${payload.name}`;
    const existingURL = this._urlForEndpoint(this.server, `${collection}/tag`, { id: path });
    const existing = await this._fetchGET(existingURL);
    let url;
    let method;
    if (existing) {
      url = this._urlForEndpoint(this.server, `${collection}/id`, { id: existing.id });
      method = "PATCH";
    } else {
      url = this._urlForEndpoint(this.server, `${collection}/tag`, { id: path });
      method = "POST";
    }
    const result = await this._fetchUpload(url, method, payload);
    console.log(result);
  }
  async getCategory(collection, uid) {
    const existingURL = this._urlForEndpoint(this.server, collection + "/path", { id: uid });
    return await this._fetchGET(existingURL);
  }
  async createCategory(collection, uid) {
    const existing = await this.getCategory(collection, uid);
    if (existing) {
      return existing.id;
    }
    const url = this._urlForEndpoint(this.server, collection + "/path", { id: uid });
    return await this._fetchUpload(url, "POST", null);
  }
  _urlForEndpoint(server, endpoint, options = {}) {
    server = server.endsWith("/") ? server.substring(0, server.length - 1) : server;
    return `${server}${endpoint}${options.id ? `/${options.id}` : ""}${options.query ? `?${options.query}` : ""}`;
  }
  async _checkFetchResult(result) {
    if (result.error) {
      if (result.error.status === 403) {
        this.jwt = "";
        await setLocalData("com.phenoui.strapi.auth.token" /* strapiJWT */, "");
        throw new ForbiddenError("Forbidden, please login again");
      } else {
        throw new UnknownError(result.error.message, result.error);
      }
    }
  }
  async _fetch(url, method, headers, body) {
    const response = await fetch(url, {
      method,
      headers,
      body
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new ForbiddenError("Unauthorized, please login again");
      } else if (response.status === 404) {
        return null;
      }
    }
    const result = await response.json();
    await this._checkFetchResult(result);
    return result;
  }
  async _fetchGET(url) {
    return await this._fetch(url, "GET", {
      "Authorization": `Bearer ${this.jwt}`
    });
  }
  async _fetchUpload(url, method, data) {
    return await this._fetch(url, method, {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.jwt}`
    }, JSON.stringify(data));
  }
  async _fetchPOST(url, data) {
    return await this._fetchUpload(url, "POST", data);
  }
  async _fetchPUT(url, data) {
    return await this._fetchUpload(url, "PUT", data);
  }
};

// src/plugin/PhenoUI.ts
var PhenoUI = class {
  constructor(api, bus) {
    this.tab = 0 /* figma */;
    this.api = api;
    this.bus = bus;
    this.bus.executors.push(this);
    this.strapi = new Strapi(this.api);
    this.setupLocalEvents();
  }
  async isLoggedIn() {
    if (await this.strapi.isLoggedIn()) {
      return true;
    }
    showStrapiLoginScreen(this.bus, this.api);
    return false;
  }
  setupLocalEvents() {
    this.api.on("run", async (evt) => await this.isLoggedIn() ? this.handleOpen(evt) : null);
    this.api.on("selectionchange", async () => await this.isLoggedIn() ? this.handleSelectionChange(this.api.currentPage.selection) : null);
    this.api.on("documentchange", async (evt) => await this.isLoggedIn() ? this.handleDocumentChange(this.api.currentPage.selection, evt.documentChanges, true) : null);
  }
  printTypes(nodes) {
    for (const node of nodes) {
      console.log(node);
      console.log(`${node.name} => ${node.type}`);
      if (node.type === "FRAME") {
        for (const key in node) {
          if (key.toLowerCase().includes("layout")) {
            console.log(`	${key} => `, node[key]);
          }
        }
      } else if (node.type === "TEXT") {
        console.log(node.getStyledTextSegments([
          "fontSize",
          "fontName",
          "fontWeight",
          "textDecoration",
          "textCase",
          "lineHeight",
          "letterSpacing",
          "fills",
          "listOptions",
          "indentation",
          "hyperlink"
        ]));
      } else if (node.type === "INSTANCE") {
        console.log(node.componentProperties);
      }
    }
  }
  handleOpen(evt) {
    this.handleSelectionChange(figma.currentPage.selection);
  }
  handleSelectionChange(selection, useDefaultCache = false) {
    this.printTypes(selection);
    if (selection.length > 1) {
      showErrorScreen(
        this.bus,
        "ERROR",
        "This plugin cannot work while multiple objects are selected. Please select a single object to continue."
      );
    } else if (selection.length === 1) {
      this._callLayerScreenUpdate(selection[0], useDefaultCache);
    } else {
      showEmptyScreen(this.bus);
    }
  }
  handleDocumentChange(selection, changes, useDefaultCache = false) {
    for (const change of changes) {
      if (change.origin === "LOCAL" && change.type === "PROPERTY_CHANGE" && change.properties.length === 1 && change.properties[0] === "pluginData") {
        continue;
      }
      if ("node" in change && selection.find((n) => n.id === change.node.id)) {
        this.handleSelectionChange(selection, useDefaultCache);
        break;
      }
    }
  }
  async performStrapiLogin(data) {
    const success = await this.strapi.performLogin(this.bus, data.server, data.user, data.password);
    if (success) {
      this.handleSelectionChange(figma.currentPage.selection);
    }
  }
  updateMetadata(data) {
    const node = data.id === null ? this.api.root : findNode(this.api, data.id);
    if (node) {
      updateMetadata(node, data.key, data.value);
    } else {
      console.warn(`Node with id [${data.id}] could not be found to update its metadata`);
    }
  }
  getMetadata(data) {
    const node = data.id === null ? this.api.root : findNode(this.api, data.id);
    this.api.currentPage;
    if (node) {
      return getMetadata(node, data.key);
    } else {
      console.warn(`Node with id [${data.id}] could not be found to get its metadata`);
      return null;
    }
  }
  async setLocalData(data) {
    await setLocalData(data.key, data.value);
  }
  async getLocalData(key) {
    return await getLocalData(key);
  }
  updateComponentProperty(data) {
    const node = data.id === null ? this.api.root : findNode(this.api, data.id);
    if (node) {
      if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
        try {
          node.editComponentProperty(data.key, { defaultValue: data.value });
        } catch (e) {
          const key = data.key.split(/#(?!.*#)/)[0];
          node.editComponentProperty(key, { defaultValue: data.value });
        }
      } else if (node.type === "INSTANCE") {
        try {
          node.setProperties({ [data.key]: data.value });
        } catch (e) {
          const key = data.key.split(/#(?!.*#)/)[0];
          node.setProperties({ [key]: data.value });
        }
      } else {
        console.warn(`Node with id [${data.id}] is not a component or instance and so it cannot have component properties`);
      }
    } else {
      console.warn(`Node with id [${data.id}] could not be found to update its component property`);
    }
  }
  async setTab(data) {
    if (data.tab !== this.tab) {
      this.tab = data.tab;
      if (this.tab === 2 /* github */) {
        const loggedIn = await this.bus.execute("isGithubLoggedIn", void 0);
        if (!loggedIn) {
          showGithubLoginScreen(this.bus, this.api);
          return;
        }
      }
      this.handleSelectionChange(figma.currentPage.selection);
    }
  }
  async strapiLogout() {
    await this.strapi.logout();
    this.handleSelectionChange([]);
  }
  updateLayerView() {
    this.handleSelectionChange(figma.currentPage.selection);
  }
  async exportToFlutter(data) {
    if (!this.isLoggedIn()) {
      return null;
    }
    const node = findNode(this.api, data.id);
    if (!node) {
      throw new Error(`Could not find node with ID [${data.id}] for export.`);
    }
    return exportToFlutter(this.strapi, node);
  }
  async exportRawJson(data) {
    if (!this.isLoggedIn()) {
      return null;
    }
    const node = findNode(this.api, data.id);
    if (!node) {
      throw new Error(`Could not find node with ID [${data.id}] for export.`);
    }
    return exportRawJson(node);
  }
  async uploadToStrapi(data) {
    await this.strapi.uploadData(data.collection, data.payload, data.tag);
  }
  getStrapiJwt() {
    return this.strapi.jwt;
  }
  getStrapiServer() {
    return this.strapi.server;
  }
  getStrapiUrlForEndpoint(data) {
    return this.strapi._urlForEndpoint(this.strapi.server, data.collection, data.options);
  }
  async getCategory(data) {
    return await this.strapi.getCategory(data.collection, data.uid);
  }
  async createCategory(data) {
    return await this.strapi.createCategory(data.collection, data.uid);
  }
  async getTypeList(data) {
    if (!await this.isLoggedIn()) {
      return [];
    }
    try {
      return this.strapi.getTypeList(data.search, data.limit);
    } catch (e) {
      if (e instanceof ForbiddenError) {
        showStrapiLoginScreen(this.bus, this.api, e.message);
      } else {
        showErrorScreen(this.bus, "ERROR", e.message);
      }
      return [];
    }
  }
  async resizeLayer(data) {
    const node = findNode(this.api, data.id);
    if (node) {
      node.resize(data.width, data.height);
    } else {
      console.warn(`Node with id [${data.id}] could not be found to resize it`);
    }
  }
  async replaceContentsWithSvg(data) {
    const node = findNode(this.api, data.id);
    if (node) {
      const content = this.api.createNodeFromSvg(data.svg);
      for (const child of node.children) {
        child.remove();
      }
      for (const child of content.children) {
        node.appendChild(child);
      }
      content.remove();
    } else {
      console.warn(`Node with id [${data.id}] could not be found to replace its contents with svg`);
    }
  }
  async resizeUi(data) {
    const minWidth = 240;
    const maxWidth = 480;
    const minHeight = 400;
    const maxHeight = 640;
    const width = Math.min(maxWidth, Math.max(minWidth, data.width || 0));
    const height = Math.min(maxHeight, Math.max(minHeight, data.height || 0));
    this.api.ui.resize(width, height);
  }
  async getLayerSize(id) {
    const node = findNode(this.api, id);
    if (node) {
      return { width: node.width, height: node.height };
    } else {
      console.warn(`Node with id [${id}] could not be found to get its size`);
      return { width: 0, height: 0 };
    }
  }
  async _callLayerScreenUpdate(node, useDefaultCache = false) {
    const defaultType = figmaTypeToWidget(node);
    const customType = getMetadata(node, "com.phenoui.layer.widget_override" /* widgetOverride */);
    const type = customType || defaultType;
    try {
      let typeData = await getTypeSpec(type, node, this.strapi, void 0, useDefaultCache);
      if (typeData && typeData.userData) {
        typeData.userData = getUserData(node, type, typeData.userData);
        const component = findComponentOrInstance(node);
        if (component !== null) {
          for (const userType of Object.keys(typeData.userData)) {
            const typeInfo = typeData.userData[userType];
            if (typeof typeInfo.value === "object" && !Array.isArray(typeInfo.value) && typeInfo.value !== null) {
              switch (typeInfo.value.type) {
                case "binding":
                  const binding = typeInfo.value;
                  const propValue = getComponentProperty(component, binding.id);
                  binding.value = propValue == null ? void 0 : propValue.value;
                  break;
                case "group":
                  break;
                default:
                  typeInfo.value = JSON.stringify(typeInfo.value);
                  break;
              }
            } else if ((typeInfo.type === "string" || typeInfo.type === "boolean") && (component.type === "COMPONENT" || component.type === "COMPONENT_SET") && component !== node) {
              const compProps = component.componentPropertyDefinitions;
              const properties = [];
              const propType = typeInfo.type === "string" ? "TEXT" : "BOOLEAN";
              if (propType) {
                for (const key of Object.keys(compProps)) {
                  if (compProps[key].type === propType) {
                    properties.push(key);
                  }
                }
                typeInfo.properties = properties;
              }
            }
          }
        }
      }
      showLayerScreen(this.bus, {
        layer: {
          id: node.id,
          name: node.name,
          widgetDefault: defaultType,
          widgetOverride: customType,
          typeData,
          exportable: Boolean(node.parent && node.parent.type === "PAGE" || node.type === "COMPONENT" || node.type === "COMPONENT_SET")
        }
      }, this.tab);
    } catch (e) {
      if (e instanceof ForbiddenError) {
        showStrapiLoginScreen(this.bus, this.api, e.message);
      } else {
        showErrorScreen(this.bus, "ERROR", e.message);
      }
    }
  }
};

// node_modules/uuid/dist/esm-browser/rng.js
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
    if (!getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
  }
  return getRandomValues(rnds8);
}

// node_modules/uuid/dist/esm-browser/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}

// node_modules/uuid/dist/esm-browser/native.js
var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native_default = {
  randomUUID
};

// node_modules/uuid/dist/esm-browser/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// src/shared/MessageBus.ts
var import_polyfill_crypto = __toESM(require_polyfill_crypto());
var rnds82 = new Uint8Array(16);
function rng2() {
  return (0, import_polyfill_crypto.default)(rnds82);
}
var MessageBus = class {
  constructor(ctx, executors) {
    this.queue = /* @__PURE__ */ new Map();
    this.ctx = ctx;
    this.executors = executors;
    this.id = v4_default({ rng: rng2 });
    if (this.ctx.hasOwnProperty("ui")) {
      this.env = "plugin";
      this.ctx.ui.on("message", (pluginMessage, props) => this._messageHandler(pluginMessage, props));
    } else {
      this.env = "ui";
      this.ctx.addEventListener("message", (pluginMessage, props) => this._messageHandler(pluginMessage, props));
    }
  }
  async _messageHandler(event, props) {
    const pluginMessage = "data" in event ? event.data.pluginMessage : event;
    if (pluginMessage.type === "execute") {
      await this._executeMessage(pluginMessage);
    } else if (pluginMessage.type === "result") {
      this._resolveMessage(pluginMessage);
    } else {
      throw `ERROR: Unrecognized message type [${pluginMessage.type}]`;
    }
  }
  async _executeMessage(message) {
    for (const executor of this.executors) {
      if (message.fn in executor && typeof executor[message.fn] === "function") {
        const result = await executor[message.fn](message.args);
        this._postMessage({
          id: message.id,
          type: "result",
          result
        });
        return;
      }
    }
    throw `ERROR: No executor can handle the fn [${message.fn}]`;
  }
  _resolveMessage(message) {
    if (this.queue.has(message.id)) {
      const entry = this.queue.get(message.id);
      this.queue.delete(message.id);
      entry.resolve(message.result);
      return;
    }
    throw `ERROR: Unrecognized queue entry ID [${message.id}]`;
  }
  _postMessage(pluginMessage) {
    if (this.env === "ui") {
      this.ctx.parent.postMessage({ pluginMessage }, "*");
    } else {
      this.ctx.ui.postMessage(pluginMessage, { origin: "*" });
    }
  }
  async execute(fn, args) {
    return new Promise((resolve, reject) => {
      const id = v4_default({ rng: rng2 });
      this.queue.set(id, { id, resolve, reject });
      this._postMessage({ id, fn, args, type: "execute" });
    });
  }
};

// src/plugin/mod.ts
figma.skipInvisibleInstanceChildren = true;
figma.root.setRelaunchData({ open: "" });
figma.showUI(__html__, {
  width: 240,
  height: 400,
  themeColors: true
});
var messageBus = new MessageBus(figma, []);
var phenoUI = new PhenoUI(figma, messageBus);
console.log(phenoUI);
//# sourceMappingURL=mod.js.map
