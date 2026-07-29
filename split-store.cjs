const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/store/AppContext.tsx');

// We want to extract specific functions from AppProvider.
const appProvider = sourceFile.getVariableDeclaration('AppProvider');
const initializer = appProvider.getInitializer();
// initializer is an ArrowFunction

const hooksToExtract = {
  useAccounts: ['addAccount', 'updateAccount', 'deleteAccount', 'transferAccount'],
  useTransactions: ['addExpense', 'updateExpense', 'deleteExpense', 'addIncome', 'updateIncome', 'deleteIncome', 'repeatExpense'],
  useGoals: ['addGoal', 'updateGoal', 'deleteGoal'],
  useCategories: ['addCategory', 'updateCategory', 'deleteCategory', 'reorderCategories'],
  useGamaeyas: ['addGamaeya', 'updateGamaeya', 'deleteGamaeya', 'payGamaeyaMonth', 'receiveGamaeyaPayout'],
  useBudget: ['setBudget', 'setDailyBudget', 'setRollingBudgetEnabled']
};

fs.mkdirSync('src/store/hooks', { recursive: true });

let returnStatement;
initializer.getBody().getStatements().forEach(stmt => {
  if (stmt.getKind() === SyntaxKind.ReturnStatement) {
    returnStatement = stmt;
  }
});

let stateProps = `
  state: any,
  setState: any,
  user: any,
  db: any,
  evaluateAchievements?: any
`;

for (const [hookName, funcs] of Object.entries(hooksToExtract)) {
  let hookContent = `import { doc, collection, writeBatch, setDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';\n`;
  hookContent += `import { db } from '../../firebase';\n`;
  hookContent += `import { safeParseISO } from '../../utils';\n`;
  hookContent += `import toast from 'react-hot-toast';\n\n`;
  hookContent += `export function ${hookName}({ state, setState, user, evaluateAchievements }: any) {\n`;
  
  for (const funcName of funcs) {
    const v = initializer.getBody().getVariableDeclaration(funcName);
    if (v) {
      hookContent += v.getParent().getParent().getText() + '\n\n';
      // Now remove it from AppContext.tsx
      v.getParent().getParent().remove();
    }
  }
  
  hookContent += `  return { ${funcs.join(', ')} };\n`;
  hookContent += `}\n`;
  
  fs.writeFileSync(`src/store/hooks/${hookName}.ts`, hookContent);
}

// Now add imports for the hooks in AppContext.tsx
const importDeclarations = Object.keys(hooksToExtract).map(name => `import { ${name} } from './hooks/${name}';`).join('\n');
sourceFile.insertStatements(0, importDeclarations);

// Inside AppProvider, call the hooks
let hookCalls = ``;
let hookReturns = [];
for (const [hookName, funcs] of Object.entries(hooksToExtract)) {
  hookCalls += `  const { ${funcs.join(', ')} } = ${hookName}({ state, setState, user, evaluateAchievements });\n`;
}

initializer.getBody().insertStatements(1, hookCalls);

sourceFile.saveSync();
