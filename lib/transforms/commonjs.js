'use strict';

/*
  Copy-pasted from
  https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-modules-commonjs/src/index.js
*/
var _require = require('path');

const basename = _require.basename,
  extname = _require.extname;

const template = require('babel-template');
const babelPluginTransformStrictMode = require('babel-plugin-transform-strict-mode');

const t = require('babel-types');

const buildRequire = template(`
  require($0);
`);

const buildExportsModuleDeclaration = template(`
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
`);

const buildExportsFrom = template(`
  Object.defineProperty(exports, $0, {
    enumerable: true,
    get: function () {
      return $1;
    }
  });
`);

const buildLooseExportsModuleDeclaration = template(`
  exports.__esModule = true;
`);

const buildExportsAssignment = template(`
  exports.$0 = $1;
`);

const buildExportAll = template(`
  Object.keys(OBJECT).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return OBJECT[key];
      }
    });
  });
`);

// Parcel specific modification
const buildParcelWildcardInterop = template(`
  function parcelInteropWildcard(obj) {
    // When the object is a primitive we just return it with a default property
    if(typeof obj !== 'object') {
      obj.default = obj

      return obj
    }

    // Use the default export as a base if it exists
    var newObj = (obj && obj.default) || {}

    // Copy each property to the object (exotic namespace)
    for(var key in obj) {
      if(Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = obj[key]
      }
    }

    // set the default export if it's an ES module
    if(obj && !obj.__esModule) {
      obj.default = obj
    }

    return newObj
  }
`);

const THIS_BREAK_KEYS = [
  'FunctionExpression',
  'FunctionDeclaration',
  'ClassProperty',
  'ClassMethod',
  'ObjectMethod'
];

module.exports = function() {
  const REASSIGN_REMAP_SKIP = Symbol();

  const reassignmentVisitor = {
    ReferencedIdentifier(path) {
      const name = path.node.name;
      const remap = this.remaps[name];
      if (!remap) return;

      // redeclared in this scope
      if (this.scope.getBinding(name) !== path.scope.getBinding(name)) return;

      if (path.parentPath.isCallExpression({callee: path.node})) {
        path.replaceWith(t.sequenceExpression([t.numericLiteral(0), remap]));
      } else if (path.isJSXIdentifier() && t.isMemberExpression(remap)) {
        const object = remap.object,
          property = remap.property;

        path.replaceWith(
          t.JSXMemberExpression(
            t.JSXIdentifier(object.name),
            t.JSXIdentifier(property.name)
          )
        );
      } else {
        path.replaceWith(remap);
      }
      this.requeueInParent(path);
    },

    AssignmentExpression(path) {
      let node = path.node;
      if (node[REASSIGN_REMAP_SKIP]) return;

      const left = path.get('left');
      if (left.isIdentifier()) {
        const name = left.node.name;
        const exports = this.exports[name];
        if (!exports) return;

        // redeclared in this scope
        if (this.scope.getBinding(name) !== path.scope.getBinding(name)) return;

        node[REASSIGN_REMAP_SKIP] = true;

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (
            var _iterator = exports[Symbol.iterator](), _step;
            !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
            _iteratorNormalCompletion = true
          ) {
            const reid = _step.value;

            node = buildExportsAssignment(reid, node).expression;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        path.replaceWith(node);
        this.requeueInParent(path);
      } else if (left.isObjectPattern()) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (
            var _iterator2 = left.node.properties[Symbol.iterator](), _step2;
            !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done);
            _iteratorNormalCompletion2 = true
          ) {
            const property = _step2.value;

            const name = property.value.name;

            const exports = this.exports[name];
            if (!exports) continue;

            // redeclared in this scope
            if (this.scope.getBinding(name) !== path.scope.getBinding(name))
              return;

            node[REASSIGN_REMAP_SKIP] = true;

            path.insertAfter(
              buildExportsAssignment(t.identifier(name), t.identifier(name))
            );
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      } else if (left.isArrayPattern()) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (
            var _iterator3 = left.node.elements[Symbol.iterator](), _step3;
            !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done);
            _iteratorNormalCompletion3 = true
          ) {
            const element = _step3.value;

            if (!element) continue;
            const name = element.name;

            const exports = this.exports[name];
            if (!exports) continue;

            // redeclared in this scope
            if (this.scope.getBinding(name) !== path.scope.getBinding(name))
              return;

            node[REASSIGN_REMAP_SKIP] = true;

            path.insertAfter(
              buildExportsAssignment(t.identifier(name), t.identifier(name))
            );
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
      }
    },

    UpdateExpression(path) {
      const arg = path.get('argument');
      if (!arg.isIdentifier()) return;

      const name = arg.node.name;
      const exports = this.exports[name];
      if (!exports) return;

      // redeclared in this scope
      if (this.scope.getBinding(name) !== path.scope.getBinding(name)) return;

      const node = t.assignmentExpression(
        path.node.operator[0] + '=',
        arg.node,
        t.numericLiteral(1)
      );

      if (
        (path.parentPath.isExpressionStatement() &&
          !path.isCompletionRecord()) ||
        path.node.prefix
      ) {
        path.replaceWith(node);
        this.requeueInParent(path);
        return;
      }

      const nodes = [];
      nodes.push(node);

      let operator;
      if (path.node.operator === '--') {
        operator = '+';
      } else {
        // "++"
        operator = '-';
      }
      nodes.push(t.binaryExpression(operator, arg.node, t.numericLiteral(1)));

      path.replaceWithMultiple(t.sequenceExpression(nodes));
    }
  };

  return {
    inherits: babelPluginTransformStrictMode,

    visitor: {
      ThisExpression(path, state) {
        // If other plugins run after this plugin's Program#exit handler, we allow them to
        // insert top-level `this` values. This allows the AMD and UMD plugins to
        // function properly.
        if (this.ranCommonJS) return;

        if (
          state.opts.allowTopLevelThis !== true &&
          !path.findParent(
            path =>
              !path.is('shadow') && THIS_BREAK_KEYS.indexOf(path.type) >= 0
          )
        ) {
          path.replaceWith(t.identifier('undefined'));
        }
      },

      Program: {
        exit(path) {
          this.ranCommonJS = true;

          const strict = !!this.opts.strict;
          const noInterop = !!this.opts.noInterop;

          const scope = path.scope;

          // rename these commonjs variables if they're declared in the file

          scope.rename('module');
          scope.rename('exports');
          scope.rename('require');

          let hasExports = false;
          let hasImports = false;

          const body = path.get('body');
          const imports = Object.create(null);
          const exports = Object.create(null);

          const nonHoistedExportNames = Object.create(null);

          const topNodes = [];
          const remaps = Object.create(null);

          const requires = Object.create(null);

          function addRequire(source, blockHoist) {
            const cached = requires[source];
            if (cached) return cached;

            const ref = path.scope.generateUidIdentifier(
              basename(source, extname(source))
            );

            const varDecl = t.variableDeclaration('var', [
              t.variableDeclarator(
                ref,
                buildRequire(t.stringLiteral(source)).expression
              )
            ]);

            // Copy location from the original import statement for sourcemap
            // generation.
            if (imports[source]) {
              varDecl.loc = imports[source].loc;
            }

            if (typeof blockHoist === 'number' && blockHoist > 0) {
              varDecl._blockHoist = blockHoist;
            }

            topNodes.push(varDecl);

            return (requires[source] = ref);
          }

          function addTo(obj, key, arr) {
            const existing = obj[key] || [];
            obj[key] = existing.concat(arr);
          }

          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (
              var _iterator4 = body[Symbol.iterator](), _step4;
              !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done);
              _iteratorNormalCompletion4 = true
            ) {
              const path = _step4.value;

              if (path.isExportDeclaration()) {
                hasExports = true;

                const specifiers = [].concat(
                  path.get('declaration'),
                  path.get('specifiers')
                );
                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                  for (
                    var _iterator6 = specifiers[Symbol.iterator](), _step6;
                    !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next())
                      .done);
                    _iteratorNormalCompletion6 = true
                  ) {
                    const specifier = _step6.value;

                    const ids = specifier.getBindingIdentifiers();
                    if (ids.__esModule) {
                      throw specifier.buildCodeFrameError(
                        'Illegal export "__esModule"'
                      );
                    }
                  }
                } catch (err) {
                  _didIteratorError6 = true;
                  _iteratorError6 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion6 && _iterator6.return) {
                      _iterator6.return();
                    }
                  } finally {
                    if (_didIteratorError6) {
                      throw _iteratorError6;
                    }
                  }
                }
              }

              if (path.isImportDeclaration()) {
                hasImports = true;

                const key = path.node.source.value;
                const importsEntry = imports[key] || {
                  specifiers: [],
                  maxBlockHoist: 0,
                  loc: path.node.loc
                };

                importsEntry.specifiers.push(...path.node.specifiers);

                if (typeof path.node._blockHoist === 'number') {
                  importsEntry.maxBlockHoist = Math.max(
                    path.node._blockHoist,
                    importsEntry.maxBlockHoist
                  );
                }

                imports[key] = importsEntry;

                path.remove();
              } else if (path.isExportDefaultDeclaration()) {
                const declaration = path.get('declaration');
                if (declaration.isFunctionDeclaration()) {
                  const id = declaration.node.id;
                  const defNode = t.identifier('default');
                  if (id) {
                    addTo(exports, id.name, defNode);
                    topNodes.push(buildExportsAssignment(defNode, id));
                    path.replaceWith(declaration.node);
                  } else {
                    topNodes.push(
                      buildExportsAssignment(
                        defNode,
                        t.toExpression(declaration.node)
                      )
                    );
                    path.remove();
                  }
                } else if (declaration.isClassDeclaration()) {
                  const id = declaration.node.id;
                  const defNode = t.identifier('default');
                  if (id) {
                    addTo(exports, id.name, defNode);
                    path.replaceWithMultiple([
                      declaration.node,
                      buildExportsAssignment(defNode, id)
                    ]);
                  } else {
                    path.replaceWith(
                      buildExportsAssignment(
                        defNode,
                        t.toExpression(declaration.node)
                      )
                    );

                    // Manualy re-queue `export default class {}` expressions so that the ES3 transform
                    // has an opportunity to convert them. Ideally this would happen automatically from the
                    // replaceWith above. See #4140 for more info.
                    path.parentPath.requeue(path.get('expression.left'));
                  }
                } else {
                  path.replaceWith(
                    buildExportsAssignment(
                      t.identifier('default'),
                      declaration.node
                    )
                  );

                  // Manualy re-queue `export default foo;` expressions so that the ES3 transform
                  // has an opportunity to convert them. Ideally this would happen automatically from the
                  // replaceWith above. See #4140 for more info.
                  path.parentPath.requeue(path.get('expression.left'));
                }
              } else if (path.isExportNamedDeclaration()) {
                const declaration = path.get('declaration');
                if (declaration.node) {
                  if (declaration.isFunctionDeclaration()) {
                    const id = declaration.node.id;
                    addTo(exports, id.name, id);
                    topNodes.push(buildExportsAssignment(id, id));
                    path.replaceWith(declaration.node);
                  } else if (declaration.isClassDeclaration()) {
                    const id = declaration.node.id;
                    addTo(exports, id.name, id);
                    path.replaceWithMultiple([
                      declaration.node,
                      buildExportsAssignment(id, id)
                    ]);
                    nonHoistedExportNames[id.name] = true;
                  } else if (declaration.isVariableDeclaration()) {
                    const declarators = declaration.get('declarations');
                    var _iteratorNormalCompletion7 = true;
                    var _didIteratorError7 = false;
                    var _iteratorError7 = undefined;

                    try {
                      for (
                        var _iterator7 = declarators[Symbol.iterator](), _step7;
                        !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next())
                          .done);
                        _iteratorNormalCompletion7 = true
                      ) {
                        const decl = _step7.value;

                        const id = decl.get('id');

                        const init = decl.get('init');
                        const exportsToInsert = [];
                        if (!init.node)
                          init.replaceWith(t.identifier('undefined'));

                        if (id.isIdentifier()) {
                          addTo(exports, id.node.name, id.node);
                          init.replaceWith(
                            buildExportsAssignment(id.node, init.node)
                              .expression
                          );
                          nonHoistedExportNames[id.node.name] = true;
                        } else if (id.isObjectPattern()) {
                          for (let i = 0; i < id.node.properties.length; i++) {
                            const prop = id.node.properties[i];
                            let propValue = prop.value;
                            if (t.isAssignmentPattern(propValue)) {
                              propValue = propValue.left;
                            } else if (t.isRestProperty(prop)) {
                              propValue = prop.argument;
                            }
                            addTo(exports, propValue.name, propValue);
                            exportsToInsert.push(
                              buildExportsAssignment(propValue, propValue)
                            );
                            nonHoistedExportNames[propValue.name] = true;
                          }
                        } else if (id.isArrayPattern() && id.node.elements) {
                          for (let i = 0; i < id.node.elements.length; i++) {
                            let elem = id.node.elements[i];
                            if (!elem) continue;
                            if (t.isAssignmentPattern(elem)) {
                              elem = elem.left;
                            } else if (t.isRestElement(elem)) {
                              elem = elem.argument;
                            }
                            const name = elem.name;
                            addTo(exports, name, elem);
                            exportsToInsert.push(
                              buildExportsAssignment(elem, elem)
                            );
                            nonHoistedExportNames[name] = true;
                          }
                        }
                        path.insertAfter(exportsToInsert);
                      }
                    } catch (err) {
                      _didIteratorError7 = true;
                      _iteratorError7 = err;
                    } finally {
                      try {
                        if (!_iteratorNormalCompletion7 && _iterator7.return) {
                          _iterator7.return();
                        }
                      } finally {
                        if (_didIteratorError7) {
                          throw _iteratorError7;
                        }
                      }
                    }

                    path.replaceWith(declaration.node);
                  }
                  continue;
                }

                const specifiers = path.get('specifiers');
                const nodes = [];
                const source = path.node.source;
                if (source) {
                  const ref = addRequire(source.value, path.node._blockHoist);

                  var _iteratorNormalCompletion8 = true;
                  var _didIteratorError8 = false;
                  var _iteratorError8 = undefined;

                  try {
                    for (
                      var _iterator8 = specifiers[Symbol.iterator](), _step8;
                      !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next())
                        .done);
                      _iteratorNormalCompletion8 = true
                    ) {
                      const specifier = _step8.value;

                      if (specifier.isExportNamespaceSpecifier()) {
                        // todo
                      } else if (specifier.isExportDefaultSpecifier()) {
                        // todo
                      } else if (specifier.isExportSpecifier()) {
                        if (
                          !noInterop &&
                          specifier.node.local.name === 'default'
                        ) {
                          topNodes.push(
                            buildExportsFrom(
                              t.stringLiteral(specifier.node.exported.name),
                              t.memberExpression(
                                t.callExpression(
                                  this.addHelper('interopRequireDefault'),
                                  [ref]
                                ),
                                specifier.node.local
                              )
                            )
                          );
                        } else {
                          topNodes.push(
                            buildExportsFrom(
                              t.stringLiteral(specifier.node.exported.name),
                              t.memberExpression(ref, specifier.node.local)
                            )
                          );
                        }
                        nonHoistedExportNames[
                          specifier.node.exported.name
                        ] = true;
                      }
                    }
                  } catch (err) {
                    _didIteratorError8 = true;
                    _iteratorError8 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion8 && _iterator8.return) {
                        _iterator8.return();
                      }
                    } finally {
                      if (_didIteratorError8) {
                        throw _iteratorError8;
                      }
                    }
                  }
                } else {
                  var _iteratorNormalCompletion9 = true;
                  var _didIteratorError9 = false;
                  var _iteratorError9 = undefined;

                  try {
                    for (
                      var _iterator9 = specifiers[Symbol.iterator](), _step9;
                      !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next())
                        .done);
                      _iteratorNormalCompletion9 = true
                    ) {
                      const specifier = _step9.value;

                      if (specifier.isExportSpecifier()) {
                        addTo(
                          exports,
                          specifier.node.local.name,
                          specifier.node.exported
                        );
                        nonHoistedExportNames[
                          specifier.node.exported.name
                        ] = true;
                        nodes.push(
                          buildExportsAssignment(
                            specifier.node.exported,
                            specifier.node.local
                          )
                        );
                      }
                    }
                  } catch (err) {
                    _didIteratorError9 = true;
                    _iteratorError9 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion9 && _iterator9.return) {
                        _iterator9.return();
                      }
                    } finally {
                      if (_didIteratorError9) {
                        throw _iteratorError9;
                      }
                    }
                  }
                }
                path.replaceWithMultiple(nodes);
              } else if (path.isExportAllDeclaration()) {
                const exportNode = buildExportAll({
                  OBJECT: addRequire(
                    path.node.source.value,
                    path.node._blockHoist
                  )
                });
                exportNode.loc = path.node.loc;
                topNodes.push(exportNode);
                path.remove();
              }
            }
          } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
              }
            } finally {
              if (_didIteratorError4) {
                throw _iteratorError4;
              }
            }
          }

          for (const source in imports) {
            var _imports$source = imports[source];
            const specifiers = _imports$source.specifiers,
              maxBlockHoist = _imports$source.maxBlockHoist;

            if (specifiers.length) {
              const uid = addRequire(source, maxBlockHoist);

              let wildcard;

              for (let i = 0; i < specifiers.length; i++) {
                const specifier = specifiers[i];
                if (t.isImportNamespaceSpecifier(specifier)) {
                  if (strict || noInterop) {
                    remaps[specifier.local.name] = uid;
                  } else {
                    const varDecl = t.variableDeclaration('var', [
                      t.variableDeclarator(
                        specifier.local,
                        t.callExpression(
                          t.identifier('parcelInteropWildcard'),
                          [uid]
                        )
                      )
                    ]);
                    const interopDecl = buildParcelWildcardInterop();

                    if (maxBlockHoist > 0) {
                      varDecl._blockHoist = maxBlockHoist;
                      interopDecl._blockHoist = maxBlockHoist;
                    }

                    topNodes.push(interopDecl, varDecl);
                  }
                  wildcard = specifier.local;
                } else if (t.isImportDefaultSpecifier(specifier)) {
                  specifiers[i] = t.importSpecifier(
                    specifier.local,
                    t.identifier('default')
                  );
                }
              }

              var _iteratorNormalCompletion5 = true;
              var _didIteratorError5 = false;
              var _iteratorError5 = undefined;

              try {
                for (
                  var _iterator5 = specifiers[Symbol.iterator](), _step5;
                  !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next())
                    .done);
                  _iteratorNormalCompletion5 = true
                ) {
                  const specifier = _step5.value;

                  if (t.isImportSpecifier(specifier)) {
                    let target = uid;
                    if (specifier.imported.name === 'default') {
                      if (wildcard) {
                        target = wildcard;
                      } else if (!noInterop) {
                        target = wildcard = path.scope.generateUidIdentifier(
                          uid.name
                        );
                        const varDecl = t.variableDeclaration('var', [
                          t.variableDeclarator(
                            target,
                            t.callExpression(
                              this.addHelper('interopRequireDefault'),
                              [uid]
                            )
                          )
                        ]);

                        if (maxBlockHoist > 0) {
                          varDecl._blockHoist = maxBlockHoist;
                        }

                        topNodes.push(varDecl);
                      }
                    }
                    remaps[specifier.local.name] = t.memberExpression(
                      target,
                      t.cloneWithoutLoc(specifier.imported)
                    );
                  }
                }
              } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion5 && _iterator5.return) {
                    _iterator5.return();
                  }
                } finally {
                  if (_didIteratorError5) {
                    throw _iteratorError5;
                  }
                }
              }
            } else {
              // bare import
              const requireNode = buildRequire(t.stringLiteral(source));
              requireNode.loc = imports[source].loc;
              topNodes.push(requireNode);
            }
          }

          if (hasImports && Object.keys(nonHoistedExportNames).length) {
            // avoid creating too long of export assignment to prevent stack overflow
            const maxHoistedExportsNodeAssignmentLength = 100;
            const nonHoistedExportNamesArr = Object.keys(nonHoistedExportNames);

            for (
              let currentExportsNodeAssignmentLength = 0;
              currentExportsNodeAssignmentLength <
              nonHoistedExportNamesArr.length;
              currentExportsNodeAssignmentLength += maxHoistedExportsNodeAssignmentLength
            ) {
              const nonHoistedExportNamesChunk = nonHoistedExportNamesArr.slice(
                currentExportsNodeAssignmentLength,
                currentExportsNodeAssignmentLength +
                  maxHoistedExportsNodeAssignmentLength
              );

              let hoistedExportsNode = t.identifier('undefined');

              nonHoistedExportNamesChunk.forEach(function(name) {
                hoistedExportsNode = buildExportsAssignment(
                  t.identifier(name),
                  hoistedExportsNode
                ).expression;
              });

              const node = t.expressionStatement(hoistedExportsNode);
              node._blockHoist = 3;

              topNodes.unshift(node);
            }
          }

          // add __esModule declaration if this file has any exports
          if (hasExports && !strict) {
            let buildTemplate = buildExportsModuleDeclaration;
            if (this.opts.loose)
              buildTemplate = buildLooseExportsModuleDeclaration;

            const declar = buildTemplate();
            declar._blockHoist = 3;

            topNodes.unshift(declar);
          }

          path.unshiftContainer('body', topNodes);
          path.traverse(reassignmentVisitor, {
            remaps,
            scope,
            exports,
            requeueInParent: newPath => path.requeue(newPath)
          });
        }
      }
    }
  };
};
