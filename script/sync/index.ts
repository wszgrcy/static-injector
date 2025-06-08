import type {
  NodeQueryOption,
  ScriptFunction,
  FileQueryLayer,
} from '@code-recycle/cli';

const typeMap = {
  class: 'ClassDeclaration',
  enum: 'EnumDeclaration',
  interface: 'InterfaceDeclaration',
  function: 'FunctionDeclaration',
  type: 'TypeAliasDeclaration',
  'interface-method': 'MethodSignature',
  'interface-property': 'PropertySignature',
  'class-method': 'MethodDeclaration',
  'enum-member': 'EnumMember',
  variable: 'VariableDeclaration',
};
function importDeclarationByNamed(list: string[]) {
  let listStr = list.map((item) => `[value=${item}]`).join(',');
  // return `ImportSpecifier:has(>::name:is({{input}}))<SyntaxList<NamedImports<ImportClause<ImportDeclaration`;
  return `ImportSpecifier:has(>::name:is(${listStr}))<SyntaxList<NamedImports<ImportClause<ImportDeclaration`;
}
function importDeclarationByNameSpace(list: string[]) {
  let listStr = list.map((item) => `[value=${item}]`).join(',');

  // return `NamespaceImport:has(>::name:is({{input}}))<ImportClause<ImportDeclaration`;
  return `NamespaceImport:has(>::name:is(${listStr}))<ImportClause<ImportDeclaration`;
}
function namedImportsSelector(list: string[]) {
  let listStr = list.map((item) => `[value=${item}]`).join(',');
  // return `ImportSpecifier:has(>::name:is({{input}})):use(*,+CommaToken)`;
  return `ImportSpecifier:has(>::name:is(${listStr})):use(*,+CommaToken)`;
}
export function variableStatement(nameList: string[]) {
  let listStr = nameList.map((item) => `[value=${item}]`).join(',');

  //  `VariableDeclaration:has(>::name:is({{input}}))<SyntaxList<VariableDeclarationList<VariableStatement`;
  return `VariableDeclaration:has(>::name:is(${listStr}))<SyntaxList<VariableDeclarationList<VariableStatement`;
}

let fn: ScriptFunction = async (util, rule, host, injector) => {
  let path = util.path;

  let data = await rule.os.gitClone(
    'https://github.com/angular/angular.git',
    [
      '/packages/core/src',
      '/packages/core/primitives',
      '!**/*.bazel',
      '!**/*spec.ts',
      '!**/*.js',
      '!/packages/compiler-cli/test',
    ],
    'packages',
    'branch',
    '20.0.2',
  );
  let copyData = require('./copy.json') as {
    source: string;
    target: string;
    fileList: string[];
  }[];

  for (const item of copyData) {
    let nDir = path.normalize(item.source);
    for (const filePath of item.fileList) {
      let file = data[path.join(nDir, filePath)];
      if (!file) {
        throw new Error(`${file} 不存在`);
      }
      await new Promise((res) =>
        host
          .write(path.join(path.normalize(item.target), filePath), file)
          .subscribe({
            complete: () => res(undefined),
          }),
      );
    }
  }
  let copyData2 = require('./dir-copy.json') as {
    source: string;
    target: string;
    fileList: string[];
  }[];

  let fileList = Object.keys(data);
  for (const item of copyData2) {
    for (const fileItem of item.fileList) {
      let fullGlobPath = path.join(path.normalize(item.source), fileItem);

      for (const fileName of fileList) {
        let result = fileName.startsWith(fullGlobPath);
        if (!result) {
          continue;
        }
        let relPath = fileName.slice(item.source.length);
        let writeFile = item.target
          ? path.join(path.normalize(item.target), relPath)
          : path.normalize('.' + relPath);
        if (
          writeFile === 'import/render3/reactivity/after_render_effect.ts' ||
          writeFile === 'import/render3/reactivity/view_effect_runner.ts'
        ) {
          continue;
        }
        await new Promise((res) =>
          host
            .write(
              item.target
                ? path.join(path.normalize(item.target), relPath)
                : path.normalize('.' + relPath),
              data[fileName],
            )
            .subscribe({
              complete: () => res(undefined),
            }),
        );
      }
    }
  }

  function createOption(item: {
    type: string;
    change: string;
    values: {
      excludes?: string[];
      selector?: string;
      namespaces?: string[];
      all?: boolean;
      namedImports?: string[];
      global?: boolean;
      content?: string;
      includes?: string[];
      removeComment?: boolean;
      replaceSelector?: string;
    };
  }): NodeQueryOption {
    const range = async (context) => {
      return [
        await rule.common.getData(context, 'node.node.extra.pos'),
        await rule.common.getData(context, 'node.node.extra.end'),
      ] as [number, number];
    };
    if (!item.change || item.change === 'remove') {
      if (item.type === 'import') {
        if (item.values.all) {
          return {
            delete: true,
            query: `ImportDeclaration`,
            multi: true,
          };
        } else if (item.values.excludes) {
          return {
            delete: true,
            query: importDeclarationByNamed(item.values.excludes),
            multi: true,
          };
        } else if (item.values.namespaces) {
          return {
            delete: true,
            query: importDeclarationByNameSpace(item.values.namespaces),
            multi: true,
          };
        } else if (item.values.namedImports) {
          return {
            delete: true,
            query: namedImportsSelector(item.values.namedImports),
            multi: true,
          };
        }
      } else if (item.type === 'custom') {
        if (item.values.selector) {
          return {
            delete: true,
            query: item.values.selector,
            multi: true,
            range: async (context) => {
              if (!item.values.removeComment) {
                return context.node!.node!.range;
              } else {
                return await rule.common.getData(
                  context,
                  'node.node.extra.rangeWithComment',
                );
              }
            },
          };
        }
      } else if (item.type === 'variable') {
        if (item.values.excludes) {
          return {
            delete: true,
            query: variableStatement(item.values.excludes),
            multi: true,
            range: range,
          };
        }
      } else {
        let query = `${item.values.selector! || ''} ${typeMap[item.type]}`;
        let add = '';
        if (item.values.includes) {
          if (item.values.includes.length) {
            add = `:has(>::name:not(:is(${item.values.includes
              .map((item) => '[value=' + item + ']')
              .join(',')})))`;
          } else {
            add = `:has(>::name)`;
          }
        } else if (item.values.excludes && item.values.excludes.length) {
          add = `:has(>::name:is(${item.values.excludes
            .map((item) => '[value=' + item + ']')
            .join(',')}))`;
        }
        return {
          delete: true,
          query: query + add,
          multi: true,
          range: range,
        };
      }
    } else if (item.change === 'change') {
      if (item.type === 'custom') {
        if (item.values.content) {
          return {
            query: item.values.selector,
            replace: item.values.content,
            multi: true,
            range: range,
          };
        } else if (item.values.replaceSelector) {
          return {
            query: item.values.selector,
            multi: true,
            // range: range,
            children: [{ query: item.values.replaceSelector }],
            callback(context, index) {
              return {
                range: context.node!.node!.range,
                value: context.getNode('0').node!.value,
              };
            },
          };
        }
      }
    } else {
      throw new Error('');
    }
    throw new Error('');
  }

  let changeData = require('./extra.json') as {
    glob: boolean;
    fileName: string;
    rules: any[];
  }[];
  let list = await util.changeList(
    changeData.map((item) => {
      return {
        glob: !!item.glob,
        path: item.fileName,
        list: item.rules.map((ruleItem) => {
          let option = createOption(ruleItem);
          if (item.glob) {
            option.optional = true;
          }
          return option;
        }),
      };
    }),
  );
  await util.updateChangeList(list);
};
export default fn;
