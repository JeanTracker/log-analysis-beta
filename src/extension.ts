import * as vscode from "vscode";
import {
  addFilter,
  applyHighlight,
  deleteFilter,
  editFilter,
  refreshEditors,
  setHighlight,
  setVisibility,
  turnOnFocusMode,
  addGroup,
  editGroup,
  deleteGroup,
  saveProject,
  addProject,
  editProject,
  deleteProject,
  refreshSettings,
  selectProject,
  updateExplorerTitle,
  addExFilter,
  deleteExGroup
} from "./commands";
import { FilterTreeViewProvider } from "./filterTreeViewProvider";
import { ProjectTreeViewProvider } from "./projectTreeViewProvider";
import { ExFilterTreeViewProvider } from "./exFilterTreeViewProvider";
import { FocusProvider } from "./focusProvider";
import { Project, Group, Filter } from "./utils";
import { openSettings } from "./settings";

export type State = {
  inFocusMode: boolean;
  projects: Project[];
  groups: Group[];
  exFilters: Filter[];
  decorations: vscode.TextEditorDecorationType[];
  disposableFoldingRange: vscode.Disposable | null;
  filterTreeViewProvider: FilterTreeViewProvider;
  exFilterTreeViewProvider: ExFilterTreeViewProvider;
  projectTreeViewProvider: ProjectTreeViewProvider;
  focusProvider: FocusProvider;
  globalStorageUri: vscode.Uri;
};

export function activate(context: vscode.ExtensionContext) {
  //internal globals
  const projects: Project[] = [];
  const groups: Group[] = [];
  const exFilters: Filter[] = [];
  const state: State = {
    inFocusMode: false,
    projects,
    groups,
    exFilters,
    decorations: [],
    disposableFoldingRange: null,
    filterTreeViewProvider: new FilterTreeViewProvider(groups),
    exFilterTreeViewProvider: new ExFilterTreeViewProvider(exFilters),
    projectTreeViewProvider: new ProjectTreeViewProvider(projects),
    focusProvider: new FocusProvider(groups, exFilters),
    globalStorageUri: context.globalStorageUri
  };

  refreshSettings(state);

  //tell vs code to open focus-beta:... uris with state.focusProvider
  const disposableFocus = vscode.workspace.registerTextDocumentContentProvider(
    "focus-beta",
    state.focusProvider
  );
  context.subscriptions.push(disposableFocus);
  //register filterTreeViewProvider under id 'filters' which gets attached
  //to the file explorer according to package.json's contributes>views>explorer
  const view = vscode.window.createTreeView(
    "filters-beta",
    { treeDataProvider: state.filterTreeViewProvider, showCollapseAll: true }
  );
  context.subscriptions.push(view);

  //register filterTreeViewProvider under id 'filters.minus' which gets attached
  //to the file explorer according to package.json's contributes>views>explorer
  vscode.window.registerTreeDataProvider('filters-beta.minus', state.exFilterTreeViewProvider);

  //register projectTreeViewProvider under id 'filters.settings' which gets attached
  //to filter_project_setting in the Activity Bar according to package.json's contributes>views>filter_project_settings
  vscode.window.registerTreeDataProvider(
    "filters-beta.settings",
    state.projectTreeViewProvider);

  updateExplorerTitle(view, state);

  //Add events listener
  var disposableOnDidChangeVisibleTextEditors =
    vscode.window.onDidChangeVisibleTextEditors((event) => {
      if (vscode.window.visibleTextEditors.length === 0) {
        console.log("no visible editors");
        return;
      }
      console.log(`[${new Date().toISOString()}] onDidChangeVisibleTextEditors - ${vscode.window.visibleTextEditors.length}`);
      refreshEditors(state);
    });
  context.subscriptions.push(disposableOnDidChangeVisibleTextEditors);

  var disposableOnDidChangeTextDocument =
    vscode.workspace.onDidChangeTextDocument((event) => {
      console.log(`[${new Date().toISOString()}] onDidChangeTextDocument - ${vscode.window.visibleTextEditors.length}`);
      refreshEditors(state);
    });
  context.subscriptions.push(disposableOnDidChangeTextDocument);

  var disposableOnDidChangeActiveTextEditor =
    vscode.window.onDidChangeActiveTextEditor((event) => {
      //update the filter counts for the current activate editor
      applyHighlight(state, vscode.window.visibleTextEditors);
      state.filterTreeViewProvider.refresh();
    });
  context.subscriptions.push(disposableOnDidChangeActiveTextEditor);

  //register commands
  let disposableAddProject = vscode.commands.registerCommand(
    "log-analysis-beta.addProject",
    () => addProject(state));
  context.subscriptions.push(disposableAddProject);

  let disposibleEditProject = vscode.commands.registerCommand(
    "log-analysis-beta.editProject",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in Log Analysis Beta Projects');
        return;
      }
      editProject(treeItem, state, () => {
        updateExplorerTitle(view, state);
      });
    }
  );
  context.subscriptions.push(disposibleEditProject);

  let disposableDeleteProject = vscode.commands.registerCommand(
    "log-analysis-beta.deleteProject",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in Log Analysis Beta Projects');
        return;
      }
      deleteProject(treeItem, state);
      updateExplorerTitle(view, state);
    });
  context.subscriptions.push(disposableDeleteProject);

  let disposableOpenSettings = vscode.commands.registerCommand(
    "log-analysis-beta.openSettings",
    () => openSettings(state.globalStorageUri));
  context.subscriptions.push(disposableOpenSettings);

  let disposableRefreshSettings = vscode.commands.registerCommand(
    "log-analysis-beta.refreshSettings",
    () => {
      refreshSettings(state);
      updateExplorerTitle(view, state);
    });
  context.subscriptions.push(disposableRefreshSettings);

  let disposableSelectProject = vscode.commands.registerCommand(
    "log-analysis-beta.selectProject",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in Log Analysis Beta Projects');
        return;
      }
      if (selectProject(treeItem, state)) {
        updateExplorerTitle(view, state);
        vscode.commands.executeCommand('workbench.view.explorer');
      }
    });
  context.subscriptions.push(disposableSelectProject);

  let disposableSaveProject = vscode.commands.registerCommand(
    "log-analysis-beta.saveProject",
    () => saveProject(state));
  context.subscriptions.push(disposableSaveProject);

  let disposableEnableVisibility = vscode.commands.registerCommand(
    "log-analysis-beta.enableVisibility",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in FILTERS');
        return;
      }
      setVisibility(true, treeItem, state);
    }
  );
  context.subscriptions.push(disposableEnableVisibility);

  let disposableDisableVisibility = vscode.commands.registerCommand(
    "log-analysis-beta.disableVisibility",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in FILTERS');
        return;
      }
      setVisibility(false, treeItem, state);
    }
  );
  context.subscriptions.push(disposableDisableVisibility);

  let disposableTurnOnFocusMode = vscode.commands.registerCommand(
    "log-analysis-beta.turnOnFocusMode",
    () => turnOnFocusMode(state)
  );
  context.subscriptions.push(disposableTurnOnFocusMode);

  let disposibleAddFilter = vscode.commands.registerCommand(
    "log-analysis-beta.addFilter",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in FILTERS');
        return;
      }
      addFilter(treeItem, state);
    }
  );
  context.subscriptions.push(disposibleAddFilter);

  let disposibleEditFilter = vscode.commands.registerCommand(
    "log-analysis-beta.editFilter",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in FILTERS');
        return;
      }
      editFilter(treeItem, state);
    }
  );
  context.subscriptions.push(disposibleEditFilter);

  let disposibleDeleteFilter = vscode.commands.registerCommand(
    "log-analysis-beta.deleteFilter",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in FILTERS');
        return;
      }
      deleteFilter(treeItem, state);
    }
  );
  context.subscriptions.push(disposibleDeleteFilter);

  let disposibleEnableHighlight = vscode.commands.registerCommand(
    "log-analysis-beta.enableHighlight",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in FILTERS');
        return;
      }
      setHighlight(true, treeItem, state);
    }
  );
  context.subscriptions.push(disposibleEnableHighlight);

  let disposibleDisableHighlight = vscode.commands.registerCommand(
    "log-analysis-beta.disableHighlight",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in FILTERS');
        return;
      }
      setHighlight(false, treeItem, state);
    }
  );
  context.subscriptions.push(disposibleDisableHighlight);

  let disposibleAddGroup = vscode.commands.registerCommand(
    "log-analysis-beta.addGroup",
    () => {
      addGroup(state);
    }
  );
  context.subscriptions.push(disposibleAddGroup);

  let disposibleEditGroup = vscode.commands.registerCommand(
    "log-analysis-beta.editGroup",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in FILTERS');
        return;
      }
      editGroup(treeItem, state);
    }
  );
  context.subscriptions.push(disposibleEditGroup);

  let disposibleDeleteGroup = vscode.commands.registerCommand(
    "log-analysis-beta.deleteGroup",
    (treeItem: vscode.TreeItem) => {
      if (treeItem === undefined) {
        vscode.window.showErrorMessage('This command is excuted with button in FILTERS');
        return;
      }
      deleteGroup(treeItem, state);
    }
  );
  context.subscriptions.push(disposibleDeleteGroup);

  let disposibleAddExFilter = vscode.commands.registerCommand(
    "log-analysis-beta.addExFilter",
    () => addExFilter(state));
  context.subscriptions.push(disposibleAddExFilter);

  let disposibleDeleteExGroup = vscode.commands.registerCommand(
    "log-analysis-beta.deleteExGroup",
    () => deleteExGroup(state));
  context.subscriptions.push(disposibleDeleteExGroup);
}

// this method is called when your extension is deactivated
export function deactivate() { }
