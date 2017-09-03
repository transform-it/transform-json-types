import SHA1 from "sha1";
import {
  values,
  isEmpty,
  isArray,
  isObject,
  isBoolean,
  isNumber,
  isString,
  merge,
  isInteger
} from "lodash";

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
      ANY: "AnyVal"
    }),
    handleArray: (className = "") => `Array[${className}]`
  }
};

let langDetails = {};
let classes = {};
let classesCache = {};
let classesInUse = {};

function hasSpecialChars(str) {
  return /[ ~`!#$%\^&*+=\-\[\]\\';,\/{}|\\":<>\?]/g.test(str);
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
  return key
    .replace(/_/gi, " ")
    .replace(/-/gi, " ")
    .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1))
    .replace(/ /gi, "");
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

function isValueConsistent(o) {
  if (!o.length) {
    return true;
  } else {
    if (!isArray(o)) {
      o = values(o);
    }
    const n = o[0];
    const nn = isObject(n) ? generateSignature(n) : typeof n;
    return Object.keys(o).every(
      key =>
        (isObject(o[key]) ? generateSignature(o[key]) : typeof o[key]) === nn
    );
  }
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
          if (!value.length) {
            type = handleArray("", true);
          } else {
            if (isObject(value[0])) {
              type = handleArray(
                getInterfaceType(
                  key,
                  value[0],
                  classes,
                  classesCache,
                  classesInUse
                )
              );
              analyzeObject(value[0], key);
            } else {
              type = `${getBasicType(value[0])}[]`;
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

export default function transform(obj, options) {
  obj = isString(obj) ? JSON.parse(obj) : obj;

  if (isArray(obj)) {
    obj = merge({}, ...obj);
  }

  const defaultOptions = {
    objectName: "_RootInterface",
    lang: "flow"
  };

  langDetails = {};

  const { objectName, lang } = merge({}, defaultOptions, options);

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
    preInterface
  } = langDetails;

  Object.keys(classes).map(clsName => {
    output = preInterface || "";
    output += `${langDetails.interface} ${clsName}${equator} ${startingBrace}\n`;
    Object.keys(classes[clsName]).map(key => {
      output += `  ${key}: ${classes[clsName][key]}${separator}\n`;
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
