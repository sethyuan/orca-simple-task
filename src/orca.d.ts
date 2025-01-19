declare global {
  declare const orca: OrcaAPI
  interface Window {
    orca: OrcaAPI
    React: any
    Valtio: any
  }
}

// Orca API
export interface OrcaAPI {
  invokeBackend(type: APIMsg, ...args: any[]): Promise<any>
  state: {
    activePanel: string
    blockConverters: Record<
      string,
      Record<
        string,
        (block: BlockForConversion, repr: Repr) => string | Promise<string>
      >
    >
    blockRenderers: Record<string, any>
    blocks: Record<string | DbId, Block>
    commands: Record<string, CommandWithPinyin>
    dataDir: string
    inlineConverters: Record<
      string,
      Record<string, (content: ContentFragment) => string | Promise<string>>
    >
    inlineRenderers: Record<string, any>
    locale: string
    notifications: Notification[]
    panelBackHistory: PanelHistory[]
    panelForwardHistory: PanelHistory[]
    panels: RowPanel
    plugins: Record<string, Plugin>
    repo: string
    settings: Record<number, any>
    settingsOpened: boolean
    commandPaletteOpened: boolean
    globalSearchOpened: boolean
    shortcuts: Record<string, string>
    themeMode: "light" | "dark"
    themes: Record<string, string>
    toolbarButtons: Record<string, ToolbarButton | ToolbarButton[]>
    slashCommands: Record<string, SlashCommandWithPinyin>
    blockMenuCommands: Record<string, BlockMenuCommand>
    tagMenuCommands: Record<string, TagMenuCommand>
    sidebarTab: string
    filterInTags?: string
  }
  commands: {
    registerCommand(id: string, fn: CommandFn, label?: string): void
    unregisterCommand(id: string): void
    registerEditorCommand(
      id: string,
      doFn: EditorCommandFn,
      undoFn: CommandFn,
      opts?: { label?: string; hasArgs?: boolean; noFocusNeeded?: boolean },
    ): void
    unregisterEditorCommand(id: string): void
    invokeCommand(id: string, ...args: any[]): Promise<any>
    invokeEditorCommand(
      id: string,
      cursor: CursorData | null,
      ...args: any[]
    ): Promise<any>
    invokeGroup(callback: () => Promise<void>)
    registerBeforeCommand(id: string, pred: BeforeHookPred): void
    unregisterBeforeCommand(id: string, pred: BeforeHookPred): void
    registerAfterCommand(id: string, fn: AfterHook): void
    unregisterAfterCommand(id: string, fn: AfterHook): void
  }
  shortcuts: {
    reload(): Promise<void>
    assign(shortcut: string, command: string): Promise<void>
    reset(command: string): Promise<void>
  }
  nav: {
    addTo(
      id: string,
      dir: "top" | "bottom" | "left" | "right",
      src?: Pick<ViewPanel, "view" | "viewArgs" | "viewState">,
    ): string
    move(
      from: string,
      to: string,
      dir: "top" | "bottom" | "left" | "right",
    ): void
    close(id: string): void
    closeAllBut(id: string): void
    changeSizes(startPanelId: string, values: number[])
    switchFocusTo(id: string): void
    goBack(withRedo?: boolean): void
    goForward(): void
    goTo(
      view: PanelView,
      viewArgs?: Record<string, any>,
      panelId?: string,
    ): void
    openInLastPanel(view: PanelView, viewArgs?: Record<string, any>): void
    findViewPanel(id: string, panels: RowPanel): ViewPanel | null
    isThereMoreThanOneViewPanel(): boolean
    focusNext(): void
    focusPrev(): void
  }
  plugins: {
    register(name: string): Promise<void>
    unregister(name: string): Promise<void>
    enable(name: string): Promise<void>
    disable(name: string): Promise<void>
    setSettingsSchema(name: string, schema: PluginSettingsSchema): Promise<void>
    setSettings(
      to: "app" | "repo",
      name: string,
      settings: Record<string, any>,
    ): Promise<void>
    load(
      name: string,
      schema: PluginSettingsSchema,
      settings: Record<string, any>,
    ): Promise<void>
    unload(name: string): Promise<void>
    getDataKeys(name: string): Promise<string[]>
    getData(name: string, key: string): Promise<any>
    setData(
      name: string,
      key: string,
      value: string | number | ArrayBuffer | null,
    ): Promise<void>
    removeData(name: string, key: string): Promise<void>
    clearData(name: string): Promise<void>
  }
  themes: {
    register(pluginName: string, themeName: string, themeFileName: string): void
    unregister(themeName: string): void
    injectCSSResource(url: string, role: string): void
    removeCSSResources(role: string): void
  }
  renderers: {
    registerInline(type: string, isEditable: boolean, renderer: any): void
    unregisterInline(type: string): void
    registerBlock(type: string, isEditable: boolean, renderer: any): void
    unregisterBlock(type: string): void
  }
  converters: {
    registerBlock(
      format: string,
      type: string,
      fn: (
        block: BlockForConversion,
        repr: Repr,
        forExport?: boolean,
      ) => string | Promise<string>,
    ): void
    registerInline(
      format: string,
      type: string,
      fn: (content: ContentFragment) => string | Promise<string>,
    ): void
    unregisterBlock(format: string, type: string): void
    unregisterInline(format: string, type: string): void
    blockConvert(
      format: string,
      block: BlockForConversion,
      repr: Repr,
      forExport?: boolean,
    ): Promise<string>
    inlineConvert(
      format: string,
      type: string,
      content: ContentFragment,
    ): Promise<string>
  }
  broadcasts: {
    isHandlerRegistered(type: string): boolean
    registerHandler(type: string, handler: CommandFn): void
    unregisterHandler(type: string): void
    broadcast(type: string, ...args: any[]): void
  }
  // TODO: describe component props
  components: {
    Block: any
    BlockBreadcrumb: any
    BlockChildren: any
    BlockSelect: any
    BlockShell: any
    Breadcrumb: any
    Button: any
    Checkbox: any
    CompositionInput: any
    CompositionTextArea: any
    ConfirmBox: any
    ContextMenu: any
    DatePicker: any
    HoverContextMenu: any
    Image: any
    Input: any
    InputBox: any
    LoadMore: any
    MemoizedViews: any
    Menu: any
    MenuItem: any
    MenuSeparator: any
    MenuText: any
    MenuTitle: any
    ModalOverlay: any
    Popup: any
    Segmented: any
    Select: any
    Skeleton: any
    Switch: any
    Table: any
    Tooltip: any
  }
  toolbar: {
    registerToolbarButton(
      id: string,
      button: ToolbarButton | ToolbarButton[],
    ): void
    unregisterToolbarButton(id: string): void
  }
  slashCommands: {
    registerSlashCommand(id: string, command: SlashCommand): void
    unregisterSlashCommand(id: string): void
  }
  blockMenuCommands: {
    registerBlockMenuCommand(id: string, command: BlockMenuCommand): void
    unregisterBlockMenuCommand(id: string): void
  }
  tagMenuCommands: {
    registerTagMenuCommand(id: string, command: TagMenuCommand): void
    unregisterTagMenuCommand(id: string): void
  }
  notify: (
    type: "info" | "success" | "warn" | "error",
    message: string,
    options?: {
      title?: string
      action?: () => void | Promise<void>
    },
  ) => void
}

// Backend API
export type APIMsg =
  | "add-repo"
  | "assign-shortcut"
  | "batch-insert-text"
  | "change-ref-data-name"
  | "change-theme-mode"
  | "clear-plugin-data"
  | "close-window"
  | "copy-blocks"
  | "create-alias"
  | "create-block"
  | "create-ref"
  | "create-repo"
  | "delete-alias"
  | "delete-blocks"
  | "delete-properties"
  | "delete-ref"
  | "delete-refs"
  | "delete-ref-data"
  | "delete-ref-data-by-tag-prop"
  | "delete-repo"
  | "disable-plugin"
  | "enable-plugin"
  | "export-pdf"
  | "export-png"
  | "export-txt"
  | "find-days-with-journal"
  | "find-text"
  | "fold-block"
  | "get-aliased-blocks"
  | "get-aliases"
  | "get-aliases-ids"
  | "get-all-settings"
  | "get-all-shortcuts"
  | "get-block"
  | "get-block-by-alias"
  | "get-blockid-by-alias"
  | "get-blocks"
  | "get-blocks-with-tags"
  | "get-block-tree"
  | "get-children-tags"
  | "get-children-tag-blocks"
  | "get-headings"
  | "get-journal-block"
  | "get-plugin-data-keys"
  | "get-plugin-data"
  | "get-plugin-info"
  | "get-ref"
  | "get-ref-tos"
  | "get-setting"
  | "get-tag-group-values"
  | "get-tag-properties"
  | "get-tags-from-refs-of-blocks"
  | "get-tags-for-tag-combo"
  | "get-top-include-in"
  | "has-ref-data"
  | "move-blocks"
  | "open-repo"
  | "open-repo-folder"
  | "open-repo-in-new-window"
  | "query"
  | "register-plugin"
  | "remove-plugin-data"
  | "remove-shortcut"
  | "remove-shortcuts-from-command"
  | "rename-alias"
  | "rename-repo"
  | "reset-documentation"
  | "scan-repos"
  | "search-aliases"
  | "search-blocks-by-text"
  | "set-app-config"
  | "set-blocks-content"
  | "set-config"
  | "set-locale"
  | "set-plugin-data"
  | "set-plugin-settings"
  | "set-plugin-settings-schema"
  | "set-properties"
  | "set-ref-alias"
  | "set-ref-data"
  | "set-title-bar-overlay"
  | "shell-open"
  | "show-in-folder"
  | "show-window"
  | "undo-batch-insert-text"
  | "undo-change-ref-data-name"
  | "undo-create-block"
  | "undo-delete-properties"
  | "undo-delete-ref-data"
  | "undo-move-blocks"
  | "undo-set-blocks-content"
  | "undo-set-properties"
  | "undo-set-ref-data"
  | "unregister-plugin"
  | "upload-asset-binary"
  | "upload-assets"
  | "upsert-blocks"

// Panels
export type PanelView = "journal" | "block"
export interface RowPanel {
  id: string
  direction: "row"
  children: (ColumnPanel | ViewPanel)[]
  height: number
}
export interface ColumnPanel {
  id: string
  direction: "column"
  children: (RowPanel | ViewPanel)[]
  width: number
}
export interface ViewPanel {
  id: string
  view: PanelView
  viewArgs?: Record<string, any>
  viewState: Record<string, any>
  width?: number
  height?: number
  locked?: boolean
  wide?: boolean
}
export interface PanelHistory {
  activePanel: string
  view: PanelView
  viewArgs?: Record<string, any>
}
export interface PanelLayouts {
  default: string
  layouts: Record<string, { activePanel: string; panels: RowPanel }>
}

// Commands
export type CommandFn = (...args: any[]) => void | Promise<void>
export type EditorCommandFn = (
  editor: EditorArg,
  ...args: any[]
) =>
  | { ret?: any; undoArgs: any }
  | Promise<{ ret?: any; undoArgs?: any }>
  | null
  | Promise<null>
export interface Command {
  label?: string
  fn: CommandFn | [EditorCommandFn, CommandFn]
  hasArgs?: boolean
  noFocusNeeded?: boolean
}
export interface CommandWithPinyin extends Command {
  pinyin: string
}
export type EditorArg = [
  // panelId
  string,
  // rootBlockId
  DbId,
  // cursor
  CursorData,
  // isRedo
  boolean,
]
export type BeforeHookPred = (id: string, ...args: any[]) => boolean
export type AfterHook = (id: string, ...args: any[]) => void | Promise<void>
export interface CursorData {
  anchor: CursorNodeData
  focus: CursorNodeData
  isForward: boolean
}
export interface CursorNodeData {
  blockId: DbId
  isInline: boolean
  index: number
  offset: number
}

// Notifications
export interface Notification {
  id: number
  type: "info" | "success" | "warn" | "error"
  title?: string
  message: string
  action?: () => void | Promise<void>
}

// Plugins
export interface Plugin {
  enabled: boolean
  icon: string
  schema?: PluginSettingsSchema
  settings?: Record<string, any>
  module?: any
}
export interface PluginSettingsSchema {
  [key: string]: {
    label: string
    description?: string
    type:
      | "string"
      | "number"
      | "boolean"
      | "date"
      | "time"
      | "datetime"
      | "dateRange"
      | "datetimeRange"
      | "color"
      | "singleChoice"
      | "multiChoices"
      | "array"
    defaultValue?: any
    choices?: { label: string; value: string }[]
    arrayItemSchema?: PluginSettingsSchema
  }
}

// Toolbar
export interface ToolbarButton {
  icon: string
  tooltip: string
  command: string
  color?: string
  background?: string
}

// Slash Command
export interface SlashCommand {
  icon: string
  group: string
  title: string
  command: string
}
export interface SlashCommandWithPinyin extends SlashCommand {
  pinyin: string
}

// Block Menu Command
export type BlockMenuCommand =
  | {
      worksOnMultipleBlocks: false
      render: (
        blockId: DbId,
        rootBlockId: DbId,
        close: () => void,
      ) => React.ReactElement
    }
  | {
      worksOnMultipleBlocks: true
      render: (
        blockIds: DbId[],
        rootBlockId: DbId,
        close: () => void,
      ) => React.ReactElement
    }

// Tag Menu Command
export type TagMenuCommand = {
  render: (tagBlock: Block, close: () => void) => React.ReactElement
}

// Blocks
export type DbId = number
export interface Block {
  id: DbId
  content?: ContentFragment[]
  text?: string
  created: Date
  modified: Date
  parent?: DbId
  left?: DbId
  children: DbId[]
  aliases: string[]
  properties: BlockProperty[]
  refs: BlockRef[]
  backRefs: BlockRef[]
}
export type ContentFragment = {
  t: string // type
  v: any // value
  f?: string // format
  fa?: Record<string, any> // format arguments
  [key: string]: any
}
export type Repr = {
  type: string
  [key: string]: any
}
export interface BlockProperty {
  name: string
  type: number
  typeArgs?: any
  value?: any
  pos?: number
}
export interface BlockRef {
  id: DbId
  from: DbId
  to: DbId
  type: number
  alias?: string
  data?: BlockProperty[]
}
export type BlockRefData = Pick<BlockProperty, "name" | "type" | "value">
export type BlockForConversion = {
  content?: ContentFragment[]
  children?: DbId[]
}
export interface BlockTag {
  blockId: DbId
  name: string
  icon?: string
  color?: string
}

// Query
export interface QueryDescription {
  q?: QueryGroup
  excludeId?: DbId
  sort?: QuerySort[]
  page?: number
  pageSize?: number
  tagName?: string
  groupBy?: string
  group?: any
  stats?: QueryStat[]
  asTable?: boolean
  asCalendar?: {
    field: "created" | "modified" | "journal"
    start: Date
    end: Date
  }
}
export type QueryItem =
  | QueryGroup
  | QueryTag
  | QueryNoTag
  | QueryJournal
  | QueryRef
  | QueryNoRef
  | QueryText
export interface QueryGroup {
  kind: QueryKindAnd | QueryKindOr
  conditions: QueryItem[]
  includeDescendants?: boolean
}
export interface QueryTag {
  kind: QueryKindTag
  name: string
  properties?: QueryTagProperty[]
  includeDescendants?: boolean
}
export interface QueryNoTag {
  kind: QueryKindNoTag
  name: string
}
export interface QueryJournal {
  kind: QueryKindJournal
  start: QueryJournalDate
  end: QueryJournalDate
  includeDescendants?: boolean
}
export interface QueryJournalDate {
  t: QueryJournalRelative | QueryJournalFull
  v: number
  u?: "s" | "m" | "h" | "d" | "w" | "M" | "y"
}
export interface QueryRef {
  kind: QueryKindRef
  blockId: DbId
  includeDescendants?: boolean
}
export interface QueryNoRef {
  kind: QueryKindNoRef
  blockId: DbId
}
export interface QueryText {
  kind: QueryKindText
  text: string
  raw?: boolean
  includeDescendants?: boolean
}
export interface QueryTagProperty {
  name: string
  type?: number
  op?:
    | QueryEq
    | QueryNotEq
    | QueryIncludes
    | QueryNotIncludes
    | QueryHas
    | QueryNotHas
    | QueryGt
    | QueryLt
    | QueryGe
    | QueryLe
    | QueryNull
    | QueryNotNull
  value?: any
}
export type QuerySort = [string, "ASC" | "DESC"]
export type QueryStat =
  | ""
  | "count"
  | "count_e"
  | "count_ne"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "percent_e"
  | "percent_ne"
export type QueryKindAnd = 1
export type QueryKindOr = 2
export type QueryKindJournal = 3
export type QueryKindTag = 4
export type QueryKindNoTag = 5
export type QueryKindRef = 6
export type QueryKindNoRef = 7
export type QueryKindText = 8
export type QueryEq = 1
export type QueryNotEq = 2
export type QueryIncludes = 3
export type QueryNotIncludes = 4
export type QueryHas = 5
export type QueryNotHas = 6
export type QueryGt = 7
export type QueryLt = 8
export type QueryGe = 9
export type QueryLe = 10
export type QueryNull = 11
export type QueryNotNull = 12
export type QueryJournalRelative = 1
export type QueryJournalFull = 2

// Misc
export interface IdContent {
  id: DbId
  content: ContentFragment[]
}
