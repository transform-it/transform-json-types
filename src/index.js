/* eslint-disable standard/computed-property-even-spacing */
import SHA1 from "sha1";
import {
  isEmpty,
  isArray,
  isObject,
  isBoolean,
  isNumber,
  isString,
  merge,
  isInteger,
  intersection,
  difference,
  union,
  assign,
  camelCase,
  upperFirst,
  snakeCase
} from "lodash";
import rustReserved from "rust-keywords";

const typeNames = {
  STRING: "string",
  NUMBER: "number",
  INTEGER: "number",
  BOOLEAN: "boolean",
  ARRAY: "[]",
  ANY: "any"
};

const mapping = {
  flow: {
    interface: "type",
    separator: ",",
    startingBrace: "{",
    endingBrace: "}",
    terminator: ";",
    equator: " = ",
    types: typeNames,
    optional: "?",
    handleArray: (className = "", any) => (any ? "any[]" : `${className}[]`)
  },
  typescript: {
    interface: "interface",
    separator: ";",
    startingBrace: "{",
    endingBrace: "}",
    terminator: "",
    equator: "",
    types: typeNames,
    optional: "?",
    handleArray: (className = "", any) => (any ? "any[]" : `${className}[]`)
  },
  "rust-serde": {
    interface: "struct",
    separator: ",",
    startingBrace: "{",
    endingBrace: "}",
    terminator: "",
    equator: "",
    types: merge({}, typeNames, {
      STRING: "String",
      NUMBER: "f64",
      INTEGER: "i64",
      BOOLEAN: "bool",
      ANY: "()"
    }),
    handleArray: (className = "") => `Vec<${className}>`,
    preInterface: "#[derive(Serialize, Deserialize)]\n"
  },
  scala: {
    interface: "case class",
    separator: ",",
    startingBrace: "(",
    endingBrace: ")",
    terminator: "",
    equator: "",
    types: merge({}, typeNames, {
      STRING: "String",
      NUMBER: "Double",
      INTEGER: "Int",
      ANY: "Any",
      BOOLEAN: "Boolean"
    }),
    hideTerminatorAtLast: true,
    handleArray: (className = "") => `Seq[${className}]`
  },
  "io-ts": {
    interface: "const",
    separator: ",",
    startingBrace: "{",
    endingBrace: "})",
    terminator: ";",
    equator: " = t.type(",
    types: typeNames,
    optional: "?",
    handleArray: (className = "", any) => (any ? "any[]" : `${className}[]`),
    types: merge({}, typeNames, {
      STRING: "t.string",
      NUMBER: "t.number",
      INTEGER: "t.Integer",
      ANY: "t.any",
      BOOLEAN: "t.boolean"
    })
  }
};

let langDetails = {};
let classes = {};
let classesCache = {};
let classesInUse = {};
let optionalProperties = {};

function pascalCase(str) {
  return upperFirst(camelCase(str));
}

function setOptionalProperties(arr, objectName) {
  if (!isValueConsistent(arr)) return;
  const arrayOfKeys = arr.map(a => Object.keys(a));
  optionalProperties[objectName] = difference(
    union(...arrayOfKeys),
    intersection(...arrayOfKeys)
  );
}

function hasSpecialChars(str) {
  return /[ ~`!@#$%\^&*+=\-\[\]\\';,\/{}|\\":<>\?]/g.test(str);
}

function getBasicType(value) {
  const { types } = langDetails;

  let type = types.STRING;
  switch (true) {
    case isString(value):
      type = types.STRING;
      break;
    case isInteger(value):
      type = types.INTEGER;
      break;
    case isNumber(value):
      type = types.NUMBER;
      break;
    case isBoolean(value):
      type = types.BOOLEAN;
      break;
  }
  return type;
}

function generateSignature(o) {
  if (isObject(o)) {
    return SHA1(Object.keys(o).map(n => n.toLowerCase()).sort().join("|"));
  } else {
    return SHA1(Object.keys(o).map(n => typeof n).sort().join("|"));
  }
}

function getValidClassName(key) {
  return pascalCase(key);
}

function getInterfaceType(key, value, classes, classesCache, classesInUse) {
  // get a valid className
  const className = getValidClassName(key);
  const currentObjectSignature = generateSignature(value);
  const isKnownClass =
    Object.keys(classesCache).indexOf(currentObjectSignature) !== -1;
  if (isKnownClass) return classesCache[currentObjectSignature];
  if (classesInUse[className] !== undefined) {
    classesInUse[className]++;
    classesCache[currentObjectSignature] = className + classesInUse[className];
    return classesCache[currentObjectSignature];
  }
  classesCache[currentObjectSignature] = className;
  classesInUse[className] = 0;
  return className;
}

function isValueConsistent(arr) {
  if (!isEmpty(arr)) {
    arr.every(x => (isObject(x) ? "object" : typeof x));
  }
  return true;
}

function analyzeObject(obj, objectName) {
  objectName = getInterfaceType(
    objectName,
    obj,
    classes,
    classesCache,
    classesInUse
  );
  classes[objectName] = classes[objectName] || {};

  Object.keys(obj).map(key => {
    let type = "string";
    const value = obj[key];
    const { types, handleArray } = langDetails;

    switch (true) {
      case isString(value):
        type = types.STRING;
        break;
      case isInteger(value):
        type = types.INTEGER;
        break;
      case isNumber(value):
        type = types.NUMBER;
        break;
      case isBoolean(value):
        type = types.BOOLEAN;
        break;
      case isArray(value):
        type = handleArray("", true);
        if (isValueConsistent(value)) {
          if (isEmpty(value)) {
            type = handleArray("", true);
          } else {
            if (isObject(value[0])) {
              const clsName = getInterfaceType(
                key,
                assign({}, ...value),
                classes,
                classesCache,
                classesInUse
              );
              type = handleArray(clsName);
              setOptionalProperties(value, clsName);
              analyzeObject(assign({}, ...value), key);
            } else {
              type = `${handleArray(getBasicType(value[0]))}`;
            }
          }
        }
        break;
      case isObject(value) && !isArray(value):
        type = types.ANY;
        if (!isEmpty(value)) {
          type = getInterfaceType(
            key,
            value,
            classes,
            classesCache,
            classesInUse
          );
          analyzeObject(value, key);
        }
        break;
    }
    if (hasSpecialChars(key)) {
      key = `"${key}"`;
    }
    classes[objectName][key] = type;
  });

  return { classes, classesCache, classesInUse };
}

function setOptional(key, objName) {
  if (
    optionalProperties[objName] &&
    optionalProperties[objName].indexOf(key) >= 0 &&
    langDetails.optional
  ) {
    return langDetails.optional;
  }
  return "";
}

function rustRename(key, lang, clsName, rustCase) {
  const caseFunc = rustCase === "camelCase" ? camelCase : snakeCase;
  const casedText =
    hasSpecialChars(key) || rustCase === "snakeCase" ? caseFunc(key) : key;
  if (
    lang === "rust-serde" &&
    (rustReserved.indexOf(key) >= 0 ||
      key.indexOf(" ") >= 0 ||
      key !== casedText)
  ) {
    const changedKey = `${casedText.indexOf("_") >= 0 ? "" : "_"}${casedText}`;
    return `  #[serde(rename = "${key.replace(/"/g, "")}")]\n  ${changedKey}`;
  }
  return `  ${key}${setOptional(key, clsName)}`;
}

export default function transform(obj, options) {
  obj = isString(obj) ? JSON.parse(obj) : obj;

  if (isArray(obj)) {
    obj = merge({}, ...obj);
  }

  const defaultOptions = {
    objectName: "_RootInterface",
    lang: "flow",
    rustCase: "camelCase"
  };

  langDetails = {};
  optionalProperties = {};

  const { objectName, lang, rustCase } = merge({}, defaultOptions, options);

  if (rustCase !== "camelCase" && rustCase !== "snakeCase") {
    throw new Error("rustCase can only be 'camelCase' or 'snakeCase'.");
  }

  langDetails = mapping[lang];
  let output = "";
  const localClasses = {};
  classes = {};
  classesCache = {};
  classesInUse = {};

  analyzeObject(obj, objectName);

  const {
    equator,
    separator,
    endingBrace,
    startingBrace,
    terminator,
    preInterface,
    hideTerminatorAtLast
  } = langDetails;

  Object.keys(classes).map(clsName => {
    output = preInterface || "";
    output += `${langDetails.interface} ${clsName}${equator} ${startingBrace}\n`;

    const keys = Object.keys(classes[clsName]);

    keys.map((key, i) => {
      const _separator =
        i === keys.length - 1 && hideTerminatorAtLast ? "" : separator;

      output += `${rustRename(key, lang, clsName, rustCase)}: ${classes[
        clsName
      ][key]}${_separator}\n`;
    });
    output += `${endingBrace}${terminator}\n\n`;
    localClasses[clsName] = output;
  });

  output = "";

  Object.keys(localClasses).sort().forEach(key => {
    output += localClasses[key];
  });

  return output;
}
